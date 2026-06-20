import * as productionService from './production.service.js'

// Machine CRUD
export const createMachine = async (req, res, next) => {
  try { const m = await productionService.createMachine(req.body); res.status(201).json(m) } catch (err) { next(err) }
}
export const listMachines = async (req, res, next) => {
  try { const data = await productionService.listMachines(); res.json(data) } catch (err) { next(err) }
}
export const updateMachine = async (req, res, next) => {
  try { const m = await productionService.updateMachine(req.params.id, req.body); res.json(m) } catch (err) { next(err) }
}
export const deleteMachine = async (req, res, next) => {
  try { const r = await productionService.deleteMachine(req.params.id); res.json(r) } catch (err) { next(err) }
}

// Production Worker CRUD
export const createProductionWorker = async (req, res, next) => {
  try { const w = await productionService.createProductionWorker(req.body); res.status(201).json(w) } catch (err) { next(err) }
}
export const listProductionWorkers = async (req, res, next) => {
  try { const data = await productionService.listProductionWorkers(); res.json(data) } catch (err) { next(err) }
}
export const updateProductionWorker = async (req, res, next) => {
  try { const w = await productionService.updateProductionWorker(req.params.id, req.body); res.json(w) } catch (err) { next(err) }
}
export const deleteProductionWorker = async (req, res, next) => {
  try { const r = await productionService.deleteProductionWorker(req.params.id); res.json(r) } catch (err) { next(err) }
}

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
