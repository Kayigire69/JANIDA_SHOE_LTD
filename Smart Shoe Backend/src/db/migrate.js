import { pool } from '../config/db.js'

export async function runMigrations() {
const sql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(40) NOT NULL,
  employee_id VARCHAR(80) UNIQUE,
  role VARCHAR(40) NOT NULL CHECK (role IN ('pending','production_manager','inventory_manager','quality_officer','sales_staff','administrator')),
  department VARCHAR(80) NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN ('email_verification','password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_id VARCHAR(120) UNIQUE NOT NULL,
  ip_address VARCHAR(80),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(160) NOT NULL,
  success BOOLEAN NOT NULL,
  reason TEXT,
  ip_address VARCHAR(80),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  ip_address VARCHAR(80),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_department ON users(role, department);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(80) NOT NULL CHECK (alert_type IN ('failed_login_spike', 'unusual_access_pattern', 'privilege_escalation', 'data_export', 'suspicious_ip', 'after_hours_access', 'account_lockout')),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_ip VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(80) NOT NULL UNIQUE CHECK (resource_type IN ('audit_logs', 'login_attempts', 'user_sessions', 'batch_history', 'inventory_adjustments', 'quality_inspections')),
  retention_days INTEGER NOT NULL DEFAULT 365 CHECK (retention_days > 0),
  auto_purge_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_purged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(40) NOT NULL,
  department VARCHAR(80),
  title VARCHAR(120) NOT NULL,
  value VARCHAR(80) NOT NULL,
  subtitle VARCHAR(160),
  trend VARCHAR(120),
  color VARCHAR(40) NOT NULL DEFAULT 'blue',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_chart_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(40) NOT NULL,
  chart_key VARCHAR(80) NOT NULL,
  label VARCHAR(80) NOT NULL,
  value NUMERIC NOT NULL,
  secondary_value NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(40) NOT NULL,
  record_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(40),
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(40) NOT NULL DEFAULT 'normal',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(40),
  type VARCHAR(40) NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_role ON dashboard_metrics(role);
CREATE INDEX IF NOT EXISTS idx_dashboard_chart_points_role ON dashboard_chart_points(role, chart_key);
CREATE INDEX IF NOT EXISTS idx_dashboard_records_role ON dashboard_records(role, record_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role ON notifications(user_id, role);
CREATE INDEX IF NOT EXISTS idx_system_announcements_role ON system_announcements(role);

-- Production Planning & Scheduling Module Tables
CREATE TABLE IF NOT EXISTS shoe_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  minimum NUMERIC NOT NULL DEFAULT 0,
  maximum NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  supplier VARCHAR(120),
  warehouse_location VARCHAR(40),
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shoe_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoe_model_id UUID NOT NULL REFERENCES shoe_models(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_per_pair NUMERIC NOT NULL CHECK (quantity_per_pair > 0),
  UNIQUE (shoe_model_id, raw_material_id)
);

CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'Production Operator',
  department VARCHAR(80) NOT NULL DEFAULT 'Production',
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(40),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(40) UNIQUE NOT NULL,
  shoe_model_id UUID NOT NULL REFERENCES shoe_models(id) ON DELETE RESTRICT,
  size VARCHAR(20) NOT NULL,
  target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
  completed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),
  deadline DATE NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'Paused')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  start_date DATE,
  end_date DATE,
  efficiency NUMERIC DEFAULT 0 CHECK (efficiency >= 0),
  defect_rate NUMERIC DEFAULT 0 CHECK (defect_rate >= 0),
  operator_id UUID REFERENCES production_workers(id) ON DELETE SET NULL,
  gantt_start INTEGER DEFAULT 0 CHECK (gantt_start >= 0 AND gantt_start <= 24),
  gantt_duration INTEGER DEFAULT 4 CHECK (gantt_duration >= 1 AND gantt_duration <= 24),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_workers (
  plan_id UUID NOT NULL REFERENCES production_plans(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES production_workers(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, worker_id)
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name VARCHAR(40) NOT NULL CHECK (shift_name IN ('morning', 'afternoon', 'night')),
  worker_id UUID NOT NULL REFERENCES production_workers(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (shift_name, worker_id, assigned_date)
);

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(80) UNIQUE NOT NULL,
  plan_id UUID REFERENCES production_plans(id) ON DELETE SET NULL,
  shoe_model_id UUID REFERENCES shoe_models(id) ON DELETE RESTRICT,
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'quality_hold')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  location VARCHAR(120) NOT NULL DEFAULT 'Cutting',
  operator_id UUID REFERENCES production_workers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity_used NUMERIC NOT NULL CHECK (quantity_used > 0),
  material_batch_number VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  parameter_name VARCHAR(80) NOT NULL,
  parameter_value VARCHAR(80) NOT NULL,
  unit VARCHAR(20),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS batch_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'resolved')),
  affected_units INTEGER NOT NULL DEFAULT 0,
  actions_taken TEXT,
  initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  contact_name VARCHAR(120),
  email VARCHAR(160),
  phone VARCHAR(40),
  lead_time_days INTEGER NOT NULL DEFAULT 5 CHECK (lead_time_days >= 0),
  address TEXT,
  rating NUMERIC DEFAULT 5.0,
  orders_completed INTEGER DEFAULT 0,
  on_time_delivery_pct NUMERIC DEFAULT 100.0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(40) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  delivery_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0)
);

CREATE TABLE IF NOT EXISTS finished_goods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoe_model_id UUID NOT NULL REFERENCES shoe_models(id) ON DELETE RESTRICT,
  sku VARCHAR(80) UNIQUE NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  target INTEGER NOT NULL DEFAULT 0 CHECK (target >= 0),
  minimum INTEGER NOT NULL DEFAULT 0 CHECK (minimum >= 0),
  warehouse_location VARCHAR(80),
  unit_cost NUMERIC NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  last_produced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(40) NOT NULL CHECK (item_type IN ('raw_material', 'finished_good')),
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  finished_good_id UUID REFERENCES finished_goods(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  movement_type VARCHAR(40) NOT NULL CHECK (movement_type IN ('purchase_receipt', 'production_issue', 'production_receipt', 'sales_shipment', 'adjustment')),
  reference_id UUID,
  reference_number VARCHAR(80),
  warehouse_location VARCHAR(80),
  operator_name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  product_type VARCHAR(120) NOT NULL,
  checkpoints INTEGER NOT NULL DEFAULT 0,
  checklist JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  template_id UUID REFERENCES inspection_templates(id) ON DELETE SET NULL,
  inspected_quantity INTEGER NOT NULL DEFAULT 0,
  passed_quantity INTEGER NOT NULL DEFAULT 0,
  failed_quantity INTEGER NOT NULL DEFAULT 0,
  defect_type VARCHAR(80),
  defect_classification VARCHAR(20) CHECK (defect_classification IN ('minor', 'major', 'critical')),
  inspector_name VARCHAR(120) NOT NULL,
  size_accuracy NUMERIC DEFAULT 0,
  stitching_quality NUMERIC DEFAULT 0,
  material_integrity NUMERIC DEFAULT 0,
  color_consistency NUMERIC DEFAULT 0,
  sole_adhesion NUMERIC DEFAULT 0,
  dimension_tolerance NUMERIC DEFAULT 0,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'rework')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rework_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  defect_type VARCHAR(80) NOT NULL,
  failed_quantity INTEGER NOT NULL DEFAULT 0,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to VARCHAR(120) DEFAULT 'Rework Department',
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  certificate_no VARCHAR(80) UNIQUE NOT NULL,
  inspected_by VARCHAR(120) NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  passed_quantity INTEGER NOT NULL DEFAULT 0,
  defect_rate NUMERIC NOT NULL DEFAULT 0,
  grade VARCHAR(10) NOT NULL DEFAULT 'A',
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'pending', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  email VARCHAR(160),
  phone VARCHAR(40),
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(80) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered')),
  delivery_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  finished_good_id UUID NOT NULL REFERENCES finished_goods(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0)
);

