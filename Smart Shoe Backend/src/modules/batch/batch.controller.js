import * as batchService from './batch.service.js'

export const getBatches = async (req, res, next) => {
  try {
    const data = await batchService.getBatches()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getBatchDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await batchService.getBatchDetails(id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const getBatchByNumber = async (req, res, next) => {
  try {
    const { batchNumber } = req.params
    const data = await batchService.getBatchByNumber(batchNumber)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createBatch = async (req, res, next) => {
  try {
    const batch = await batchService.createBatch(req.body, req.user)
    res.status(201).json(batch)
  } catch (err) {
    next(err)
  }
}

export const updateBatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await batchService.updateBatchStatus(id, req.body, req.user)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const updateBatchLocation = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await batchService.updateBatchLocation(id, req.body, req.user)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const createRecall = async (req, res, next) => {
  try {
    const recall = await batchService.createRecall(req.body, req.user)
    res.status(201).json(recall)
  } catch (err) {
    next(err)
  }
}

export const getRecalls = async (req, res, next) => {
  try {
    const data = await batchService.getRecalls()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateRecall = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await batchService.updateRecall(id, req.body, req.user)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
