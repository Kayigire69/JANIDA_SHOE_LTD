import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const createPlainToken = (length = 32) => crypto.randomBytes(length).toString('hex')

export const createSixDigitCode = () => String(crypto.randomInt(100000, 999999))

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export const createJwt = ({ user, jwtId }) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    department: user.department,
    fullName: user.full_name
  },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN, jwtid: jwtId }
)
