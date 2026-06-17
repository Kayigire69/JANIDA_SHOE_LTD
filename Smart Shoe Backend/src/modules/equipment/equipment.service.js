import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

// Equipment CRUD
export const createEquipment = async (data, currentUser) => {
  const { code, name, type, manufacturer, model, serialNumber, location, department, status, purchaseDate, warrantyExpiry, hourlyRate } = data
  if (!code || !name || !type) throw new AppError('Code, name, and type are required', 400)

  const existing = await query('SELECT id FROM equipment WHERE code = $1', [code])
  if (existing.rowCount > 0) throw new AppError('Equipment code already exists', 409)

  const res = await query(`
    INSERT INTO equipment (code, name, type, manufacturer, model, serial_number, location, department, status, purchase_date, warranty_expiry, hourly_rate, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [code, name, type, manufacturer || null, model || null, serialNumber || null, location || null, department || null, status || 'operational', purchaseDate || null, warrantyExpiry || null, Number(hourlyRate) || 0, currentUser?.id || null])

  return res.rows[0]
}

export const listEquipment = async (params = {}) => {
  const { search, status, type, department } = params
  let sql = `SELECT * FROM equipment WHERE 1=1`
  const values = []
  let i = 1

  if (search) {
    sql += ` AND (name ILIKE $${i} OR code ILIKE $${i})`
    values.push(`%${search}%`)
    i++
  }
  if (status) {
    sql += ` AND status = $${i}`
    values.push(status)
    i++
  }
  if (type) {
    sql += ` AND type = $${i}`
    values.push(type)
    i++
  }
  if (department) {
    sql += ` AND department = $${i}`
    values.push(department)
    i++
  }

  sql += ` ORDER BY created_at DESC`
  const res = await query(sql, values)
  return { equipment: res.rows }
}

export const getEquipment = async (id) => {
  const res = await query('SELECT * FROM equipment WHERE id = $1', [id])
  if (res.rowCount === 0) throw new AppError('Equipment not found', 404)
  return res.rows[0]
}

export const updateEquipment = async (id, data) => {
  const fields = []
  const values = []
  let i = 1

  const map = {
    code: 'code',
    name: 'name',
    type: 'type',
    manufacturer: 'manufacturer',
    model: 'model',
    serialNumber: 'serial_number',
    location: 'location',
    department: 'department',
    status: 'status',
    purchaseDate: 'purchase_date',
    warrantyExpiry: 'warranty_expiry',
    hourlyRate: 'hourly_rate',
    assignedProductionPlanId: 'assigned_production_plan_id'
  }

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${i}`)
      values.push(data[key])
      i++
    }
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  values.push(id)

  const res = await query(`UPDATE equipment SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Equipment not found', 404)
  return res.rows[0]
}

export const deleteEquipment = async (id) => {
  const res = await query('DELETE FROM equipment WHERE id = $1 RETURNING id', [id])
  if (res.rowCount === 0) throw new AppError('Equipment not found', 404)
  return { message: 'Equipment deleted' }
}

export const equipmentTypes = async () => {
  const res = await query('SELECT DISTINCT type FROM equipment ORDER BY type')
  return { types: res.rows.map(r => r.type) }
}

export const equipmentDepartments = async () => {
  const res = await query('SELECT DISTINCT department FROM equipment WHERE department IS NOT NULL ORDER BY department')
  return { departments: res.rows.map(r => r.department) }
}

// Maintenance
export const createMaintenance = async (data) => {
  const { equipmentId, maintenanceType, scheduledDate, technician, description, cost } = data
  if (!equipmentId || !maintenanceType || !scheduledDate) throw new AppError('equipmentId, maintenanceType, and scheduledDate are required', 400)

  const eq = await query('SELECT id FROM equipment WHERE id = $1', [equipmentId])
  if (eq.rowCount === 0) throw new AppError('Equipment not found', 404)

  const res = await query(`
    INSERT INTO equipment_maintenance (equipment_id, maintenance_type, scheduled_date, technician, description, cost)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [equipmentId, maintenanceType, scheduledDate, technician || null, description || null, Number(cost) || 0])

  return res.rows[0]
}

export const listMaintenance = async (equipmentId) => {
  const res = await query(`
    SELECT * FROM equipment_maintenance WHERE equipment_id = $1 ORDER BY scheduled_date DESC
  `, [equipmentId])
  return { maintenance: res.rows }
}

