import { Router } from 'express'
import * as authController from './auth.controller.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

router.post('/register', authController.register)
router.post('/verify-email', authController.verifyEmail)
router.post('/resend-verification', authController.resendVerification)
router.post('/login', authController.login)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.get('/settings', authController.getPublicSettings)
router.get('/profile', authenticate, authController.profile)
router.patch('/profile', authenticate, authController.updateProfile)
router.patch('/change-password', authenticate, authController.changePassword)
router.post('/mfa/setup', authenticate, authController.beginMfaSetup)
router.post('/mfa/verify', authenticate, authController.verifyMfaSetup)
router.get('/sessions', authenticate, authController.sessions)
router.post('/logout', authenticate, authController.logout)

export default router
