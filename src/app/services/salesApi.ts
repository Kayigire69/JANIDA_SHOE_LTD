const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  getCustomers: () => request<any[]>('/sales/customers'),
  createCustomer: (data: any) => request<any>('/sales/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request<any>(`/sales/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request<any>(`/sales/customers/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (status?: string) => request<any[]>(`/sales/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
  getOrderById: (id: string) => request<any>(`/sales/orders/${id}`),
  createOrder: (data: any) => request<any>('/sales/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string, shipmentData?: { carrier?: string; trackingNumber?: string }) =>
    request<any>(`/sales/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...shipmentData }) }),
  updateOrderPriority: (id: string, priority: string) =>
    request<any>(`/sales/orders/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),

  // Shipments / Delivery
  getShipments: () => request<any[]>('/sales/shipments').catch(() => [] as any[]),

  // Backorders
  getBackorders: () => request<any[]>('/sales/backorders'),
  resolveBackorder: (id: string) => request<any>(`/sales/backorders/${id}/resolve`, { method: 'PATCH' }),

  // Invoices
  getInvoices: () => request<any[]>('/sales/invoices'),
  payInvoice: (id: string) => request<any>(`/sales/invoices/${id}/pay`, { method: 'PATCH' }),
};
