import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as productionController from './production.controller.js'

const router = Router()

router.use(authenticate)

// Machine management
router.get('/machines', productionController.listMachines)
router.post('/machines', productionController.createMachine)
router.patch('/machines/:id', productionController.updateMachine)
router.delete('/machines/:id', productionController.deleteMachine)

// Production worker management
router.get('/workers', productionController.listProductionWorkers)
router.post('/workers', productionController.createProductionWorker)
router.patch('/workers/:id', productionController.updateProductionWorker)
router.delete('/workers/:id', productionController.deleteProductionWorker)

router.get('/planning-data', productionController.getPlanningData)
router.post('/plans', productionController.createPlan)
router.get('/schedule', productionController.getSchedule)
router.post('/schedule/optimize', productionController.optimizeSchedule)
router.post('/schedule/shifts', productionController.updateShiftWorkers)
router.get('/orders', productionController.getOrders)
router.patch('/orders/:id/status', productionController.updateOrderStatus)
router.get('/history', productionController.getHistory)

export default router