export const updateMaintenanceStatus = async (id, status) => {
  const valid = ['scheduled', 'in_progress', 'completed', 'cancelled']
  if (!valid.includes(status)) throw new AppError('Invalid status', 400)
  const updates = [`status = $1`]
  const values = [status]
  if (status === 'completed') {
    updates.push('completed_date = CURRENT_DATE')
  }
  values.push(id)
  const res = await query(`UPDATE equipment_maintenance SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Maintenance record not found', 404)
  return res.rows[0]
}

// Downtime
export const createDowntime = async (data) => {
  const { equipmentId, startTime, endTime, reason, category, operatorNotes } = data
  if (!equipmentId || !startTime || !reason) throw new AppError('equipmentId, startTime, and reason are required', 400)

  const eq = await query('SELECT id FROM equipment WHERE id = $1', [equipmentId])
  if (eq.rowCount === 0) throw new AppError('Equipment not found', 404)

  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : null
  const impact = end ? Math.max(0, Math.round((end - start) / 60000)) : 0

  const res = await query(`
    INSERT INTO equipment_downtime (equipment_id, start_time, end_time, reason, category, impact_minutes, operator_notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [equipmentId, startTime, endTime || null, reason, category || 'mechanical', impact, operatorNotes || null])

  return res.rows[0]
}

export const listDowntime = async (equipmentId) => {
  const res = await query(`SELECT * FROM equipment_downtime WHERE equipment_id = $1 ORDER BY start_time DESC`, [equipmentId])
  return { downtime: res.rows }
}

// Spare parts
export const createSparePart = async (data) => {
  const { name, partNumber, equipmentType, quantity, minimumStock, unitCost, supplier, location } = data
  if (!name) throw new AppError('Name is required', 400)

  const res = await query(`
    INSERT INTO spare_parts (name, part_number, equipment_type, quantity, minimum_stock, unit_cost, supplier, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [name, partNumber || null, equipmentType || null, Number(quantity) || 0, Number(minimumStock) || 0, Number(unitCost) || 0, supplier || null, location || null])

  return res.rows[0]
}

export const listSpareParts = async (params = {}) => {
  const { search, equipmentType } = params
  let sql = `SELECT * FROM spare_parts WHERE 1=1`
  const values = []
  let i = 1

  if (search) {
    sql += ` AND (name ILIKE $${i} OR part_number ILIKE $${i})`
    values.push(`%${search}%`)
    i++
  }
  if (equipmentType) {
    sql += ` AND equipment_type = $${i}`
    values.push(equipmentType)
    i++
  }

  sql += ` ORDER BY name`
  const res = await query(sql, values)
  return { parts: res.rows }
}

export const updateSparePart = async (id, data) => {
  const fields = []
  const values = []
  let i = 1

  const map = {
    name: 'name',
    partNumber: 'part_number',
    equipmentType: 'equipment_type',
    quantity: 'quantity',
    minimumStock: 'minimum_stock',
    unitCost: 'unit_cost',
    supplier: 'supplier',
    location: 'location'
  }

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${i}`)
      values.push(data[key])
      i++
    }
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  values.push(id)

  const res = await query(`UPDATE spare_parts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Spare part not found', 404)
  return res.rows[0]
}

export const deleteSparePart = async (id) => {
  const res = await query('DELETE FROM spare_parts WHERE id = $1 RETURNING id', [id])
  if (res.rowCount === 0) throw new AppError('Spare part not found', 404)
  return { message: 'Spare part deleted' }
}

// Calibration
export const createCalibration = async (data) => {
  const { equipmentId, calibratedAt, nextDue, calibratedBy, certificateNumber, result, notes } = data
  if (!equipmentId || !calibratedAt) throw new AppError('equipmentId and calibratedAt are required', 400)

  const eq = await query('SELECT id FROM equipment WHERE id = $1', [equipmentId])
  if (eq.rowCount === 0) throw new AppError('Equipment not found', 404)

  const res = await query(`
    INSERT INTO equipment_calibration (equipment_id, calibrated_at, next_due, calibrated_by, certificate_number, result, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [equipmentId, calibratedAt, nextDue || null, calibratedBy || null, certificateNumber || null, result || 'pass', notes || null])

  return res.rows[0]
}

export const listCalibration = async (equipmentId) => {
  const res = await query(`SELECT * FROM equipment_calibration WHERE equipment_id = $1 ORDER BY calibrated_at DESC`, [equipmentId])
  return { calibrations: res.rows }
}

// Metrics
export const getMetrics = async () => {
  const totalRes = await query(`SELECT COUNT(*)::int AS total FROM equipment`)
  const statusRes = await query(`SELECT status, COUNT(*)::int AS count FROM equipment GROUP BY status`)
  const downtimeRes = await query(`
    SELECT COALESCE(SUM(impact_minutes), 0)::int AS total_minutes FROM equipment_downtime
    WHERE start_time >= NOW() - INTERVAL '30 days'
  `)
  const maintenanceRes = await query(`
    SELECT COUNT(*)::int AS count FROM equipment_maintenance
    WHERE status != 'completed' AND scheduled_date <= CURRENT_DATE + INTERVAL '7 days'
  `)

  const statusMap = {}
  for (const r of statusRes.rows) statusMap[r.status] = r.count

  const total = totalRes.rows[0].total
  const operational = statusMap.operational || 0
  const maintenance = statusMap.maintenance || 0
  const idle = statusMap.idle || 0
  const retired = statusMap.retired || 0

  // Simple availability metric: operational / total (excluding retired)
  const activeTotal = total - retired
  const availability = activeTotal > 0 ? ((operational / activeTotal) * 100).toFixed(1) : '0.0'

  return {
    total,
    operational,
    maintenance,
    idle,
    retired,
    availabilityPercent: availability,
    downtimeMinutesLast30Days: downtimeRes.rows[0].total_minutes,
    upcomingMaintenance: maintenanceRes.rows[0].count
  }
}
