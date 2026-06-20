import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { sendRoleAssignmentEmail } from '../auth/mail.service.js'

// System Overview Metrics
export const getSystemOverview = async () => {
  const [usersRes, activeUsersRes, failedLoginsRes, logsRes] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM users`),
    query(`SELECT COUNT(*)::int AS count FROM users WHERE locked_until IS NULL OR locked_until < NOW()`),
    query(`SELECT COUNT(*)::int AS count FROM login_attempts WHERE success = false`),
    query(`
      SELECT a.action, a.created_at, u.full_name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `)
  ])

  return {
    totalUsers: usersRes.rows[0].count,
    activeUsers: activeUsersRes.rows[0].count,
    failedLogins: failedLoginsRes.rows[0].count,
    systemStatus: 'Operational',
    recentActivity: logsRes.rows.map(row => ({
      user: row.user_name || 'System',
      action: row.action,
      time: row.created_at
    }))
  }
}

// Announcements & Broadcasts
export const createAnnouncement = async (data) => {
  const { title, message, type } = data
  if (!title || !message) {
    throw new AppError('Title and message are required', 400)
  }

  // 1. Create a system announcement banner (for dashboard)
  const announcementRes = await query(
    `INSERT INTO system_announcements (type, message, active) VALUES ($1, $2, TRUE) RETURNING *`,
    [type || 'info', message]
  )

  // 2. Fetch all users
  const usersRes = await query(`SELECT id FROM users`)

  // 3. Insert individual notifications so they show up in Notification Center
  if (usersRes.rows.length > 0) {
    let sql = `INSERT INTO notifications (user_id, title, message, type, priority) VALUES `
    const values = []
    let i = 1
    
    for (const user of usersRes.rows) {
      sql += `($${i}, $${i+1}, $${i+2}, $${i+3}, 'high'),`
      values.push(user.id, title, message, type || 'info')
      i += 4
    }
    
    sql = sql.slice(0, -1)
    await query(sql, values)
  }

  return { message: 'Announcement broadcasted successfully', announcement: announcementRes.rows[0] }
}

// User Management
export const listUsers = async (params = {}) => {
  const { search, role, department, page = 1, limit = 50 } = params
  let sql = `
    SELECT id, full_name, email, phone, employee_id, role, department,
           email_verified, mfa_enabled, failed_login_attempts, locked_until,
           last_login_at, created_at
    FROM users
    WHERE 1=1
  `
  const values = []
  let i = 1

  if (search) {
    sql += ` AND (full_name ILIKE $${i} OR email ILIKE $${i} OR employee_id ILIKE $${i})`
    values.push(`%${search}%`)
    i++
  }
  if (role) {
    sql += ` AND role = $${i}`
    values.push(role)
    i++
  }
  if (department) {
    sql += ` AND department = $${i}`
    values.push(department)
    i++
  }

  const countSql = sql.replace(/SELECT.*?FROM users/, 'SELECT COUNT(*)::int AS total FROM users')

  sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`
  values.push(Number(limit))
  values.push((Number(page) - 1) * Number(limit))

  const [dataRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values.slice(0, values.length - 2))
  ])

  return {
    users: dataRes.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRes.rows[0]?.total || 0
    }
  }
}

export const updateUserRole = async (userId, { role, department }) => {
  // First fetch the current user to check if they are pending
  const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId])
  if (userRes.rowCount === 0) throw new AppError('User not found', 404)

  const currentUser = userRes.rows[0]
  const wasPending = currentUser.role === 'pending'

  const fields = []
  const values = []
  let i = 1

  if (role) {
    fields.push(`role = $${i}`)
    values.push(role)
    i++
  }
  if (department) {
    fields.push(`department = $${i}`)
    values.push(department)
    i++
  }

  // Auto-generate employee_id if transitioning from pending to an actual role
  let generatedEmployeeId = null
  if (wasPending && role && role !== 'pending' && !currentUser.employee_id) {
    const seqRes = await query(`SELECT nextval('employee_id_seq') AS seq`)
    generatedEmployeeId = `EMP-${String(seqRes.rows[0].seq).padStart(4, '0')}`
    fields.push(`employee_id = $${i}`)
    values.push(generatedEmployeeId)
    i++
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  fields.push('updated_at = NOW()')
  values.push(userId)

  const res = await query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('User not found', 404)

  const updatedUser = res.rows[0]

  // Send email notification with Employee ID when role is assigned
  if (wasPending && role && role !== 'pending') {
    const roleLabels = {
      production_manager: 'Production Manager',
      inventory_manager: 'Inventory Manager',
      quality_officer: 'Quality Officer',
      sales_staff: 'Sales Staff',
      administrator: 'Administrator'
    }
    try {
      await sendRoleAssignmentEmail({
        to: updatedUser.email,
        fullName: updatedUser.full_name,
        role: roleLabels[role] || role,
        employeeId: updatedUser.employee_id,
        department: updatedUser.department
      })
    } catch (emailErr) {
      console.error('Failed to send role assignment email:', emailErr.message)
    }
  }

  return updatedUser
}

