import { z } from 'zod'

export const roles = ['production_manager', 'inventory_manager', 'quality_officer', 'sales_staff', 'administrator']

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(40),
  employeeId: z.string().min(2).max(80),
  role: z.enum(roles),
  department: z.string().min(2).max(80),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().length(6).optional()
})

export const emailVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
})

export const passwordRecoverySchema = z.object({
  email: z.string().email()
})

export const passwordResetSchema = z.object({
  token: z.string().min(12),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
})

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(40)
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)
})

export const mfaVerifySchema = z.object({
  code: z.string().length(6)
})
