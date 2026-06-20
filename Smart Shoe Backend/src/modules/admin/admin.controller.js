import * as adminService from './admin.service.js'

export const getSystemOverview = async (req, res, next) => {
  try {
    const data = await adminService.getSystemOverview()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createAnnouncement = async (req, res, next) => {
  try {
    const result = await adminService.createAnnouncement(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}


export const listUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(req.params.id, req.body)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export const toggleUserLock = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserLock(req.params.id, req.body.lock)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listProducts = async (req, res, next) => {
  try {
    const data = await adminService.listProducts(req.query)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createProduct = async (req, res, next) => {
  try {
    const product = await adminService.createProduct(req.body.name)
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    const product = await adminService.updateProduct(req.params.id, req.body.name)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

export const deleteProduct = async (req, res, next) => {
  try {
    const result = await adminService.deleteProduct(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getBomForProduct = async (req, res, next) => {
  try {
    const data = await adminService.getBomForProduct(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const addBomItem = async (req, res, next) => {
  try {
    const item = await adminService.addBomItem(req.params.id, req.body.rawMaterialId, req.body.quantityPerPair)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const removeBomItem = async (req, res, next) => {
  try {
    const result = await adminService.removeBomItem(req.params.bomId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listProductionLines = async (req, res, next) => {
  try {
    const data = await adminService.listProductionLines()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createProductionLine = async (req, res, next) => {
  try {
    const line = await adminService.createProductionLine(req.body)
    res.status(201).json(line)
  } catch (err) {
    next(err)
  }
}

export const updateProductionLine = async (req, res, next) => {
  try {
    const line = await adminService.updateProductionLine(req.params.id, req.body)
    res.json(line)
  } catch (err) {
    next(err)
  }
}

export const deleteProductionLine = async (req, res, next) => {
  try {
    const result = await adminService.deleteProductionLine(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getLineMachines = async (req, res, next) => {
  try {
    const data = await adminService.getLineMachines(req.params.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const addMachineToLine = async (req, res, next) => {
  try {
    const item = await adminService.addMachineToLine(req.params.id, req.body.machineId, req.body.sequenceOrder)
    res.status(201).json(item)
  } catch (err) {
    next(err)
  }
}

export const removeMachineFromLine = async (req, res, next) => {
  try {
    const result = await adminService.removeMachineFromLine(req.params.machineAssignmentId)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listQualityStandards = async (req, res, next) => {
  try {
    const data = await adminService.listQualityStandards()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createQualityStandard = async (req, res, next) => {
  try {
    const standard = await adminService.createQualityStandard(req.body)
    res.status(201).json(standard)
  } catch (err) {
    next(err)
  }
}

export const updateQualityStandard = async (req, res, next) => {
  try {
    const standard = await adminService.updateQualityStandard(req.params.id, req.body)
    res.json(standard)
  } catch (err) {
    next(err)
  }
}

export const deleteQualityStandard = async (req, res, next) => {
  try {
    const result = await adminService.deleteQualityStandard(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listSystemSettings = async (req, res, next) => {
  try {
    const data = await adminService.listSystemSettings()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const updateSystemSetting = async (req, res, next) => {
  try {
    const setting = await adminService.updateSystemSetting(req.params.id, req.body)
    res.json(setting)
  } catch (err) {
    next(err)
  }
}

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const logoUrl = `/uploads/${req.file.filename}`;
    // Assuming setting_key for logo is 'company_logo_url'
    const setting = await adminService.updateSystemSettingByKey('company_logo_url', logoUrl);
    res.json({ setting, logoUrl });
  } catch (err) {
    next(err)
  }
}

export const listBackups = async (req, res, next) => {
  try {
    const data = await adminService.listBackups()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const createBackup = async (req, res, next) => {
  try {
    const backup = await adminService.createBackup(req.body.backupName, req.body.backupType, req.user.id)
    res.status(201).json(backup)
  } catch (err) {
    next(err)
  }
}

export const completeBackup = async (req, res, next) => {
  try {
    const backup = await adminService.completeBackup(req.params.id, req.body)
    res.json(backup)
  } catch (err) {
    next(err)
  }
}

export const deleteBackup = async (req, res, next) => {
  try {
    const result = await adminService.deleteBackup(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const listRawMaterialsForBom = async (req, res, next) => {
  try {
    const data = await adminService.listRawMaterialsForBom()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const listMachinesForLine = async (req, res, next) => {
  try {
    const data = await adminService.listMachinesForLine()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export const listSupervisors = async (req, res, next) => {
  try {
    const data = await adminService.listSupervisors()
    res.json(data)
  } catch (err) {
    next(err)
  }
}
