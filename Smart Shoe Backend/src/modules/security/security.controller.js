import * as securityService from './security.service.js'

export const listAuditLogs = async (req, res, next) => {
  try {
    const data = await securityService.listAuditLogs(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getAuditActions = async (req, res, next) => {
  try {
    const data = await securityService.getAuditActions()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const listLoginActivity = async (req, res, next) => {
  try {
    const data = await securityService.listLoginActivity(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const listActiveSessions = async (req, res, next) => {
  try {
    const data = await securityService.listActiveSessions(req.query.userId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const revokeSession = async (req, res, next) => {
  try {
    const result = await securityService.revokeSession(req.params.id, req.user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listSecurityAlerts = async (req, res, next) => {
  try {
    const data = await securityService.listSecurityAlerts(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createSecurityAlert = async (req, res, next) => {
  try {
    const item = await securityService.createSecurityAlert(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const updateAlertStatus = async (req, res, next) => {
  try {
    const item = await securityService.updateAlertStatus(req.params.id, req.body.status, req.user.id)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const listRetentionPolicies = async (req, res, next) => {
  try {
    const data = await securityService.listRetentionPolicies()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateRetentionPolicy = async (req, res, next) => {
  try {
    const item = await securityService.updateRetentionPolicy(req.params.id, req.body)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const getSecurityMetrics = async (req, res, next) => {
  try {
    const data = await securityService.getSecurityMetrics()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const exportAuditTrail = async (req, res, next) => {
  try {
    const data = await securityService.exportAuditTrail(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}
