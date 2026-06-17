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

export interface BatchMaterial {
  id: string;
  batch_id: string;
  raw_material_id: string;
  quantity_used: number;
  material_batch_number: string;
  material_name: string;
  unit: string;
}

export interface BatchParameter {
  id: string;
  batch_id: string;
  parameter_name: string;
  parameter_value: string;
  unit: string;
  recorded_at: string;
}

export interface BatchRecall {
  id: string;
  batch_id: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "initiated" | "in_progress" | "resolved";
  affected_units: number;
  actions_taken?: string;
  initiated_by_name?: string;
  initiated_at: string;
  resolved_at?: string;
  batch_number?: string;
  shoe_model_name?: string;
}

export interface Batch {
  id: string;
  batch_number: string;
  plan_id: string | null;
  shoe_model_id: string;
  status: "in_progress" | "completed" | "quality_hold";
  quantity: number;
  location: string;
  operator_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  shoe_model_name: string;
  plan_code: string | null;
  operator_name: string | null;
  rawMaterials?: BatchMaterial[];
  parameters?: BatchParameter[];
  recalls?: BatchRecall[];
}

export interface CreateBatchInput {
  planId?: string;
  shoeModelId: string;
  quantity: number;
  operatorId: string;
  rawMaterialId: string;
  materialBatchNumber: string;
  temperature?: string;
  pressure?: string;
  time?: string;
}

export interface CreateRecallInput {
  batchId: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
}

export const batchApi = {
  getBatches: () => request<Batch[]>("/batch"),

  getBatchDetails: (id: string) => request<Batch>(`/batch/${id}`),

  getBatchByNumber: (batchNumber: string) => request<Batch>(`/batch/number/${batchNumber}`),

  createBatch: (data: CreateBatchInput) =>
    request<Batch>("/batch", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBatchStatus: (id: string, status: "in_progress" | "completed" | "quality_hold") =>
    request<{ message: string }>(`/batch/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateBatchLocation: (id: string, location: string) =>
    request<{ message: string }>(`/batch/${id}/location`, {
      method: "PATCH",
      body: JSON.stringify({ location }),
    }),

  createRecall: (data: CreateRecallInput) =>
    request<BatchRecall>("/batch/recall", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRecalls: () => request<BatchRecall[]>("/batch/recall/list"),

  updateRecall: (recallId: string, status: "initiated" | "in_progress" | "resolved", actionsTaken?: string) =>
    request<{ message: string }>(`/batch/recall/${recallId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, actionsTaken }),
    }),
};
