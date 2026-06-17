const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const salesApi = {
  // Customers
  getCustomers: () => request<any[]>('/api/sales/customers'),
  createCustomer: (data: any) => request<any>('/api/sales/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Orders
  getOrders: (status?: string) => request<any[]>(`/api/sales/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  createOrder: (data: any) => request<any>('/api/sales/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string, shipmentData?: { carrier?: string; trackingNumber?: string }) =>
    request<any>(`/api/sales/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...shipmentData }) }),

  // Backorders
  getBackorders: () => request<any[]>('/api/sales/backorders'),
  resolveBackorder: (id: string) => request<any>(`/api/sales/backorders/${id}/resolve`, { method: 'PATCH' }),

  // Invoices
  getInvoices: () => request<any[]>('/api/sales/invoices'),
  payInvoice: (id: string) => request<any>(`/api/sales/invoices/${id}/pay`, { method: 'PATCH' }),
};
