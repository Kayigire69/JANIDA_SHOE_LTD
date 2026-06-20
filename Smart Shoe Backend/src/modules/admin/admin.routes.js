import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import { upload } from '../../middleware/upload.js'
import * as controller from './admin.controller.js'

const router = Router()
router.use(authenticate)
router.use(authorize('administrator'))

// System overview
router.get('/overview', controller.getSystemOverview)

// Announcements
router.post('/announcements', controller.createAnnouncement)

// User management
router.get('/users', controller.listUsers)
router.patch('/users/:id/role', controller.updateUserRole)
router.patch('/users/:id/lock', controller.toggleUserLock)
router.delete('/users/:id', controller.deleteUser)

// Product catalog
router.get('/products', controller.listProducts)
router.post('/products', controller.createProduct)
router.get('/products/:id/bom', controller.getBomForProduct)
router.post('/products/:id/bom', controller.addBomItem)
router.patch('/products/:id', controller.updateProduct)
router.delete('/products/:id', controller.deleteProduct)

// BOM global
router.delete('/bom/:bomId', controller.removeBomItem)

// Production lines
router.get('/production-lines', controller.listProductionLines)
router.post('/production-lines', controller.createProductionLine)
router.get('/production-lines/:id/machines', controller.getLineMachines)
router.post('/production-lines/:id/machines', controller.addMachineToLine)
router.delete('/production-lines/:id/machines/:machineAssignmentId', controller.removeMachineFromLine)
router.patch('/production-lines/:id', controller.updateProductionLine)
router.delete('/production-lines/:id', controller.deleteProductionLine)

// Quality standards
router.get('/quality-standards', controller.listQualityStandards)
router.post('/quality-standards', controller.createQualityStandard)
router.patch('/quality-standards/:id', controller.updateQualityStandard)
router.delete('/quality-standards/:id', controller.deleteQualityStandard)

// System settings
router.get('/settings', controller.listSystemSettings)
router.patch('/settings/:id', controller.updateSystemSetting)
router.post('/settings/logo', upload.single('logo'), controller.uploadLogo)

// Backups
router.get('/backups', controller.listBackups)
router.post('/backups', controller.createBackup)
router.patch('/backups/:id', controller.completeBackup)
router.delete('/backups/:id', controller.deleteBackup)

// Lookup data
router.get('/raw-materials', controller.listRawMaterialsForBom)
router.get('/machines', controller.listMachinesForLine)
router.get('/supervisors', controller.listSupervisors)

export default router
