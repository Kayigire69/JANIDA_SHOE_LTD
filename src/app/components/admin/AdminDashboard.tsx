import { Layout } from "../Layout";
import {
  Users,
  Activity,
  Settings,
  AlertTriangle,
  Server,
  Database,
  Shield,
  HardDrive,
  FileText,
} from "lucide-react";

export function AdminDashboard() {
  const systemAlerts = [
    { severity: "high", message: "Machine B2 offline - requires immediate attention", module: "Production" },
    { severity: "medium", message: "Low stock alert - Fabric material below threshold", module: "Inventory" },
    { severity: "low", message: "Scheduled backup completed successfully", module: "System" },
  ];

  const systemHealth = [
    { component: "Web Server", status: "operational", uptime: "99.8%" },
    { component: "Database", status: "operational", uptime: "99.9%" },
    { component: "API Gateway", status: "operational", uptime: "99.7%" },
    { component: "File Storage", status: "warning", uptime: "97.2%" },
  ];

  const recentActivity = [
    { user: "John Anderson", action: "Created new batch BTH-001235", time: "5 min ago" },
    { user: "Sarah Williams", action: "Updated inventory levels", time: "12 min ago" },
    { user: "Admin", action: "Modified user permissions", time: "1 hour ago" },
    { user: "Mike Johnson", action: "Completed quality inspection", time: "2 hours ago" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-slate-400";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-amber-500 bg-amber-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-slate-300 bg-slate-50";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Administration</h1>
            <p className="text-slate-600 text-sm mt-1">Monitor and manage factory operations</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">47</p>
                <p className="text-slate-500 text-sm mt-1">23 online now</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">System Health</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">98.9%</p>
                <p className="text-emerald-600 text-sm mt-1">All systems operational</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Production Lines</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">6/8</p>
                <p className="text-slate-500 text-sm mt-1">active lines</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">System Alerts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">3</p>
                <p className="text-amber-600 text-sm mt-1">1 requires attention</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">System Alerts</h3>
              </div>
              <div className="p-6 space-y-3">
                {systemAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`border-l-4 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 ${
                            alert.severity === "high"
                              ? "text-red-600"
                              : alert.severity === "medium"
                              ? "text-amber-600"
                              : "text-blue-600"
                          }`} />
                          <span className="text-xs font-medium text-slate-600">{alert.module}</span>
                        </div>
                        <p className="text-sm text-slate-900">{alert.message}</p>
                      </div>
                      <button className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">System Health Status</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {systemHealth.map((item, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">{item.component}</span>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Uptime</span>
                        <span className="text-sm font-semibold text-slate-900">{item.uptime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  <Users className="w-4 h-4" />
                  Manage Users
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  <HardDrive className="w-4 h-4" />
                  Backup System
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  <FileText className="w-4 h-4" />
                  View Logs
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                  <Shield className="w-4 h-4" />
                  Security Settings
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="pb-3 border-b border-slate-100 last:border-0">
                    <p className="text-sm font-medium text-slate-900">{activity.user}</p>
                    <p className="text-xs text-slate-600 mt-1">{activity.action}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
