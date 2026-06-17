import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import * as qualityController from './quality.controller.js'

const router = Router()

// All quality routes require authentication
router.use(authenticate)

// Templates
router.get('/templates', qualityController.getInspectionTemplates)
router.post('/templates', authorize('quality_officer', 'administrator'), qualityController.createInspectionTemplate)

// Inspections
router.get('/inspections', qualityController.getInspections)
router.post('/inspections', authorize('quality_officer', 'administrator'), qualityController.createInspection)

// Rework Orders
router.get('/rework', qualityController.getReworkOrders)
router.patch('/rework/:id', authorize('quality_officer', 'production_manager', 'administrator'), qualityController.updateReworkOrderStatus)

// Certificates
router.get('/certificates', qualityController.getQualityCertificates)

// Analytics
router.get('/analytics', qualityController.getDefectAnalytics)

export default router
