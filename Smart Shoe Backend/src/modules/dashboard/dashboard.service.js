import { query } from '../../config/db.js'

export const getDashboard = async ({ role, userId }) => {
  const [metrics, chartPoints, records, announcements, notifications] = await Promise.all([
    query(`SELECT title, value, subtitle, trend, color FROM dashboard_metrics WHERE role = $1 ORDER BY sort_order, created_at`, [role]),
    query(`SELECT chart_key, label, value, secondary_value FROM dashboard_chart_points WHERE role = $1 ORDER BY sort_order, created_at`, [role]),
    query(`SELECT record_type, payload FROM dashboard_records WHERE role = $1 ORDER BY sort_order, created_at DESC`, [role]),
    query(`SELECT id, type, message FROM system_announcements WHERE active = TRUE AND (role = $1 OR role IS NULL) ORDER BY created_at DESC LIMIT 3`, [role]),
    query(`SELECT COUNT(*)::int AS unread_count FROM notifications WHERE read_at IS NULL AND (user_id = $1 OR role = $2)`, [userId, role])
  ])

  const charts = chartPoints.rows.reduce((acc, row) => {
    acc[row.chart_key] ||= []
    acc[row.chart_key].push({ label: row.label, value: Number(row.value), secondaryValue: row.secondary_value === null ? null : Number(row.secondary_value) })
    return acc
  }, {})

  const groupedRecords = records.rows.reduce((acc, row) => {
    acc[row.record_type] ||= []
    acc[row.record_type].push(row.payload)
    return acc
  }, {})

  return {
    metrics: metrics.rows,
    charts,
    records: groupedRecords,
    announcements: announcements.rows,
    unreadNotifications: notifications.rows[0]?.unread_count || 0
  }
}

export const listNotifications = async ({ role, userId }) => {
  const result = await query(
    `SELECT id, type, title, message, priority, read_at, created_at
     FROM notifications
     WHERE user_id = $1 OR role = $2 OR role IS NULL
     ORDER BY created_at DESC`,
    [userId, role]
  )

  return {
    notifications: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      priority: row.priority,
      read: Boolean(row.read_at),
      timestamp: row.created_at
    }))
  }
}

export const markNotificationRead = async ({ id, userId }) => {
  await query(`UPDATE notifications SET read_at = NOW() WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`, [id, userId])
  return { message: 'Notification marked as read' }
}

export const markAllNotificationsRead = async ({ role, userId }) => {
  await query(`UPDATE notifications SET read_at = NOW() WHERE read_at IS NULL AND (user_id = $1 OR role = $2 OR role IS NULL)`, [userId, role])
  return { message: 'All notifications marked as read' }
}
