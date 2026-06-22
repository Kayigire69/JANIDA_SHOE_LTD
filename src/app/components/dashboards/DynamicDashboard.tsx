import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, ClipboardCheck, Package, PlayCircle, ShoppingCart, TrendingUp, Database, LayoutDashboard, CheckSquare, Calendar, Award } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layout } from "../Layout";
import { SystemAnnouncement } from "../common/SystemAnnouncement";
import { dashboardApi } from "../../services/dashboardApi";
import { exportToCSV, generateStyledPDF } from "../../utils/exportUtils";
import { useSettings } from "../../context/SettingsContext";

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
  const { companyName, logoUrl, API_BASE_URL } = useSettings();
  const [loading, setLoading] = useState(true);
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

  const handleExportCSV = () => {
    // Generate rows from metrics and primary records
    const rows = [
      ["Dashboard Report"],
      [""],
      ["Metrics"],
      ["Title", "Value", "Trend"],
      ...metrics.map((m: any) => [m.title, m.value, m.trend || m.subtitle]),
      [""],
      ["Role Data"],
    ];

    if (primaryRecords.length > 0) {
      const headers = Object.keys(primaryRecords[0]);
      rows.push(headers);
      primaryRecords.forEach((record: any) => {
        rows.push(headers.map(h => String(record[h])));
      });
    }
    
    exportToCSV(`${role}_dashboard_report`, rows);
  };

  const handleExportPDF = async () => {
    let cols: string[] = [];
    let pdfRows: any[][] = [];
    if (primaryRecords.length > 0) {
      cols = Object.keys(primaryRecords[0]).map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
      pdfRows = primaryRecords.map((record: any) => Object.keys(primaryRecords[0]).map(h => String(record[h])));
    } else {
      cols = ["Metrics", "Value", "Trend"];
      pdfRows = metrics.map((m: any) => [m.title, m.value, m.trend || m.subtitle]);
    }
    
    await generateStyledPDF({
      filename: `${role}_dashboard_report`,
      reportTitle: `${roleTitles[role]} Dashboard Report`,
      sectionTitle: "1. DASHBOARD DETAIL IN PERIOD",
      periodStart: new Date().toLocaleDateString(),
      columns: cols,
      rows: pdfRows,
      companyName,
      logoUrl: logoUrl || undefined,
      apiBaseUrl: API_BASE_URL
    });
  };

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
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-8">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6">Trend Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              {role === "inventory_manager" || role === "sales_staff" ? (
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="value" fill="url(#colorValue)" radius={[6, 6, 0, 0]}>
                    {/* Define gradient for bar chart */}
                  </Bar>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              ) : (
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-8">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {activities.map((activity: any, index: number) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
                  <p className="text-sm font-medium text-slate-800">{activity.action || activity.message}</p>
                  <p className="text-xs text-slate-500 mt-1.5 font-semibold">{activity.time || activity.createdAt}</p>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No recent activity yet.</p>
                </div>
              )}
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