CREATE TABLE IF NOT EXISTS backorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity_backordered INTEGER NOT NULL CHECK (quantity_backordered > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(80) UNIQUE NOT NULL,
  amount_due NUMERIC NOT NULL CHECK (amount_due >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier VARCHAR(80) NOT NULL,
  tracking_number VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'delivered', 'returned')),
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workforce_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(40) UNIQUE NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(40),
  role VARCHAR(80) NOT NULL,
  department VARCHAR(80) NOT NULL,
  shift VARCHAR(40) NOT NULL DEFAULT 'morning' CHECK (shift IN ('morning', 'afternoon', 'night', 'flex')),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  skills TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate NUMERIC NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emergency_contact VARCHAR(160),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(30) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave')),
  hours_worked NUMERIC NOT NULL DEFAULT 0 CHECK (hours_worked >= 0),
  UNIQUE (employee_id, work_date)
);

CREATE TABLE IF NOT EXISTS workforce_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  training_name VARCHAR(160) NOT NULL,
  provider VARCHAR(160),
  completion_date DATE,
  expiry_date DATE,
  score NUMERIC CHECK (score >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  review_period VARCHAR(80) NOT NULL,
  productivity_score NUMERIC NOT NULL DEFAULT 0 CHECK (productivity_score >= 0),
  quality_score NUMERIC NOT NULL DEFAULT 0 CHECK (quality_score >= 0),
  attendance_score NUMERIC NOT NULL DEFAULT 0 CHECK (attendance_score >= 0),
  overall_score NUMERIC NOT NULL DEFAULT 0 CHECK (overall_score >= 0),
  notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES workforce_employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(40) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workforce_employees_search ON workforce_employees(full_name, employee_code, email);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_department ON workforce_employees(department);
CREATE INDEX IF NOT EXISTS idx_workforce_tasks_employee ON workforce_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_workforce_attendance_employee_date ON workforce_attendance(employee_id, work_date);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  type VARCHAR(80) NOT NULL,
  manufacturer VARCHAR(160),
  model VARCHAR(160),
  serial_number VARCHAR(160),
  location VARCHAR(160),
  department VARCHAR(80),
  status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'idle', 'retired')),
  purchase_date DATE,
  warranty_expiry DATE,
  hourly_rate NUMERIC NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  assigned_production_plan_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(40) NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'calibration')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  technician VARCHAR(160),
  description TEXT,
  cost NUMERIC NOT NULL DEFAULT 0 CHECK (cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_downtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  reason TEXT NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'mechanical' CHECK (category IN ('mechanical', 'electrical', 'operator', 'material', 'planned')),
  impact_minutes NUMERIC NOT NULL DEFAULT 0 CHECK (impact_minutes >= 0),
  operator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  part_number VARCHAR(160) UNIQUE,
  equipment_type VARCHAR(80),
  quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  minimum_stock NUMERIC NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  unit_cost NUMERIC NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  supplier VARCHAR(160),
  location VARCHAR(160),
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  calibrated_at TIMESTAMPTZ NOT NULL,
  next_due TIMESTAMPTZ,
  calibrated_by VARCHAR(160),
  certificate_number VARCHAR(160),
  result VARCHAR(20) NOT NULL DEFAULT 'pass' CHECK (result IN ('pass', 'fail', 'adjustment')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(120) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL DEFAULT '',
  setting_type VARCHAR(40) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  editable_by_admin BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name VARCHAR(200) NOT NULL,
  backup_type VARCHAR(40) NOT NULL CHECK (backup_type IN ('full', 'partial')),
  status VARCHAR(40) NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  file_path TEXT,
  file_size_bytes BIGINT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  capacity_per_hour INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  supervisor_id UUID REFERENCES workforce_employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_line_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (line_id, machine_id)
);

CREATE TABLE IF NOT EXISTS quality_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_name VARCHAR(160) UNIQUE NOT NULL,
  product_type VARCHAR(120),
  size_accuracy_min NUMERIC NOT NULL DEFAULT 0 CHECK (size_accuracy_min >= 0),
  stitching_quality_min NUMERIC NOT NULL DEFAULT 0 CHECK (stitching_quality_min >= 0),
  material_integrity_min NUMERIC NOT NULL DEFAULT 0 CHECK (material_integrity_min >= 0),
  color_consistency_min NUMERIC NOT NULL DEFAULT 0 CHECK (color_consistency_min >= 0),
  sole_adhesion_min NUMERIC NOT NULL DEFAULT 0 CHECK (sole_adhesion_min >= 0),
  dimension_tolerance_min NUMERIC NOT NULL DEFAULT 0 CHECK (dimension_tolerance_min >= 0),
  max_defect_rate NUMERIC NOT NULL DEFAULT 0 CHECK (max_defect_rate >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_search ON equipment(name, code);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment ON equipment_maintenance(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_downtime_equipment ON equipment_downtime(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_calibration_equipment ON equipment_calibration(equipment_id);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('pending','production_manager','inventory_manager','quality_officer','sales_staff','administrator','supervisor'));

-- Make employee_id nullable for pending users
ALTER TABLE users ALTER COLUMN employee_id DROP NOT NULL;

-- Sequence for auto-generating employee IDs
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START WITH 1000;
`

await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
await pool.query(sql)

// Seed default admin user (always runs, idempotent)
const bcrypt = (await import('bcryptjs')).default
const adminExists = await pool.query(`SELECT id FROM users WHERE email = 'admin@janidashoe.com'`)
if (adminExists.rowCount === 0) {
  const adminPasswordHash = await bcrypt.hash('Admin@2025', 12)
  await pool.query(
    `INSERT INTO users (full_name, email, phone, employee_id, role, department, password_hash, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
    ['System Administrator', 'admin@janidashoe.com', '+250780000000', 'EMP-0001', 'administrator', 'IT & Administration', adminPasswordHash]
  )
  console.log('Default admin user seeded: admin@janidashoe.com / Admin@2025')
}

// Database Seeding Logic
const enableSeedData = process.env.ENABLE_SEED_DATA === 'true'
const modelsRes = enableSeedData ? await pool.query('SELECT COUNT(*) FROM shoe_models') : { rows: [{ count: '1' }] }
if (enableSeedData && parseInt(modelsRes.rows[0].count) === 0) {
  console.log('Seeding production data...')
  
  // Seed shoe models
  const modelNames = ['Running Shoe Pro', 'Casual Sneaker', 'Sports Trainer', 'Walking Comfort', 'Athletic Runner', 'Urban Style']
  const modelIds = {}
  for (const name of modelNames) {
    const res = await pool.query('INSERT INTO shoe_models (name) VALUES ($1) RETURNING id', [name])
    modelIds[name] = res.rows[0].id
  }

  // Seed raw materials
  const rawMaterials = [
    { code: 'RM-001', name: 'Premium Leather', qty: 450, unit: 'sqm', min: 200, max: 800, cost: 45.00, supplier: 'Global Leather Co.', loc: 'WH-A-01' },
    { code: 'RM-002', name: 'Rubber Sole Material', qty: 780, unit: 'pairs', min: 300, max: 1200, cost: 12.50, supplier: 'Sole Tech Industries', loc: 'WH-B-03' },
    { code: 'RM-003', name: 'Fabric Lining', qty: 120, unit: 'meters', min: 150, max: 600, cost: 8.75, supplier: 'Textile Partners Ltd', loc: 'WH-A-05' },
    { code: 'RM-004', name: 'Shoe Laces', qty: 980, unit: 'pairs', min: 400, max: 1500, cost: 2.25, supplier: 'Accessories Inc', loc: 'WH-A-03' },
    { code: 'RM-005', name: 'EVA Foam', qty: 340, unit: 'sheets', min: 250, max: 700, cost: 15.50, supplier: 'Foam Solutions', loc: 'WH-B-01' },
    { code: 'RM-006', name: 'Industrial Adhesive', qty: 90, unit: 'liters', min: 100, max: 300, cost: 28.00, supplier: 'Chemical Corp', loc: 'WH-C-02' }
  ]
  const matIds = {}
  for (const m of rawMaterials) {
    const res = await pool.query(
      `INSERT INTO raw_materials (material_code, name, quantity, unit, minimum, maximum, unit_cost, supplier, warehouse_location, last_restocked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id`,
      [m.code, m.name, m.qty, m.unit, m.min, m.max, m.cost, m.supplier, m.loc]
    )
    matIds[m.name] = res.rows[0].id
  }

  // Seed BOM (Bill of Materials)
  const bomSpecs = [
    { model: 'Running Shoe Pro', specs: [
      { mat: 'Premium Leather', qty: 0.5 },
      { mat: 'Rubber Sole Material', qty: 1.0 },
      { mat: 'Fabric Lining', qty: 0.3 },
      { mat: 'Shoe Laces', qty: 1.0 },
      { mat: 'EVA Foam', qty: 0.5 }
    ] },
    { model: 'Casual Sneaker', specs: [
      { mat: 'Premium Leather', qty: 0.4 },
      { mat: 'Rubber Sole Material', qty: 1.0 },
      { mat: 'Fabric Lining', qty: 0.2 },
      { mat: 'Shoe Laces', qty: 1.0 }
    ] },
    { model: 'Sports Trainer', specs: [
      { mat: 'Premium Leather', qty: 0.6 },
      { mat: 'Rubber Sole Material', qty: 1.2 },
      { mat: 'Fabric Lining', qty: 0.4 },
      { mat: 'Shoe Laces', qty: 1.0 },
      { mat: 'EVA Foam', qty: 0.6 }
    ] },
    { model: 'Walking Comfort', specs: [
      { mat: 'Premium Leather', qty: 0.5 },
      { mat: 'Rubber Sole Material', qty: 0.9 },
      { mat: 'Fabric Lining', qty: 0.3 },
      { mat: 'Shoe Laces', qty: 1.0 }
    ] }
  ]
  for (const spec of bomSpecs) {
    const modelId = modelIds[spec.model]
    for (const item of spec.specs) {
      const matId = matIds[item.mat]
      await pool.query(
        'INSERT INTO shoe_bom (shoe_model_id, raw_material_id, quantity_per_pair) VALUES ($1, $2, $3)',
        [modelId, matId, item.qty]
      )
    }
  }

  // Seed machines
  const machineList = [
    { code: 'A1', name: 'Machine A1' },
    { code: 'A2', name: 'Machine A2' },
    { code: 'B1', name: 'Machine B1' },
    { code: 'C1', name: 'Machine C1' }
  ]
  const machIds = {}
  for (const m of machineList) {
    const res = await pool.query('INSERT INTO machines (code, name) VALUES ($1, $2) RETURNING id', [m.code, m.name])
    machIds[m.code] = res.rows[0].id
  }

  // Seed production workers
  const workerList = [
    { id: 'EMP-001', name: 'John Anderson', role: 'Production Manager', dept: 'Production', email: 'john.anderson@smartshoe.com', phone: '+1 555-0101' },
    { id: 'EMP-002', name: 'Jane Smith', role: 'Inventory Manager', dept: 'Inventory & Logistics', email: 'jane.smith@smartshoe.com', phone: '+1 555-0102' },
    { id: 'EMP-003', name: 'Mike Johnson', role: 'Quality Officer', dept: 'Quality Assurance', email: 'mike.johnson@smartshoe.com', phone: '+1 555-0103' },
    { id: 'EMP-004', name: 'Sarah Williams', role: 'Quality Inspector', dept: 'Quality Assurance', email: 'sarah.williams@smartshoe.com', phone: '+1 555-0104' },
    { id: 'EMP-005', name: 'Tom Brown', role: 'Production Operator', dept: 'Production', email: 'tom.brown@smartshoe.com', phone: '+1 555-0105' },
    { id: 'EMP-006', name: 'Lisa Davis', role: 'Production Operator', dept: 'Production', email: 'lisa.davis@smartshoe.com', phone: '+1 555-0106' },
    { id: 'EMP-007', name: 'David Wilson', role: 'Production Operator', dept: 'Production', email: 'david.wilson@smartshoe.com', phone: '+1 555-0107' },
    { id: 'EMP-008', name: 'Emma Martinez', role: 'Administrator', dept: 'IT & Administration', email: 'emma.martinez@smartshoe.com', phone: '+1 555-0108' }
  ]
  const workIds = {}
  for (const w of workerList) {
    const res = await pool.query(
      `INSERT INTO production_workers (worker_id, name, role, department, email, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id`,
      [w.id, w.name, w.role, w.dept, w.email, w.phone]
    )
    workIds[w.name] = res.rows[0].id
  }

  // Seed plans/orders/history
  const plans = [
    { code: 'PO-2026-001', model: 'Running Shoe Pro', size: '10', target: 500, completed: 500, status: 'Completed', priority: 'high', operator: 'John Anderson', mach: 'A1', startHour: 0, duration: 8, startD: '2026-04-28', endD: '2026-05-01', eff: 98, def: 2.1 },
    { code: 'PO-2026-002', model: 'Casual Sneaker', size: '9', target: 300, completed: 0, status: 'Planned', priority: 'medium', operator: 'Jane Smith', mach: 'A2', startHour: 2, duration: 6, startD: null, endD: null, eff: 0, def: 0 },
    { code: 'PO-2026-003', model: 'Sports Trainer', size: '11', target: 600, completed: 600, status: 'Completed', priority: 'high', operator: 'Mike Johnson', mach: 'B1', startHour: 8, duration: 4, startD: '2026-04-30', endD: '2026-05-02', eff: 94, def: 1.8 },
    { code: 'PO-2026-004', model: 'Walking Comfort', size: '8', target: 600, completed: 180, status: 'In Progress', priority: 'low', operator: 'Sarah Williams', mach: 'C1', startHour: 0, duration: 10, startD: '2026-05-01', endD: null, eff: 75, def: 0 },
    { code: 'PO-2026-005', model: 'Running Shoe Pro', size: '9', target: 500, completed: 375, status: 'In Progress', priority: 'high', operator: 'Tom Brown', mach: 'A1', startHour: 4, duration: 6, startD: '2026-05-02', endD: null, eff: 82, def: 0 }
  ]
  const planIds = {}
  for (const p of plans) {
    const modelId = modelIds[p.model]
    const machId = machIds[p.mach]
    const opId = workIds[p.operator]
    const res = await pool.query(
      `INSERT INTO production_plans (plan_code, shoe_model_id, size, target_quantity, completed_quantity, deadline, machine_id, status, priority, start_date, end_date, efficiency, defect_rate, operator_id, gantt_start, gantt_duration)
       VALUES ($1, $2, $3, $4, $5, '2026-06-30', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [p.code, modelId, p.size, p.target, p.completed, machId, p.status, p.priority, p.startD, p.endD, p.eff, p.def, opId, p.startHour, p.duration]
    )
    const planId = res.rows[0].id
    planIds[p.code] = planId

    // Associate workers
    const assignedWorkerNames = ['John Anderson', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown']
    for (const name of assignedWorkerNames) {
      if (workIds[name]) {
        await pool.query('INSERT INTO plan_workers (plan_id, worker_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [planId, workIds[name]])
      }
    }
  }

  // Seed shift assignments
  const shiftsSeeds = {
    morning: ['John Anderson', 'Jane Smith', 'Mike Johnson'],
    afternoon: ['Sarah Williams', 'Tom Brown', 'Lisa Davis'],
    night: ['David Wilson', 'Emma Martinez']
  }
  for (const [shiftName, workers] of Object.entries(shiftsSeeds)) {
    for (const wName of workers) {
      const wId = workIds[wName]
      if (wId) {
        await pool.query('INSERT INTO shift_assignments (shift_name, worker_id, assigned_date) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING', [shiftName, wId])
      }
    }
  }

  // Seed batches & traceability data
  console.log('Seeding batches...')
  const batchList = [
    {
      number: 'BTH-001234',
      planCode: 'PO-2026-005',
      modelName: 'Running Shoe Pro',
      status: 'in_progress',
      qty: 120,
      location: 'Assembly',
      operatorName: 'John Anderson',
      materials: [
        { name: 'Premium Leather', qtyUsed: 60.0, batchNum: 'RM-2026-001 (Leather)' },
        { name: 'Rubber Sole Material', qtyUsed: 120.0, batchNum: 'RM-2026-002 (Rubber)' }
      ],
      params: [
        { name: 'Temperature', val: '150', unit: '°C' },
        { name: 'Pressure', val: '45', unit: 'PSI' },
        { name: 'Curing Time', val: '120', unit: 'min' }
      ]
    },
    {
      number: 'BTH-001235',
      planCode: 'PO-2026-001',
      modelName: 'Running Shoe Pro',
      status: 'completed',
      qty: 200,
      location: 'Finished Goods',
      operatorName: 'Jane Smith',
      materials: [
        { name: 'Premium Leather', qtyUsed: 100.0, batchNum: 'RM-2026-001 (Leather)' },
        { name: 'Rubber Sole Material', qtyUsed: 200.0, batchNum: 'RM-2026-002 (Rubber)' }
      ],
      params: [
        { name: 'Temperature', val: '145', unit: '°C' },
        { name: 'Pressure', val: '40', unit: 'PSI' },
        { name: 'Curing Time', val: '100', unit: 'min' }
      ]
    },
    {
      number: 'BTH-001236',
      planCode: 'PO-2026-004',
      modelName: 'Walking Comfort',
      status: 'quality_hold',
      qty: 80,
      location: 'Quality Check',
      operatorName: 'Mike Johnson',
      materials: [
        { name: 'Premium Leather', qtyUsed: 40.0, batchNum: 'RM-2026-001 (Leather)' },
        { name: 'Fabric Lining', qtyUsed: 24.0, batchNum: 'RM-2026-003 (Fabric)' }
      ],
      params: [
        { name: 'Temperature', val: '155', unit: '°C' },
        { name: 'Pressure', val: '50', unit: 'PSI' },
        { name: 'Curing Time', val: '130', unit: 'min' }
      ],
      recall: {
        reason: 'Adhesive bonding failure detected under high temperature stress test.',
        severity: 'high',
        status: 'initiated',
        affectedUnits: 80
      }
    }
  ]

  for (const b of batchList) {
    const planId = planIds[b.planCode] || null
    const modelId = modelIds[b.modelName] || null
    const opId = workIds[b.operatorName] || null
    
    const bRes = await pool.query(
      `INSERT INTO batches (batch_number, plan_id, shoe_model_id, status, quantity, location, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [b.number, planId, modelId, b.status, b.qty, b.location, opId]
    )
    const batchId = bRes.rows[0].id

    // Seed raw materials used
    for (const m of b.materials) {
      const matId = matIds[m.name]
      if (matId) {
        await pool.query(
          `INSERT INTO batch_raw_materials (batch_id, raw_material_id, quantity_used, material_batch_number)
           VALUES ($1, $2, $3, $4)`,
          [batchId, matId, m.qtyUsed, m.batchNum]
        )
      }
    }

    // Seed parameters
    for (const p of b.params) {
      await pool.query(
        `INSERT INTO batch_parameters (batch_id, parameter_name, parameter_value, unit)
         VALUES ($1, $2, $3, $4)`,
        [batchId, p.name, p.val, p.unit]
      )
    }

    // Seed recall if present
    if (b.recall) {
      await pool.query(
        `INSERT INTO batch_recalls (batch_id, reason, severity, status, affected_units)
         VALUES ($1, $2, $3, $4, $5)`,
        [batchId, b.recall.reason, b.recall.severity, b.recall.status, b.recall.affectedUnits]
      )
    }
  }

  // Seed suppliers
  console.log('Seeding suppliers...')
  const suppliersSeed = [
    { name: 'Global Leather Co.', contact: 'Michael Chen', email: 'contact@globalleather.com', phone: '+1 555-0201', address: '123 Industrial Park, New York, NY 10001', leadTime: 7, rating: 4.8, completed: 145, onTime: 96.5 },
    { name: 'Sole Tech Industries', contact: 'Sarah Johnson', email: 'sales@soletech.com', phone: '+1 555-0202', address: '456 Manufacturing Rd, Chicago, IL 60601', leadTime: 5, rating: 4.9, completed: 198, onTime: 98.2 },
    { name: 'Textile Partners Ltd', contact: 'David Williams', email: 'info@textilepartners.com', phone: '+1 555-0203', address: '789 Fabric Ave, Los Angeles, CA 90001', leadTime: 10, rating: 4.3, completed: 87, onTime: 89.7 },
    { name: 'Accessories Inc', contact: 'Emma Martinez', email: 'orders@accessories-inc.com', phone: '+1 555-0204', address: '321 Commerce St, Boston, MA 02101', leadTime: 3, rating: 4.7, completed: 234, onTime: 95.8 },
    { name: 'Foam Solutions', contact: 'Robert Lee', email: 'sales@foamsolutions.com', phone: '+1 555-0205', address: '654 Innovation Blvd, Austin, TX 78701', leadTime: 8, rating: 4.6, completed: 112, onTime: 93.2 },
    { name: 'Chemical Corp', contact: 'Lisa Anderson', email: 'contact@chemicalcorp.com', phone: '+1 555-0206', address: '987 Industry Way, Houston, TX 77001', leadTime: 4, rating: 4.5, completed: 156, onTime: 91.4 }
  ]
  const supIds = {}
  for (const s of suppliersSeed) {
    const res = await pool.query(
      `INSERT INTO suppliers (name, contact_name, email, phone, address, lead_time_days, rating, orders_completed, on_time_delivery_pct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [s.name, s.contact, s.email, s.phone, s.address, s.leadTime, s.rating, s.completed, s.onTime]
    )
    supIds[s.name] = res.rows[0].id
  }

  // Seed finished goods
  console.log('Seeding finished goods inventory...')
  const fgSeed = [
    { model: 'Running Shoe Pro', sku: 'RSP-001', stock: 1250, target: 1500, min: 500, loc: 'WH-FG-A1', cost: 45.50 },
    { model: 'Casual Sneaker', sku: 'CS-002', stock: 890, target: 1000, min: 400, loc: 'WH-FG-A2', cost: 38.75 },
    { model: 'Sports Trainer', sku: 'ST-003', stock: 450, target: 800, min: 300, loc: 'WH-FG-B1', cost: 52.00 },
    { model: 'Walking Comfort', sku: 'WC-004', stock: 2100, target: 2000, min: 800, loc: 'WH-FG-A3', cost: 41.25 },
    { model: 'Athletic Runner', sku: 'AR-005', stock: 680, target: 700, min: 300, loc: 'WH-FG-B2', cost: 48.90 },
    { model: 'Urban Style', sku: 'US-006', stock: 250, target: 600, min: 200, loc: 'WH-FG-C1', cost: 55.00 }
  ]
  const fgIds = {}
  for (const fg of fgSeed) {
    const modelId = modelIds[fg.model]
    if (modelId) {
      const res = await pool.query(
        `INSERT INTO finished_goods (shoe_model_id, sku, stock, target, minimum, warehouse_location, unit_cost, last_produced)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
        [modelId, fg.sku, fg.stock, fg.target, fg.min, fg.loc, fg.cost]
      )
      fgIds[fg.sku] = res.rows[0].id
    }
  }

  // Seed purchase orders and items
  console.log('Seeding purchase orders...')
  const poSeeds = [
    { poNum: 'PO-202605-1234', supplierName: 'Global Leather Co.', materialName: 'Premium Leather', qty: 500, cost: 45.00, status: 'pending', deliveryDays: 7 },
    { poNum: 'PO-202605-1235', supplierName: 'Sole Tech Industries', materialName: 'Rubber Sole Material', qty: 800, cost: 12.50, status: 'approved', deliveryDays: 5 },
    { poNum: 'PO-202605-1236', supplierName: 'Textile Partners Ltd', materialName: 'Fabric Lining', qty: 300, cost: 8.75, status: 'pending', deliveryDays: 10 },
    { poNum: 'PO-202605-1237', supplierName: 'Chemical Corp', materialName: 'Industrial Adhesive', qty: 150, cost: 28.00, status: 'received', deliveryDays: 4 },
    { poNum: 'PO-202605-1238', supplierName: 'Foam Solutions', materialName: 'EVA Foam', qty: 200, cost: 15.50, status: 'approved', deliveryDays: 8 },
    { poNum: 'PO-202605-1239', supplierName: 'Accessories Inc', materialName: 'Shoe Laces', qty: 1000, cost: 2.25, status: 'received', deliveryDays: 3 }
  ]
  for (const po of poSeeds) {
    const supId = supIds[po.supplierName]
    const matId = matIds[po.materialName]
    if (supId && matId) {
      const totalVal = po.qty * po.cost
      const poRes = await pool.query(
        `INSERT INTO purchase_orders (po_number, supplier_id, status, total_amount, delivery_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::integer) RETURNING id`,
        [po.poNum, supId, po.status, totalVal, po.deliveryDays]
      )
      const poId = poRes.rows[0].id
      await pool.query(
        `INSERT INTO purchase_order_items (purchase_order_id, raw_material_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4)`,
        [poId, matId, po.qty, po.cost]
      )
    }
  }

  // Seed stock movements
  console.log('Seeding stock movements...')
  const movementSeeds = [
    { materialName: 'Premium Leather', qty: 200, type: 'purchase_receipt', refNum: 'PO-1234', loc: 'WH-A-01', operator: 'John Anderson' },
    { materialName: 'Rubber Sole Material', qty: -150, type: 'production_issue', refNum: 'PRD-5678', loc: 'WH-B-03', operator: 'Jane Smith' },
    { materialName: 'Fabric Lining', qty: 300, type: 'purchase_receipt', refNum: 'PO-1235', loc: 'WH-A-05', operator: 'Mike Johnson' },
    { materialName: 'Industrial Adhesive', qty: -25, type: 'production_issue', refNum: 'PRD-5679', loc: 'WH-C-02', operator: 'Sarah Williams' },
    { materialName: 'EVA Foam', qty: 120, type: 'purchase_receipt', refNum: 'PO-1236', loc: 'WH-B-01', operator: 'Tom Brown' },
    { materialName: 'Shoe Laces', qty: -500, type: 'production_issue', refNum: 'PRD-5680', loc: 'WH-A-03', operator: 'Lisa Davis' }
  ]
  for (const mov of movementSeeds) {
    const matId = matIds[mov.materialName]
    if (matId) {
      await pool.query(
        `INSERT INTO stock_movements (item_type, raw_material_id, quantity, movement_type, reference_number, warehouse_location, operator_name)
         VALUES ('raw_material', $1, $2, $3, $4, $5, $6)`,
        [matId, mov.qty, mov.type, mov.refNum, mov.loc, mov.operator]
      )
    }
  }

  // Seed quality templates
  console.log('Seeding quality templates...')
  const templatesSeed = [
    {
      name: 'Running Shoe Quality Inspection',
      productType: 'Running Shoe Pro',
      checkpoints: 12,
      checklist: [
        { id: 1, category: 'Upper Construction', item: 'Stitching quality and alignment', measurement: 'Visual inspection', passedCriteria: 'No loose threads, even stitch lines' },
        { id: 2, category: 'Upper Construction', item: 'Material integrity', measurement: 'Visual & tactile', passedCriteria: 'No tears, holes, or discoloration' },
        { id: 3, category: 'Upper Construction', item: 'Color consistency', measurement: 'Color matching card', passedCriteria: '±2% variance from standard' },
        { id: 4, category: 'Sole Assembly', item: 'Adhesion strength', measurement: 'Pull test 5kg', passedCriteria: 'No separation at 5kg force' },
        { id: 5, category: 'Sole Assembly', item: 'Sole alignment', measurement: 'Visual alignment jig', passedCriteria: 'Within ±1mm tolerance' },
        { id: 6, category: 'Dimensions', item: 'Length measurement', measurement: 'Digital caliper', passedCriteria: '±2mm from spec' },
        { id: 7, category: 'Dimensions', item: 'Width measurement', measurement: 'Digital caliper', passedCriteria: '±1.5mm from spec' },
        { id: 8, category: 'Dimensions', item: 'Heel height', measurement: 'Height gauge', passedCriteria: '±1mm from spec' },
        { id: 9, category: 'Components', item: 'Lace integrity', measurement: 'Visual inspection', passedCriteria: 'Uniform weave, no fraying' },
        { id: 10, category: 'Components', item: 'Insole placement', measurement: 'Visual & fit test', passedCriteria: 'Properly seated, no wrinkles' },
        { id: 11, category: 'Finishing', item: 'Surface cleanliness', measurement: 'Visual inspection', passedCriteria: 'No glue marks or stains' },
        { id: 12, category: 'Finishing', item: 'Label placement', measurement: 'Visual inspection', passedCriteria: 'Centered, legible, secure' }
      ]
    },
    {
      name: 'Casual Sneaker QC Checklist',
      productType: 'Casual Sneaker',
      checkpoints: 10,
      checklist: [
        { id: 1, category: 'Material', item: 'Leather quality', measurement: 'Visual & tactile', passedCriteria: 'Grade A leather, no blemishes' },
        { id: 2, category: 'Material', item: 'Canvas integrity', measurement: 'Visual inspection', passedCriteria: 'Tight weave, no loose threads' },
        { id: 3, category: 'Construction', item: 'Seam strength', measurement: 'Pull test 3kg', passedCriteria: 'No separation at 3kg force' },
        { id: 4, category: 'Construction', item: 'Eyelet alignment', measurement: 'Visual jig', passedCriteria: 'Symmetric placement' },
        { id: 5, category: 'Sole', item: 'Rubber vulcanization', measurement: 'Visual & flex test', passedCriteria: 'Proper bonding, no cracks' },
        { id: 6, category: 'Sole', item: 'Tread depth', measurement: 'Depth gauge', passedCriteria: '3.5mm ±0.3mm' },
        { id: 7, category: 'Size', item: 'US size accuracy', measurement: 'Size template', passedCriteria: 'Matches size template' },
        { id: 8, category: 'Aesthetics', item: 'Color matching', measurement: 'Pantone card', passedCriteria: 'Exact Pantone match' },
        { id: 9, category: 'Aesthetics', item: 'Logo placement', measurement: 'Template overlay', passedCriteria: 'Centered within 2mm' },
        { id: 10, category: 'Finishing', item: 'Packaging readiness', measurement: 'Visual checklist', passedCriteria: 'Clean, ready to pack' }
      ]
    },
    {
      name: 'Sports Trainer Inspection',
      productType: 'Sports Trainer',
      checkpoints: 14,
      checklist: [
        { id: 1, category: 'Performance', item: 'Cushioning response', measurement: 'Compression test', passedCriteria: '15-20mm compression at 50kg' },
        { id: 2, category: 'Performance', item: 'Arch support integrity', measurement: 'Pressure mapping', passedCriteria: 'Even pressure distribution' },
        { id: 3, category: 'Upper', item: 'Mesh breathability', measurement: 'Airflow meter', passedCriteria: '≥500 cm³/s' },
        { id: 4, category: 'Upper', item: 'Synthetic overlay bonding', measurement: 'Peel test', passedCriteria: '≥8N/cm peel strength' },
        { id: 5, category: 'Midsole', item: 'EVA foam density', measurement: 'Durometer test', passedCriteria: '45-50 Shore A' },
        { id: 6, category: 'Midsole', item: 'Heel counter stiffness', measurement: 'Flex test', passedCriteria: 'No deformation' },
        { id: 7, category: 'Outsole', item: 'Traction pattern', measurement: 'Visual template', passedCriteria: 'Pattern depth 4mm ±0.2mm' },
        { id: 8, category: 'Outsole', item: 'Flex grooves', measurement: 'Flex test 100 cycles', passedCriteria: 'No cracking' },
        { id: 9, category: 'Dimensions', item: 'Toe box height', measurement: 'Height gauge', passedCriteria: '18mm ±1mm' },
        { id: 10, category: 'Dimensions', item: 'Heel-toe drop', measurement: 'Drop gauge', passedCriteria: '8mm ±0.5mm' },
        { id: 11, category: 'Components', item: 'Lacing system', measurement: 'Function test', passedCriteria: 'Smooth operation, secure hold' },
        { id: 12, category: 'Components', item: 'Reflective elements', measurement: 'Light test', passedCriteria: 'Visual elements visible at 50m' },
        { id: 13, category: 'Weight', item: 'Single shoe weight', measurement: 'Digital scale', passedCriteria: '280g ±10g (size 9)' },
        { id: 14, category: 'Final', item: 'Overall appearance', measurement: 'Visual 360° check', passedCriteria: 'No defects visible' }
      ]
    }
  ]

  const templateIds = {}
  for (const t of templatesSeed) {
    const res = await pool.query(
      `INSERT INTO inspection_templates (name, product_type, checkpoints, checklist)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [t.name, t.productType, t.checkpoints, JSON.stringify(t.checklist)]
    )
    templateIds[t.name] = res.rows[0].id
  }

  console.log('Seeding quality inspections...')
  const b1Res = await pool.query("SELECT id FROM batches WHERE batch_number = 'BTH-001234'")
  const b2Res = await pool.query("SELECT id FROM batches WHERE batch_number = 'BTH-001235'")
  const b3Res = await pool.query("SELECT id FROM batches WHERE batch_number = 'BTH-001236'")

  if (b1Res.rowCount > 0 && b2Res.rowCount > 0 && b3Res.rowCount > 0) {
    const b1Id = b1Res.rows[0].id
    const b2Id = b2Res.rows[0].id
    const b3Id = b3Res.rows[0].id

    // BTH-001234 - completed inspection
    const ins1Res = await pool.query(
      `INSERT INTO quality_inspections (batch_id, template_id, inspected_quantity, passed_quantity, failed_quantity, defect_type, defect_classification, inspector_name, size_accuracy, stitching_quality, material_integrity, color_consistency, sole_adhesion, dimension_tolerance, notes, status, created_at)
       VALUES ($1, $2, 500, 485, 15, 'Stitching Defect', 'minor', 'Sarah Williams', 97.0, 8, 98.0, 99.0, 10, 1, 'Inspected batch BTH-001234. Minor stitching issues found.', 'completed', NOW() - INTERVAL '10 days') RETURNING id`,
      [b1Id, templateIds['Running Shoe Quality Inspection']]
    )
    const ins1Id = ins1Res.rows[0].id

    await pool.query(
      `INSERT INTO rework_orders (inspection_id, batch_id, defect_type, failed_quantity, priority, assigned_to, due_date, status, created_at, updated_at)
       VALUES ($1, $2, 'Stitching Defect', 15, 'medium', 'Production Team A', CURRENT_DATE - INTERVAL '8 days', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days')`,
      [ins1Id, b1Id]
    )

    await pool.query(
      `INSERT INTO quality_certificates (inspection_id, batch_id, certificate_no, inspected_by, inspection_date, expiry_date, passed_quantity, defect_rate, grade, status)
       VALUES ($1, $2, 'CERT-001234', 'Sarah Williams', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '355 days', 485, 3.0, 'A', 'issued')`,
      [ins1Id, b1Id]
    )

    // BTH-001235 - fully passed
    const ins2Res = await pool.query(
      `INSERT INTO quality_inspections (batch_id, template_id, inspected_quantity, passed_quantity, failed_quantity, defect_type, defect_classification, inspector_name, size_accuracy, stitching_quality, material_integrity, color_consistency, sole_adhesion, dimension_tolerance, notes, status, created_at)
       VALUES ($1, $2, 450, 442, 8, 'None', NULL, 'Mike Johnson', 98.2, 9, 99.0, 99.5, 11, 0, 'Batch meets all premium quality standards.', 'completed', NOW() - INTERVAL '8 days') RETURNING id`,
      [b2Id, templateIds['Casual Sneaker QC Checklist']]
    )
    const ins2Id = ins2Res.rows[0].id

    await pool.query(
      `INSERT INTO quality_certificates (inspection_id, batch_id, certificate_no, inspected_by, inspection_date, expiry_date, passed_quantity, defect_rate, grade, status)
       VALUES ($1, $2, 'CERT-001235', 'Mike Johnson', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '357 days', 442, 1.8, 'A+', 'issued')`,
      [ins2Id, b2Id]
    )

    // BTH-001236 - failed, rework needed
    const ins3Res = await pool.query(
      `INSERT INTO quality_inspections (batch_id, template_id, inspected_quantity, passed_quantity, failed_quantity, defect_type, defect_classification, inspector_name, size_accuracy, stitching_quality, material_integrity, color_consistency, sole_adhesion, dimension_tolerance, notes, status, created_at)
       VALUES ($1, $2, 400, 378, 22, 'Size Variance', 'major', 'Sarah Williams', 94.5, 7, 96.0, 95.0, 8, 2, 'Significant dimensions deviations found. Batch placed on hold.', 'rework', NOW() - INTERVAL '5 days') RETURNING id`,
      [b3Id, templateIds['Running Shoe Quality Inspection']]
    )
    const ins3Id = ins3Res.rows[0].id

    await pool.query(
      `INSERT INTO rework_orders (inspection_id, batch_id, defect_type, failed_quantity, priority, assigned_to, due_date, status, created_at)
       VALUES ($1, $2, 'Size Variance', 22, 'high', 'Production Team C', CURRENT_DATE + INTERVAL '2 days', 'pending', NOW() - INTERVAL '5 days')`,
      [ins3Id, b3Id]
    )
  }

  console.log('Seeding quality officer dashboard metrics...')
  const qaMetrics = [
    { title: 'Total Inspections', value: '3', subtitle: 'inspections logged', trend: 'all time', color: 'blue', order: 0 },
    { title: 'Avg Pass Rate', value: '96.6%', subtitle: 'average run quality', trend: 'excellent', color: 'emerald', order: 1 },
    { title: 'Pending Rework', value: '1', subtitle: 'batches requiring rework', trend: 'action required', color: 'amber', order: 2 },
    { title: 'Defect Rate', value: '3.4%', subtitle: 'average defect rate', trend: 'optimal control', color: 'slate', order: 3 }
  ]
  for (const m of qaMetrics) {
    await pool.query(
      `INSERT INTO dashboard_metrics (role, title, value, subtitle, trend, color, sort_order)
       VALUES ('quality_officer', $1, $2, $3, $4, $5, $6)`,
      [m.title, m.value, m.subtitle, m.trend, m.color, m.order]
    )
  }

  const qaCharts = [
    { key: 'trend', label: 'Jan', val: 95.5, sec: 4.5 },
    { key: 'trend', label: 'Feb', val: 96.2, sec: 3.8 },
    { key: 'trend', label: 'Mar', val: 97.0, sec: 3.0 },
    { key: 'trend', label: 'Apr', val: 96.8, sec: 3.2 },
    { key: 'trend', label: 'May', val: 96.6, sec: 3.4 }
  ]
  let qaChartOrder = 0
  for (const c of qaCharts) {
    await pool.query(
      `INSERT INTO dashboard_chart_points (role, chart_key, label, value, secondary_value, sort_order)
       VALUES ('quality_officer', $1, $2, $3, $4, $5)`,
      [c.key, c.label, c.val, c.sec, qaChartOrder++]
    )
  }

  const qaRecords = [
    { id: 'INS-001', batchId: 'BTH-001234', product: 'Running Shoe Pro', passRate: '97.0%', defectType: 'Stitching Defect', status: 'Completed' },
    { id: 'INS-002', batchId: 'BTH-001235', product: 'Casual Sneaker', passRate: '98.2%', defectType: 'None', status: 'Completed' },
    { id: 'INS-003', batchId: 'BTH-001236', product: 'Walking Comfort', passRate: '94.5%', defectType: 'Size Variance', status: 'Rework Required' }
  ]
  let qaRecordOrder = 0
  for (const r of qaRecords) {
    await pool.query(
      `INSERT INTO dashboard_records (role, record_type, payload, sort_order)
       VALUES ('quality_officer', 'inspection_results', $1, $2)`,
      [JSON.stringify(r), qaRecordOrder++]
    )
  }

  console.log('Seeding customer database...')
  const customerSeeds = [
    { name: 'Retail Chain A', email: 'orders@retailchain-a.com', phone: '+1 555-0301', address: '100 Retail Way, Chicago, IL 60611' },
    { name: 'Sports Store B', email: 'purchasing@sportsstore-b.com', phone: '+1 555-0302', address: '200 Athletics Blvd, Denver, CO 80202' },
    { name: 'Online Store C', email: 'logistics@onlinestore-c.com', phone: '+1 555-0303', address: '300 Web Commerce Rd, Seattle, WA 98101' },
    { name: 'Distribution Hub D', email: 'wholesale@dist-hub-d.com', phone: '+1 555-0304', address: '400 Logistics Pkwy, Dallas, TX 75201' }
  ]
  const custIds = {}
  for (const c of customerSeeds) {
    const res = await pool.query(
      `INSERT INTO customers (name, email, phone, address)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [c.name, c.email, c.phone, c.address]
    )
    custIds[c.name] = res.rows[0].id
  }

  console.log('Seeding customer orders...')
  const fgRSP = fgIds['RSP-001']
  const fgCS = fgIds['CS-002']
  const fgST = fgIds['ST-003']
  const fgWC = fgIds['WC-004']

  const orderSeeds = [
    { orderNum: 'ORD-1001', customerName: 'Retail Chain A', fgId: fgRSP, qty: 100, price: 68.25, status: 'pending', deliveryDays: 7, priority: 'medium', addr: '100 Retail Way, Chicago, IL 60611', notes: 'Standard wholesale replenishment.' },
    { orderNum: 'ORD-1002', customerName: 'Sports Store B', fgId: fgCS, qty: 150, price: 58.12, status: 'processing', deliveryDays: 5, priority: 'high', addr: '200 Athletics Blvd, Denver, CO 80202', notes: 'Express shipment requested.' },
    { orderNum: 'ORD-1003', customerName: 'Online Store C', fgId: fgST, qty: 50, price: 78.00, status: 'shipped', deliveryDays: 3, priority: 'low', addr: '300 Web Commerce Rd, Seattle, WA 98101', notes: 'Standard ground shipping.' },
    { orderNum: 'ORD-1004', customerName: 'Distribution Hub D', fgId: fgWC, qty: 200, price: 61.88, status: 'delivered', deliveryDays: 2, priority: 'medium', addr: '400 Logistics Pkwy, Dallas, TX 75201', notes: 'Deliver to Loading Dock 4.' }
  ]

  for (const o of orderSeeds) {
    if (o.fgId) {
      const orderRes = await pool.query(
        `INSERT INTO orders (order_number, customer_id, status, delivery_date, priority, shipping_address, notes)
         VALUES ($1, $2, $3, CURRENT_DATE + $4::integer, $5, $6, $7) RETURNING id`,
        [o.orderNum, custIds[o.customerName], o.status, o.deliveryDays, o.priority, o.addr, o.notes]
      )
      const orderId = orderRes.rows[0].id

      await pool.query(
        `INSERT INTO order_items (order_id, finished_good_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, o.fgId, o.qty, o.price]
      )

      // Generate invoice
      const invoiceNo = `INV-202605-${o.orderNum.split('-')[1]}`
      const totalAmount = o.qty * o.price
      await pool.query(
        `INSERT INTO invoices (order_id, invoice_number, amount_due, status, due_date)
         VALUES ($1, $2, $3, $4, CURRENT_DATE + $5::integer)`,
        [orderId, invoiceNo, totalAmount, o.status === 'delivered' ? 'paid' : 'unpaid', o.deliveryDays + 30]
      )

      // Generate shipment for shipped/delivered orders
      if (o.status === 'shipped' || o.status === 'delivered') {
        await pool.query(
          `INSERT INTO shipments (order_id, carrier, tracking_number, status, shipped_at, delivered_at)
           VALUES ($1, 'FedEx', $2, $3, NOW() - INTERVAL '3 days', $4)`,
          [orderId, `TRK-FedEx-${o.orderNum.split('-')[1]}`, o.status === 'delivered' ? 'delivered' : 'in_transit', o.status === 'delivered' ? 'NOW()' : null]
        )
      }
    }
  }

  console.log('Seeding sales staff dashboard metrics...')
  const salesMetrics = [
    { title: 'Total Sales Orders', value: '4', subtitle: 'active customer requests', trend: 'steady demand', color: 'blue', order: 0 },
    { title: 'Total Revenue', value: '$31,733.00', subtitle: 'gross billing amount', trend: 'steady growth', color: 'emerald', order: 1 },
    { title: 'Active Backorders', value: '0', subtitle: 'unfulfilled due to stock', trend: 'optimal stock', color: 'amber', order: 2 },
    { title: 'Fulfillment Rate', value: '100%', subtitle: 'on-time shipments', trend: 'excellent', color: 'slate', order: 3 }
  ]
  for (const m of salesMetrics) {
    await pool.query(
      `INSERT INTO dashboard_metrics (role, title, value, subtitle, trend, color, sort_order)
       VALUES ('sales_staff', $1, $2, $3, $4, $5, $6)`,
      [m.title, m.value, m.subtitle, m.trend, m.color, m.order]
    )
  }

  const salesCharts = [
    { key: 'trend', label: 'Jan', val: 12000, sec: null },
    { key: 'trend', label: 'Feb', val: 15400, sec: null },
    { key: 'trend', label: 'Mar', val: 19100, sec: null },
    { key: 'trend', label: 'Apr', val: 24500, sec: null },
    { key: 'trend', label: 'May', val: 31733, sec: null }
  ]
  let salesChartOrder = 0
  for (const c of salesCharts) {
    await pool.query(
      `INSERT INTO dashboard_chart_points (role, chart_key, label, value, secondary_value, sort_order)
       VALUES ('sales_staff', $1, $2, $3, $4, $5)`,
      [c.key, c.label, c.val, c.sec, salesChartOrder++]
    )
  }

  const salesRecords = [
    { id: 'ORD-1001', customer: 'Retail Chain A', product: 'Running Shoe Pro', quantity: 100, status: 'Pending' },
    { id: 'ORD-1002', customer: 'Sports Store B', product: 'Casual Sneaker', quantity: 150, status: 'Processing' },
    { id: 'ORD-1003', customer: 'Online Store C', product: 'Sports Trainer', quantity: 50, status: 'Shipped' }
  ]
  let salesRecordOrder = 0
  for (const r of salesRecords) {
    await pool.query(
      `INSERT INTO dashboard_records (role, record_type, payload, sort_order)
       VALUES ('sales_staff', 'pending_orders', $1, $2)`,
      [JSON.stringify(r), salesRecordOrder++]
    )
  }

  console.log('Production, Quality and Sales data seeded.')
} // end if (count === 0)
} // end runMigrations

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  await runMigrations()
  await pool.end()
  console.log('Database migration and seeding completed successfully.')
}
