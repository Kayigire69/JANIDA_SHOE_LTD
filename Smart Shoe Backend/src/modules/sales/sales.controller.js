import { salesService } from './sales.service.js';

export const salesController = {

  // Customers
  async getCustomers(req, res, next) {
    try {
      const data = await salesService.getCustomers();
      res.json(data);
    } catch (err) { next(err); }
  },

  async createCustomer(req, res, next) {
    try {
      const customer = await salesService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (err) { next(err); }
  },

  // Orders
  async getOrders(req, res, next) {
    try {
      const { status } = req.query;
      const data = await salesService.getOrders(status);
      res.json(data);
    } catch (err) { next(err); }
  },

  async createOrder(req, res, next) {
    try {
      const result = await salesService.createOrder(req.body, req.user?.id);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, carrier, trackingNumber } = req.body;
      const result = await salesService.updateOrderStatus(id, status, { carrier, trackingNumber });
      res.json(result);
    } catch (err) { next(err); }
  },

  // Backorders
  async getBackorders(req, res, next) {
    try {
      const data = await salesService.getBackorders();
      res.json(data);
    } catch (err) { next(err); }
  },

  async resolveBackorder(req, res, next) {
    try {
      const { id } = req.params;
      const result = await salesService.resolveBackorder(id);
      res.json(result);
    } catch (err) { next(err); }
  },

  // Invoices
  async getInvoices(req, res, next) {
    try {
      const data = await salesService.getInvoices();
      res.json(data);
    } catch (err) { next(err); }
  },

  async payInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const result = await salesService.payInvoice(id);
      res.json(result);
    } catch (err) { next(err); }
  },
};
