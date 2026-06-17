import * as authService from './auth.service.js'
import {
  emailVerificationSchema,
  loginSchema,
  mfaVerifySchema,
  passwordChangeSchema,
  passwordRecoverySchema,
  passwordResetSchema,
  profileUpdateSchema,
  registerSchema
} from './auth.validation.js'

const parse = (schema, body) => schema.parse(body)

export const register = async (req, res, next) => {
  try {
    res.status(201).json(await authService.register(parse(registerSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const verifyEmail = async (req, res, next) => {
  try {
    res.json(await authService.verifyEmail(parse(emailVerificationSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const resendVerification = async (req, res, next) => {
  try {
    res.json(await authService.resendVerification(parse(passwordRecoverySchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    res.json(await authService.login(parse(loginSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const forgotPassword = async (req, res, next) => {
  try {
    res.json(await authService.forgotPassword(parse(passwordRecoverySchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const resetPassword = async (req, res, next) => {
  try {
    res.json(await authService.resetPassword(parse(passwordResetSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const profile = async (req, res, next) => {
  try {
    res.json(await authService.getProfile(req.user.id))
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    res.json(await authService.updateProfile(req.user.id, parse(profileUpdateSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req, res, next) => {
  try {
    res.json(await authService.changePassword(req.user.id, parse(passwordChangeSchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const beginMfaSetup = async (req, res, next) => {
  try {
    res.json(await authService.beginMfaSetup(req.user, req))
  } catch (err) {
    next(err)
  }
}

export const verifyMfaSetup = async (req, res, next) => {
  try {
    res.json(await authService.verifyMfaSetup(req.user.id, parse(mfaVerifySchema, req.body), req))
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    res.json(await authService.logout(req.user.jti, req.user.id, req))
  } catch (err) {
    next(err)
  }
}

export const sessions = async (req, res, next) => {
  try {
    res.json(await authService.listSessions(req.user.id))
  } catch (err) {
    next(err)
  }
}
