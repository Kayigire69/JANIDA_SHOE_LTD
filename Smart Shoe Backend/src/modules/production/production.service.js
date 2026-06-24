import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

// ---- Machine CRUD ----
export const createMachine = async ({ code, name, status = 'active' }) => {
  if (!code || !name) throw new AppError('Machine code and name are required', 400)
  const existing = await query('SELECT id FROM machines WHERE code = $1', [code])
  if (existing.rowCount > 0) throw new AppError('Machine code already exists', 409)
  const res = await query(
    `INSERT INTO machines (code, name, status) VALUES ($1, $2, $3) RETURNING *`,
    [code.trim(), name.trim(), status]
  )
  return res.rows[0]
}

export const listMachines = async () => {
  const res = await query('SELECT id, code, name, status, created_at FROM machines ORDER BY code')
  return { machines: res.rows }
}

export const updateMachine = async (id, { name, status }) => {
  const res = await query(
    `UPDATE machines SET name = COALESCE($1, name), status = COALESCE($2, status) WHERE id = $3 RETURNING *`,
    [name || null, status || null, id]
  )
  if (res.rowCount === 0) throw new AppError('Machine not found', 404)
  return res.rows[0]
}

export const deleteMachine = async (id) => {
  await query('DELETE FROM machines WHERE id = $1', [id])
  return { message: 'Machine deleted' }
}

// ---- Production Worker CRUD ----
export const createProductionWorker = async ({ workerId, name, role = 'Production Operator', department = 'Production', email, phone }) => {
  if (!workerId || !name || !email) throw new AppError('Worker ID, name, and email are required', 400)
  const existing = await query('SELECT id FROM production_workers WHERE worker_id = $1 OR email = $2', [workerId, email])
  if (existing.rowCount > 0) throw new AppError('Worker ID or email already exists', 409)
  const res = await query(
    `INSERT INTO production_workers (worker_id, name, role, department, email, phone, status) VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING *`,
    [workerId.trim(), name.trim(), role, department, email.trim(), phone || null]
  )
  return res.rows[0]
}

export const listProductionWorkers = async () => {
  const res = await query('SELECT id, worker_id, name, role, department, email, phone, status, created_at FROM production_workers ORDER BY name')
  return { workers: res.rows }
}

export const updateProductionWorker = async (id, { name, role, department, phone, status }) => {
  const res = await query(
    `UPDATE production_workers SET
       name = COALESCE($1, name), role = COALESCE($2, role), department = COALESCE($3, department),
       phone = COALESCE($4, phone), status = COALESCE($5, status)
     WHERE id = $6 RETURNING *`,
    [name || null, role || null, department || null, phone || null, status || null, id]
  )
  if (res.rowCount === 0) throw new AppError('Worker not found', 404)
  return res.rows[0]
}

export const deleteProductionWorker = async (id) => {
  await query('DELETE FROM production_workers WHERE id = $1', [id])
  return { message: 'Worker deleted' }
}

