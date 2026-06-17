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

export const adminApi = {
  // System overview
  getSystemOverview: () => request<any>("/admin/overview"),

  // Users
  listUsers: (params?: Record<string, string>) =>
    request<{ users: any[]; pagination: any }>(`/admin/users?${new URLSearchParams(params || {}).toString()}`),
  updateUserRole: (id: string, body: unknown) =>
    request<any>(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify(body) }),
  toggleUserLock: (id: string, lock: boolean) =>
    request<any>(`/admin/users/${id}/lock`, { method: "PATCH", body: JSON.stringify({ lock }) }),

  // Products
  listProducts: (params?: Record<string, string>) =>
    request<{ products: any[]; pagination: any }>(`/admin/products?${new URLSearchParams(params || {}).toString()}`),
  createProduct: (name: string) =>
    request<any>("/admin/products", { method: "POST", body: JSON.stringify({ name }) }),
  updateProduct: (id: string, name: string) =>
    request<any>(`/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, { method: "DELETE" }),

  // BOM
  getBomForProduct: (productId: string) =>
    request<{ items: any[] }>(`/admin/products/${productId}/bom`),
  addBomItem: (productId: string, rawMaterialId: string, quantityPerPair: number) =>
    request<any>(`/admin/products/${productId}/bom`, { method: "POST", body: JSON.stringify({ rawMaterialId, quantityPerPair }) }),
  removeBomItem: (bomId: string) =>
    request<{ message: string }>(`/admin/bom/${bomId}`, { method: "DELETE" }),

  // Production lines
  listProductionLines: () => request<{ lines: any[] }>("/admin/production-lines"),
  createProductionLine: (body: unknown) =>
    request<any>("/admin/production-lines", { method: "POST", body: JSON.stringify(body) }),
  updateProductionLine: (id: string, body: unknown) =>
    request<any>(`/admin/production-lines/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProductionLine: (id: string) =>
    request<{ message: string }>(`/admin/production-lines/${id}`, { method: "DELETE" }),
  getLineMachines: (lineId: string) =>
    request<{ machines: any[] }>(`/admin/production-lines/${lineId}/machines`),
  addMachineToLine: (lineId: string, machineId: string, sequenceOrder: number) =>
    request<any>(`/admin/production-lines/${lineId}/machines`, { method: "POST", body: JSON.stringify({ machineId, sequenceOrder }) }),
  removeMachineFromLine: (lineId: string, machineAssignmentId: string) =>
    request<{ message: string }>(`/admin/production-lines/${lineId}/machines/${machineAssignmentId}`, { method: "DELETE" }),

  // Quality standards
  listQualityStandards: () => request<{ standards: any[] }>("/admin/quality-standards"),
  createQualityStandard: (body: unknown) =>
    request<any>("/admin/quality-standards", { method: "POST", body: JSON.stringify(body) }),
  updateQualityStandard: (id: string, body: unknown) =>
    request<any>(`/admin/quality-standards/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteQualityStandard: (id: string) =>
    request<{ message: string }>(`/admin/quality-standards/${id}`, { method: "DELETE" }),

  // System settings
  listSystemSettings: () => request<{ settings: any[] }>("/admin/settings"),
  updateSystemSetting: (id: string, settingValue: string) =>
    request<any>(`/admin/settings/${id}`, { method: "PATCH", body: JSON.stringify({ settingValue }) }),

  // Backups
  listBackups: () => request<{ backups: any[] }>("/admin/backups"),
  createBackup: (backupName: string, backupType: string) =>
    request<any>("/admin/backups", { method: "POST", body: JSON.stringify({ backupName, backupType }) }),
  completeBackup: (id: string, body: unknown) =>
    request<any>(`/admin/backups/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBackup: (id: string) =>
    request<{ message: string }>(`/admin/backups/${id}`, { method: "DELETE" }),

  // Lookup data
  listRawMaterials: () => request<{ materials: any[] }>("/admin/raw-materials"),
  listMachines: () => request<{ machines: any[] }>("/admin/machines"),
  listSupervisors: () => request<{ employees: any[] }>("/admin/supervisors"),
};
