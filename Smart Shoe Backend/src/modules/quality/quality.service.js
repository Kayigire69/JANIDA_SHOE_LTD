import { query } from '../../config/db.js'
import { AppError } from '../../utils/AppError.js'
import { refreshProductionDashboardMetrics } from '../production/production.service.js'

// Helper to generate unique certificate number
const generateCertificateNumber = () => {
  const rand = Math.floor(100000 + Math.random() * 900000)
  return `CERT-${rand}`
}

// 1. Get all inspection templates
export const getInspectionTemplates = async () => {
  const result = await query(`
    SELECT * FROM inspection_templates
    ORDER BY created_at DESC
  `)
  return result.rows
}

// 2. Create a new inspection template
export const createInspectionTemplate = async (data) => {
  const { name, productType, checkpoints, checklist } = data

  if (!name || !productType || checkpoints === undefined || !checklist) {
    throw new AppError('Template name, product type, checkpoints count, and checklist items are required', 400)
  }

  const result = await query(`
    INSERT INTO inspection_templates (name, product_type, checkpoints, checklist, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `, [name, productType, checkpoints, JSON.stringify(checklist)])

  return result.rows[0]
}

// 3. Get all inspections joined with batch and model
export const getInspections = async () => {
  const result = await query(`
    SELECT qi.*, b.batch_number, m.name as shoe_model_name, t.name as template_name
    FROM quality_inspections qi
    JOIN batches b ON qi.batch_id = b.id
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    LEFT JOIN inspection_templates t ON qi.template_id = t.id
    ORDER BY qi.created_at DESC
  `)
  return result.rows
}

// 4. Record a new inspection
export const createInspection = async (data) => {
  const {
    batchId,
    templateId,
    inspectedQuantity,
    passedQuantity,
    failedQuantity,
    defectType,
    defectClassification,
    inspectorName,
    sizeAccuracy,
    stitchingQuality,
    materialIntegrity,
    colorConsistency,
    soleAdhesion,
    dimensionTolerance,
    notes,
    status
  } = data

  if (!batchId || inspectedQuantity === undefined || passedQuantity === undefined || failedQuantity === undefined || !inspectorName) {
    throw new AppError('Batch ID, inspected quantity, passed quantity, failed quantity, and inspector name are required', 400)
  }

  // 1. Insert the inspection record
  const insRes = await query(`
    INSERT INTO quality_inspections (
      batch_id, template_id, inspected_quantity, passed_quantity, failed_quantity,
      defect_type, defect_classification, inspector_name,
      size_accuracy, stitching_quality, material_integrity, color_consistency, sole_adhesion, dimension_tolerance,
      notes, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
    RETURNING *
  `, [
    batchId, templateId || null, inspectedQuantity, passedQuantity, failedQuantity,
    defectType || null, defectClassification || null, inspectorName,
    sizeAccuracy || 0, stitchingQuality || 0, materialIntegrity || 0, colorConsistency || 0, soleAdhesion || 0, dimensionTolerance || 0,
    notes || '', status || 'completed'
  ])

  const inspection = insRes.rows[0]

  // 2. Update the batch status
  // If failed_quantity > 0, batch is placed on 'quality_hold'
  // If failed_quantity == 0, batch is completed successfully
  const batchStatus = failedQuantity > 0 ? 'quality_hold' : 'completed'
  await query(`
    UPDATE batches
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `, [batchStatus, batchId])

  // 3. If failed_quantity > 0, automatically generate a rework order
  if (failedQuantity > 0) {
    const priority = defectClassification === 'critical' ? 'high' : (defectClassification === 'major' ? 'medium' : 'low')
    await query(`
      INSERT INTO rework_orders (
        inspection_id, batch_id, defect_type, failed_quantity, priority, assigned_to, due_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'Rework Department', CURRENT_DATE + INTERVAL '3 days', 'pending', NOW(), NOW())
    `, [inspection.id, batchId, defectType || 'General Defect', failedQuantity, priority])
  }

  // 4. If pass rate is >= 98% (passed_quantity / inspected_quantity >= 0.98), automatically generate a quality certificate
  const passRate = inspectedQuantity > 0 ? (passedQuantity / inspectedQuantity) : 0
  if (passRate >= 0.98 && failedQuantity === 0) {
    const certNo = generateCertificateNumber()
    const grade = passRate === 1.0 ? 'A+' : (passRate >= 0.99 ? 'A' : 'A-')
    const defectRatePercent = inspectedQuantity > 0 ? ((failedQuantity / inspectedQuantity) * 100) : 0

    await query(`
      INSERT INTO quality_certificates (
        inspection_id, batch_id, certificate_no, inspected_by, inspection_date, expiry_date, passed_quantity, defect_rate, grade, status, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', $5, $6, $7, 'issued', NOW())
    `, [inspection.id, batchId, certNo, inspectorName, passedQuantity, defectRatePercent, grade])
  }

  // 5. Asynchronously refresh both quality and production dashboards
  await refreshQualityDashboardMetrics()
  await refreshProductionDashboardMetrics()

  return inspection
}

