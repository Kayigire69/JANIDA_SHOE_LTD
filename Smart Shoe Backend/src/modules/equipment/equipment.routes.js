import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as controller from './equipment.controller.js'

const router = Router()
router.use(authenticate)

// Spare parts (global collection) — place before /:id to avoid shadowing
router.post('/spare-parts', controller.createSparePart)
router.get('/spare-parts', controller.listSpareParts)
router.patch('/spare-parts/:id', controller.updateSparePart)
router.delete('/spare-parts/:id', controller.deleteSparePart)

// Equipment catalog
router.post('/', controller.createEquipment)
router.get('/', controller.listEquipment)
router.get('/types', controller.listTypes)
router.get('/departments', controller.listDepartments)
router.get('/metrics', controller.getMetrics)
router.get('/:id', controller.getEquipment)
router.patch('/:id', controller.updateEquipment)
router.delete('/:id', controller.deleteEquipment)

// Maintenance
router.post('/:id/maintenance', controller.createMaintenance)
router.get('/:id/maintenance', controller.listMaintenance)
router.patch('/maintenance/:id/status', controller.updateMaintenanceStatus)

// Downtime
router.post('/:id/downtime', controller.createDowntime)
router.get('/:id/downtime', controller.listDowntime)

// Calibration
router.post('/:id/calibration', controller.createCalibration)
router.get('/:id/calibration', controller.listCalibration)

export default router
