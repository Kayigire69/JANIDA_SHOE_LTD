import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as productionController from './production.controller.js'

const router = Router()

router.use(authenticate)

router.get('/planning-data', productionController.getPlanningData)
router.post('/plans', productionController.createPlan)
router.get('/schedule', productionController.getSchedule)
router.post('/schedule/optimize', productionController.optimizeSchedule)
router.post('/schedule/shifts', productionController.updateShiftWorkers)
router.get('/orders', productionController.getOrders)
router.patch('/orders/:id/status', productionController.updateOrderStatus)
router.get('/history', productionController.getHistory)

export default router
