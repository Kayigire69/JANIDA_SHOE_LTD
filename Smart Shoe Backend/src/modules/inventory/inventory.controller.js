import { inventoryService } from './inventory.service.js';

export const inventoryController = {
  async getRawMaterials(req, res) {
    try {
      const data = await inventoryService.getRawMaterials();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createRawMaterial(req, res) {
    try {
      const data = await inventoryService.createRawMaterial(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getFinishedGoods(req, res) {
    try {
      const data = await inventoryService.getFinishedGoods();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSuppliers(req, res) {
    try {
      const data = await inventoryService.getSuppliers();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createSupplier(req, res) {
    try {
      const data = await inventoryService.createSupplier(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getPurchaseOrders(req, res) {
    try {
      const data = await inventoryService.getPurchaseOrders();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createPurchaseOrder(req, res) {
    try {
      const userId = req.user?.id;
      const data = await inventoryService.createPurchaseOrder(req.body, userId);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updatePOStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const operatorName = req.user?.name;
      const data = await inventoryService.updatePOStatus(id, status, operatorName);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getStockMovements(req, res) {
    try {
      const { material, date } = req.query;
      const data = await inventoryService.getStockMovements(material, date);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async recordManualMovement(req, res) {
    try {
      const operatorName = req.user?.name;
      const data = await inventoryService.recordManualMovement({
        ...req.body,
        operatorName
      });
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
