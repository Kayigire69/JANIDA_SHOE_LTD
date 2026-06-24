import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, ClipboardCheck, Package, PlayCircle, ShoppingCart, TrendingUp, Database, LayoutDashboard, CheckSquare, Calendar, Award } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend } from "recharts";
import { Layout } from "../Layout";
import { SystemAnnouncement } from "../common/SystemAnnouncement";
import { dashboardApi } from "../../services/dashboardApi";
import { productionApi } from "../../services/productionApi";
import { salesApi } from "../../services/salesApi";

const roleTitles: Record<string, string> = {
  production_manager: "Production Manager",
  inventory_manager: "Inventory Manager",
  quality_officer: "Quality Officer",
  sales_staff: "Sales Staff",
  administrator: "Administrator",
  supervisor: "Supervisor",
};

const quickActions: Record<string, Array<{ label: string; path: string; icon: any }>> = {
  production_manager: [
    { label: "Start Batch", path: "/batch-creation", icon: PlayCircle },
    { label: "Production Plan", path: "/production-planning", icon: Activity },
    { label: "Schedule", path: "/production-schedule", icon: BarChart3 },
  ],
  inventory_manager: [
    { label: "Raw Materials", path: "/inventory/raw-materials", icon: Package },
    { label: "Stock Movement", path: "/inventory/stock-movement", icon: TrendingUp },
    { label: "Warehouses", path: "/inventory/warehouses", icon: Database },
  ],
  quality_officer: [
    { label: "Record Inspection", path: "/quality/inspection", icon: ClipboardCheck },
    { label: "Defect Tracking", path: "/quality/defects", icon: AlertTriangle },
    { label: "Certificates", path: "/quality/certificates", icon: CheckCircle2 },
  ],
  sales_staff: [
    { label: "Create Order", path: "/orders/create", icon: ShoppingCart },
    { label: "View Orders", path: "/production-orders", icon: Package },
    { label: "Notifications", path: "/notifications", icon: Bell },
  ],
  administrator: [
    { label: "Production", path: "/dashboard/production", icon: Activity },
    { label: "Inventory", path: "/dashboard/inventory", icon: Package },
    { label: "Quality", path: "/dashboard/quality", icon: ClipboardCheck },
  ],
  supervisor: [
    { label: "Assign Tasks", path: "/workforce/tasks", icon: CheckSquare },
    { label: "Manage Shifts", path: "/workforce/scheduling", icon: Calendar },
    { label: "Performance", path: "/workforce/performance", icon: Award },
  ],
};

export function DynamicDashboard({ role }: { role: string }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [liveChart, setLiveChart] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load dashboard");
        if (String(err?.message || "").toLowerCase().includes("auth")) navigate("/login");
      });
  }, [navigate]);

  // Fetch live chart data based on role
  useEffect(() => {
    if (role === "production_manager") {
      productionApi.getOrders().then(res => {
        const orders = res.orders || [];
        // Group by month
        const monthly: Record<string, { label: string; value: number; completed: number }> = {};
        orders.forEach((o: any) => {
          const d = new Date(o.deadline || Date.now());
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
          if (!monthly[key]) monthly[key] = { label, value: 0, completed: 0 };
          monthly[key].value++;
          if (o.status?.toLowerCase() === "completed") monthly[key].completed++;
        });
        setLiveChart(Object.values(monthly).slice(-7));
        // Status breakdown for pie
        const statusMap: Record<string, number> = {};
        orders.forEach((o: any) => { const s = o.status || "Unknown"; statusMap[s] = (statusMap[s] || 0) + 1; });
        setStatusBreakdown(
          Object.entries(statusMap).map(([name, value]) => ({ name, value }))
        );
      }).catch(() => {});
    } else if (role === "sales_staff") {
      salesApi.getOrders().then(orders => {
        if (!Array.isArray(orders)) return;
        const monthly: Record<string, { label: string; value: number; revenue: number }> = {};
        orders.forEach((o: any) => {
          const d = new Date(o.createdAt || o.created_at || Date.now());
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
          if (!monthly[key]) monthly[key] = { label, value: 0, revenue: 0 };
          monthly[key].value++;
          monthly[key].revenue += o.totalAmount || o.total_amount || 0;
        });
        setLiveChart(Object.values(monthly).slice(-7));
        const statusMap: Record<string, number> = {};
        orders.forEach((o: any) => { const s = o.status || "Unknown"; statusMap[s] = (statusMap[s] || 0) + 1; });
        setStatusBreakdown(
          Object.entries(statusMap).map(([name, value]) => ({ name, value }))
        );
      }).catch(() => {});
    }
  }, [role]);

  const metrics = data?.metrics || [];
  const announcements = data?.announcements || [];
  const dbChart = data?.charts?.trend || [];
  // Use live chart data if DB chart is empty
  const chart = dbChart.length > 0 ? dbChart : liveChart;
  const records = data?.records || {};
  const primaryRecords = records.active_batches || records.stock_items || records.inspection_results || records.pending_orders || [];
  const activities = records.recent_activity || [];

  const PIE_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {announcements.map((item: any) => (
          <SystemAnnouncement key={item.id} message={item.message} type={item.type} />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.map((metric: any) => (
            <div key={metric.title} className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-semibold tracking-wide">{metric.title}</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2">{metric.value}</p>
                  <p className="text-slate-400 text-xs mt-1 font-medium">{metric.trend || metric.subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="w-full h-1 bg-slate-100 mt-4 rounded-full overflow-hidden">
                <div className="w-full h-full bg-blue-500 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-8">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(quickActions[role] || quickActions.production_manager).map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path} className="group flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all duration-300 border border-slate-100 hover:border-blue-200 hover:shadow-md">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-8">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-extrabold text-slate-900">
                {role === "production_manager" ? "Production Batches by Month" :
                 role === "sales_staff" ? "Sales Orders by Month" :
                 "Trend Overview"}
              </h3>
            </div>
            {chart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-slate-400 gap-2">
                <BarChart3 className="w-10 h-10" />
                <p className="text-sm">No data yet — create some records to see trends</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                {role === "production_manager" ? (
                  <BarChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" name="Total Batches" fill="url(#colorProd)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="url(#colorComp)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : role === "sales_staff" ? (
                  <BarChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="value" name="Orders" fill="url(#colorSales)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" name="Value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Status Breakdown + Recent Activity */}
          <div className="space-y-6">
            {/* Status Pie (when we have live breakdown data) */}
            {statusBreakdown.length > 0 && (
              <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusBreakdown} cx="50%" cy="45%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
                      {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex-1">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {activities.map((activity: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                    <p className="text-sm font-medium text-slate-800">{activity.action || activity.message}</p>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{activity.time || activity.createdAt}</p>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs font-medium text-slate-500">No recent activity yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-5 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Role Data Records
            </h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {primaryRecords.map((record: any, index: number) => (
              <div key={index} className="border border-slate-100 rounded-2xl p-6 bg-slate-50 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                <div className="space-y-3">
                  {Object.entries(record).map(([key, value]) => {
                    // Don't show complex nested objects
                    if (typeof value === "object" && value !== null) return null;
                    return (
                      <div key={key} className="flex justify-between items-center gap-4 text-sm border-b border-slate-100/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-500 font-medium capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-bold text-slate-900 text-right truncate max-w-[60%]">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {primaryRecords.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <Database className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No dashboard records posted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
