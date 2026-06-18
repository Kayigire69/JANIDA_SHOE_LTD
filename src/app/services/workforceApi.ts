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

export const workforceApi = {
  createEmployee: (body: unknown) => request<{ id: string }>("/workforce/employees", { method: "POST", body: JSON.stringify(body) }),
  listEmployees: (params?: Record<string, string>) => request<{ employees: any[] }>(`/workforce/employees?${new URLSearchParams(params || {}).toString()}`),
  getEmployee: (id: string) => request<any>(`/workforce/employees/${id}`),
  updateEmployee: (id: string, body: unknown) => request<any>(`/workforce/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteEmployee: (id: string) => request<{ message: string }>(`/workforce/employees/${id}`, { method: "DELETE" }),
  departments: () => request<{ departments: string[] }>("/workforce/employees/departments"),

  createTask: (body: unknown) => request<any>("/workforce/tasks", { method: "POST", body: JSON.stringify(body) }),
  listTasks: (params?: Record<string, string>) => request<{ tasks: any[] }>(`/workforce/tasks?${new URLSearchParams(params || {}).toString()}`),
  updateTaskStatus: (id: string, status: string) => request<{ message: string }>(`/workforce/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  recordAttendance: (body: unknown) => request<any>("/workforce/attendance", { method: "POST", body: JSON.stringify(body) }),
  getAttendance: (params: Record<string, string>) => request<{ records: any[] }>(`/workforce/attendance?${new URLSearchParams(params).toString()}`),

  createReview: (body: unknown) => request<any>("/workforce/performance", { method: "POST", body: JSON.stringify(body) }),
  listAllReviews: () => request<{ reviews: any[] }>("/workforce/performance"),
  getReviews: (id: string) => request<{ reviews: any[] }>(`/workforce/performance/${id}`),

  requestLeave: (body: unknown) => request<any>("/workforce/leave", { method: "POST", body: JSON.stringify(body) }),
  listLeaves: (params?: Record<string, string>) => request<{ leaves: any[] }>(`/workforce/leave?${new URLSearchParams(params || {}).toString()}`),
  updateLeaveStatus: (id: string, status: string) => request<{ message: string }>(`/workforce/leave/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  laborCosts: (params: Record<string, string>) => request<any>(`/workforce/labor-costs?${new URLSearchParams(params).toString()}`),
};
