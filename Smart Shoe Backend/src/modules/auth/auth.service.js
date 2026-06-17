import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import { query } from '../../config/db.js'
import { env } from '../../config/env.js'
import { AppError } from '../../utils/AppError.js'
import { createJwt, createPlainToken, createSixDigitCode, hashToken } from '../../utils/tokens.js'
import { sendPasswordResetEmail, sendVerificationEmail } from './mail.service.js'

const publicUser = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone,
  employeeId: user.employee_id,
  role: user.role,
  department: user.department,
  emailVerified: user.email_verified,
  mfaEnabled: user.mfa_enabled,
  lastLoginAt: user.last_login_at
})

const audit = async ({ userId, action, metadata = {}, req }) => {
  await query(
    `INSERT INTO audit_logs (user_id, action, metadata, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
    [userId || null, action, metadata, req.ip, req.get('user-agent')]
  )
}

const trackLogin = async ({ email, success, reason, req }) => {
  await query(
    `INSERT INTO login_attempts (email, success, reason, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
    [email, success, reason || null, req.ip, req.get('user-agent')]
  )
}

export const register = async (data, req) => {
  const existing = await query(`SELECT id FROM users WHERE email = $1 OR employee_id = $2`, [data.email, data.employeeId])

  if (existing.rowCount > 0) {
    throw new AppError('A user with this email or employee ID already exists', 409)
  }

  const passwordHash = await bcrypt.hash(data.password, 12)
  const created = await query(
    `INSERT INTO users (full_name, email, phone, employee_id, role, department, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.fullName, data.email.toLowerCase(), data.phone, data.employeeId, data.role, data.department, passwordHash]
  )

  const user = created.rows[0]
  const code = createSixDigitCode()

  await query(
    `INSERT INTO verification_tokens (user_id, token_hash, type, expires_at) VALUES ($1, $2, 'email_verification', NOW() + INTERVAL '15 minutes')`,
    [user.id, hashToken(code)]
  )

  await sendVerificationEmail({ to: user.email, code })
  await audit({ userId: user.id, action: 'user.registered', metadata: { role: user.role, department: user.department }, req })

  return { user: publicUser(user), message: 'Registration successful. Check your email for the verification code.' }
}

export const verifyEmail = async ({ email, code }, req) => {
  const userResult = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])

  if (userResult.rowCount === 0) {
    throw new AppError('Invalid verification request', 400)
  }

  const user = userResult.rows[0]
  const tokenResult = await query(
    `SELECT id FROM verification_tokens
     WHERE user_id = $1 AND type = 'email_verification' AND token_hash = $2 AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, hashToken(code)]
  )

  if (tokenResult.rowCount === 0) {
    throw new AppError('Invalid or expired verification code', 400)
  }

  await query(`UPDATE verification_tokens SET used_at = NOW() WHERE id = $1`, [tokenResult.rows[0].id])
  await query(`UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`, [user.id])
  await audit({ userId: user.id, action: 'user.email_verified', req })

  return { message: 'Email verified successfully' }
}

export const resendVerification = async ({ email }, req) => {
  const userResult = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])

  if (userResult.rowCount === 0 || userResult.rows[0].email_verified) {
    return { message: 'If verification is required, a new code has been sent.' }
  }

  const user = userResult.rows[0]
  const code = createSixDigitCode()

  await query(
    `INSERT INTO verification_tokens (user_id, token_hash, type, expires_at) VALUES ($1, $2, 'email_verification', NOW() + INTERVAL '15 minutes')`,
    [user.id, hashToken(code)]
  )

  await sendVerificationEmail({ to: user.email, code })
  await audit({ userId: user.id, action: 'user.email_verification_resent', req })

  return { message: 'If verification is required, a new code has been sent.' }
}

