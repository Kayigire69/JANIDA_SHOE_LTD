const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const roleLabels: Record<string, string> = {
  pending: "Pending Approval",
  production_manager: "Production Manager",
  inventory_manager: "Inventory Manager",
  quality_officer: "Quality Officer",
  sales_staff: "Sales Staff",
  supervisor: "Supervisor",
  administrator: "Administrator",
};

export const dashboardPaths: Record<string, string> = {
  pending: "/pending-approval",
  production_manager: "/dashboard/production",
  inventory_manager: "/dashboard/inventory",
  quality_officer: "/dashboard/quality",
  sales_staff: "/dashboard/sales",
  supervisor: "/dashboard/supervisor",
  administrator: "/dashboard/admin",
};

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

export const authApi = {
  register: (body: unknown) => request<{ message: string; user: any }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  verifyEmail: (body: unknown) => request<{ message: string }>("/auth/verify-email", { method: "POST", body: JSON.stringify(body) }),
  resendVerification: (body: unknown) => request<{ message: string }>("/auth/resend-verification", { method: "POST", body: JSON.stringify(body) }),
  login: (body: unknown) => request<{ token?: string; user?: any; mfaRequired?: boolean; message?: string; expiresAt?: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (body: unknown) => request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body: unknown) => request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  profile: () => request<{ user: any }>("/auth/profile"),
  updateProfile: (body: unknown) => request<{ user: any }>("/auth/profile", { method: "PATCH", body: JSON.stringify(body) }),
  changePassword: (body: unknown) => request<{ message: string }>("/auth/change-password", { method: "PATCH", body: JSON.stringify(body) }),
  beginMfaSetup: () => request<{ secret: string; otpauthUrl: string }>("/auth/mfa/setup", { method: "POST" }),
  verifyMfaSetup: (body: unknown) => request<{ message: string }>("/auth/mfa/verify", { method: "POST", body: JSON.stringify(body) }),
  sessions: () => request<{ sessions: any[] }>("/auth/sessions"),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
};

export function storeAuthSession(token: string, user: any) {
  localStorage.setItem("authToken", token);
  localStorage.setItem("authUser", JSON.stringify(user));
  localStorage.setItem("userRole", roleLabels[user.role] || user.role);
}

export function clearAuthSession() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("userRole");
}
