const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export interface Checkpoint {
  id: number;
  category: string;
  item: string;
  measurement: string;
  passedCriteria: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  product_type: string;
  checkpoints: number;
  checklist: Checkpoint[];
  created_at: string;
  updated_at: string;
}

export interface CreateInspectionTemplateInput {
  name: string;
  productType: string;
  checkpoints: number;
  checklist: Checkpoint[];
}

export interface QualityInspection {
  id: string;
  batch_id: string;
  template_id: string | null;
  inspected_quantity: number;
  passed_quantity: number;
  failed_quantity: number;
  defect_type: string | null;
  defect_classification: "minor" | "major" | "critical" | null;
  inspector_name: string;
  size_accuracy: number;
  stitching_quality: number;
  material_integrity: number;
  color_consistency: number;
  sole_adhesion: number;
  dimension_tolerance: number;
  notes: string;
  status: "completed" | "rework";
  created_at: string;
  batch_number?: string;
  shoe_model_name?: string;
  template_name?: string;
}

export interface CreateInspectionInput {
  batchId: string;
  templateId?: string;
  inspectedQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  defectType?: string;
  defectClassification?: "minor" | "major" | "critical";
  inspectorName: string;
  sizeAccuracy?: number;
  stitchingQuality?: number;
  materialIntegrity?: number;
  colorConsistency?: number;
  soleAdhesion?: number;
  dimensionTolerance?: number;
  notes?: string;
  status?: "completed" | "rework";
}

export interface ReworkOrder {
  id: string;
  inspection_id: string;
  batch_id: string;
  defect_type: string;
  failed_quantity: number;
  priority: "low" | "medium" | "high";
  assigned_to: string;
  due_date: string;
  status: "pending" | "in-progress" | "completed";
  created_at: string;
  updated_at: string;
  batch_number?: string;
  shoe_model_name?: string;
  passed_quantity?: number;
  inspected_quantity?: number;
}

export interface QualityCertificate {
  id: string;
  inspection_id: string;
  batch_id: string;
  certificate_no: string;
  inspected_by: string;
  inspection_date: string;
  expiry_date: string;
  passed_quantity: number;
  defect_rate: number;
  grade: string;
  status: "issued" | "pending" | "revoked";
  created_at: string;
  batch_number?: string;
  shoe_model_name?: string;
}

export interface DefectAnalytics {
  totalInspected: number;
  totalFailed: number;
  defectsByCategory: Array<{ name: string; value: number }>;
}

export const qualityApi = {
  getTemplates: () => request<InspectionTemplate[]>("/quality/templates"),

  createTemplate: (data: CreateInspectionTemplateInput) =>
    request<InspectionTemplate>("/quality/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInspections: () => request<QualityInspection[]>("/quality/inspections"),

  createInspection: (data: CreateInspectionInput) =>
    request<QualityInspection>("/quality/inspections", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getReworkOrders: () => request<ReworkOrder[]>("/quality/rework"),

  updateReworkOrderStatus: (id: string, status: "pending" | "in-progress" | "completed") =>
    request<ReworkOrder>(`/quality/rework/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getCertificates: () => request<QualityCertificate[]>("/quality/certificates"),

  getAnalytics: () => request<DefectAnalytics>("/quality/analytics"),
};
