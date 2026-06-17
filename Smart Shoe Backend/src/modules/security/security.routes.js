import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import * as controller from './security.controller.js'

const router = Router()
router.use(authenticate)
router.use(authorize('administrator', 'production_manager', 'quality_officer'))

// Audit logs
router.get('/audit-logs', controller.listAuditLogs)
router.get('/audit-actions', controller.getAuditActions)
router.get('/audit-export', controller.exportAuditTrail)

// Login activity
router.get('/login-activity', controller.listLoginActivity)

// Active sessions
router.get('/sessions', controller.listActiveSessions)
router.patch('/sessions/:id/revoke', controller.revokeSession)

// Security alerts
router.get('/alerts', controller.listSecurityAlerts)
router.post('/alerts', controller.createSecurityAlert)
router.patch('/alerts/:id/status', controller.updateAlertStatus)

// Data retention policies
router.get('/retention-policies', controller.listRetentionPolicies)
router.patch('/retention-policies/:id', controller.updateRetentionPolicy)

// Metrics
router.get('/metrics', controller.getSecurityMetrics)

export default router
