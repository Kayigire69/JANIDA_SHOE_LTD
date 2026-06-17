import * as qualityService from './quality.service.js'

export const getInspectionTemplates = async (req, res, next) => {
  try {
    const data = await qualityService.getInspectionTemplates()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createInspectionTemplate = async (req, res, next) => {
  try {
    const data = await qualityService.createInspectionTemplate(req.body)
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

export const getInspections = async (req, res, next) => {
  try {
    const data = await qualityService.getInspections()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createInspection = async (req, res, next) => {
  try {
    const data = await qualityService.createInspection(req.body)
    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

export const getReworkOrders = async (req, res, next) => {
  try {
    const data = await qualityService.getReworkOrders()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateReworkOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const data = await qualityService.updateReworkOrderStatus(id, status)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getQualityCertificates = async (req, res, next) => {
  try {
    const data = await qualityService.getQualityCertificates()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getDefectAnalytics = async (req, res, next) => {
  try {
    const data = await qualityService.getDefectAnalytics()
    res.json(data)
  } catch (err) {
    next(err)
  }
}
