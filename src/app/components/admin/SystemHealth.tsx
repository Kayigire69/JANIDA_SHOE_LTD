import { Layout } from "../Layout";
import { Server, Database, Wifi, HardDrive, Cpu, Activity } from "lucide-react";

export function SystemHealth() {
  const healthMetrics = [
    {
      component: "Web Server",
      status: "operational",
      icon: Server,
      metrics: {
        uptime: "99.8%",
        cpu: "42%",
        memory: "68%",
        requests: "1,245/min",
      },
    },
    {
      component: "Database Server",
      status: "operational",
      icon: Database,
      metrics: {
        uptime: "99.9%",
        cpu: "35%",
        memory: "71%",
        connections: "87/500",
      },
    },
    {
      component: "API Gateway",
      status: "operational",
      icon: Wifi,
      metrics: {
        uptime: "99.7%",
        cpu: "28%",
        memory: "52%",
        throughput: "8.4 MB/s",
      },
    },
    {
      component: "File Storage",
      status: "warning",
      icon: HardDrive,
      metrics: {
        uptime: "97.2%",
        cpu: "18%",
        memory: "89%",
        space: "2.1 TB / 5 TB",
      },
    },
    {
      component: "Cache Server",
      status: "operational",
      icon: Cpu,
      metrics: {
        uptime: "99.6%",
        cpu: "22%",
        memory: "45%",
        hitRate: "94.2%",
      },
    },
    {
      component: "Message Queue",
      status: "operational",
      icon: Activity,
      metrics: {
        uptime: "99.8%",
        cpu: "15%",
        memory: "38%",
        messages: "342/s",
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500" };
      case "warning":
        return { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" };
      case "critical":
        return { bg: "bg-red-500", text: "text-red-700", border: "border-red-500" };
      default:
        return { bg: "bg-slate-400", text: "text-slate-700", border: "border-slate-400" };
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">System Health Monitoring</h1>
          <p className="text-slate-600 text-sm mt-1">Real-time system status and performance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {healthMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const colors = getStatusColor(metric.status);
            return (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${colors.border}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{metric.component}</h3>
                        <span
                          className={`text-xs font-medium capitalize ${colors.text}`}
                        >
                          {metric.status}
                        </span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(metric.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Overall Health</p>
              <p className="text-2xl font-bold text-emerald-600">98.9%</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Active Services</p>
              <p className="text-2xl font-bold text-slate-900">6/6</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-slate-900">124ms</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Alerts (24h)</p>
              <p className="text-2xl font-bold text-amber-600">3</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
