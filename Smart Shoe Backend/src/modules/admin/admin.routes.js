import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import { upload } from '../../middleware/upload.js'
import * as controller from './admin.controller.js'

const router = Router()
router.use(authenticate)

// System overview (admin only)
router.get('/overview', authorize('administrator'), controller.getSystemOverview)

// Announcements (admin only)
router.post('/announcements', authorize('administrator'), controller.createAnnouncement)

// User management (admin only)
router.get('/users', authorize('administrator'), controller.listUsers)
router.patch('/users/:id/role', authorize('administrator'), controller.updateUserRole)
router.patch('/users/:id/lock', authorize('administrator'), controller.toggleUserLock)
router.delete('/users/:id', authorize('administrator'), controller.deleteUser)

// Product catalog (admin and production manager)
router.get('/products', authorize('administrator', 'production_manager'), controller.listProducts)
router.post('/products', authorize('administrator', 'production_manager'), controller.createProduct)
router.get('/products/:id/bom', authorize('administrator', 'production_manager'), controller.getBomForProduct)
router.post('/products/:id/bom', authorize('administrator', 'production_manager'), controller.addBomItem)
router.patch('/products/:id', authorize('administrator', 'production_manager'), controller.updateProduct)
router.delete('/products/:id', authorize('administrator', 'production_manager'), controller.deleteProduct)

// BOM global (admin and production manager)
router.delete('/bom/:bomId', authorize('administrator', 'production_manager'), controller.removeBomItem)

// Production lines (admin and production manager)
router.get('/production-lines', authorize('administrator', 'production_manager'), controller.listProductionLines)
router.post('/production-lines', authorize('administrator', 'production_manager'), controller.createProductionLine)
router.get('/production-lines/:id/machines', authorize('administrator', 'production_manager'), controller.getLineMachines)
router.post('/production-lines/:id/machines', authorize('administrator', 'production_manager'), controller.addMachineToLine)
router.delete('/production-lines/:id/machines/:machineAssignmentId', authorize('administrator', 'production_manager'), controller.removeMachineFromLine)
router.patch('/production-lines/:id', authorize('administrator', 'production_manager'), controller.updateProductionLine)
router.delete('/production-lines/:id', authorize('administrator', 'production_manager'), controller.deleteProductionLine)

// Quality standards (admin only)
router.get('/quality-standards', authorize('administrator'), controller.listQualityStandards)
router.post('/quality-standards', authorize('administrator'), controller.createQualityStandard)
router.patch('/quality-standards/:id', authorize('administrator'), controller.updateQualityStandard)
router.delete('/quality-standards/:id', authorize('administrator'), controller.deleteQualityStandard)

// System settings (admin only)
router.get('/settings', authorize('administrator'), controller.listSystemSettings)
router.patch('/settings/:id', authorize('administrator'), controller.updateSystemSetting)
router.post('/settings/logo', authorize('administrator'), upload.single('logo'), controller.uploadLogo)

// Backups (admin only)
router.get('/backups', authorize('administrator'), controller.listBackups)
router.post('/backups', authorize('administrator'), controller.createBackup)
router.patch('/backups/:id', authorize('administrator'), controller.completeBackup)
router.delete('/backups/:id', authorize('administrator'), controller.deleteBackup)

// Lookup data (admin and production manager)
router.get('/raw-materials', authorize('administrator', 'production_manager'), controller.listRawMaterialsForBom)
router.get('/machines', authorize('administrator', 'production_manager'), controller.listMachinesForLine)
router.get('/supervisors', authorize('administrator', 'production_manager'), controller.listSupervisors)

export default router
