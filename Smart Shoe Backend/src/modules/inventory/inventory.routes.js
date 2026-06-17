import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { inventoryController } from './inventory.controller.js';

const router = Router();

// Require authentication for all inventory routes
router.use(authenticate);

// Readers routes
router.get('/materials', inventoryController.getRawMaterials);
router.get('/finished-goods', inventoryController.getFinishedGoods);
router.get('/suppliers', inventoryController.getSuppliers);
router.get('/purchase-orders', inventoryController.getPurchaseOrders);
router.get('/movements', inventoryController.getStockMovements);

// Writers routes - restricted to inventory_manager and administrator
router.post('/materials', authorize('inventory_manager', 'administrator'), inventoryController.createRawMaterial);
router.post('/suppliers', authorize('inventory_manager', 'administrator'), inventoryController.createSupplier);
router.post('/purchase-orders', authorize('inventory_manager', 'administrator'), inventoryController.createPurchaseOrder);
router.patch('/purchase-orders/:id/status', authorize('inventory_manager', 'administrator'), inventoryController.updatePOStatus);
router.post('/movements/in', authorize('inventory_manager', 'administrator'), inventoryController.recordManualMovement);
router.post('/movements/out', authorize('inventory_manager', 'administrator'), inventoryController.recordManualMovement);

export default router;
