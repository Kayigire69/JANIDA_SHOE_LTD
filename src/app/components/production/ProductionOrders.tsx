import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { PlayCircle, Pause, CheckCircle2, Filter, Download, Eye, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { productionApi, OrdersData } from "../../services/productionApi";

export function ProductionOrders() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [data, setData] = useState<OrdersData | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await productionApi.getOrders();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleExport = () => {
    if (!data) return;
    const dataStr = JSON.stringify(data.orders, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `production-orders-${Date.now()}.json`;
    link.click();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    let completedQuantity: number | undefined = undefined;

    if (status === "Completed") {
      const targetOrder = data?.orders.find(o => o.id === id);
      const input = prompt(`Enter final completed quantity:`, String(targetOrder?.quantity || 0));
      if (input === null) return; // User cancelled
      completedQuantity = parseInt(input) || targetOrder?.quantity || 0;
    }

    try {
      setUpdatingId(id);
      await productionApi.updateOrderStatus(id, status, completedQuantity);
      await loadOrders(); // Refresh table and metrics
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = data?.orders.filter((order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase().replace(" ", "-") === filter;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Planned":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Paused":
        return "bg-amber-100 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 font-semibold";
      case "medium":
        return "text-amber-600 font-semibold";
      case "low":
        return "text-slate-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Production Orders</h1>
            <p className="text-slate-600 text-sm mt-1">Manage and track production orders</p>
          </div>
          <button
            onClick={handleExport}
            disabled={!data}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Orders
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{data?.metrics.totalOrders || 0}</p>
              <p className="text-slate-500 text-sm mt-1">active batches</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div>
              <p className="text-slate-600 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{data?.metrics.completedCount || 0}</p>
              <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                On track
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div>
              <p className="text-slate-600 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{data?.metrics.inProgressCount || 0}</p>
              <p className="text-slate-500 text-sm mt-1">currently active</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div>
              <p className="text-slate-600 text-sm font-medium">Planned</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{data?.metrics.plannedCount || 0}</p>
              <p className="text-slate-500 text-sm mt-1">awaiting start</p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filter by status:</span>
          </div>
          <div className="flex gap-2">
            {["all", "planned", "in-progress", "paused", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Loading active production order list...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Order ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Quantity</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Progress</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Deadline</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Priority</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sm text-slate-500 italic">No production orders found matching this filter.</td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const progress = order.quantity > 0 ? (order.completed / order.quantity) * 100 : 0;
                      const isUpdating = updatingId === order.id;

                      return (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">{order.plan_code}</td>
                          <td className="py-4 px-6 text-sm text-slate-700 font-semibold">{order.product}</td>
                          <td className="py-4 px-6 text-sm text-slate-700">
                            {order.completed} / {order.quantity}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 w-24">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-600">{progress.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-700">{order.deadline}</td>
                          <td className="py-4 px-6">
                            <span className={`text-sm capitalize ${getPriorityColor(order.priority)}`}>
                              {order.priority}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {isUpdating ? (
                              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {(order.status === "Planned" || order.status === "Paused") && (
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, "In Progress")}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Start production"
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {order.status === "In Progress" && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(order.id, "Paused")}
                                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                      title="Pause"
                                    >
                                      <Pause className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(order.id, "Completed")}
                                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Mark complete"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
