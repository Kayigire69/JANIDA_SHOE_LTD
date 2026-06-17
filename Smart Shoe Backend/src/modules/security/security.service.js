import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'

// Audit Logs
export const listAuditLogs = async (params = {}) => {
  const { search, action, userId, resourceType, dateFrom, dateTo, page = 1, limit = 50 } = params
  let sql = `
    SELECT al.*, u.full_name AS user_name, u.email AS user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `
  const values = []
  let i = 1

  if (search) {
    sql += ` AND (al.action ILIKE $${i} OR u.full_name ILIKE $${i} OR u.email ILIKE $${i})`
    values.push(`%${search}%`)
    i++
  }
  if (action) {
    sql += ` AND al.action = $${i}`
    values.push(action)
    i++
  }
  if (userId) {
    sql += ` AND al.user_id = $${i}`
    values.push(userId)
    i++
  }
  if (resourceType) {
    sql += ` AND al.metadata->>'resourceType' = $${i}`
    values.push(resourceType)
    i++
  }
  if (dateFrom) {
    sql += ` AND al.created_at >= $${i}`
    values.push(dateFrom)
    i++
  }
  if (dateTo) {
    sql += ` AND al.created_at <= $${i}`
    values.push(dateTo)
    i++
  }

  const countSql = sql.replace('SELECT al.*, u.full_name AS user_name, u.email AS user_email', 'SELECT COUNT(*)::int AS total')

  sql += ` ORDER BY al.created_at DESC LIMIT $${i} OFFSET $${i + 1}`
  values.push(Number(limit))
  values.push((Number(page) - 1) * Number(limit))

  const [dataRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values.slice(0, values.length - 2))
  ])

  return {
    logs: dataRes.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRes.rows[0]?.total || 0
    }
  }
}

export const getAuditActions = async () => {
  const res = await query('SELECT DISTINCT action FROM audit_logs ORDER BY action')
  return { actions: res.rows.map(r => r.action) }
}

// Login Activity
export const listLoginActivity = async (params = {}) => {
  const { email, success, dateFrom, dateTo, page = 1, limit = 50 } = params
  let sql = `SELECT * FROM login_attempts WHERE 1=1`
  const values = []
  let i = 1

  if (email) {
    sql += ` AND email ILIKE $${i}`
    values.push(`%${email}%`)
    i++
  }
  if (success !== undefined && success !== '') {
    sql += ` AND success = $${i}`
    values.push(success === 'true' || success === true)
    i++
  }
  if (dateFrom) {
    sql += ` AND created_at >= $${i}`
    values.push(dateFrom)
    i++
  }
  if (dateTo) {
    sql += ` AND created_at <= $${i}`
    values.push(dateTo)
    i++
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)::int AS total')
  sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`
  values.push(Number(limit))
  values.push((Number(page) - 1) * Number(limit))

  const [dataRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values.slice(0, values.length - 2))
  ])

  return {
    activities: dataRes.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRes.rows[0]?.total || 0
    }
  }
}

// Active Sessions
export const listActiveSessions = async (userId) => {
  let sql = `
    SELECT s.*, u.full_name, u.email
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.revoked_at IS NULL AND s.expires_at > NOW()
  `
  const values = []
  if (userId) {
    sql += ` AND s.user_id = $1`
    values.push(userId)
  }
  sql += ` ORDER BY s.created_at DESC`

  const res = await query(sql, values)
  return { sessions: res.rows }
}

export const revokeSession = async (sessionId, currentUserId) => {
  const res = await query(
    `UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL RETURNING *`,
    [sessionId]
  )
  if (res.rowCount === 0) throw new AppError('Session not found or already revoked', 404)

  await query(
    `INSERT INTO audit_logs (user_id, action, metadata, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
    [currentUserId, 'session.revoked', JSON.stringify({ sessionId }), null, null]
  )

  return { message: 'Session revoked' }
}

