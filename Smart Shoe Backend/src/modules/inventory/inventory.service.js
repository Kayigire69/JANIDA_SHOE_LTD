import pool from '../../db/pool.js';

export const inventoryService = {
  async getRawMaterials() {
    const query = `
      SELECT 
        id, 
        material_code as "idCode", 
        name, 
        quantity, 
        unit, 
        minimum, 
        maximum, 
        unit_cost as "unitCost", 
        supplier, 
        warehouse_location as "warehouseLocation",
        to_char(last_restocked, 'YYYY-MM-DD') as "lastRestocked"
      FROM raw_materials
      ORDER BY material_code ASC
    `;
    const res = await pool.query(query);
    
    // Map stock status dynamically
    return res.rows.map(m => {
      const qty = parseFloat(m.quantity);
      const min = parseFloat(m.minimum);
      let status = 'normal';
      if (qty <= min * 0.9) {
        status = 'critical';
      } else if (qty <= min) {
        status = 'low';
      }
      return {
        ...m,
        quantity: qty,
        minimum: min,
        maximum: parseFloat(m.maximum),
        unitCost: parseFloat(m.unitCost),
        status
      };
    });
  },

  async createRawMaterial(data) {
    const query = `
      INSERT INTO raw_materials (
        material_code, name, quantity, unit, minimum, maximum, unit_cost, supplier, warehouse_location, last_restocked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING 
        id, 
        material_code as "idCode", 
        name, 
        quantity, 
        unit, 
        minimum, 
        maximum, 
        unit_cost as "unitCost", 
        supplier, 
        warehouse_location as "warehouseLocation"
    `;
    const params = [
      data.materialCode,
      data.name,
      data.quantity || 0,
      data.unit,
      data.minimum || 0,
      data.maximum || 0,
      data.unitCost || 0,
      data.supplier || null,
      data.warehouseLocation || null
    ];
    const res = await pool.query(query, params);
    return res.rows[0];
  },

  async getFinishedGoods() {
    const query = `
      SELECT 
        fg.id, 
        m.name as "product", 
        fg.sku, 
        fg.stock, 
        fg.target, 
        fg.minimum, 
        fg.warehouse_location as "warehouseLocation", 
        fg.unit_cost as "unitCost", 
        to_char(fg.last_produced, 'YYYY-MM-DD') as "lastProduced"
      FROM finished_goods fg
      JOIN shoe_models m ON fg.shoe_model_id = m.id
      ORDER BY fg.sku ASC
    `;
    const res = await pool.query(query);

    return res.rows.map(item => {
      const stock = parseInt(item.stock);
      const min = parseInt(item.minimum);
      const target = parseInt(item.target);
      let status = 'normal';
      if (stock <= min * 0.5) {
        status = 'critical';
      } else if (stock <= min) {
        status = 'low';
      } else if (stock >= target) {
        status = 'excess';
      }
      return {
        ...item,
        stock,
        minimum: min,
        target,
        unitCost: parseFloat(item.unitCost),
        status
      };
    });
  },

  async getSuppliers() {
    const query = `
      SELECT 
        id, 
        name, 
        contact_name as "contact", 
        email, 
        phone, 
        address, 
        lead_time_days as "leadTime", 
        rating, 
        orders_completed as "ordersCompleted", 
        on_time_delivery_pct as "onTimeDelivery", 
        status
      FROM suppliers
      ORDER BY name ASC
    `;
    const res = await pool.query(query);
    return res.rows.map(s => ({
      ...s,
      leadTime: parseInt(s.leadTime),
      rating: parseFloat(s.rating),
      ordersCompleted: parseInt(s.ordersCompleted),
      onTimeDelivery: parseFloat(s.onTimeDelivery)
    }));
  },

  async createSupplier(data) {
    const query = `
      INSERT INTO suppliers (
        name, contact_name, email, phone, address, lead_time_days, rating, orders_completed, on_time_delivery_pct, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 5.0, 0, 100.0, 'active')
      RETURNING 
        id, name, contact_name as "contact", email, phone, address, lead_time_days as "leadTime", rating, orders_completed as "ordersCompleted", on_time_delivery_pct as "onTimeDelivery", status
    `;
    const params = [
      data.name,
      data.contact,
      data.email,
      data.phone,
      data.address,
      data.leadTime || 5
    ];
    const res = await pool.query(query, params);
    return res.rows[0];
  },

  async getPurchaseOrders() {
    const query = `
      SELECT 
        po.id, 
        po.po_number as "poNumber", 
        s.name as "supplier", 
        po.status, 
        po.total_amount as "totalValue", 
        to_char(po.created_at, 'YYYY-MM-DD') as "orderDate", 
        to_char(po.delivery_date, 'YYYY-MM-DD') as "deliveryDate",
        po.notes,
        poi.quantity,
        poi.unit_cost as "unitPrice",
        rm.material_code as "materialCode",
        rm.name as "material",
        rm.unit
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
      LEFT JOIN raw_materials rm ON poi.raw_material_id = rm.id
      ORDER BY po.created_at DESC
    `;
    const res = await pool.query(query);

    // Group items under purchase orders
    const poMap = {};
    for (const r of res.rows) {
      if (!poMap[r.id]) {
        poMap[r.id] = {
          id: r.id,
          poNumber: r.poNumber,
          supplier: r.supplier,
          status: r.status,
          totalValue: parseFloat(r.totalValue),
          orderDate: r.orderDate,
          deliveryDate: r.deliveryDate,
          notes: r.notes,
          material: r.material || '',
          materialCode: r.materialCode || '',
          quantity: r.quantity ? parseFloat(r.quantity) : 0,
          unit: r.unit || '',
          unitPrice: r.unitPrice ? parseFloat(r.unitPrice) : 0
        };
      }
    }
    return Object.values(poMap);
  },

  async createPurchaseOrder(data, userId) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const prefix = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const countRes = await db.query('SELECT COUNT(*) FROM purchase_orders');
      const poNum = `${prefix}-${String(parseInt(countRes.rows[0].count) + 1000).padStart(4, '0')}`;

      // Calculate total amount
      const qty = parseFloat(data.quantity);
      const price = parseFloat(data.unitPrice);
      const totalAmount = qty * price;

      const poQuery = `
        INSERT INTO purchase_orders (po_number, supplier_id, status, total_amount, notes, delivery_date, created_by)
        VALUES ($1, $2, 'pending', $3, $4, $5, $6)
        RETURNING id, po_number as "poNumber"
      `;
      const poRes = await db.query(poQuery, [
        poNum,
        data.supplierId,
        totalAmount,
        data.notes || null,
        data.deliveryDate || null,
        userId || null
      ]);

      const poId = poRes.rows[0].id;

      await db.query(
        `INSERT INTO purchase_order_items (purchase_order_id, raw_material_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [poId, data.materialId, qty, price]
      );

      await db.query('COMMIT');
      return { id: poId, poNumber: poNum };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  },

  async updatePOStatus(poId, status, operatorName) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      // Check current status
      const check = await db.query('SELECT status, po_number, supplier_id FROM purchase_orders WHERE id = $1', [poId]);
      if (check.rowCount === 0) {
        throw new Error('Purchase Order not found');
      }

      const currentStatus = check.rows[0].status;
      const poNumber = check.rows[0].po_number;

      if (status === 'received' && currentStatus !== 'received') {
        // Fetch items
        const itemsRes = await db.query(
          `SELECT raw_material_id, quantity, unit_cost FROM purchase_order_items WHERE purchase_order_id = $1`,
          [poId]
        );

        for (const item of itemsRes.rows) {
          // Update raw materials stock
          const matRes = await db.query(
            `UPDATE raw_materials 
             SET quantity = quantity + $1, last_restocked = NOW() 
             WHERE id = $2 
             RETURNING name, warehouse_location`,
            [parseFloat(item.quantity), item.raw_material_id]
          );

          if (matRes.rowCount > 0) {
            const mat = matRes.rows[0];
            // Log stock movement
            await db.query(
              `INSERT INTO stock_movements (
                item_type, raw_material_id, quantity, movement_type, reference_id, reference_number, warehouse_location, operator_name
              ) VALUES ('raw_material', $1, $2, 'purchase_receipt', $3, $4, $5, $6)`,
              [
                item.raw_material_id,
                parseFloat(item.quantity),
                poId,
                poNumber,
                mat.warehouse_location,
                operatorName || 'System Operator'
              ]
            );
          }
        }

        // Increment supplier's completed orders
        await db.query(
          `UPDATE suppliers 
           SET orders_completed = orders_completed + 1 
           WHERE id = $1`,
          [check.rows[0].supplier_id]
        );
      }

      await db.query('UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, poId]);

      await db.query('COMMIT');
      return { id: poId, status };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  },

  async getStockMovements(filterMaterial, filterDate) {
    let query = `
      SELECT 
        sm.id, 
        sm.item_type as "itemType", 
        sm.quantity, 
        sm.movement_type as "movementType", 
        sm.reference_number as "reference", 
        to_char(sm.created_at, 'YYYY-MM-DD') as "date", 
        sm.operator_name as "operator", 
        sm.warehouse_location as "location",
        rm.name as "materialName",
        rm.unit as "materialUnit",
        fg.sku as "finishedGoodSku"
      FROM stock_movements sm
      LEFT JOIN raw_materials rm ON sm.raw_material_id = rm.id
      LEFT JOIN finished_goods fg ON sm.finished_good_id = fg.id
      WHERE 1=1
    `;
    const params = [];

    if (filterMaterial && filterMaterial !== 'all') {
      params.push(`%${filterMaterial}%`);
      query += ` AND (rm.name ILIKE $${params.length} OR fg.sku ILIKE $${params.length})`;
    }

    if (filterDate) {
      params.push(filterDate);
      query += ` AND to_char(sm.created_at, 'YYYY-MM-DD') = $${params.length}`;
    }

    query += ` ORDER BY sm.created_at DESC`;
    const res = await pool.query(query, params);

    return res.rows.map(r => ({
      id: r.id,
      type: r.quantity >= 0 ? 'in' : 'out',
      material: r.itemType === 'raw_material' ? r.materialName : r.finishedGoodSku,
      quantity: Math.abs(parseFloat(r.quantity)),
      unit: r.itemType === 'raw_material' ? r.materialUnit : 'pairs',
      reference: r.reference,
      date: r.date,
      operator: r.operator,
      location: r.location,
      cost: r.movementType === 'purchase_receipt' ? null : null // We can calculate value in client or omit if not tracked
    }));
  },

  async recordManualMovement(data) {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');

      const qty = parseFloat(data.quantity);
      let finalQty = data.type === 'in' ? qty : -qty;

      let warehouseLoc = data.warehouseLocation;

      if (data.itemType === 'raw_material') {
        const matRes = await db.query(
          `UPDATE raw_materials 
           SET quantity = quantity + $1, last_restocked = CASE WHEN $1 > 0 THEN NOW() ELSE last_restocked END
           WHERE id = $2 
           RETURNING warehouse_location`,
          [finalQty, data.rawMaterialId]
        );
        if (matRes.rowCount === 0) {
          throw new Error('Raw material not found');
        }
        if (!warehouseLoc) {
          warehouseLoc = matRes.rows[0].warehouse_location;
        }

        await db.query(
          `INSERT INTO stock_movements (
            item_type, raw_material_id, quantity, movement_type, reference_number, warehouse_location, operator_name
          ) VALUES ('raw_material', $1, $2, $3, $4, $5, $6)`,
          [
            data.rawMaterialId,
            finalQty,
            data.type === 'in' ? 'purchase_receipt' : 'production_issue',
            data.referenceNumber || null,
            warehouseLoc,
            data.operatorName || 'System Operator'
          ]
        );
      } else if (data.itemType === 'finished_good') {
        const fgRes = await db.query(
          `UPDATE finished_goods 
           SET stock = stock + $1, last_produced = CASE WHEN $1 > 0 THEN NOW() ELSE last_produced END
           WHERE id = $2 
           RETURNING warehouse_location`,
          [finalQty, data.finishedGoodId]
        );
        if (fgRes.rowCount === 0) {
          throw new Error('Finished good SKU not found');
        }
        if (!warehouseLoc) {
          warehouseLoc = fgRes.rows[0].warehouse_location;
        }

        await db.query(
          `INSERT INTO stock_movements (
            item_type, finished_good_id, quantity, movement_type, reference_number, warehouse_location, operator_name
          ) VALUES ('finished_good', $1, $2, $3, $4, $5, $6)`,
          [
            data.finishedGoodId,
            finalQty,
            data.type === 'in' ? 'production_receipt' : 'sales_shipment',
            data.referenceNumber || null,
            warehouseLoc,
            data.operatorName || 'System Operator'
          ]
        );
      }

      await db.query('COMMIT');
      return { success: true };
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    } finally {
      db.release();
    }
  }
};
