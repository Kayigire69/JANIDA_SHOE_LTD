import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, ClipboardCheck, Package, PlayCircle, ShoppingCart, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layout } from "../Layout";
import { SystemAnnouncement } from "../common/SystemAnnouncement";
import { dashboardApi } from "../../services/dashboardApi";

const roleTitles: Record<string, string> = {
  production_manager: "Production Manager",
  inventory_manager: "Inventory Manager",
  quality_officer: "Quality Officer",
  sales_staff: "Sales Staff",
  administrator: "Administrator",
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
    { label: "Purchase Orders", path: "/inventory/purchase-orders", icon: ShoppingCart },
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
};

export function DynamicDashboard({ role }: { role: string }) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(setData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load dashboard");
        if (String(err?.message || "").toLowerCase().includes("auth")) navigate("/login");
      });
  }, [navigate]);

  const metrics = data?.metrics || [];
  const announcements = data?.announcements || [];
  const chart = data?.charts?.trend || [];
  const records = data?.records || {};
  const primaryRecords = records.active_batches || records.stock_items || records.inspection_results || records.pending_orders || [];
  const activities = records.recent_activity || [];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {error && <SystemAnnouncement message={error} type="warning" />}
        {announcements.map((item: any) => (
          <SystemAnnouncement key={item.id} message={item.message} type={item.type} />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.map((metric: any) => (
            <div key={metric.title} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  <p className="text-slate-500 text-sm mt-1">{metric.trend || metric.subtitle}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(quickActions[role] || quickActions.production_manager).map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.path} to={action.path} className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                  <Icon className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Trend Overview</h3>
            <ResponsiveContainer width="100%" height={260}>
              {role === "inventory_manager" || role === "sales_staff" ? (
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              ) : (
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((activity: any, index: number) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">{activity.action || activity.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time || activity.createdAt}</p>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-slate-500">No recent activity yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Role Data</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {primaryRecords.map((record: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                {Object.entries(record).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm py-1">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-medium text-slate-900 text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            ))}
            {primaryRecords.length === 0 && <p className="text-sm text-slate-500">No dashboard records posted yet.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