// Security Alerts
export const listSecurityAlerts = async (params = {}) => {
  const { status, severity, alertType, page = 1, limit = 50 } = params
  let sql = `
    SELECT sa.*, u.full_name AS related_user_name, u.email AS related_user_email,
           r.full_name AS resolved_by_name
    FROM security_alerts sa
    LEFT JOIN users u ON sa.related_user_id = u.id
    LEFT JOIN users r ON sa.resolved_by = r.id
    WHERE 1=1
  `
  const values = []
  let i = 1

  if (status) {
    sql += ` AND sa.status = $${i}`
    values.push(status)
    i++
  }
  if (severity) {
    sql += ` AND sa.severity = $${i}`
    values.push(severity)
    i++
  }
  if (alertType) {
    sql += ` AND sa.alert_type = $${i}`
    values.push(alertType)
    i++
  }

  const countSql = sql.replace(/SELECT sa\.\*, u\.full_name AS related_user_name, u\.email AS related_user_email,\s+r\.full_name AS resolved_by_name/, 'SELECT COUNT(*)::int AS total')
  sql += ` ORDER BY sa.created_at DESC LIMIT $${i} OFFSET $${i + 1}`
  values.push(Number(limit))
  values.push((Number(page) - 1) * Number(limit))

  const [dataRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values.slice(0, values.length - 2))
  ])

  return {
    alerts: dataRes.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countRes.rows[0]?.total || 0
    }
  }
}

export const createSecurityAlert = async (data) => {
  const { alertType, severity, title, description, relatedUserId, relatedIp, metadata = {} } = data
  if (!alertType || !title) throw new AppError('alertType and title are required', 400)

  const res = await query(`
    INSERT INTO security_alerts (alert_type, severity, title, description, related_user_id, related_ip, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [alertType, severity || 'medium', title, description || null, relatedUserId || null, relatedIp || null, metadata])

  return res.rows[0]
}

export const updateAlertStatus = async (id, status, resolvedBy) => {
  const valid = ['open', 'investigating', 'resolved', 'dismissed']
  if (!valid.includes(status)) throw new AppError('Invalid status', 400)

  const updates = [`status = $1`]
  const values = [status]
  if (status === 'resolved' || status === 'dismissed') {
    updates.push('resolved_at = NOW()')
    updates.push('resolved_by = $' + (values.length + 1))
    values.push(resolvedBy)
  } else {
    updates.push('resolved_at = NULL')
    updates.push('resolved_by = NULL')
  }
  values.push(id)

  const res = await query(`UPDATE security_alerts SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Alert not found', 404)
  return res.rows[0]
}

// Data Retention Policies
export const listRetentionPolicies = async () => {
  const res = await query('SELECT * FROM data_retention_policies ORDER BY resource_type')
  return { policies: res.rows }
}

export const updateRetentionPolicy = async (id, data) => {
  const fields = []
  const values = []
  let i = 1

  if (data.retentionDays !== undefined) {
    fields.push(`retention_days = $${i}`)
    values.push(Number(data.retentionDays))
    i++
  }
  if (data.autoPurgeEnabled !== undefined) {
    fields.push(`auto_purge_enabled = $${i}`)
    values.push(data.autoPurgeEnabled)
    i++
  }

  if (fields.length === 0) throw new AppError('No fields to update', 400)
  fields.push('updated_at = NOW()')
  values.push(id)

  const res = await query(`UPDATE data_retention_policies SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values)
  if (res.rowCount === 0) throw new AppError('Policy not found', 404)
  return res.rows[0]
}

// Security Metrics
export const getSecurityMetrics = async () => {
  const [failedLogins, activeAlerts, activeSessions, recentAuditLogs] = await Promise.all([
    query(`SELECT COUNT(*)::int AS count FROM login_attempts WHERE success = FALSE AND created_at >= NOW() - INTERVAL '24 hours'`),
    query(`SELECT COUNT(*)::int AS count FROM security_alerts WHERE status = 'open'`),
    query(`SELECT COUNT(*)::int AS count FROM user_sessions WHERE revoked_at IS NULL AND expires_at > NOW()`),
    query(`SELECT COUNT(*)::int AS count FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours'`)
  ])

  return {
    failedLogins24h: failedLogins.rows[0].count,
    openAlerts: activeAlerts.rows[0].count,
    activeSessions: activeSessions.rows[0].count,
    auditLogs24h: recentAuditLogs.rows[0].count
  }
}

// Export Audit Trail
export const exportAuditTrail = async (params = {}) => {
  const { dateFrom, dateTo, action, userId } = params
  let sql = `
    SELECT al.created_at, al.action, u.full_name, u.email, al.ip_address, al.metadata
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `
  const values = []
  let i = 1

  if (action) {
    sql += ` AND al.action = $${i}`
    values.push(action)
    i++
  }
  if (userId) {
    sql += ` AND al.user_id = $${i}`
    values.push(userId)
    i++
  }
  if (dateFrom) {
    sql += ` AND al.created_at >= $${i}`
    values.push(dateFrom)
    i++
  }
  if (dateTo) {
    sql += ` AND al.created_at <= $${i}`
    values.push(dateTo)
    i++
  }

  sql += ` ORDER BY al.created_at DESC`
  const res = await query(sql, values)
  return { logs: res.rows }
}
