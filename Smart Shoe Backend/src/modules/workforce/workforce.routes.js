import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as controller from './workforce.controller.js'

const router = Router()
router.use(authenticate)

// Employees
router.post('/employees', controller.createEmployee)
router.get('/employees', controller.listEmployees)
router.get('/employees/departments', controller.listDepartments)
router.get('/employees/:id', controller.getEmployee)
router.patch('/employees/:id', controller.updateEmployee)
router.delete('/employees/:id', controller.deleteEmployee)

// Tasks
router.post('/tasks', controller.createTask)
router.get('/tasks', controller.listTasks)
router.patch('/tasks/:id/status', controller.updateTaskStatus)

// Attendance
router.post('/attendance', controller.recordAttendance)
router.get('/attendance', controller.getAttendance)

// Performance
router.post('/performance', controller.createPerformanceReview)
router.get('/performance', controller.listAllPerformanceReviews)
router.get('/performance/:id', controller.getPerformanceReviews)

// Leave
router.post('/leave', controller.requestLeave)
router.get('/leave', controller.listLeaveRequests)
router.patch('/leave/:id/status', controller.updateLeaveStatus)

// Labor costs
router.get('/labor-costs', controller.getLaborCosts)

export default router