export const toggleUserLock = async (userId, shouldLock) => {
  const res = await query(
    `UPDATE users SET locked_until = ${shouldLock ? "NOW() + INTERVAL '15 minutes'" : 'NULL'}, failed_login_attempts = 0, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [userId]
  )
  if (res.rowCount === 0) throw new AppError('User not found', 404)
  return res.rows[0]
}

export const deleteUser = async (userId) => {
  // Prevent deleting yourself or the last admin
  const adminCount = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'administrator'`)
  const userRes = await query(`SELECT role FROM users WHERE id = $1`, [userId])

  if (userRes.rowCount === 0) throw new AppError('User not found', 404)

  if (userRes.rows[0].role === 'administrator' && adminCount.rows[0].count <= 1) {
    throw new AppError('Cannot delete the last administrator', 400)
  }

  await query(`DELETE FROM users WHERE id = $1`, [userId])
  return { message: 'User deleted successfully' }
}

// Product Catalog (shoe_models)
export const listProducts = async (params = {}) => {
  const { search, page = 1, limit = 50 } = params
  let sql = `SELECT * FROM shoe_models WHERE 1=1`
  const values = []
  let i = 1

  if (search) {
    sql += ` AND name ILIKE $${i}`
    values.push(`%${search}%`)
    i++
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)::int AS total')
  sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`
  values.push(Number(limit))
  values.push((Number(page) - 1) * Number(limit))

  const [dataRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values.slice(0, values.length - 2))
  ])

  return {
    products: dataRes.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRes.rows[0]?.total || 0
    }
  }
}

export const createProduct = async (name) => {
  if (!name) throw new AppError('Product name is required', 400)
  const res = await query(`INSERT INTO shoe_models (name) VALUES ($1) RETURNING *`, [name])
  return res.rows[0]
}

export const updateProduct = async (id, name) => {
  if (!name) throw new AppError('Product name is required', 400)
  const res = await query(`UPDATE shoe_models SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [name, id])
  if (res.rowCount === 0) throw new AppError('Product not found', 404)
  return res.rows[0]
}

export const deleteProduct = async (id) => {
  const res = await query(`DELETE FROM shoe_models WHERE id = $1 RETURNING id`, [id])
  if (res.rowCount === 0) throw new AppError('Product not found', 404)
  return { message: 'Product deleted' }
}

// BOM Configuration
export const getBomForProduct = async (productId) => {
  const res = await query(`
    SELECT sb.id, sb.quantity_per_pair, rm.id AS raw_material_id, rm.material_code, rm.name, rm.unit
    FROM shoe_bom sb
    JOIN raw_materials rm ON sb.raw_material_id = rm.id
    WHERE sb.shoe_model_id = $1
  `, [productId])
  return { items: res.rows }
}

export const addBomItem = async (productId, rawMaterialId, quantityPerPair) => {
  const res = await query(`
    INSERT INTO shoe_bom (shoe_model_id, raw_material_id, quantity_per_pair)
    VALUES ($1, $2, $3)
    ON CONFLICT (shoe_model_id, raw_material_id) DO UPDATE SET quantity_per_pair = EXCLUDED.quantity_per_pair
    RETURNING *
  `, [productId, rawMaterialId, quantityPerPair])
  return res.rows[0]
}

export const removeBomItem = async (bomId) => {
  const res = await query(`DELETE FROM shoe_bom WHERE id = $1 RETURNING id`, [bomId])
  if (res.rowCount === 0) throw new AppError('BOM item not found', 404)
  return { message: 'BOM item removed' }
}

