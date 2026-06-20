import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, Settings, AlertTriangle, Shield,
  Database, Bell, ArrowRight, Loader2, RefreshCw
} from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState<any>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getSystemOverview();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load system overview metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const quickActions = [
    { label: "Manage Users", desc: "View, update, lock or delete system accounts", path: "/admin/users", icon: Users, color: "blue" },
    { label: "Roles & Permissions", desc: "Configure access matrix across system modules", path: "/admin/roles", icon: Shield, color: "indigo" },
    { label: "Broadcast Announcements", desc: "Send announcements to all active sessions", path: "/admin/announcements", icon: Bell, color: "amber" },
    { label: "System Backups", desc: "Manage database backup storage & downloads", path: "/admin/backups", icon: Database, color: "emerald" },
    { label: "System Settings", desc: "Adjust system parameters and defaults", path: "/admin/settings", icon: Settings, color: "slate" },
    { label: "Security & Audit Logs", desc: "Review detailed activity logs & audit trails", path: "/security/audit", icon: AlertTriangle, color: "red" },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IT Administration Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">Real-time system oversight, health metrics, and administrative functions</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading && !metrics ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 text-sm font-medium">Fetching dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.totalUsers ?? 0}</p>
                    <p className="text-slate-500 text-xs mt-1">Registered in system</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Active Users</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.activeUsers ?? 0}</p>
                    <p className="text-emerald-600 text-xs mt-1 font-medium">Unlocked & validated</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Failed Logins */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Failed Logins</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.failedLogins ?? 0}</p>
                    <p className="text-amber-600 text-xs mt-1 font-medium">Recorded attempts</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-600 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">System Status</p>
                    <p className="text-3xl font-bold text-indigo-900 mt-2">{metrics?.systemStatus || "Operational"}</p>
                    <p className="text-indigo-600 text-xs mt-1 font-medium">API and DB connected</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions Grid */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Administrative Functions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => navigate(action.path)}
                        className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex items-start gap-4"
                      >
                        <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition-colors`}>
                          <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            {action.label}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </h3>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">{action.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">System Activity</h2>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 max-h-[380px] overflow-y-auto">
                  {!metrics?.recentActivity || metrics.recentActivity.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-12">No recent audit logs.</p>
                  ) : (
                    <div className="space-y-4">
                      {metrics.recentActivity.map((log: any, idx: number) => (
                        <div key={idx} className="flex gap-3 pb-3 border-b border-slate-50 last:border-b-0 last:pb-0">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-500">
                              <span className="font-semibold text-slate-700">{log.user}</span> • {new Date(log.time).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-slate-900 mt-0.5 break-words">{log.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
