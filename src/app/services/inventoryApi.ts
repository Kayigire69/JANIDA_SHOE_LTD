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
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

export interface RawMaterial {
  id: string;
  idCode: string;
  name: string;
  quantity: number;
  unit: string;
  minimum: number;
  maximum: number;
  unitCost: number;
  supplier: string | null;
  warehouseLocation: string | null;
  lastRestocked: string | null;
  status: "normal" | "low" | "critical";
}

export interface FinishedGood {
  id: string;
  product: string;
  sku: string;
  stock: number;
  target: number;
  minimum: number;
  warehouseLocation: string;
  unitCost: number;
  lastProduced: string | null;
  status: "normal" | "low" | "critical" | "excess";
}

export interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  leadTime: number;
  rating: number;
  ordersCompleted: number;
  onTimeDelivery: number;
  status: string;
}

export interface Warehouse {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "pending" | "approved" | "received" | "cancelled";
  totalValue: number;
  orderDate: string;
  deliveryDate: string;
  notes: string | null;
  material: string;
  materialCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface StockMovement {
  id: string;
  type: "in" | "out";
  material: string;
  quantity: number;
  unit: string;
  reference: string;
  date: string;
  operator: string;
  location: string;
  cost: number | null;
}

export interface CreateMaterialInput {
  materialCode: string;
  name: string;
  quantity?: number;
  unit: string;
  minimum?: number;
  maximum?: number;
  unitCost?: number;
  supplier?: string;
  warehouseLocation?: string;
}

export interface CreateSupplierInput {
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTime?: number;
}

export interface CreatePOInput {
  supplierId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  deliveryDate?: string;
  notes?: string;
}

export interface RecordMovementInput {
  itemType: "raw_material" | "finished_good";
  rawMaterialId?: string;
  finishedGoodId?: string;
  quantity: number;
  type: "in" | "out";
  referenceNumber?: string;
  warehouseLocation?: string;
}

export const inventoryApi = {
  getRawMaterials: () => request<RawMaterial[]>("/inventory/materials"),
  
  createRawMaterial: (data: CreateMaterialInput) =>
    request<RawMaterial>("/inventory/materials", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getFinishedGoods: () => request<FinishedGood[]>("/inventory/finished-goods"),

  getSuppliers: () => request<Supplier[]>("/inventory/suppliers"),

  createSupplier: (data: CreateSupplierInput) =>
    request<Supplier>("/inventory/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getWarehouses: async (): Promise<Warehouse[]> => {
    try {
      const data = await request<Warehouse[]>("/inventory/warehouses");
      return data;
    } catch {
      // Fallback to local storage if API doesn't exist
      const local = localStorage.getItem("warehouses");
      if (local) return JSON.parse(local);
      const defaultWh = [
        { id: "WH-A", name: "Zone A - Raw Leather & Linings", capacity: 2500, type: "Raw Materials" },
        { id: "WH-B", name: "Zone B - Soles & EVA Foams", capacity: 3000, type: "Raw Materials" },
      ];
      localStorage.setItem("warehouses", JSON.stringify(defaultWh));
      return defaultWh;
    }
  },

  createWarehouse: async (data: Omit<Warehouse, "id">): Promise<Warehouse> => {
    try {
      return await request<Warehouse>("/inventory/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      // Fallback to local storage
      const warehouses = JSON.parse(localStorage.getItem("warehouses") || "[]");
      const newWh = { ...data, id: `WH-${Math.random().toString(36).substr(2, 6).toUpperCase()}` };
      warehouses.push(newWh);
      localStorage.setItem("warehouses", JSON.stringify(warehouses));
      return newWh;
    }
  },

  getPurchaseOrders: () => request<PurchaseOrder[]>("/inventory/purchase-orders"),

  createPurchaseOrder: (data: CreatePOInput) =>
    request<{ id: string; poNumber: string }>("/inventory/purchase-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePOStatus: (id: string, status: "pending" | "approved" | "received" | "cancelled") =>
    request<{ id: string; status: string }>(`/inventory/purchase-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getStockMovements: (material?: string, date?: string) => {
    let query = "";
    const params = [];
    if (material) params.push(`material=${encodeURIComponent(material)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    if (params.length) query = "?" + params.join("&");
    return request<StockMovement[]>(`/inventory/movements${query}`);
  },

  recordStockIn: (data: RecordMovementInput) =>
    request<{ success: boolean }>("/inventory/movements/in", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  recordStockOut: (data: RecordMovementInput) =>
    request<{ success: boolean }>("/inventory/movements/out", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