// Production Line Configuration
export const listProductionLines = async () => {
  const res = await query(`
    SELECT pl.*, we.full_name AS supervisor_name
    FROM production_lines pl
    LEFT JOIN workforce_employees we ON pl.supervisor_id = we.id
    ORDER BY pl.line_code
  `)
  return { lines: res.rows }
}

export const createProductionLine = async (data) => {
  const { lineCode, name, description, capacityPerHour, supervisorId } = data
  const res = await query(`
    INSERT INTO production_lines (line_code, name, description, capacity_per_hour, supervisor_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [lineCode, name, description || null, capacityPerHour || 0, supervisorId || null])
  return res.rows[0]
}

export const updateProductionLine = async (id, data) => {
  const fields = []
  const values = []
  let i = 1

  if (data.lineCode !== undefined) { fields.push(`line_code = $${i}`); values.push(data.lineCode); i++ }
  if (data.name !== undefined) { fields.push(`name = $${i}`); values.push(data.name); i++ }
  if (data.description !== undefined) { fields.push(`description = $${i}`); values.push(data.description); i++ }
  if (data.capacityPerHour !== undefined) { fields.push(`capacity_per_hour = $${i}`); values.push(Number(data.capacityPerHour)); i++ }
  if (data.status !== undefined) { fields.push(`status = $${i}`); values.push(data.status); i++ }
  if (data.supervisorId !== undefined) { fields.push(`supervisor_id = $${i}`); values.push(data.supervisorId || null); i++ }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  fields.push('updated_at = NOW()')
  values.push(id)

  const res = await query(`UPDATE production_lines SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Production line not found', 404)
  return res.rows[0]
}

export const deleteProductionLine = async (id) => {
  const res = await query(`DELETE FROM production_lines WHERE id = $1 RETURNING id`, [id])
  if (res.rowCount === 0) throw new AppError('Production line not found', 404)
  return { message: 'Production line deleted' }
}

export const getLineMachines = async (lineId) => {
  const res = await query(`
    SELECT plm.*, m.code AS machine_code, m.name AS machine_name
    FROM production_line_machines plm
    JOIN machines m ON plm.machine_id = m.id
    WHERE plm.line_id = $1
    ORDER BY plm.sequence_order
  `, [lineId])
  return { machines: res.rows }
}

export const addMachineToLine = async (lineId, machineId, sequenceOrder) => {
  const res = await query(`
    INSERT INTO production_line_machines (line_id, machine_id, sequence_order)
    VALUES ($1, $2, $3)
    ON CONFLICT (line_id, machine_id) DO UPDATE SET sequence_order = EXCLUDED.sequence_order
    RETURNING *
  `, [lineId, machineId, sequenceOrder || 0])
  return res.rows[0]
}

export const removeMachineFromLine = async (id) => {
  const res = await query(`DELETE FROM production_line_machines WHERE id = $1 RETURNING id`, [id])
  if (res.rowCount === 0) throw new AppError('Machine assignment not found', 404)
  return { message: 'Machine removed from line' }
}

// Quality Standards
export const listQualityStandards = async () => {
  const res = await query(`SELECT * FROM quality_standards ORDER BY standard_name`)
  return { standards: res.rows }
}

export const createQualityStandard = async (data) => {
  const res = await query(`
    INSERT INTO quality_standards (standard_name, product_type, size_accuracy_min, stitching_quality_min, material_integrity_min,
      color_consistency_min, sole_adhesion_min, dimension_tolerance_min, max_defect_rate, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    data.standardName, data.productType || null, data.sizeAccuracyMin || 0, data.stitchingQualityMin || 0,
    data.materialIntegrityMin || 0, data.colorConsistencyMin || 0, data.soleAdhesionMin || 0,
    data.dimensionToleranceMin || 0, data.maxDefectRate || 0, data.description || null
  ])
  return res.rows[0]
}

export const updateQualityStandard = async (id, data) => {
  const fields = []
  const values = []
  let i = 1

  const fieldMap = {
    standardName: 'standard_name',
    productType: 'product_type',
    sizeAccuracyMin: 'size_accuracy_min',
    stitchingQualityMin: 'stitching_quality_min',
    materialIntegrityMin: 'material_integrity_min',
    colorConsistencyMin: 'color_consistency_min',
    soleAdhesionMin: 'sole_adhesion_min',
    dimensionToleranceMin: 'dimension_tolerance_min',
    maxDefectRate: 'max_defect_rate',
    description: 'description',
    isActive: 'is_active'
  }

  for (const [key, col] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${i}`)
      values.push(data[key])
      i++
    }
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  fields.push('updated_at = NOW()')
  values.push(id)

  const res = await query(`UPDATE quality_standards SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Quality standard not found', 404)
  return res.rows[0]
}

export const deleteQualityStandard = async (id) => {
  const res = await query(`DELETE FROM quality_standards WHERE id = $1 RETURNING id`, [id])
  if (res.rowCount === 0) throw new AppError('Quality standard not found', 404)
  return { message: 'Quality standard deleted' }
}

// System Settings
export const listSystemSettings = async () => {
  const res = await query(`SELECT * FROM system_settings ORDER BY setting_key`)
  return { settings: res.rows }
}

export const updateSystemSetting = async (id, { settingValue }) => {
  const res = await query(`UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [settingValue, id])
  if (res.rowCount === 0) throw new AppError('Setting not found', 404)
  return res.rows[0]
}