// Helper to refresh dashboard metrics for the production_manager role dynamically
export const refreshProductionDashboardMetrics = async () => {
  try {
    // 1. Get current states from production_plans
    const countsRes = await query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END)::int AS completed,
        COUNT(CASE WHEN status = 'In Progress' THEN 1 END)::int AS in_progress,
        COUNT(CASE WHEN status = 'Planned' THEN 1 END)::int AS planned
      FROM production_plans
    `)
    const { total, completed, in_progress, planned } = countsRes.rows[0]

    // Calculate average efficiency
    const effRes = await query(`
      SELECT COALESCE(AVG(efficiency), 0)::numeric(5,2) AS avg_eff
      FROM production_plans
      WHERE status = 'Completed'
    `)
    const avgEff = effRes.rows[0]?.avg_eff || '0.00'

    // 2. Delete existing metrics for production_manager
    await query(`DELETE FROM dashboard_metrics WHERE role = 'production_manager'`)

    // 3. Insert fresh metrics
    const metrics = [
      { title: 'Total Batches', value: String(total), subtitle: 'active batches', trend: 'total batches', color: 'blue', order: 0 },
      { title: 'Completed Batches', value: String(completed), subtitle: 'completed this period', trend: 'on track', color: 'emerald', order: 1 },
      { title: 'In Progress', value: String(in_progress), subtitle: 'currently active', trend: 'active runs', color: 'amber', order: 2 },
      { title: 'Average Efficiency', value: `${avgEff}%`, subtitle: 'average run performance', trend: 'optimal speed', color: 'slate', order: 3 }
    ]

    for (const m of metrics) {
      await query(`
        INSERT INTO dashboard_metrics (role, title, value, subtitle, trend, color, sort_order)
        VALUES ('production_manager', $1, $2, $3, $4, $5, $6)
      `, [m.title, m.value, m.subtitle, m.trend, m.color, m.order])
    }

    // 4. Update trend overview chart points
    await query(`DELETE FROM dashboard_chart_points WHERE role = 'production_manager' AND chart_key = 'trend'`)
    const monthlyRes = await query(`
      SELECT 
        TO_CHAR(deadline, 'Mon') as label,
        COUNT(*)::numeric as val,
        COALESCE(AVG(efficiency), 0)::numeric as secondary_val
      FROM production_plans
      GROUP BY TO_CHAR(deadline, 'Mon')
      ORDER BY MIN(deadline)
    `)
    
    let chartOrder = 0
    for (const r of monthlyRes.rows) {
      await query(`
        INSERT INTO dashboard_chart_points (role, chart_key, label, value, secondary_value, sort_order)
        VALUES ('production_manager', 'trend', $1, $2, $3, $4)
      `, [r.label, r.val, r.secondary_val, chartOrder++])
    }

    // 5. Update dashboard records for active_batches
    await query(`DELETE FROM dashboard_records WHERE role = 'production_manager' AND record_type = 'active_batches'`)
    const activePlans = await query(`
      SELECT p.plan_code as "batchId", m.name as "product", p.target_quantity as "target", p.completed_quantity as "completed", p.status
      FROM production_plans p
      JOIN shoe_models m ON p.shoe_model_id = m.id
      WHERE p.status IN ('Planned', 'In Progress')
      ORDER BY p.deadline ASC
      LIMIT 6
    `)

    let recordOrder = 0
    for (const row of activePlans.rows) {
      await query(`
        INSERT INTO dashboard_records (role, record_type, payload, sort_order)
        VALUES ('production_manager', 'active_batches', $1, $2)
      `, [JSON.stringify(row), recordOrder++])
    }

  } catch (err) {
    console.error('Error refreshing dashboard metrics:', err)
  }
}

// Fetch all dynamic planning dependencies
export const getPlanningData = async () => {
  const [models, machines, workers, materials] = await Promise.all([
    query('SELECT id, name FROM shoe_models ORDER BY name'),
    query('SELECT id, code, name, status FROM machines ORDER BY code'),
    query("SELECT id, worker_id, name, role, department, email, phone, status FROM production_workers WHERE status = 'active' ORDER BY name"),
    query('SELECT id, material_code, name, quantity, unit, minimum, maximum, unit_cost, supplier, warehouse_location FROM raw_materials ORDER BY material_code')
  ])

  // Map BOM spec dynamically for each model to supply planning form with direct calculation metrics
  const boms = await query(`
    SELECT b.shoe_model_id, r.name as material_name, b.quantity_per_pair
    FROM shoe_bom b
    JOIN raw_materials r ON b.raw_material_id = r.id
  `)

  const bomsByModel = boms.rows.reduce((acc, row) => {
    acc[row.shoe_model_id] ||= []
    acc[row.shoe_model_id].push({
      name: row.material_name,
      qtyPerPair: Number(row.quantity_per_pair)
    })
    return acc
  }, {})

  return {
    shoeModels: models.rows,
    machines: machines.rows,
    workers: workers.rows,
    materials: materials.rows.map(m => ({
      id: m.id,
      code: m.material_code,
      name: m.name,
      available: Number(m.quantity),
      unit: m.unit,
      minimum: Number(m.minimum),
      maximum: Number(m.maximum),
      unitCost: Number(m.unit_cost),
      supplier: m.supplier,
      warehouseLocation: m.warehouse_location
    })),
    boms: bomsByModel
  }
}

// Create a new production plan
export const createPlan = async (planData, currentUser) => {
  const { shoeModelId, size, targetQuantity, deadline, machineId, workerIds } = planData

  if (!shoeModelId || !size || !targetQuantity || !deadline || !machineId || !workerIds || workerIds.length === 0) {
    throw new AppError('All plan details (model, size, quantity, deadline, machine, workers) are required', 400)
  }

  // Check unique order code generation
  const planCode = `PO-2026-${Math.floor(100 + Math.random() * 900)}`

  // Establish standard priority based on deadline proximity
  const daysDiff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  const priority = daysDiff <= 3 ? 'high' : daysDiff <= 7 ? 'medium' : 'low'

  const operatorId = workerIds[0] // Lead operator is the first worker

  // Insert plan record
  const planRes = await query(`
    INSERT INTO production_plans (plan_code, shoe_model_id, size, target_quantity, deadline, machine_id, priority, operator_id, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Planned')
    RETURNING *
  `, [planCode, shoeModelId, size, targetQuantity, deadline, machineId, priority, operatorId])

  const plan = planRes.rows[0]

  // Associate workers
  for (const wId of workerIds) {
    await query('INSERT INTO plan_workers (plan_id, worker_id) VALUES ($1, $2)', [plan.id, wId])
  }

  // Create audit log
  await query(`
    INSERT INTO audit_logs (user_id, action, metadata)
    VALUES ($1, $2, $3)
  `, [currentUser.id, 'create_production_plan', JSON.stringify({ planId: plan.id, planCode })])

  // Trigger dashboard update
  await refreshProductionDashboardMetrics()

  return plan
}

// Fetch current schedules (Gantt tasks, shifts, conflicts)
export const getSchedule = async () => {
  const [plans, workers, shifts, assignments] = await Promise.all([
    query(`
      SELECT p.id, p.plan_code, m.name as model_name, p.size, p.status, p.gantt_start, p.gantt_duration, mach.code as machine_code, mach.name as machine_name, p.machine_id
      FROM production_plans p
      JOIN shoe_models m ON p.shoe_model_id = m.id
      LEFT JOIN machines mach ON p.machine_id = mach.id
      WHERE p.status IN ('Planned', 'In Progress')
      ORDER BY p.deadline ASC
    `),
    query('SELECT id, name FROM production_workers WHERE status = \'active\''),
    query('SELECT id, shift_name, worker_id FROM shift_assignments WHERE assigned_date = CURRENT_DATE'),
    query(`
      SELECT s.shift_name, w.name
      FROM shift_assignments s
      JOIN production_workers w ON s.worker_id = w.id
      WHERE s.assigned_date = CURRENT_DATE
    `)
  ])

  // Group shift workers
  const shiftsMap = {
    morning: { name: 'Morning Shift', time: '6:00 AM - 2:00 PM', workers: [] },
    afternoon: { name: 'Afternoon Shift', time: '2:00 PM - 10:00 PM', workers: [] },
    night: { name: 'Night Shift', time: '10:00 PM - 6:00 AM', workers: [] }
  }

  for (const row of assignments.rows) {
    const shift = shiftsMap[row.shift_name]
    if (shift) {
      shift.workers.push(row.name)
    }
  }

  // Dynamic conflict detection
  const conflicts = []

  // Conflict 1: Machine Overbooking
  // Group plans by machine and check for overlapping Gantt hours
  const machineOverlaps = {}
  for (const p of plans.rows) {
    if (!p.machine_id) continue
    machineOverlaps[p.machine_id] ||= []
    machineOverlaps[p.machine_id].push(p)
  }

  for (const machId in machineOverlaps) {
    const activeRuns = machineOverlaps[machId]
    for (let i = 0; i < activeRuns.length; i++) {
      for (let j = i + 1; j < activeRuns.length; j++) {
        const p1 = activeRuns[i]
        const p2 = activeRuns[j]
        
        const start1 = p1.gantt_start
        const end1 = start1 + p1.gantt_duration
        const start2 = p2.gantt_start
        const end2 = start2 + p2.gantt_duration

        // Check if intervals overlap
        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            shift: start1 < 8 ? 'Morning' : start1 < 16 ? 'Afternoon' : 'Night',
            issue: `Machine ${p1.machine_code} overbooked between ${p1.plan_code} and ${p2.plan_code}`,
            severity: 'high'
          })
        }
      }
    }
  }

  // Conflict 2: Understaffed shifts - only check if there are active plans
  // First, determine which shifts have active production plans
  const shiftsWithPlans = new Set()
  for (const p of plans.rows) {
    if (p.gantt_start !== null && p.gantt_duration !== null) {
      const shift = p.gantt_start < 8 ? 'Morning' : p.gantt_start < 16 ? 'Afternoon' : 'Night'
      shiftsWithPlans.add(shift)
    }
  }

  // Only flag understaffed shifts if they have active plans
  for (const [key, shift] of Object.entries(shiftsMap)) {
    const shiftName = key.charAt(0).toUpperCase() + key.slice(1)
    // Only check staffing if this shift has active production plans
    if (shiftsWithPlans.has(shiftName) && shift.workers.length < 3) {
      conflicts.push({
        shift: shiftName,
        issue: `Insufficient workers assigned (${shift.workers.length}/3 required)`,
        severity: 'medium'
      })
    }
  }

  // Map database plans to Gantt format
  const tasks = plans.rows.map((p) => ({
    id: p.id,
    name: `${p.model_name} - ${p.plan_code}`,
    start: p.gantt_start,
    duration: p.gantt_duration,
    status: p.status,
    machine: p.machine_code || 'Unassigned'
  }))

  return {
    tasks,
    shifts: shiftsMap,
    conflicts
  }
}

// Schedule optimization algorithm: automatically shifts overlapping Gantt items
export const optimizeSchedule = async () => {
  const plans = await query(`
    SELECT id, machine_id, gantt_start, gantt_duration
    FROM production_plans
    WHERE status IN ('Planned', 'In Progress')
    ORDER BY machine_id, deadline ASC
  `)

  // Simple heuristic: resolve machine overbookings by shifting start times sequentially
  const machineHours = {}
  for (const p of plans.rows) {
    if (!p.machine_id) continue
    machineHours[p.machine_id] ||= 0
    
    // Assign plan start time to be the next available hour for that machine
    const newStart = machineHours[p.machine_id]
    await query('UPDATE production_plans SET gantt_start = $1 WHERE id = $2', [newStart, p.id])
    
    // Increment the next available hour
    machineHours[p.machine_id] = (newStart + p.gantt_duration) % 24
  }

  // Seed standard workforce to satisfy understaffed shifts
  const workers = await query("SELECT id FROM production_workers WHERE status = 'active' LIMIT 8")
  if (workers.rowCount >= 8) {
    await query('DELETE FROM shift_assignments WHERE assigned_date = CURRENT_DATE')
    const w = workers.rows
    
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'morning\', $1, CURRENT_DATE)', [w[0].id])
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'morning\', $1, CURRENT_DATE)', [w[1].id])
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'morning\', $1, CURRENT_DATE)', [w[2].id])
    
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'afternoon\', $1, CURRENT_DATE)', [w[3].id])
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'afternoon\', $1, CURRENT_DATE)', [w[4].id])
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'afternoon\', $1, CURRENT_DATE)', [w[5].id])
    
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'night\', $1, CURRENT_DATE)', [w[6].id])
    await query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES (\'night\', $1, CURRENT_DATE)', [w[7].id])
  }

  await refreshProductionDashboardMetrics()

  return { message: 'Schedule optimized successfully' }
}

// Update shift worker assignments
export const updateShiftWorkers = async ({ shiftName, workerIds }) => {
  if (!['morning', 'afternoon', 'night'].includes(shiftName)) {
    throw new AppError('Invalid shift name', 400)
  }

  // Remove existing shift assignments for this shift today
  await query('DELETE FROM shift_assignments WHERE shift_name = $1 AND assigned_date = CURRENT_DATE', [shiftName])

  // Re-assign workers
  for (const wId of workerIds) {
    await query(`
      INSERT INTO shift_assignments (shift_name, worker_id, assigned_date)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT DO NOTHING
    `, [shiftName, wId])
  }

  return { message: 'Shift assignments updated successfully' }
}

// Get production orders & order-related metrics
export const getOrders = async () => {
  const orders = await query(`
    SELECT p.id, p.plan_code as id_code, m.name as product, p.target_quantity as quantity, p.completed_quantity as completed, p.deadline, p.status, p.priority
    FROM production_plans p
    JOIN shoe_models m ON p.shoe_model_id = m.id
    ORDER BY p.deadline ASC
  `)

  // Group status counts
  const total = orders.rowCount
  const completed = orders.rows.filter(o => o.status === 'Completed').length
  const inProgress = orders.rows.filter(o => o.status === 'In Progress').length
  const planned = orders.rows.filter(o => o.status === 'Planned').length

  return {
    orders: orders.rows.map(o => ({
      id: o.id,
      plan_code: o.id_code,
      product: o.product,
      quantity: Number(o.quantity),
      completed: Number(o.completed),
      deadline: o.deadline.toISOString().split('T')[0],
      status: o.status,
      priority: o.priority
    })),
    metrics: {
      totalOrders: total,
      completedCount: completed,
      inProgressCount: inProgress,
      plannedCount: planned
    }
  }
}

// Update status of production orders
export const updateOrderStatus = async ({ id, status, completedQuantity }, currentUser) => {
  if (!['Planned', 'In Progress', 'Completed', 'Paused'].includes(status)) {
    throw new AppError('Invalid production status', 400)
  }

  const planRes = await query('SELECT * FROM production_plans WHERE id = $1', [id])
  if (planRes.rowCount === 0) {
    throw new AppError('Production plan/order not found', 404)
  }

  const plan = planRes.rows[0]

  let updateFields = []
  let params = [status, id]
  
  // Transition state actions
  if (status === 'In Progress' && plan.status !== 'In Progress') {
    // 1. Set start date to today
    updateFields.push('start_date = CURRENT_DATE')

    // 2. Dynamic BOM Deduction from Raw Materials Inventory
    // Fetch materials required for this shoe model
    const bomRes = await query(`
      SELECT raw_material_id, quantity_per_pair
      FROM shoe_bom
      WHERE shoe_model_id = $1
    `, [plan.shoe_model_id])

    for (const b of bomRes.rows) {
      const requiredQty = Number(b.quantity_per_pair) * plan.target_quantity
      
      // Update inventory (deduct quantity)
      await query(`
        UPDATE raw_materials
        SET quantity = GREATEST(0, quantity - $1), last_restocked = NOW()
        WHERE id = $2
      `, [requiredQty, b.raw_material_id])
    }
  }

  if (status === 'Completed' && plan.status !== 'Completed') {
    updateFields.push('end_date = CURRENT_DATE')
    
    const qty = completedQuantity !== undefined ? completedQuantity : plan.target_quantity
    updateFields.push(`completed_quantity = $${params.length + 1}`)
    params.push(qty)

    // Compute dynamic, high-fidelity metrics for history simulation
    const efficiency = (92 + Math.random() * 7).toFixed(1) // 92% - 99%
    const defectRate = (1.0 + Math.random() * 2).toFixed(1) // 1% - 3%
    
    updateFields.push(`efficiency = $${params.length + 1}`)
    params.push(efficiency)
    updateFields.push(`defect_rate = $${params.length + 1}`)
    params.push(defectRate)
  }

  if (status === 'Paused') {
    // Audit logs for pausing
  }

  // Execute update
  await query(`
    UPDATE production_plans
    SET status = $1, ${updateFields.join(', ')}
    WHERE id = $2
  `, params)

  // Write audit log
  await query(`
    INSERT INTO audit_logs (user_id, action, metadata)
    VALUES ($1, $2, $3)
  `, [currentUser.id, 'update_production_status', JSON.stringify({ planId: id, status, planCode: plan.plan_code })])

  // Sync dashboard
  await refreshProductionDashboardMetrics()

  return { message: 'Order status updated successfully' }
}

// Fetch complete historical production records
export const getHistory = async () => {
  const history = await query(`
    SELECT p.plan_code as id, m.name as product, p.size, p.target_quantity as quantity, p.completed_quantity as completed,
           p.start_date, p.end_date, p.status, p.efficiency, p.defect_rate, w.name as operator, mach.name as machine
    FROM production_plans p
    JOIN shoe_models m ON p.shoe_model_id = m.id
    LEFT JOIN production_workers w ON p.operator_id = w.id
    LEFT JOIN machines mach ON p.machine_id = mach.id
    ORDER BY p.end_date DESC NULLS LAST, p.created_at DESC
  `)

  // Calculate historical metrics
  const completedPlans = history.rows.filter(h => h.status === 'Completed')
  const totalCompleted = completedPlans.reduce((sum, h) => sum + Number(h.completed), 0)
  
  const avgEfficiency = completedPlans.length > 0
    ? (completedPlans.reduce((sum, h) => sum + Number(h.efficiency), 0) / completedPlans.length).toFixed(1)
    : '0.0'
    
  const avgDefectRate = completedPlans.length > 0
    ? (completedPlans.reduce((sum, h) => sum + Number(h.defect_rate), 0) / completedPlans.length).toFixed(1)
    : '0.0'

  return {
    history: history.rows.map(h => ({
      id: h.id,
      product: h.product,
      size: h.size,
      quantity: Number(h.quantity),
      completed: Number(h.completed),
      startDate: h.start_date ? h.start_date.toISOString().split('T')[0] : '-',
      endDate: h.end_date ? h.end_date.toISOString().split('T')[0] : '-',
      status: h.status,
      efficiency: Number(h.efficiency),
      defectRate: Number(h.defect_rate),
      operator: h.operator || 'System Operator',
      machine: h.machine || 'General Line'
    })),
    metrics: {
      totalCompleted,
      avgEfficiency: `${avgEfficiency}%`,
      avgDefectRate: `${avgDefectRate}%`,
      totalBatches: history.rowCount
    }
  }
}
