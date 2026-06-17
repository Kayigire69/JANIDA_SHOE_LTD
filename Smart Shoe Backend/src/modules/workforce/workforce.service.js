import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

// ---- Employees ----
export const createEmployee = async (data, createdBy) => {
  const { employeeCode, fullName, email, phone, role, department, shift, skills, hourlyRate, hireDate, emergencyContact } = data
  if (!employeeCode || !fullName || !email || !role || !department) {
    throw new AppError('Employee code, full name, email, role and department are required', 400)
  }

  const existing = await query('SELECT id FROM workforce_employees WHERE employee_code = $1 OR email = $2', [employeeCode, email])
  if (existing.rowCount > 0) {
    throw new AppError('An employee with this code or email already exists', 409)
  }

  const result = await query(
    `INSERT INTO workforce_employees (employee_code, full_name, email, phone, role, department, shift, skills, hourly_rate, hire_date, emergency_contact, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [employeeCode, fullName, email, phone || null, role, department, shift || 'morning', skills || [], hourlyRate || 0, hireDate || new Date().toISOString().slice(0,10), emergencyContact || null, createdBy]
  )
  return result.rows[0]
}

export const listEmployees = async ({ search = '', department = 'all', status = 'all', shift = 'all' }) => {
  let sql = `
    SELECT id, employee_code, full_name, email, phone, role, department, shift, status, skills, hourly_rate, hire_date, emergency_contact, created_at
    FROM workforce_employees
    WHERE 1=1
  `
  const values = []
  let idx = 1

  if (search) {
    sql += ` AND (LOWER(full_name) LIKE $${idx} OR LOWER(employee_code) LIKE $${idx} OR LOWER(email) LIKE $${idx})`
    values.push(`%${search.toLowerCase()}%`)
    idx++
  }
  if (department !== 'all') {
    sql += ` AND department = $${idx}`
    values.push(department)
    idx++
  }
  if (status !== 'all') {
    sql += ` AND status = $${idx}`
    values.push(status)
    idx++
  }
  if (shift !== 'all') {
    sql += ` AND shift = $${idx}`
    values.push(shift)
    idx++
  }

  sql += ' ORDER BY full_name LIMIT 500'
  const result = await query(sql, values)

  return {
    employees: result.rows.map(r => ({
      id: r.id,
      employeeCode: r.employee_code,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      role: r.role,
      department: r.department,
      shift: r.shift,
      status: r.status,
      skills: Array.isArray(r.skills) ? r.skills : [],
      hourlyRate: Number(r.hourly_rate),
      hireDate: r.hire_date,
      emergencyContact: r.emergency_contact,
      createdAt: r.created_at
    }))
  }
}

export const getEmployee = async (id) => {
  const result = await query('SELECT * FROM workforce_employees WHERE id = $1', [id])
  if (result.rowCount === 0) throw new AppError('Employee not found', 404)
  const r = result.rows[0]
  return {
    id: r.id,
    employeeCode: r.employee_code,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    department: r.department,
    shift: r.shift,
    status: r.status,
    skills: Array.isArray(r.skills) ? r.skills : [],
    hourlyRate: Number(r.hourly_rate),
    hireDate: r.hire_date,
    emergencyContact: r.emergency_contact,
    createdAt: r.created_at
  }
}

export const updateEmployee = async (id, data) => {
  const current = await getEmployee(id)
  const fields = []
  const values = []
  let idx = 1

  const map = {
    fullName: 'full_name',
    email: 'email',
    phone: 'phone',
    role: 'role',
    department: 'department',
    shift: 'shift',
    status: 'status',
    skills: 'skills',
    hourlyRate: 'hourly_rate',
    hireDate: 'hire_date',
    emergencyContact: 'emergency_contact'
  }

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = $${idx}`)
      values.push(data[key])
      idx++
    }
  }
  if (fields.length === 0) throw new AppError('No fields to update', 400)

  values.push(id)
  const result = await query(
    `UPDATE workforce_employees SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
    values
  )
  return result.rows[0]
}

export const deleteEmployee = async (id) => {
  await query('DELETE FROM workforce_employees WHERE id = $1', [id])
  return { message: 'Employee deleted' }
}

// ---- Department options (dynamic from existing employees) ----
export const listDepartments = async () => {
  const result = await query(`SELECT DISTINCT department FROM workforce_employees ORDER BY department`)
  return { departments: result.rows.map(r => r.department) }
}

// ---- Tasks ----
export const createTask = async (data, assignedBy) => {
  const { employeeId, title, description, priority, dueDate } = data
  if (!employeeId || !title) throw new AppError('Employee ID and title are required', 400)
  const result = await query(
    `INSERT INTO workforce_tasks (employee_id, title, description, priority, due_date, assigned_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [employeeId, title, description || null, priority || 'medium', dueDate || null, assignedBy]
  )
  return result.rows[0]
}

