import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as dashboardController from './dashboard.controller.js'

const router = Router()

router.use(authenticate)
router.get('/', dashboardController.dashboard)
router.get('/notifications', dashboardController.notifications)
router.patch('/notifications/:id/read', dashboardController.markNotificationRead)
router.patch('/notifications/read-all', dashboardController.markAllNotificationsRead)

export default router
