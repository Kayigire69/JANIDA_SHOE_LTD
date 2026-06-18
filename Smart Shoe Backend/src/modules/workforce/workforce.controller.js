import * as workforceService from './workforce.service.js'

const wrap = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req, res))
  } catch (err) {
    next(err)
  }
}

// Employees
export const createEmployee = wrap(async (req) => workforceService.createEmployee(req.body, req.user.id))
export const listEmployees = wrap(async (req) => workforceService.listEmployees({
  search: req.query.search || '',
  department: req.query.department || 'all',
  status: req.query.status || 'all',
  shift: req.query.shift || 'all'
}))
export const getEmployee = wrap(async (req) => workforceService.getEmployee(req.params.id))
export const updateEmployee = wrap(async (req) => workforceService.updateEmployee(req.params.id, req.body))
export const deleteEmployee = wrap(async (req) => workforceService.deleteEmployee(req.params.id))
export const listDepartments = wrap(async () => workforceService.listDepartments())

// Tasks
export const createTask = wrap(async (req) => workforceService.createTask(req.body, req.user.id))
export const listTasks = wrap(async (req) => workforceService.listTasks({
  employeeId: req.query.employeeId || null,
  status: req.query.status || 'all'
}))
export const updateTaskStatus = wrap(async (req) => workforceService.updateTaskStatus(req.params.id, req.body.status))

// Attendance
export const recordAttendance = wrap(async (req) => workforceService.recordAttendance(req.body))
export const getAttendance = wrap(async (req) => workforceService.getAttendance({
  employeeId: req.query.employeeId,
  startDate: req.query.startDate,
  endDate: req.query.endDate
}))

// Performance
export const createPerformanceReview = wrap(async (req) => workforceService.createPerformanceReview(req.body, req.user.id))
export const listAllPerformanceReviews = wrap(async () => workforceService.listAllPerformanceReviews())
export const getPerformanceReviews = wrap(async (req) => workforceService.getPerformanceReviews(req.params.id))

// Leave
export const requestLeave = wrap(async (req) => workforceService.requestLeave(req.body))
export const listLeaveRequests = wrap(async (req) => workforceService.listLeaveRequests({
  employeeId: req.query.employeeId || null,
  status: req.query.status || 'all'
}))
export const updateLeaveStatus = wrap(async (req) => workforceService.updateLeaveStatus(req.params.id, req.body.status, req.user.id))

// Labor costs
export const getLaborCosts = wrap(async (req) => workforceService.getLaborCosts({
  startDate: req.query.startDate,
  endDate: req.query.endDate
}))
