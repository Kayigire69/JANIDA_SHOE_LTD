import * as equipmentService from './equipment.service.js'

export const createEquipment = async (req, res, next) => {
  try {
    const item = await equipmentService.createEquipment(req.body, req.user)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const listEquipment = async (req, res, next) => {
  try {
    const data = await equipmentService.listEquipment(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getEquipment = async (req, res, next) => {
  try {
    const item = await equipmentService.getEquipment(req.params.id)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const updateEquipment = async (req, res, next) => {
  try {
    const item = await equipmentService.updateEquipment(req.params.id, req.body)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const deleteEquipment = async (req, res, next) => {
  try {
    const result = await equipmentService.deleteEquipment(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listTypes = async (req, res, next) => {
  try {
    const data = await equipmentService.equipmentTypes()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const listDepartments = async (req, res, next) => {
  try {
    const data = await equipmentService.equipmentDepartments()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createMaintenance = async (req, res, next) => {
  try {
    const item = await equipmentService.createMaintenance(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const listMaintenance = async (req, res, next) => {
  try {
    const data = await equipmentService.listMaintenance(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const item = await equipmentService.updateMaintenanceStatus(req.params.id, req.body.status)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const createDowntime = async (req, res, next) => {
  try {
    const item = await equipmentService.createDowntime(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const listDowntime = async (req, res, next) => {
  try {
    const data = await equipmentService.listDowntime(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createSparePart = async (req, res, next) => {
  try {
    const item = await equipmentService.createSparePart(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const listSpareParts = async (req, res, next) => {
  try {
    const data = await equipmentService.listSpareParts(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateSparePart = async (req, res, next) => {
  try {
    const item = await equipmentService.updateSparePart(req.params.id, req.body)
    res.json(item)
  } catch (err) {
    next(err)
  }
}

export const deleteSparePart = async (req, res, next) => {
  try {
    const result = await equipmentService.deleteSparePart(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const createCalibration = async (req, res, next) => {
  try {
    const item = await equipmentService.createCalibration(req.body)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const listCalibration = async (req, res, next) => {
  try {
    const data = await equipmentService.listCalibration(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getMetrics = async (req, res, next) => {
  try {
    const data = await equipmentService.getMetrics()
    res.json(data)
  } catch (err) {
    next(err)
  }
}