export const listTasks = async ({ employeeId, status = 'all' }) => {
  let sql = 'SELECT * FROM workforce_tasks WHERE 1=1'
  const values = []
  let idx = 1
  if (employeeId) {
    sql += ` AND employee_id = $${idx}`
    values.push(employeeId)
    idx++
  }
  if (status !== 'all') {
    sql += ` AND status = $${idx}`
    values.push(status)
    idx++
  }
  sql += ' ORDER BY created_at DESC LIMIT 500'
  const result = await query(sql, values)
  return { tasks: result.rows }
}

export const updateTaskStatus = async (id, status) => {
  await query(`UPDATE workforce_tasks SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id])
  return { message: 'Task updated' }
}

// ---- Attendance ----
export const recordAttendance = async (data) => {
  const { employeeId, workDate, checkIn, checkOut, status, hoursWorked } = data
  const result = await query(
    `INSERT INTO workforce_attendance (employee_id, work_date, check_in, check_out, status, hours_worked)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (employee_id, work_date) DO UPDATE SET check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out, status = EXCLUDED.status, hours_worked = EXCLUDED.hours_worked
     RETURNING *`,
    [employeeId, workDate, checkIn || null, checkOut || null, status || 'present', hoursWorked || 0]
  )
  return result.rows[0]
}

export const getAttendance = async ({ employeeId, startDate, endDate }) => {
  const result = await query(
    `SELECT a.*, e.full_name, e.employee_code
     FROM workforce_attendance a
     JOIN workforce_employees e ON a.employee_id = e.id
     WHERE a.employee_id = $1 AND a.work_date BETWEEN $2 AND $3
     ORDER BY a.work_date DESC`,
    [employeeId, startDate, endDate]
  )
  return { records: result.rows }
}

// ---- Performance ----
export const createPerformanceReview = async (data, reviewedBy) => {
  const { employeeId, reviewPeriod, productivityScore, qualityScore, attendanceScore, overallScore, notes } = data
  const result = await query(
    `INSERT INTO workforce_performance_reviews (employee_id, review_period, productivity_score, quality_score, attendance_score, overall_score, notes, reviewed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [employeeId, reviewPeriod, productivityScore, qualityScore, attendanceScore, overallScore, notes || null, reviewedBy]
  )
  return result.rows[0]
}

export const getPerformanceReviews = async (employeeId) => {
  const result = await query(
    `SELECT * FROM workforce_performance_reviews WHERE employee_id = $1 ORDER BY created_at DESC`,
    [employeeId]
  )
  return { reviews: result.rows }
}

// ---- Leave ----
export const requestLeave = async (data) => {
  const { employeeId, leaveType, startDate, endDate, reason } = data
  const result = await query(
    `INSERT INTO workforce_leave_requests (employee_id, leave_type, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [employeeId, leaveType, startDate, endDate, reason || null]
  )
  return result.rows[0]
}

export const listLeaveRequests = async ({ employeeId, status = 'all' }) => {
  let sql = 'SELECT * FROM workforce_leave_requests WHERE 1=1'
  const values = []
  let idx = 1
  if (employeeId) {
    sql += ` AND employee_id = $${idx}`
    values.push(employeeId)
    idx++
  }
  if (status !== 'all') {
    sql += ` AND status = $${idx}`
    values.push(status)
    idx++
  }
  sql += ' ORDER BY created_at DESC'
  const result = await query(sql, values)
  return { leaves: result.rows }
}

export const updateLeaveStatus = async (id, status, reviewedBy) => {
  await query(`UPDATE workforce_leave_requests SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3`, [status, reviewedBy, id])
  return { message: 'Leave request updated' }
}

// ---- Labor cost overview ----
export const getLaborCosts = async ({ startDate, endDate }) => {
  const [attendanceRes, leaveRes] = await Promise.all([
    query(
      `SELECT e.id, e.full_name, e.hourly_rate, SUM(a.hours_worked) as total_hours
       FROM workforce_employees e
       LEFT JOIN workforce_attendance a ON a.employee_id = e.id AND a.work_date BETWEEN $1 AND $2
       GROUP BY e.id, e.full_name, e.hourly_rate`,
      [startDate, endDate]
    ),
    query(
      `SELECT COUNT(*)::int as leave_days FROM workforce_leave_requests WHERE status = 'approved' AND start_date <= $2 AND end_date >= $1`,
      [startDate, endDate]
    )
  ])

  const costs = attendanceRes.rows.map(r => ({
    employeeId: r.id,
    fullName: r.full_name,
    totalHours: Number(r.total_hours || 0),
    hourlyRate: Number(r.hourly_rate),
    cost: Number((r.total_hours || 0) * r.hourly_rate)
  }))

  const totalCost = costs.reduce((s, c) => s + c.cost, 0)
  return { costs, totalCost, leaveDays: leaveRes.rows[0]?.leave_days || 0, period: { startDate, endDate } }
}
