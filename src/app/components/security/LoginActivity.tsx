import { useState } from "react";
import { Layout } from "../Layout";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Filter } from "lucide-react";

export function LoginActivity() {
  const [filterStatus, setFilterStatus] = useState("all");

  const loginAttempts = [
    {
      id: 1,
      user: "john.anderson@smartshoe.com",
      time: "2026-05-02 14:32:15",
      ip: "192.168.1.105",
      device: "Chrome on Windows",
      status: "success",
      location: "New York, US",
    },
    {
      id: 2,
      user: "sarah.williams@smartshoe.com",
      time: "2026-05-02 14:28:42",
      ip: "192.168.1.87",
      device: "Safari on macOS",
      status: "success",
      location: "San Francisco, US",
    },
    {
      id: 3,
      user: "unknown@external.com",
      time: "2026-05-02 14:15:33",
      ip: "45.123.67.89",
      device: "Chrome on Linux",
      status: "failed",
      location: "Unknown",
      suspicious: true,
    },
    {
      id: 4,
      user: "mike.johnson@smartshoe.com",
      time: "2026-05-02 13:45:12",
      ip: "192.168.1.92",
      device: "Firefox on Windows",
      status: "success",
      location: "Boston, US",
    },
    {
      id: 5,
      user: "admin@smartshoe.com",
      time: "2026-05-02 13:22:08",
      ip: "203.45.12.67",
      device: "Chrome on Android",
      status: "failed",
      location: "Unknown",
      suspicious: true,
    },
    {
      id: 6,
      user: "emily.chen@smartshoe.com",
      time: "2026-05-02 12:58:45",
      ip: "192.168.1.112",
      device: "Edge on Windows",
      status: "success",
      location: "Seattle, US",
    },
  ];

  const filteredAttempts = loginAttempts.filter((attempt) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "suspicious") return attempt.suspicious;
    return attempt.status === filterStatus;
  });

  const getStatusIcon = (status: string, suspicious?: boolean) => {
    if (suspicious) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    return status === "success" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusColor = (status: string, suspicious?: boolean) => {
    if (suspicious) {
      return "bg-red-100 text-red-700 border-red-500";
    }
    return status === "success"
      ? "bg-emerald-100 text-emerald-700 border-emerald-500"
      : "bg-red-100 text-red-700 border-red-500";
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Login Activity Monitoring</h1>
            <p className="text-slate-600 text-sm mt-1">Track and review authentication attempts</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Successful Logins</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loginAttempts.filter((a) => a.status === "success").length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Failed Attempts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loginAttempts.filter((a) => a.status === "failed").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Suspicious Activity</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loginAttempts.filter((a) => a.suspicious).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">23</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <Filter className="w-4 h-4 text-slate-600" />
            <div className="flex gap-2">
              {["all", "success", "failed", "suspicious"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className={`p-4 rounded-lg border-l-4 ${
                  attempt.suspicious ? "bg-red-50 border-red-500" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(attempt.status, attempt.suspicious)}
                      <span className="font-medium text-slate-900">{attempt.user}</span>
                      {attempt.suspicious && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          SUSPICIOUS
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Time:</span> {attempt.time}
                      </div>
                      <div>
                        <span className="font-medium">IP:</span> {attempt.ip}
                      </div>
                      <div>
                        <span className="font-medium">Device:</span> {attempt.device}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {attempt.location}
                      </div>
                    </div>
                  </div>
                  {attempt.suspicious && (
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                      Block IP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
