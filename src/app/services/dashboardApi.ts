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

export const dashboardApi = {
  getDashboard: () => request<any>("/dashboard"),
  getNotifications: () => request<{ notifications: any[] }>("/dashboard/notifications"),
  markNotificationRead: (id: string) => request<{ message: string }>(`/dashboard/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request<{ message: string }>("/dashboard/notifications/read-all", { method: "PATCH" }),
  deleteNotification: (id: string) => request<{ message: string }>(`/dashboard/notifications/${id}`, { method: "DELETE" }),
};
