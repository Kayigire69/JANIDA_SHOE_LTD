import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { ShoppingCart, Plus, Clock, CheckCircle2, XCircle, DollarSign, AlertTriangle, X } from "lucide-react";
import { inventoryApi, PurchaseOrder, Supplier, RawMaterial } from "../../services/inventoryApi";
import { toast } from "sonner";

export function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newPO, setNewPO] = useState({
    supplierId: "",
    materialId: "",
    quantity: 0,
    unitPrice: 0,
    deliveryDate: "",
    notes: "",
  });

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role;
  const canManage = userRole === "inventory_manager" || userRole === "administrator";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pos, sups, mats] = await Promise.all([
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getSuppliers(),
        inventoryApi.getRawMaterials()
      ]);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setMaterials(mats);
    } catch (err: any) {
      toast.error(err.message || "Failed to load purchase order data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Unauthorized: Only Inventory Managers or Administrators can create purchase orders.");
      return;
    }
    if (!newPO.supplierId || !newPO.materialId || newPO.quantity <= 0 || newPO.unitPrice <= 0) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    try {
      await inventoryApi.createPurchaseOrder({
        supplierId: newPO.supplierId,
        materialId: newPO.materialId,
        quantity: Number(newPO.quantity),
        unitPrice: Number(newPO.unitPrice),
        deliveryDate: newPO.deliveryDate,
        notes: newPO.notes,
      });
      setShowCreateModal(false);
      // Reset form
      setNewPO({
        supplierId: "",
        materialId: "",
        quantity: 0,
        unitPrice: 0,
        deliveryDate: "",
        notes: "",
      });
      fetchData();
      toast.success("Purchase order created successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase order");
    }
  };

  const handleUpdateStatus = async (id: string, status: "pending" | "approved" | "received" | "cancelled") => {
    if (!canManage) {
      toast.error("Unauthorized: Only Inventory Managers or Administrators can update purchase order statuses.");
      return;
    }
    try {
      await inventoryApi.updatePOStatus(id, status);
      fetchData();
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update purchase order status");
    }
  };

  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalValue, 0);
  const pendingCount = purchaseOrders.filter(po => po.status === "pending").length;
  const approvedCount = purchaseOrders.filter(po => po.status === "approved").length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "received":
        return "bg-emerald-100 text-emerald-700 border-l-4 border-emerald-600";
      case "approved":
        return "bg-blue-100 text-blue-700 border-l-4 border-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-700 border-l-4 border-red-600";
      default:
        return "bg-amber-100 text-amber-700 border-l-4 border-amber-600";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Purchase Orders</h1>
            <p className="text-slate-600 text-sm mt-1">Track and manage raw material orders</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{purchaseOrders.length}</p>
                <p className="text-slate-500 text-sm mt-1">placed orders</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Approval</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{pendingCount}</p>
                <p className="text-amber-600 text-sm mt-1">awaiting signature</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Approved / Transit</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{approvedCount}</p>
                <p className="text-emerald-600 text-sm mt-1">incoming stock</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Spend</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">RWF {(totalValue / 1000).toFixed(1)}k</p>
                <p className="text-slate-500 text-sm mt-1">all-time value</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-500 font-medium">Loading purchase orders...</div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">No purchase orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">PO Number</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Supplier</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Material</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Quantity</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Unit Price</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Total Value</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Order Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Delivery Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                    {canManage && <th className="text-center py-4 px-6 text-sm font-semibold text-white">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">{po.poNumber}</td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">{po.supplier}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {po.material} <span className="text-xs text-slate-500 font-mono">({po.materialCode})</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900">
                        {po.quantity} {po.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">RWF {po.unitPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        RWF {po.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{po.orderDate}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{po.deliveryDate || "-"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusStyle(po.status)}`}>
                          {po.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-4 px-6 flex justify-center gap-2">
                          {po.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(po.id, "approved")}
                                className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(po.id, "cancelled")}
                                className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors border border-red-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {po.status === "approved" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(po.id, "received")}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                Receive
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(po.id, "cancelled")}
                                className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors border border-red-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(po.status === "received" || po.status === "cancelled") && (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Create Purchase Order
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                <select
                  required
                  value={newPO.supplierId}
                  onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Raw Material *</label>
                <select
                  required
                  value={newPO.materialId}
                  onChange={(e) => {
                    const mat = materials.find(m => m.id === e.target.value);
                    setNewPO({ 
                      ...newPO, 
                      materialId: e.target.value,
                      unitPrice: mat ? mat.unitCost : 0
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.idCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPO.quantity}
                    onChange={(e) => setNewPO({ ...newPO, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    value={newPO.unitPrice}
                    onChange={(e) => setNewPO({ ...newPO, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={newPO.deliveryDate}
                    onChange={(e) => setNewPO({ ...newPO, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  placeholder="Additional order terms, shipping method, etc."
                  value={newPO.notes}
                  onChange={(e) => setNewPO({ ...newPO, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  Place Order
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