// 5. Get all rework orders
export const getReworkOrders = async () => {
  const result = await query(`
    SELECT r.*, b.batch_number, m.name as shoe_model_name, qi.passed_quantity, qi.inspected_quantity
    FROM rework_orders r
    JOIN batches b ON r.batch_id = b.id
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    JOIN quality_inspections qi ON r.inspection_id = qi.id
    ORDER BY r.created_at DESC
  `)
  return result.rows
}

// 6. Update rework order status
export const updateReworkOrderStatus = async (id, status) => {
  if (!status || !['pending', 'in-progress', 'completed'].includes(status)) {
    throw new AppError('Valid status (pending, in-progress, completed) is required', 400)
  }

  const result = await query(`
    UPDATE rework_orders
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [status, id])

  if (result.rowCount === 0) {
    throw new AppError('Rework order not found', 404)
  }

  const reworkOrder = result.rows[0]

  // If rework is completed, let's clear the quality hold on the batch and set batch back to in_progress or completed
  if (status === 'completed') {
    await query(`
      UPDATE batches
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [reworkOrder.batch_id])
  } else if (status === 'in-progress') {
    await query(`
      UPDATE batches
      SET status = 'in_progress', updated_at = NOW()
      WHERE id = $1
    `, [reworkOrder.batch_id])
  } else {
    await query(`
      UPDATE batches
      SET status = 'quality_hold', updated_at = NOW()
      WHERE id = $1
    `, [reworkOrder.batch_id])
  }

  // Refresh dashboard metrics since status changed
  await refreshQualityDashboardMetrics()
  await refreshProductionDashboardMetrics()

  return reworkOrder
}

// 7. Get all quality certificates
export const getQualityCertificates = async () => {
  const result = await query(`
    SELECT qc.*, b.batch_number, m.name as shoe_model_name
    FROM quality_certificates qc
    JOIN batches b ON qc.batch_id = b.id
    LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
    ORDER BY qc.created_at DESC
  `)
  return result.rows
}

// 8. Get defect rate analytics
export const getDefectAnalytics = async () => {
  const totalIns = await query(`SELECT COALESCE(SUM(inspected_quantity), 0)::int AS total FROM quality_inspections`)
  const totalFail = await query(`SELECT COALESCE(SUM(failed_quantity), 0)::int AS total FROM quality_inspections`)
  
  const defectsByCategory = await query(`
    SELECT defect_type as name, COUNT(*)::int as value
    FROM quality_inspections
    WHERE defect_type IS NOT NULL AND defect_type != 'None' AND failed_quantity > 0
    GROUP BY defect_type
    ORDER BY value DESC
  `)

  return {
    totalInspected: totalIns.rows[0].total,
    totalFailed: totalFail.rows[0].total,
    defectsByCategory: defectsByCategory.rows
  }
}

