import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { refreshProductionDashboardMetrics } from '../production/production.service.js'

// Helper to generate a unique batch number
const generateBatchNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `BTH-${dateStr}-${randomSuffix}`
}

export const getBatches = async () => {
  const result = await query(`
    SELECT b.*, m.name as shoe_model_name, p.plan_code, w.name as operator_name
    FROM batches b
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    LEFT JOIN production_plans p ON b.plan_id = p.id
    LEFT JOIN production_workers w ON b.operator_id = w.id
    ORDER BY b.created_at DESC
  `)
  return result.rows
}

export const getBatchDetails = async (id) => {
  const batchRes = await query(`
    SELECT b.*, m.name as shoe_model_name, p.plan_code, w.name as operator_name
    FROM batches b
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    LEFT JOIN production_plans p ON b.plan_id = p.id
    LEFT JOIN production_workers w ON b.operator_id = w.id
    WHERE b.id = $1
  `, [id])

  if (batchRes.rowCount === 0) {
    throw new AppError('Batch not found', 404)
  }

  const batch = batchRes.rows[0]

  const materialsRes = await query(`
    SELECT brm.*, rm.name as material_name, rm.unit
    FROM batch_raw_materials brm
    JOIN raw_materials rm ON brm.raw_material_id = rm.id
    WHERE brm.batch_id = $1
  `, [id])

  const parametersRes = await query(`
    SELECT * FROM batch_parameters
    WHERE batch_id = $1
    ORDER BY recorded_at ASC
  `, [id])

  const recallsRes = await query(`
    SELECT r.*, u.full_name as initiated_by_name
    FROM batch_recalls r
    LEFT JOIN users u ON r.initiated_by = u.id
    WHERE r.batch_id = $1
    ORDER BY r.initiated_at DESC
  `, [id])

  return {
    ...batch,
    rawMaterials: materialsRes.rows,
    parameters: parametersRes.rows,
    recalls: recallsRes.rows
  }
}

export const getBatchByNumber = async (batchNumber) => {
  const batchRes = await query(`
    SELECT id FROM batches WHERE batch_number = $1
  `, [batchNumber])

  if (batchRes.rowCount === 0) {
    throw new AppError('Batch number not found', 404)
  }

  return getBatchDetails(batchRes.rows[0].id)
}

