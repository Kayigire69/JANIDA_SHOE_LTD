import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import * as batchController from './batch.controller.js'

const router = Router()

// All batch routes require authentication
router.use(authenticate)

// Get all recall entries (any authenticated user can trace history)
router.get('/recall/list', batchController.getRecalls)

// Batch tracking and lookup
router.get('/', batchController.getBatches)
router.get('/:id', batchController.getBatchDetails)
router.get('/number/:batchNumber', batchController.getBatchByNumber)

// Batch creation and updates (restricted by role)
router.post('/', authorize('production_manager', 'administrator'), batchController.createBatch)
router.patch('/:id/status', authorize('production_manager', 'quality_officer', 'administrator'), batchController.updateBatchStatus)
router.patch('/:id/location', authorize('production_manager', 'quality_officer', 'administrator'), batchController.updateBatchLocation)

// Recall management (restricted by role)
router.post('/recall', authorize('quality_officer', 'administrator'), batchController.createRecall)
router.patch('/recall/:id', authorize('quality_officer', 'administrator'), batchController.updateRecall)

export default router
