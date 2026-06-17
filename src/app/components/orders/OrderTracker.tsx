import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import {
  ListOrdered, Search, Filter, ChevronDown, Truck, CheckCircle2,
  Clock, Package, AlertTriangle, Loader2, FileDown, RefreshCw
} from "lucide-react";
import { salesApi } from "../../services/salesApi";

const STATUS_OPTIONS = ["all", "pending", "processing", "shipped", "delivered"];

const statusStyles: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
};
const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
};

const NEXT_STATUS: Record<string, string> = {
  pending: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const NEXT_LABEL: Record<string, string> = {
  pending: "Mark Processing",
  processing: "Mark Shipped",
  shipped: "Mark Delivered",
};

export function OrderTracker() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Ship modal
  const [shipModal, setShipModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [carrier, setCarrier] = useState("FedEx");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrders = () => {
    setLoading(true);
    salesApi.getOrders(filterStatus !== "all" ? filterStatus : undefined)
      .then(setOrders)
      .catch((e) => {
        setError(e.message);
        if (e.message?.toLowerCase().includes("auth")) navigate("/login");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [filterStatus]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (newStatus === "shipped") {
      const order = orders.find((o) => o.id === orderId);
      setShipModal({ orderId, orderNumber: order?.orderNumber || "" });
      return;
    }
    setUpdatingId(orderId);
    try {
      await salesApi.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmShipment = async () => {
    if (!shipModal) return;
    setUpdatingId(shipModal.orderId);
    try {
      await salesApi.updateOrderStatus(shipModal.orderId, "shipped", {
        carrier,
        trackingNumber: trackingNumber || `TRK-${Date.now()}`,
      });
      setShipModal(null);
      setTrackingNumber("");
      loadOrders();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Order #", "Customer", "Status", "Priority", "Total Amount", "Delivery Date", "Invoice", "Tracking"];
    const rows = filtered.map((o) => [
      o.orderNumber, o.customer, o.status, o.priority,
      `$${o.totalAmount?.toFixed(2)}`, o.deliveryDate,
      o.invoiceNumber || "—", o.trackingNumber || "—"
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = orders.filter((o) =>
    !search ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-blue-600" /> Order Tracker
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor and advance customer order status in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadOrders} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total", count: stats.total, color: "border-slate-400" },
            { label: "Pending", count: stats.pending, color: "border-slate-400" },
            { label: "Processing", count: stats.processing, color: "border-blue-500" },
            { label: "Shipped", count: stats.shipped, color: "border-amber-500" },
            { label: "Delivered", count: stats.delivered, color: "border-emerald-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} shadow-sm p-4`}>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.count}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or customer..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ListOrdered className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No orders found</p>
              <p className="text-slate-300 text-sm mt-1">Try adjusting your filters or create a new order</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Order #", "Customer", "Status", "Priority", "Invoice", "Shipment", "Total", "Delivery", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((order) => {
                    const StatusIcon = statusIcons[order.status] || Clock;
                    const nextStatus = NEXT_STATUS[order.status];
                    const isUpdating = updatingId === order.id;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{order.orderNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{order.customer}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status] || "bg-slate-100 text-slate-600"}`}>
                            <StatusIcon className="w-3 h-3" />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                            order.priority === "high" ? "bg-red-100 text-red-700" :
                            order.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          }`}>{order.priority}</span>
                        </td>
                        <td className="px-4 py-3">
                          {order.invoiceNumber ? (
                            <div>
                              <p className="text-xs font-mono text-slate-600">{order.invoiceNumber}</p>
                              <span className={`text-xs font-semibold ${order.invoiceStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                                {order.invoiceStatus}
                              </span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {order.trackingNumber ? (
                            <div>
                              <p className="text-xs font-mono text-slate-600">{order.trackingNumber}</p>
                              <p className="text-xs text-slate-400">{order.carrier}</p>
                            </div>
                          ) : <span className="text-slate-300 text-xs">Not shipped</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{order.deliveryDate}</td>
                        <td className="px-4 py-3">
                          {nextStatus ? (
                            <button onClick={() => handleStatusUpdate(order.id, nextStatus)}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3 rotate-[-90deg]" />}
                              {NEXT_LABEL[order.status]}
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Shipment Modal */}
      {shipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Shipment Details</h3>
            <p className="text-sm text-slate-500 mb-5">Order <span className="font-mono font-semibold text-blue-700">{shipModal.orderNumber}</span></p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Carrier</label>
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {["FedEx", "UPS", "DHL", "USPS", "Standard Shipping"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tracking Number (optional)</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-FedEx-123456"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShipModal(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >Cancel</button>
              <button onClick={confirmShipment} disabled={!!updatingId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
