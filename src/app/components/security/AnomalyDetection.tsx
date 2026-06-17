import { Layout } from "../Layout";
import { AlertTriangle, Shield, TrendingUp, Activity } from "lucide-react";

export function AnomalyDetection() {
  const anomalies = [
    {
      id: 1,
      type: "Multiple Failed Logins",
      severity: "critical",
      description: "5 failed login attempts from IP 45.123.67.89 in 2 minutes",
      timestamp: "2026-05-02 14:15:33",
      status: "active",
      affectedUser: "admin@smartshoe.com",
    },
    {
      id: 2,
      type: "Unusual Access Pattern",
      severity: "high",
      description: "User accessing system outside normal working hours",
      timestamp: "2026-05-02 02:45:12",
      status: "investigating",
      affectedUser: "john.anderson@smartshoe.com",
    },
    {
      id: 3,
      type: "Elevated Privilege Usage",
      severity: "medium",
      description: "Admin user deleted 15 records in production module",
      timestamp: "2026-05-01 16:32:08",
      status: "resolved",
      affectedUser: "admin@smartshoe.com",
    },
    {
      id: 4,
      type: "Data Export Anomaly",
      severity: "high",
      description: "Large volume of data exported (>500MB) by single user",
      timestamp: "2026-05-01 11:22:45",
      status: "investigating",
      affectedUser: "sarah.williams@smartshoe.com",
    },
    {
      id: 5,
      type: "Geographic Anomaly",
      severity: "low",
      description: "Login from unusual location (different country)",
      timestamp: "2026-05-01 09:15:22",
      status: "resolved",
      affectedUser: "mike.johnson@smartshoe.com",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-500",
          badge: "bg-red-500",
        };
      case "high":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-500",
          badge: "bg-amber-500",
        };
      case "medium":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-500",
          badge: "bg-blue-500",
        };
      case "low":
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-500",
          badge: "bg-slate-500",
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-500",
          badge: "bg-slate-500",
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-700";
      case "investigating":
        return "bg-amber-100 text-amber-700";
      case "resolved":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Anomaly Detection</h1>
          <p className="text-slate-600 text-sm mt-1">
            Monitor and respond to unusual system activities
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Critical Alerts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {anomalies.filter((a) => a.severity === "critical" && a.status === "active").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Under Investigation</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {anomalies.filter((a) => a.status === "investigating").length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Resolved (24h)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {anomalies.filter((a) => a.status === "resolved").length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Detection Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">98.4%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Detected Anomalies</h3>
          </div>
          <div className="p-6 space-y-4">
            {anomalies.map((anomaly) => {
              const colors = getSeverityColor(anomaly.severity);
              return (
                <div
                  key={anomaly.id}
                  className={`border-l-4 ${colors.border} ${colors.bg} rounded-lg p-4`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
                        <h4 className="font-semibold text-slate-900">{anomaly.type}</h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(
                            anomaly.status
                          )}`}
                        >
                          {anomaly.status}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${colors.badge}`}></div>
                        <span className={`text-xs font-medium uppercase ${colors.text}`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{anomaly.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span>
                          <span className="font-medium">Time:</span> {anomaly.timestamp}
                        </span>
                        <span>
                          <span className="font-medium">User:</span> {anomaly.affectedUser}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {anomaly.status === "active" && (
                        <>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Investigate
                          </button>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                            Block
                          </button>
                        </>
                      )}
                      {anomaly.status === "investigating" && (
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Anomaly Detection Guidelines</h4>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>• Investigate all critical anomalies immediately</li>
                <li>• Review and respond to high-severity alerts within 1 hour</li>
                <li>• Document all investigations and resolutions</li>
                <li>• Update security policies based on detected patterns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
