import * as dashboardService from './dashboard.service.js'

export const dashboard = async (req, res, next) => {
  try {
    res.json(await dashboardService.getDashboard({ role: req.user.role, userId: req.user.id }))
  } catch (err) {
    next(err)
  }
}

export const notifications = async (req, res, next) => {
  try {
    res.json(await dashboardService.listNotifications({ role: req.user.role, userId: req.user.id }))
  } catch (err) {
    next(err)
  }
}

export const markNotificationRead = async (req, res, next) => {
  try {
    res.json(await dashboardService.markNotificationRead({ id: req.params.id, userId: req.user.id }))
  } catch (err) {
    next(err)
  }
}

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    res.json(await dashboardService.markAllNotificationsRead({ role: req.user.role, userId: req.user.id }))
  } catch (err) {
    next(err)
  }
}

export const deleteNotification = async (req, res, next) => {
  try {
    res.json(await dashboardService.deleteNotification({ id: req.params.id, userId: req.user.id }))
  } catch (err) {
    next(err)
  }
}