// 9. Refresh dashboard metrics for quality officer
export const refreshQualityDashboardMetrics = async () => {
  try {
    // A. Calculate counts
    const insCountRes = await query(`SELECT COUNT(*)::int AS count FROM quality_inspections`)
    const totalInspections = insCountRes.rows[0]?.count || 0

    const passRateRes = await query(`
      SELECT 
        COALESCE(SUM(passed_quantity), 0)::numeric AS passed,
        COALESCE(SUM(inspected_quantity), 0)::numeric AS inspected
      FROM quality_inspections
    `)
    const passed = Number(passRateRes.rows[0]?.passed || 0)
    const inspected = Number(passRateRes.rows[0]?.inspected || 0)
    const avgPassRate = inspected > 0 ? ((passed / inspected) * 100).toFixed(1) : '0.0'
    const avgDefectRate = inspected > 0 ? (((inspected - passed) / inspected) * 100).toFixed(1) : '0.0'

    const pendingReworkRes = await query(`
      SELECT COUNT(*)::int AS count FROM rework_orders WHERE status = 'pending'
    `)
    const pendingRework = pendingReworkRes.rows[0]?.count || 0

    // B. Delete existing dashboard metrics for quality officer
    await query(`DELETE FROM dashboard_metrics WHERE role = 'quality_officer'`)

    // C. Insert fresh metrics
    const metrics = [
      { title: 'Total Inspections', value: String(totalInspections), subtitle: 'inspections logged', trend: 'all time', color: 'blue', order: 0 },
      { title: 'Avg Pass Rate', value: `${avgPassRate}%`, subtitle: 'average run quality', trend: Number(avgPassRate) >= 95 ? 'excellent' : 'needs attention', color: 'emerald', order: 1 },
      { title: 'Pending Rework', value: String(pendingRework), subtitle: 'batches requiring rework', trend: pendingRework > 0 ? 'action required' : 'all clear', color: 'amber', order: 2 },
      { title: 'Defect Rate', value: `${avgDefectRate}%`, subtitle: 'average defect rate', trend: Number(avgDefectRate) <= 5 ? 'optimal control' : 'high variance', color: 'slate', order: 3 }
    ]

    for (const m of metrics) {
      await query(`
        INSERT INTO dashboard_metrics (role, title, value, subtitle, trend, color, sort_order)
        VALUES ('quality_officer', $1, $2, $3, $4, $5, $6)
      `, [m.title, m.value, m.subtitle, m.trend, m.color, m.order])
    }

    // D. Update trend chart points
    await query(`DELETE FROM dashboard_chart_points WHERE role = 'quality_officer' AND chart_key = 'trend'`)
    const monthlyRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as label,
        COALESCE(SUM(passed_quantity)::numeric / NULLIF(SUM(inspected_quantity), 0)::numeric * 100, 0)::numeric(5,1) as val,
        COALESCE(SUM(failed_quantity)::numeric / NULLIF(SUM(inspected_quantity), 0)::numeric * 100, 0)::numeric(5,1) as secondary_val
      FROM quality_inspections
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)

    let chartOrder = 0
    for (const r of monthlyRes.rows) {
      await query(`
        INSERT INTO dashboard_chart_points (role, chart_key, label, value, secondary_value, sort_order)
        VALUES ('quality_officer', 'trend', $1, $2, $3, $4)
      `, [r.label, r.val, r.secondary_val, chartOrder++])
    }

    // E. Update dashboard records for inspection_results
    await query(`DELETE FROM dashboard_records WHERE role = 'quality_officer' AND record_type = 'inspection_results'`)
    const recentInspections = await query(`
      SELECT 
        'INS-' || SUBSTRING(qi.id::text FROM 1 FOR 6) as id,
        b.batch_number as "batchId",
        m.name as product,
        COALESCE((qi.passed_quantity::numeric / NULLIF(qi.inspected_quantity, 0)::numeric * 100)::numeric(5,1), 0) || '%' as "passRate",
        COALESCE(qi.defect_type, 'None') as "defectType",
        CASE WHEN qi.status = 'rework' THEN 'Rework Required' ELSE 'Completed' END as status
      FROM quality_inspections qi
      JOIN batches b ON qi.batch_id = b.id
      LEFT JOIN shoe_models m ON b.shoe_model_id = m.id
      ORDER BY qi.created_at DESC
      LIMIT 6
    `)

    let recordOrder = 0
    for (const row of recentInspections.rows) {
      await query(`
        INSERT INTO dashboard_records (role, record_type, payload, sort_order)
        VALUES ('quality_officer', 'inspection_results', $1, $2)
      `, [JSON.stringify(row), recordOrder++])
    }

  } catch (err) {
    console.error('Error refreshing quality dashboard metrics:', err)
  }
}
