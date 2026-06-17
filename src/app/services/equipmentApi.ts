const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

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
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const equipmentApi = {
  createEquipment: (body: unknown) => request<any>("/equipment", { method: "POST", body: JSON.stringify(body) }),
  listEquipment: (params?: Record<string, string>) => request<{ equipment: any[] }>(`/equipment?${new URLSearchParams(params || {}).toString()}`),
  getEquipment: (id: string) => request<any>(`/equipment/${id}`),
  updateEquipment: (id: string, body: unknown) => request<any>(`/equipment/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteEquipment: (id: string) => request<{ message: string }>(`/equipment/${id}`, { method: "DELETE" }),
  types: () => request<{ types: string[] }>("/equipment/types"),
  departments: () => request<{ departments: string[] }>("/equipment/departments"),
  metrics: () => request<any>("/equipment/metrics"),

  createMaintenance: (id: string, body: unknown) => request<any>(`/equipment/${id}/maintenance`, { method: "POST", body: JSON.stringify(body) }),
  listMaintenance: (id: string) => request<{ maintenance: any[] }>(`/equipment/${id}/maintenance`),
  updateMaintenanceStatus: (id: string, status: string) => request<any>(`/equipment/maintenance/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  createDowntime: (id: string, body: unknown) => request<any>(`/equipment/${id}/downtime`, { method: "POST", body: JSON.stringify(body) }),
  listDowntime: (id: string) => request<{ downtime: any[] }>(`/equipment/${id}/downtime`),

  createCalibration: (id: string, body: unknown) => request<any>(`/equipment/${id}/calibration`, { method: "POST", body: JSON.stringify(body) }),
  listCalibration: (id: string) => request<{ calibrations: any[] }>(`/equipment/${id}/calibration`),

  createSparePart: (body: unknown) => request<any>("/equipment/spare-parts", { method: "POST", body: JSON.stringify(body) }),
  listSpareParts: (params?: Record<string, string>) => request<{ parts: any[] }>(`/equipment/spare-parts?${new URLSearchParams(params || {}).toString()}`),
  updateSparePart: (id: string, body: unknown) => request<any>(`/equipment/spare-parts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteSparePart: (id: string) => request<{ message: string }>(`/equipment/spare-parts/${id}`, { method: "DELETE" }),
};
