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

export const securityApi = {
  // Audit logs
  listAuditLogs: (params?: Record<string, string>) =>
    request<{ logs: any[]; pagination: any }>(`/security/audit-logs?${new URLSearchParams(params || {}).toString()}`),
  getAuditActions: () => request<{ actions: string[] }>("/security/audit-actions"),
  exportAuditTrail: (params?: Record<string, string>) =>
    request<{ logs: any[] }>(`/security/audit-export?${new URLSearchParams(params || {}).toString()}`),

  // Login activity
  listLoginActivity: (params?: Record<string, string>) =>
    request<{ activities: any[]; pagination: any }>(`/security/login-activity?${new URLSearchParams(params || {}).toString()}`),

  // Active sessions
  listActiveSessions: (userId?: string) =>
    request<{ sessions: any[] }>(`/security/sessions?${userId ? new URLSearchParams({ userId }).toString() : ""}`),
  revokeSession: (id: string) =>
    request<{ message: string }>(`/security/sessions/${id}/revoke`, { method: "PATCH" }),

  // Security alerts
  listSecurityAlerts: (params?: Record<string, string>) =>
    request<{ alerts: any[]; pagination: any }>(`/security/alerts?${new URLSearchParams(params || {}).toString()}`),
  createSecurityAlert: (body: unknown) =>
    request<any>("/security/alerts", { method: "POST", body: JSON.stringify(body) }),
  updateAlertStatus: (id: string, status: string) =>
    request<any>(`/security/alerts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Data retention
  listRetentionPolicies: () => request<{ policies: any[] }>("/security/retention-policies"),
  updateRetentionPolicy: (id: string, body: unknown) =>
    request<any>(`/security/retention-policies/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  // Metrics
  getSecurityMetrics: () => request<any>("/security/metrics"),
};