export const createBatch = async (data, currentUser) => {
  const { planId, shoeModelId, quantity, operatorId, rawMaterialId, materialBatchNumber, temperature, pressure, time } = data

  if (!shoeModelId || !quantity || !operatorId || !rawMaterialId || !materialBatchNumber) {
    throw new AppError('Missing required batch creation parameters', 400)
  }

  const batchNumber = generateBatchNumber()

  // Start Transaction
  await query('BEGIN')

  try {
    // 1. Check if raw material has sufficient quantity
    const matRes = await query('SELECT quantity, name FROM raw_materials WHERE id = $1', [rawMaterialId])
    if (matRes.rowCount === 0) {
      throw new AppError('Raw material not found', 404)
    }

    // Default quantity consumed - let's calculate based on shoe quantity or consume a sensible quantity
    const quantityUsed = parseFloat(quantity) * 0.5 // e.g. 0.5 units per pair
    if (parseFloat(matRes.rows[0].quantity) < quantityUsed) {
      throw new AppError(`Insufficient stock for raw material: ${matRes.rows[0].name}`, 400)
    }

    // 2. Insert batch record
    const batchRes = await query(`
      INSERT INTO batches (batch_number, plan_id, shoe_model_id, status, quantity, location, operator_id, created_by)
      VALUES ($1, $2, $3, 'in_progress', $4, 'Cutting', $5, $6)
      RETURNING *
    `, [batchNumber, planId || null, shoeModelId, quantity, operatorId, currentUser.id])
    
    const batch = batchRes.rows[0]

    // 3. Insert Raw Material consumption record
    await query(`
      INSERT INTO batch_raw_materials (batch_id, raw_material_id, quantity_used, material_batch_number)
      VALUES ($1, $2, $3, $4)
    `, [batch.id, rawMaterialId, quantityUsed, materialBatchNumber])

    // 4. Deduct inventory stock
    await query(`
      UPDATE raw_materials
      SET quantity = quantity - $1, updated_at = NOW()
      WHERE id = $2
    `, [quantityUsed, rawMaterialId])

    // 5. Insert parameters
    const params = [
      { name: 'Temperature', val: temperature || '150', unit: '°C' },
      { name: 'Pressure', val: pressure || '45', unit: 'PSI' },
      { name: 'Curing Time', val: time || '120', unit: 'min' }
    ]

    for (const p of params) {
      await query(`
        INSERT INTO batch_parameters (batch_id, parameter_name, parameter_value, unit)
        VALUES ($1, $2, $3, $4)
      `, [batch.id, p.name, p.val, p.unit])
    }

    // 6. Update production plan status to In Progress if attached
    if (planId) {
      await query(`
        UPDATE production_plans
        SET status = 'In Progress', start_date = COALESCE(start_date, CURRENT_DATE), updated_at = NOW()
        WHERE id = $1
      `, [planId])
    }

    // 7. Write audit log
    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES ($1, 'create_batch', $2)
    `, [currentUser.id, JSON.stringify({ batchId: batch.id, batchNumber })])

    await query('COMMIT')

    // Refresh metrics async
    refreshProductionDashboardMetrics().catch(console.error)

    return batch
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}

export const updateBatchStatus = async (id, { status }, currentUser) => {
  if (!['in_progress', 'completed', 'quality_hold'].includes(status)) {
    throw new AppError('Invalid batch status', 400)
  }

  const batchRes = await query('SELECT * FROM batches WHERE id = $1', [id])
  if (batchRes.rowCount === 0) {
    throw new AppError('Batch not found', 404)
  }

  const batch = batchRes.rows[0]

  // If status transitions to completed, auto update location to Finished Goods
  let locationUpdate = ''
  let params = [status, id]
  if (status === 'completed') {
    locationUpdate = `, location = 'Finished Goods'`
  }

  await query(`
    UPDATE batches
    SET status = $1 ${locationUpdate}, updated_at = NOW()
    WHERE id = $2
  `, params)

  // Write audit log
  await query(`
    INSERT INTO audit_logs (user_id, action, metadata)
    VALUES ($1, 'update_batch_status', $2)
  `, [currentUser.id, JSON.stringify({ batchId: id, status, batchNumber: batch.batch_number })])

  refreshProductionDashboardMetrics().catch(console.error)

  return { message: 'Batch status updated successfully' }
}

export const updateBatchLocation = async (id, { location }, currentUser) => {
  const batchRes = await query('SELECT * FROM batches WHERE id = $1', [id])
  if (batchRes.rowCount === 0) {
    throw new AppError('Batch not found', 404)
  }

  const batch = batchRes.rows[0]

  await query(`
    UPDATE batches
    SET location = $1, updated_at = NOW()
    WHERE id = $2
  `, [location, id])

  await query(`
    INSERT INTO audit_logs (user_id, action, metadata)
    VALUES ($1, 'update_batch_location', $2)
  `, [currentUser.id, JSON.stringify({ batchId: id, location, batchNumber: batch.batch_number })])

  return { message: 'Batch location updated successfully' }
}

export const createRecall = async (data, currentUser) => {
  const { batchId, reason, severity } = data

  if (!batchId || !reason || !severity) {
    throw new AppError('Batch ID, reason, and severity are required for recalls', 400)
  }

  const batchRes = await query('SELECT * FROM batches WHERE id = $1', [batchId])
  if (batchRes.rowCount === 0) {
    throw new AppError('Batch not found', 404)
  }
  const batch = batchRes.rows[0]

  await query('BEGIN')

  try {
    // 1. Put batch on quality hold
    await query(`
      UPDATE batches
      SET status = 'quality_hold', updated_at = NOW()
      WHERE id = $1
    `, [batchId])

    // 2. Insert recall log
    const recallRes = await query(`
      INSERT INTO batch_recalls (batch_id, reason, severity, status, affected_units, initiated_by)
      VALUES ($1, $2, $3, 'initiated', $4, $5)
      RETURNING *
    `, [batchId, reason, severity, batch.quantity, currentUser.id])

    // 3. Log audit
    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES ($1, 'initiate_batch_recall', $2)
    `, [currentUser.id, JSON.stringify({ batchId, recallId: recallRes.rows[0].id, batchNumber: batch.batch_number })])

    await query('COMMIT')

    refreshProductionDashboardMetrics().catch(console.error)

    return recallRes.rows[0]
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}

export const getRecalls = async () => {
  const result = await query(`
    SELECT r.*, b.batch_number, m.name as shoe_model_name, u.full_name as initiated_by_name
    FROM batch_recalls r
    JOIN batches b ON r.batch_id = b.id
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    LEFT JOIN users u ON r.initiated_by = u.id
    ORDER BY r.initiated_at DESC
  `)
  return result.rows
}

export const updateRecall = async (recallId, data, currentUser) => {
  const { status, actionsTaken } = data

  if (!['initiated', 'in_progress', 'resolved'].includes(status)) {
    throw new AppError('Invalid recall status', 400)
  }

  const recallRes = await query('SELECT * FROM batch_recalls WHERE id = $1', [recallId])
  if (recallRes.rowCount === 0) {
    throw new AppError('Recall record not found', 404)
  }

  const recall = recallRes.rows[0]

  let resolvedAtField = ''
  let params = [status, actionsTaken || null, recallId]
  if (status === 'resolved') {
    resolvedAtField = `, resolved_at = NOW()`
  }

  await query('BEGIN')

  try {
    await query(`
      UPDATE batch_recalls
      SET status = $1, actions_taken = $2 ${resolvedAtField}
      WHERE id = $3
    `, params)

    // If resolved, put the batch back to completed or in_progress depending on original state
    if (status === 'resolved') {
      await query(`
        UPDATE batches
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `, [recall.batch_id])
    }

    await query(`
      INSERT INTO audit_logs (user_id, action, metadata)
      VALUES ($1, 'update_batch_recall', $2)
    `, [currentUser.id, JSON.stringify({ recallId, status })])

    await query('COMMIT')

    refreshProductionDashboardMetrics().catch(console.error)

    return { message: 'Recall status updated successfully' }
  } catch (err) {
    await query('ROLLBACK')
    throw err
  }
}
