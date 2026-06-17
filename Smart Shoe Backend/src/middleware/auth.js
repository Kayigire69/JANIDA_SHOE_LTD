import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { query } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      throw new AppError('Authentication required', 401)
    }

    const payload = jwt.verify(token, env.JWT_SECRET)
    const session = await query(
      `SELECT id FROM user_sessions WHERE jwt_id = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [payload.jti]
    )

    if (session.rowCount === 0) {
      throw new AppError('Session expired or revoked', 401)
    }

    req.user = payload
    next()
  } catch (err) {
    next(err.status ? err : new AppError('Invalid or expired token', 401))
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to access this resource', 403))
  }

  next()
}

export const restrictToDepartment = (department) => (req, res, next) => {
  if (req.user.department !== department && req.user.role !== 'administrator') {
    return next(new AppError('Department access denied', 403))
  }

  next()
}
