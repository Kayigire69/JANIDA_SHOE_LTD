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

export interface PlanningData {
  shoeModels: Array<{ id: string; name: string }>;
  machines: Array<{ id: string; code: string; name: string; status: string }>;
  workers: Array<{ id: string; worker_id: string; name: string; role: string; department: string }>;
  materials: Array<{ id: string; code: string; name: string; available: number; unit: string; minimum: number; maximum: number; unitCost: number }>;
  boms: Record<string, Array<{ name: string; qtyPerPair: number }>>;
}

export interface ScheduleData {
  tasks: Array<{ id: string; name: string; start: number; duration: number; status: string; machine: string }>;
  shifts: Record<string, { name: string; time: string; workers: string[] }>;
  conflicts: Array<{ shift: string; issue: string; severity: string }>;
}

export interface OrdersData {
  orders: Array<{ id: string; plan_code: string; product: string; quantity: number; completed: number; deadline: string; status: string; priority: string }>;
  metrics: {
    totalOrders: number;
    completedCount: number;
    inProgressCount: number;
    plannedCount: number;
  };
}

export interface HistoryData {
  history: Array<{ id: string; product: string; size: string; quantity: number; completed: number; startDate: string; endDate: string; status: string; efficiency: number; defectRate: number; operator: string; machine: string }>;
  metrics: {
    totalCompleted: number;
    avgEfficiency: string;
    avgDefectRate: string;
    totalBatches: number;
  };
}

export const productionApi = {
  getPlanningData: () => request<PlanningData>("/production/planning-data"),
  
  createPlan: (data: {
    shoeModelId: string;
    size: string;
    targetQuantity: number;
    deadline: string;
    machineId: string;
    workerIds: string[];
  }) => request<any>("/production/plans", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  getSchedule: () => request<ScheduleData>("/production/schedule"),

  optimizeSchedule: () => request<{ message: string }>("/production/schedule/optimize", {
    method: "POST",
  }),

  updateShiftWorkers: (data: { shiftName: string; workerIds: string[] }) =>
    request<{ message: string }>("/production/schedule/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOrders: () => request<OrdersData>("/production/orders"),

  updateOrderStatus: (id: string, status: string, completedQuantity?: number) =>
    request<{ message: string }>(`/production/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, completedQuantity }),
    }),

  getHistory: () => request<HistoryData>("/production/history"),

  // Machine management
  listMachines: () => request<{ machines: any[] }>("/production/machines"),
  createMachine: (data: { code: string; name: string; status?: string }) =>
    request<any>("/production/machines", { method: "POST", body: JSON.stringify(data) }),
  updateMachine: (id: string, data: { name?: string; status?: string }) =>
    request<any>(`/production/machines/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteMachine: (id: string) =>
    request<{ message: string }>(`/production/machines/${id}`, { method: "DELETE" }),

  // Production worker management
  listProductionWorkers: () => request<{ workers: any[] }>("/production/workers"),
  createProductionWorker: (data: { workerId: string; name: string; role?: string; department?: string; email: string; phone?: string }) =>
    request<any>("/production/workers", { method: "POST", body: JSON.stringify(data) }),
  updateProductionWorker: (id: string, data: { name?: string; role?: string; department?: string; phone?: string; status?: string }) =>
    request<any>(`/production/workers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProductionWorker: (id: string) =>
    request<{ message: string }>(`/production/workers/${id}`, { method: "DELETE" }),
};
