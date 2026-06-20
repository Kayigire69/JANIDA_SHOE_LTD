import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { AlertTriangle, TrendingDown, CheckCircle2, Clock, Loader2, AlertCircle, Wrench, Play } from "lucide-react";
import { qualityApi, ReworkOrder } from "../../services/qualityApi";
import { toast } from "sonner";

export function DefectTracking() {
  const [reworkOrders, setReworkOrders] = useState<ReworkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await qualityApi.getReworkOrders();
      setReworkOrders(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load defects and rework orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusTransition = async (orderId: string, currentStatus: "pending" | "in-progress" | "completed") => {
    const nextStatusMap: Record<string, "in-progress" | "completed"> = {
      "pending": "in-progress",
      "in-progress": "completed"
    };

    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    try {
      setUpdatingId(orderId);
      await qualityApi.updateReworkOrderStatus(orderId, nextStatus);
      // Reload fresh data
      const data = await qualityApi.getReworkOrders();
      setReworkOrders(data);
      toast.success(`Rework status updated to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update rework status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = reworkOrders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesType = filterType === "all" || order.defect_type === filterType;
    return matchesStatus && matchesType;
  });

  // Extract unique defect types dynamically
  const defectTypes = ["all", ...Array.from(new Set(reworkOrders.map((o) => o.defect_type)))];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 font-bold";
      case "medium":
        return "bg-amber-100 text-amber-700 font-semibold";
      default:
        return "bg-blue-100 text-blue-700 font-medium";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  // Calculations
  const totalDefects = reworkOrders.reduce((sum, o) => sum + o.failed_quantity, 0);
  const completedDefects = reworkOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.failed_quantity, 0);
  const pendingDefects = reworkOrders
    .filter((o) => o.status !== "completed")
    .reduce((sum, o) => sum + o.failed_quantity, 0);

  const totalInspected = reworkOrders.reduce((sum, o) => sum + (o.inspected_quantity || 0), 0);
  const avgDefectRate = totalInspected > 0 ? ((totalDefects / totalInspected) * 100).toFixed(1) : "0.0";

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Defect Tracking & Rework</h1>
          <p className="text-slate-600 text-sm mt-1">Track defects and manage active rework orders</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Loading rework dispatch log...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Defects</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalDefects}</p>
                    <p className="text-slate-500 text-xs mt-1">units affected</p>
                  </div>
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Pending Rework</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{pendingDefects}</p>
                    <p className="text-amber-600 text-xs mt-1 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      in dispatch queue
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Rework Resolved</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{completedDefects}</p>
                    <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      successfully fixed
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Defect Rate</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{avgDefectRate}%</p>
                    <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      total average
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Rework Status</option>
                  <option value="pending">Pending Dispatch</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed / Fixed</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {defectTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "all" ? "All Defect Categories" : type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    No rework orders match your filters.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Rework ID</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Batch ID</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Product Model</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Defect Type</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Priority</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Failed Units</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Rework Target</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Due Date</th>
                        <th className="text-left py-4 px-6 text-xs font-semibold uppercase">Status</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold uppercase">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">
                            RWK-{order.id.substring(0, 6).toUpperCase()}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-700 font-semibold font-mono">
                            {order.batch_number}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-900 font-medium">{order.shoe_model_name || "General"}</td>
                          <td className="py-4 px-6 text-sm text-slate-700">{order.defect_type}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-red-600">{order.failed_quantity} pairs</td>
                          <td className="py-4 px-6 text-sm text-slate-700">{order.assigned_to}</td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {new Date(order.due_date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status === "in-progress" ? "In Progress" :
                               order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {updatingId === order.id ? (
                              <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                            ) : order.status === "pending" ? (
                              <button
                                onClick={() => handleStatusTransition(order.id, "pending")}
                                className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                              >
                                <Play className="w-3 h-3" />
                                Start Rework
                              </button>
                            ) : order.status === "in-progress" ? (
                              <button
                                onClick={() => handleStatusTransition(order.id, "in-progress")}
                                className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-xs font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-colors shadow-xs animate-pulse"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Mark Fixed
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Resolved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
