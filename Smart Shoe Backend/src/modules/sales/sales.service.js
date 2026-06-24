import pool from '../../db/pool.js';

export const salesService = {

  // ─── Customers ───────────────────────────────────────────────────────────────

  async getCustomers() {
    const res = await pool.query(
      `SELECT id, name, email, phone, address, to_char(created_at,'YYYY-MM-DD') as "createdAt"
       FROM customers ORDER BY name ASC`
    );
    return res.rows;
  },

  async createCustomer(data) {
    const res = await pool.query(
      `INSERT INTO customers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.name, data.email || null, data.phone || null, data.address || null]
    );
    return res.rows[0];
  },

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async getOrders(filterStatus) {
    let query = `
      SELECT
        o.id,
        o.order_number          AS "orderNumber",
        c.name                  AS "customer",
        o.status,
        o.priority,
        to_char(o.delivery_date,'YYYY-MM-DD')  AS "deliveryDate",
        o.shipping_address      AS "shippingAddress",
        o.notes,
        to_char(o.created_at,'YYYY-MM-DD')     AS "createdAt",
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS "totalAmount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'finishedGoodId', oi.finished_good_id,
              'sku', fg.sku,
              'product', sm.name,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_price,
              'lineTotal', oi.quantity * oi.unit_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items,
        inv.invoice_number  AS "invoiceNumber",
        inv.amount_due      AS "invoiceAmount",
        inv.status          AS "invoiceStatus",
        sh.carrier          AS "carrier",
        sh.tracking_number  AS "trackingNumber",
        sh.status           AS "shipmentStatus"
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN finished_goods fg ON oi.finished_good_id = fg.id
      LEFT JOIN shoe_models sm ON fg.shoe_model_id = sm.id
      LEFT JOIN invoices inv ON inv.order_id = o.id
      LEFT JOIN shipments sh ON sh.order_id = o.id
      WHERE 1=1
    `;
    const params = [];
    if (filterStatus && filterStatus !== 'all') {
      params.push(filterStatus);
      query += ` AND o.status = $${params.length}`;
    }
    query += ` GROUP BY o.id, c.name, inv.invoice_number, inv.amount_due, inv.status, sh.carrier, sh.tracking_number, sh.status ORDER BY o.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows.map(r => ({ ...r, totalAmount: parseFloat(r.totalAmount) }));
  },

  async createOrder(data, userId) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Generate order number
      const countRes = await db.query('SELECT COUNT(*) FROM orders');
      const orderNum = `ORD-${String(parseInt(countRes.rows[0].count) + 2000).padStart(4, '0')}`;

      // Handle walkin customer
      let customerId = data.customerId;
      if (!customerId && data.walkinCustomer) {
        const custRes = await db.query(
          `INSERT INTO customers (name, email, phone) VALUES ($1,$2,$3) RETURNING id`,
          [data.walkinCustomer.name, data.walkinCustomer.email || null, data.walkinCustomer.phone || null]
        );
        customerId = custRes.rows[0].id;
      }

      // Create order
      const orderRes = await db.query(
        `INSERT INTO orders (order_number, customer_id, status, delivery_date, priority, shipping_address, notes, created_by)
         VALUES ($1,$2,'pending',$3,$4,$5,$6,$7) RETURNING id, order_number`,
        [
          orderNum,
          customerId,
          data.deliveryDate,
          data.priority || 'medium',
          data.shippingAddress,
          data.notes || null,
          userId || null,
        ]
      );
      const orderId = orderRes.rows[0].id;
      let totalAmount = 0;

      for (const item of data.items) {
        // Check finished goods stock
        let fgRes = await db.query(
          `SELECT fg.id, fg.stock, fg.unit_cost, sm.name
           FROM finished_goods fg
           JOIN shoe_models sm ON fg.shoe_model_id = sm.id
           WHERE fg.id = $1`,
          [item.finishedGoodId]
        );

        if (fgRes.rowCount === 0) {
          // Fallback: check if it's a completed batch being sold directly
          const batchRes = await db.query(
            `SELECT b.shoe_model_id, b.quantity, sm.name, b.batch_number
             FROM batches b
             JOIN shoe_models sm ON b.shoe_model_id = sm.id
             WHERE b.id = $1 AND b.status = 'completed'`,
            [item.finishedGoodId]
          );
          
          if (batchRes.rowCount > 0) {
            const batch = batchRes.rows[0];
            // Find a finished_goods entry for this shoe model
            let existingFg = await db.query(
              `SELECT id, stock, unit_cost FROM finished_goods WHERE shoe_model_id = $1 LIMIT 1`,
              [batch.shoe_model_id]
            );
            if (existingFg.rowCount === 0) {
              existingFg = await db.query(
                `INSERT INTO finished_goods (shoe_model_id, sku, stock, unit_cost)
                 VALUES ($1, $2, $3, 0) RETURNING id, stock, unit_cost`,
                [batch.shoe_model_id, 'SKU-' + batch.batch_number, batch.quantity]
              );
            } else {
              // Integrate batch stock to finished goods to cover the sale
              await db.query(`UPDATE finished_goods SET stock = stock + $1 WHERE id = $2`, [batch.quantity, existingFg.rows[0].id]);
            }
            // Mark batch location as Integrated so it doesn't appear in the dropdown again
            await db.query(`UPDATE batches SET location = 'Integrated' WHERE id = $1`, [item.finishedGoodId]);
            
            // Re-fetch the newly assigned finished_goods row
            item.finishedGoodId = existingFg.rows[0].id;
            fgRes = await db.query(
              `SELECT fg.id, fg.stock, fg.unit_cost, sm.name
               FROM finished_goods fg
               JOIN shoe_models sm ON fg.shoe_model_id = sm.id
               WHERE fg.id = $1`,
              [item.finishedGoodId]
            );
          } else {
            throw new Error(`Finished good or completed batch ${item.finishedGoodId} not found`);
          }
        }

        const fg = fgRes.rows[0];
        const unitPrice = parseFloat(item.unitPrice || fg.unit_cost);
        const requested = parseInt(item.quantity);
        const available = parseInt(fg.stock);
        const canFulfill = Math.min(requested, available);
        const shortage = requested - canFulfill;

        // Insert order item
        const itemRes = await db.query(
          `INSERT INTO order_items (order_id, finished_good_id, quantity, unit_price)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [orderId, item.finishedGoodId, requested, unitPrice]
        );
        const orderItemId = itemRes.rows[0].id;
        totalAmount += requested * unitPrice;

        // Deduct stock if available
        if (canFulfill > 0) {
          await db.query(
            `UPDATE finished_goods SET stock = stock - $1 WHERE id = $2`,
            [canFulfill, item.finishedGoodId]
          );
          await db.query(
            `INSERT INTO stock_movements (item_type, finished_good_id, quantity, movement_type, reference_number, warehouse_location, operator_name)
             SELECT 'finished_good', $1, $2, 'sales_shipment', $3, warehouse_location, 'Sales System'
             FROM finished_goods WHERE id = $1`,
            [item.finishedGoodId, -canFulfill, orderNum]
          );
        }

        // Create backorder if shortage
        if (shortage > 0) {
          await db.query(
            `INSERT INTO backorders (order_item_id, quantity_backordered, status)
             VALUES ($1, $2, 'pending')`,
            [orderItemId, shortage]
          );
        }
      }

      // Generate invoice
      const invoiceCount = await db.query('SELECT COUNT(*) FROM invoices');
      const invoiceNum = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(parseInt(invoiceCount.rows[0].count) + 2000).padStart(4, '0')}`;
      await db.query(
        `INSERT INTO invoices (order_id, invoice_number, amount_due, status, due_date)
         VALUES ($1, $2, $3, 'unpaid', $4::date + INTERVAL '30 days')`,
        [orderId, invoiceNum, totalAmount, data.deliveryDate]
      );

      await db.query('COMMIT');
      await salesService.refreshSalesDashboardMetrics();
      return { id: orderId, orderNumber: orderNum, invoiceNumber: invoiceNum };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  },

  async updateOrderStatus(orderId, status, shipmentData) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const orderRes = await db.query('SELECT id, order_number FROM orders WHERE id = $1', [orderId]);
      if (orderRes.rowCount === 0) throw new Error('Order not found');

      await db.query(
        `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [status, orderId]
      );

      // When shipped, create or update shipment record
      if (status === 'shipped' && shipmentData) {
        const existing = await db.query('SELECT id FROM shipments WHERE order_id = $1', [orderId]);
        if (existing.rowCount === 0) {
          await db.query(
            `INSERT INTO shipments (order_id, carrier, tracking_number, status, shipped_at)
             VALUES ($1, $2, $3, 'in_transit', NOW())`,
            [orderId, shipmentData.carrier || 'Standard Shipping', shipmentData.trackingNumber || `TRK-${Date.now()}`]
          );
        }
      }

      // When delivered, mark shipment delivered
      if (status === 'delivered') {
        await db.query(
          `UPDATE shipments SET status = 'delivered', delivered_at = NOW() WHERE order_id = $1`,
          [orderId]
        );
      }

      await db.query('COMMIT');
      await salesService.refreshSalesDashboardMetrics();
      return { id: orderId, status };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  },

  // ─── Backorders ──────────────────────────────────────────────────────────────

  async getBackorders() {
    const res = await pool.query(`
      SELECT
        b.id,
        b.quantity_backordered   AS "quantityBackordered",
        b.status,
        to_char(b.created_at,'YYYY-MM-DD') AS "createdAt",
        o.order_number           AS "orderNumber",
        c.name                   AS "customer",
        sm.name                  AS "product",
        fg.sku
      FROM backorders b
      JOIN order_items oi ON b.order_item_id = oi.id
      JOIN orders o ON oi.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      JOIN finished_goods fg ON oi.finished_good_id = fg.id
      JOIN shoe_models sm ON fg.shoe_model_id = sm.id
      ORDER BY b.created_at DESC
    `);
    return res.rows;
  },

  async resolveBackorder(backorderId) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const bRes = await db.query(
        `SELECT b.quantity_backordered, oi.finished_good_id, o.order_number
         FROM backorders b
         JOIN order_items oi ON b.order_item_id = oi.id
         JOIN orders o ON oi.order_id = o.id
         WHERE b.id = $1 AND b.status = 'pending'`,
        [backorderId]
      );
      if (bRes.rowCount === 0) throw new Error('Backorder not found or already resolved');

      const { quantity_backordered: qty, finished_good_id: fgId, order_number: orderNum } = bRes.rows[0];

      // Deduct stock
      await db.query(
        `UPDATE finished_goods SET stock = stock - $1 WHERE id = $2`,
        [qty, fgId]
      );
      await db.query(
        `INSERT INTO stock_movements (item_type, finished_good_id, quantity, movement_type, reference_number, warehouse_location, operator_name)
         SELECT 'finished_good', $1, $2, 'sales_shipment', $3, warehouse_location, 'Backorder Resolution'
         FROM finished_goods WHERE id = $1`,
        [fgId, -qty, orderNum]
      );

      await db.query(
        `UPDATE backorders SET status = 'resolved', updated_at = NOW() WHERE id = $1`,
        [backorderId]
      );

      await db.query('COMMIT');
      await salesService.refreshSalesDashboardMetrics();
      return { id: backorderId, status: 'resolved' };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  },

  // ─── Invoices ─────────────────────────────────────────────────────────────────

  async getInvoices() {
    const res = await pool.query(`
      SELECT
        inv.id,
        inv.invoice_number  AS "invoiceNumber",
        inv.amount_due      AS "amountDue",
        inv.status,
        to_char(inv.due_date,'YYYY-MM-DD') AS "dueDate",
        to_char(inv.created_at,'YYYY-MM-DD') AS "createdAt",
        o.order_number      AS "orderNumber",
        c.name              AS "customer"
      FROM invoices inv
      JOIN orders o ON inv.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      ORDER BY inv.created_at DESC
    `);
    return res.rows.map(r => ({ ...r, amountDue: parseFloat(r.amountDue) }));
  },

  async payInvoice(invoiceId) {
    const res = await pool.query(
      `UPDATE invoices SET status = 'paid' WHERE id = $1 AND status = 'unpaid' RETURNING id, invoice_number`,
      [invoiceId]
    );
    if (res.rowCount === 0) throw new Error('Invoice not found or already paid');
    return res.rows[0];
  },

  // ─── Dashboard Refresh ────────────────────────────────────────────────────────

  async refreshSalesDashboardMetrics() {
    try {
      const db = await pool.connect();
      try {
        await db.query('BEGIN');

        // Calculate live metrics
        const totalOrders = (await db.query(`SELECT COUNT(*) FROM orders`)).rows[0].count;
        const revenueRes = await db.query(`SELECT COALESCE(SUM(amount_due),0) AS rev FROM invoices`);
        const revenue = parseFloat(revenueRes.rows[0].rev);
        const backordersRes = await db.query(`SELECT COUNT(*) FROM backorders WHERE status = 'pending'`);
        const activeBackorders = parseInt(backordersRes.rows[0].count);
        const shippedRes = await db.query(`SELECT COUNT(*) FROM orders WHERE status IN ('shipped','delivered')`);
        const shipped = parseInt(shippedRes.rows[0].count);
        const totalOrd = parseInt(totalOrders);
        const fulfillmentRate = totalOrd > 0 ? Math.round((shipped / totalOrd) * 100) : 100;

        // Delete old metrics for sales_staff
        await db.query(`DELETE FROM dashboard_metrics WHERE role = 'sales_staff'`);
        await db.query(`DELETE FROM dashboard_chart_points WHERE role = 'sales_staff'`);
        await db.query(`DELETE FROM dashboard_records WHERE role = 'sales_staff'`);

        // Insert fresh metrics
        const metrics = [
          { title: 'Total Sales Orders', value: String(totalOrd), subtitle: 'customer orders placed', trend: 'all time', color: 'blue', order: 0 },
          { title: 'Total Revenue', value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: 'gross invoice amount', trend: 'cumulative', color: 'emerald', order: 1 },
          { title: 'Active Backorders', value: String(activeBackorders), subtitle: 'items awaiting stock', trend: activeBackorders === 0 ? 'optimal stock' : 'action required', color: 'amber', order: 2 },
          { title: 'Fulfillment Rate', value: `${fulfillmentRate}%`, subtitle: 'shipped or delivered', trend: fulfillmentRate >= 80 ? 'excellent' : 'needs attention', color: 'slate', order: 3 }
        ];
        for (const m of metrics) {
          await db.query(
            `INSERT INTO dashboard_metrics (role, title, value, subtitle, trend, color, sort_order) VALUES ('sales_staff', $1, $2, $3, $4, $5, $6)`,
            [m.title, m.value, m.subtitle, m.trend, m.color, m.order]
          );
        }

        // Chart: monthly revenue for last 6 months
        const chartRes = await db.query(`
          SELECT TO_CHAR(inv.created_at, 'Mon') AS label,
                 SUM(inv.amount_due) AS value
          FROM invoices inv
          WHERE inv.created_at >= NOW() - INTERVAL '6 months'
          GROUP BY TO_CHAR(inv.created_at, 'Mon'), DATE_TRUNC('month', inv.created_at)
          ORDER BY DATE_TRUNC('month', inv.created_at) ASC
        `);
        let chartOrder = 0;
        for (const row of chartRes.rows) {
          await db.query(
            `INSERT INTO dashboard_chart_points (role, chart_key, label, value, sort_order) VALUES ('sales_staff', 'trend', $1, $2, $3)`,
            [row.label, parseFloat(row.value), chartOrder++]
          );
        }

        // Recent orders for dashboard_records
        const recentRes = await db.query(`
          SELECT o.order_number AS id, c.name AS customer, sm.name AS product,
                 SUM(oi.quantity) AS quantity, o.status
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          JOIN order_items oi ON oi.order_id = o.id
          JOIN finished_goods fg ON oi.finished_good_id = fg.id
          JOIN shoe_models sm ON fg.shoe_model_id = sm.id
          GROUP BY o.order_number, c.name, sm.name, o.status, o.created_at
          ORDER BY o.created_at DESC
          LIMIT 6
        `);
        let recOrder = 0;
        for (const r of recentRes.rows) {
          await db.query(
            `INSERT INTO dashboard_records (role, record_type, payload, sort_order) VALUES ('sales_staff', 'pending_orders', $1, $2)`,
            [JSON.stringify({ id: r.id, customer: r.customer, product: r.product, quantity: parseInt(r.quantity), status: r.status }), recOrder++]
          );
        }

        await db.query('COMMIT');
      } catch (err) {
        await db.query('ROLLBACK');
        console.error('Error refreshing sales dashboard metrics:', err.message);
      } finally {
        db.release();
      }
    } catch (err) {
      console.error('Could not get pool connection for dashboard refresh:', err.message);
    }
  }
};
