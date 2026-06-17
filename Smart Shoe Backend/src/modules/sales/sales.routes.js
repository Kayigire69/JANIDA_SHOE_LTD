import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth.js'
import { salesController } from './sales.controller.js'

const router = Router()

router.use(authenticate)

// Customers
router.get('/customers', salesController.getCustomers)
router.post('/customers', authorize('sales_staff', 'administrator'), salesController.createCustomer)

// Orders
router.get('/orders', salesController.getOrders)
router.post('/orders', authorize('sales_staff', 'administrator'), salesController.createOrder)
router.patch('/orders/:id/status', authorize('sales_staff', 'administrator'), salesController.updateOrderStatus)

// Backorders
router.get('/backorders', salesController.getBackorders)
router.patch('/backorders/:id/resolve', authorize('sales_staff', 'administrator'), salesController.resolveBackorder)

// Invoices
router.get('/invoices', salesController.getInvoices)
router.patch('/invoices/:id/pay', authorize('sales_staff', 'administrator'), salesController.payInvoice)

export default router
