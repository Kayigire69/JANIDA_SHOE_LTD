import * as productionService from './production.service.js'

export const getPlanningData = async (req, res, next) => {
  try {
    const data = await productionService.getPlanningData()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createPlan = async (req, res, next) => {
  try {
    const plan = await productionService.createPlan(req.body, req.user)
    res.json(plan)
  } catch (err) {
    next(err)
  }
}

export const getSchedule = async (req, res, next) => {
  try {
    const schedule = await productionService.getSchedule()
    res.json(schedule)
  } catch (err) {
    next(err)
  }
}

export const optimizeSchedule = async (req, res, next) => {
  try {
    const result = await productionService.optimizeSchedule()
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const updateShiftWorkers = async (req, res, next) => {
  try {
    const { shiftName, workerIds } = req.body
    const result = await productionService.updateShiftWorkers({ shiftName, workerIds })
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getOrders = async (req, res, next) => {
  try {
    const ordersData = await productionService.getOrders()
    res.json(ordersData)
  } catch (err) {
    next(err)
  }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, completedQuantity } = req.body
    const result = await productionService.updateOrderStatus({ id, status, completedQuantity }, req.user)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getHistory = async (req, res, next) => {
  try {
    const historyData = await productionService.getHistory()
    res.json(historyData)
  } catch (err) {
    next(err)
  }
}