export const login = async ({ email, password, mfaCode }, req) => {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])

  if (result.rowCount === 0) {
    await trackLogin({ email, success: false, reason: 'unknown_email', req })
    throw new AppError('Invalid email or password', 401)
  }

  const user = result.rows[0]

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await trackLogin({ email, success: false, reason: 'account_locked', req })
    throw new AppError('Account temporarily locked. Try again later.', 423)
  }

  const matches = await bcrypt.compare(password, user.password_hash)

  if (!matches) {
    const failed = user.failed_login_attempts + 1
    const lockedUntil = failed >= 5 ? `NOW() + INTERVAL '15 minutes'` : 'NULL'
    await query(`UPDATE users SET failed_login_attempts = $1, locked_until = ${lockedUntil} WHERE id = $2`, [failed, user.id])
    await trackLogin({ email, success: false, reason: 'bad_password', req })
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.email_verified) {
    await trackLogin({ email, success: false, reason: 'email_not_verified', req })
    throw new AppError('Please verify your email before signing in', 403)
  }

  if (user.mfa_enabled) {
    const verified = speakeasy.totp.verify({ secret: user.mfa_secret, encoding: 'base32', token: mfaCode || '', window: 1 })

    if (!verified) {
      await trackLogin({ email, success: false, reason: 'mfa_required_or_invalid', req })
      return { mfaRequired: true, message: 'MFA code required' }
    }
  }

  const jwtId = crypto.randomUUID()
  const token = createJwt({ user, jwtId })
  const expiresAt = new Date(Date.now() + env.SESSION_TIMEOUT_MINUTES * 60 * 1000)

  await query(
    `INSERT INTO user_sessions (user_id, jwt_id, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5)`,
    [user.id, jwtId, req.ip, req.get('user-agent'), expiresAt]
  )
  await query(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`, [user.id])
  await trackLogin({ email, success: true, req })
  await audit({ userId: user.id, action: 'user.login', req })

  return { token, expiresAt, user: publicUser({ ...user, last_login_at: new Date() }) }
}

export const forgotPassword = async ({ email }, req) => {
  const result = await query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])

  if (result.rowCount === 0) {
    return { message: 'If that account exists, a reset link has been sent.' }
  }

  const user = result.rows[0]
  const token = createPlainToken(24)

  await query(
    `INSERT INTO verification_tokens (user_id, token_hash, type, expires_at) VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '30 minutes')`,
    [user.id, hashToken(token)]
  )

  await sendPasswordResetEmail({ to: user.email, token })
  await audit({ userId: user.id, action: 'user.password_reset_requested', req })

  return { message: 'If that account exists, a reset link has been sent.' }
}

export const resetPassword = async ({ token, password }, req) => {
  const tokenResult = await query(
    `SELECT vt.id, vt.user_id FROM verification_tokens vt
     WHERE vt.token_hash = $1 AND vt.type = 'password_reset' AND vt.used_at IS NULL AND vt.expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  )

  if (tokenResult.rowCount === 0) {
    throw new AppError('Invalid or expired reset token', 400)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const userId = tokenResult.rows[0].user_id

  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, userId])
  await query(`UPDATE verification_tokens SET used_at = NOW() WHERE id = $1`, [tokenResult.rows[0].id])
  await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`, [userId])
  await audit({ userId, action: 'user.password_reset_completed', req })

  return { message: 'Password reset successful. Please sign in again.' }
}

export const getProfile = async (userId) => {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [userId])

  if (result.rowCount === 0) {
    throw new AppError('User not found', 404)
  }

  return { user: publicUser(result.rows[0]) }
}

export const updateProfile = async (userId, data, req) => {
  const result = await query(
    `UPDATE users SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [data.fullName, data.phone, userId]
  )

  await audit({ userId, action: 'user.profile_updated', req })
  return { user: publicUser(result.rows[0]) }
}

export const changePassword = async (userId, data, req) => {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [userId])
  const user = result.rows[0]
  const matches = await bcrypt.compare(data.currentPassword, user.password_hash)

  if (!matches) {
    throw new AppError('Current password is incorrect', 400)
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12)
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [passwordHash, userId])
  await audit({ userId, action: 'user.password_changed', req })

  return { message: 'Password changed successfully' }
}

export const beginMfaSetup = async (user, req) => {
  const secret = speakeasy.generateSecret({ name: `SmartShoeFactory:${user.email}`, issuer: 'SmartShoeFactory' })

  await query(`UPDATE users SET mfa_secret = $1, updated_at = NOW() WHERE id = $2`, [secret.base32, user.id])
  await audit({ userId: user.id, action: 'user.mfa_setup_started', req })

  return { secret: secret.base32, otpauthUrl: secret.otpauth_url }
}

export const verifyMfaSetup = async (userId, { code }, req) => {
  const result = await query(`SELECT mfa_secret FROM users WHERE id = $1`, [userId])
  const secret = result.rows[0]?.mfa_secret

  if (!secret) {
    throw new AppError('Start MFA setup before verification', 400)
  }

  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 })

  if (!verified) {
    throw new AppError('Invalid MFA code', 400)
  }

  await query(`UPDATE users SET mfa_enabled = TRUE, updated_at = NOW() WHERE id = $1`, [userId])
  await audit({ userId, action: 'user.mfa_enabled', req })

  return { message: 'MFA enabled successfully' }
}

export const logout = async (jwtId, userId, req) => {
  await query(`UPDATE user_sessions SET revoked_at = NOW() WHERE jwt_id = $1`, [jwtId])
  await audit({ userId, action: 'user.logout', req })
  return { message: 'Logged out successfully' }
}

export const listSessions = async (userId) => {
  const result = await query(
    `SELECT id, ip_address, user_agent, expires_at, revoked_at, created_at FROM user_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  )

  return { sessions: result.rows }
}