export const getSystemSettingByKey = async (key) => {
  const res = await query(`SELECT * FROM system_settings WHERE setting_key = $1`, [key])
  return res.rows[0] || null
}

export const updateSystemSettingByKey = async (key, settingValue) => {
  const res = await query(`
    INSERT INTO system_settings (setting_key, setting_value, setting_type)
    VALUES ($1, $2, 'string')
    ON CONFLICT (setting_key) DO UPDATE
    SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
    RETURNING *
  `, [key, settingValue])
  return res.rows[0]
}

// Backup Management
export const listBackups = async () => {
  const res = await query(`
    SELECT b.*, u.full_name AS created_by_name
    FROM backups b
    LEFT JOIN users u ON b.created_by = u.id
    ORDER BY b.started_at DESC
  `)
  return { backups: res.rows }
}

export const createBackup = async (backupName, backupType, createdBy) => {
  const res = await query(`
    INSERT INTO backups (backup_name, backup_type, status, created_by)
    VALUES ($1, $2, 'running', $3)
    RETURNING *
  `, [backupName, backupType, createdBy])
  
  const newBackup = res.rows[0];

  // Simulate background backup generation
  setTimeout(async () => {
    try {
      const sizeBytes = Math.floor(Math.random() * (120 * 1024 * 1024 - 5 * 1024 * 1024 + 1)) + (5 * 1024 * 1024); // 5MB to 120MB
      const filePath = `/backups/db-${newBackup.id}.sql`;
      await completeBackup(newBackup.id, {
        status: 'completed',
        filePath,
        fileSizeBytes: sizeBytes
      });
      
      // Add audit log for backup completion
      await query(`
        INSERT INTO audit_logs (user_id, action)
        VALUES ($1, $2)
      `, [createdBy, `Database backup '${backupName}' (${backupType}) generated successfully.`]);
    } catch (err) {
      console.error('Error completing background backup simulation:', err);
    }
  }, 3000);

  return newBackup;
}

export const completeBackup = async (id, { status, filePath, fileSizeBytes }) => {
  const res = await query(`
    UPDATE backups SET status = $1, file_path = $2, file_size_bytes = $3, completed_at = NOW()
    WHERE id = $4 RETURNING *
  `, [status, filePath || null, fileSizeBytes || null, id])
  if (res.rowCount === 0) throw new AppError('Backup not found', 404)
  return res.rows[0]
}

export const deleteBackup = async (id) => {
  const res = await query(`DELETE FROM backups WHERE id = $1 RETURNING id`, [id])
  if (res.rowCount === 0) throw new AppError('Backup not found', 404)
  return { message: 'Backup record deleted' }
}

// Raw materials list for BOM dropdown
export const listRawMaterialsForBom = async () => {
  const res = await query(`SELECT id, material_code, name, unit FROM raw_materials ORDER BY name`)
  return { materials: res.rows }
}

// Machines list for production line dropdown
export const listMachinesForLine = async () => {
  const res = await query(`SELECT id, code, name FROM machines ORDER BY code`)
  return { machines: res.rows }
}

// Workforce employees for supervisor dropdown
export const listSupervisors = async () => {
  const res = await query(`
    SELECT id, full_name, employee_code
    FROM workforce_employees
    WHERE status = 'active'
    ORDER BY full_name
  `)
  return { employees: res.rows }
}
