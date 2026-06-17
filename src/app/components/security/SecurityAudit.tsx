import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Search, Shield, AlertTriangle, CheckCircle2, X, Loader2,
  Download, FileText, Activity, Clock, Users, Lock, Eye,
  ChevronLeft, ChevronRight, Filter, RefreshCw, Ban, Settings,
  Calendar, ShieldAlert, ShieldCheck, Trash2
} from "lucide-react";
import { securityApi } from "../../services/securityApi";

const tabs = ["audit-logs", "login-activity", "sessions", "alerts", "retention"] as const;

export function SecurityAudit() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("audit-logs");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [auditFilters, setAuditFilters] = useState({ search: "", action: "", dateFrom: "", dateTo: "" });
  const [auditActions, setAuditActions] = useState<string[]>([]);

  // Login activity state
  const [loginActivities, setLoginActivities] = useState<any[]>([]);
  const [loginPagination, setLoginPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [loginFilters, setLoginFilters] = useState({ email: "", success: "", dateFrom: "", dateTo: "" });

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  // Alerts state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertPagination, setAlertPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [alertFilters, setAlertFilters] = useState({ status: "", severity: "", alertType: "" });

  // Retention state
  const [retentionPolicies, setRetentionPolicies] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      const data = await securityApi.getSecurityMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error("Metrics error:", err);
    }
  };

  const fetchAuditLogs = async (page = auditPagination.page) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(auditPagination.limit) };
      if (auditFilters.search) params.search = auditFilters.search;
      if (auditFilters.action) params.action = auditFilters.action;
      if (auditFilters.dateFrom) params.dateFrom = auditFilters.dateFrom;
      if (auditFilters.dateTo) params.dateTo = auditFilters.dateTo;
      const data = await securityApi.listAuditLogs(params);
      setAuditLogs(data.logs || []);
      setAuditPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) {
      setError(err?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginActivity = async (page = loginPagination.page) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(loginPagination.limit) };
      if (loginFilters.email) params.email = loginFilters.email;
      if (loginFilters.success) params.success = loginFilters.success;
      if (loginFilters.dateFrom) params.dateFrom = loginFilters.dateFrom;
      if (loginFilters.dateTo) params.dateTo = loginFilters.dateTo;
      const data = await securityApi.listLoginActivity(params);
      setLoginActivities(data.activities || []);
      setLoginPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) {
      setError(err?.message || "Failed to load login activity");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await securityApi.listActiveSessions();
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async (page = alertPagination.page) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(alertPagination.limit) };
      if (alertFilters.status) params.status = alertFilters.status;
      if (alertFilters.severity) params.severity = alertFilters.severity;
      if (alertFilters.alertType) params.alertType = alertFilters.alertType;
      const data = await securityApi.listSecurityAlerts(params);
      setAlerts(data.alerts || []);
      setAlertPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const fetchRetentionPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await securityApi.listRetentionPolicies();
      setRetentionPolicies(data.policies || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load retention policies");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditActions = async () => {
    try {
      const data = await securityApi.getAuditActions();
      setAuditActions(data.actions || []);
    } catch (err: any) {
      console.error("Actions error:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchAuditActions();
  }, []);

  useEffect(() => {
    setError("");
    if (activeTab === "audit-logs") fetchAuditLogs(1);
    if (activeTab === "login-activity") fetchLoginActivity(1);
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "alerts") fetchAlerts(1);
    if (activeTab === "retention") fetchRetentionPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleRevokeSession = async (id: string) => {
    if (!window.confirm("Revoke this session?")) return;
    try {
      await securityApi.revokeSession(id);
      fetchSessions();
      fetchMetrics();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke session");
    }
  };

  const handleUpdateAlertStatus = async (id: string, status: string) => {
    try {
      await securityApi.updateAlertStatus(id, status);
      fetchAlerts();
      fetchMetrics();
    } catch (err: any) {
      setError(err?.message || "Failed to update alert");
    }
  };

  const handleUpdateRetention = async (id: string, retentionDays: number, autoPurgeEnabled: boolean) => {
    try {
      await securityApi.updateRetentionPolicy(id, { retentionDays, autoPurgeEnabled });
      fetchRetentionPolicies();
    } catch (err: any) {
      setError(err?.message || "Failed to update policy");
    }
  };

  const exportAuditCSV = () => {
    const headers = ["Timestamp", "Action", "User", "Email", "IP Address", "Metadata"];
    const rows = auditLogs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.user_name || "System",
      log.user_email || "-",
      log.ip_address || "-",
      JSON.stringify(log.metadata || {})
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityBadge = (severity: string) => {
    const map: Record<string, string> = {
      critical: "bg-red-100 text-red-700 border-red-600",
      high: "bg-orange-100 text-orange-700 border-orange-600",
      medium: "bg-amber-100 text-amber-700 border-amber-600",
      low: "bg-blue-100 text-blue-700 border-blue-600",
    };
    return map[severity] || "bg-slate-100 text-slate-700";
  };

  const alertTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const alertStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-red-100 text-red-700",
      investigating: "bg-amber-100 text-amber-700",
      resolved: "bg-emerald-100 text-emerald-700",
      dismissed: "bg-slate-100 text-slate-700",
    };
    return map[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Security & Audit</h1>
            <p className="text-slate-600 text-sm mt-1">Monitor system security, audit logs, and compliance</p>
          </div>
          <button onClick={exportAuditCSV} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Export Audit Trail
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Failed Logins (24h)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.failedLogins24h ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Open Alerts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.openAlerts ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.activeSessions ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Audit Events (24h)</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.auditLogs24h ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t === "audit-logs" && <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Audit Logs</span>}
              {t === "login-activity" && <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Login Activity</span>}
              {t === "sessions" && <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Active Sessions</span>}
              {t === "alerts" && <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Security Alerts</span>}
              {t === "retention" && <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Data Retention</span>}
            </button>
          ))}
        </div>

        {/* Audit Logs Tab */}
        {activeTab === "audit-logs" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={auditFilters.search} onChange={(e) => setAuditFilters({ ...auditFilters, search: e.target.value })} placeholder="Search action or user..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={auditFilters.action} onChange={(e) => setAuditFilters({ ...auditFilters, action: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Actions</option>
                {auditActions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input type="date" value={auditFilters.dateFrom} onChange={(e) => setAuditFilters({ ...auditFilters, dateFrom: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={auditFilters.dateTo} onChange={(e) => setAuditFilters({ ...auditFilters, dateTo: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => fetchAuditLogs(1)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && auditLogs.length === 0 && <div className="text-center py-12 text-slate-500">No audit logs found.</div>}
            {!loading && auditLogs.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Action</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">IP Address</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{log.action}</span></td>
                          <td className="py-3 px-4">{log.user_name || "System"}<br /><span className="text-xs text-slate-500">{log.user_email || "-"}</span></td>
                          <td className="py-3 px-4 text-slate-600">{log.ip_address || "-"}</td>
                          <td className="py-3 px-4"><pre className="text-xs text-slate-600 bg-slate-50 p-1 rounded overflow-x-auto max-w-xs">{JSON.stringify(log.metadata || {}, null, 2)}</pre></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {auditLogs.length} of {auditPagination.total} records</p>
                  <div className="flex gap-2">
                    <button disabled={auditPagination.page <= 1} onClick={() => fetchAuditLogs(auditPagination.page - 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {auditPagination.page}</span>
                    <button disabled={auditPagination.page * auditPagination.limit >= auditPagination.total} onClick={() => fetchAuditLogs(auditPagination.page + 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Login Activity Tab */}
        {activeTab === "login-activity" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={loginFilters.email} onChange={(e) => setLoginFilters({ ...loginFilters, email: e.target.value })} placeholder="Search email..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={loginFilters.success} onChange={(e) => setLoginFilters({ ...loginFilters, success: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Failed</option>
              </select>
              <input type="date" value={loginFilters.dateFrom} onChange={(e) => setLoginFilters({ ...loginFilters, dateFrom: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={loginFilters.dateTo} onChange={(e) => setLoginFilters({ ...loginFilters, dateTo: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => fetchLoginActivity(1)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && loginActivities.length === 0 && <div className="text-center py-12 text-slate-500">No login activity found.</div>}
            {!loading && loginActivities.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Timestamp</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Reason</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginActivities.map((act) => (
                        <tr key={act.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 whitespace-nowrap">{new Date(act.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4">{act.email}</td>
                          <td className="py-3 px-4">
                            {act.success ? (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Success</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1 w-fit"><X className="w-3 h-3" /> Failed</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{act.reason || "-"}</td>
                          <td className="py-3 px-4 text-slate-600">{act.ip_address || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {loginActivities.length} of {loginPagination.total} records</p>
                  <div className="flex gap-2">
                    <button disabled={loginPagination.page <= 1} onClick={() => fetchLoginActivity(loginPagination.page - 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {loginPagination.page}</span>
                    <button disabled={loginPagination.page * loginPagination.limit >= loginPagination.total} onClick={() => fetchLoginActivity(loginPagination.page + 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && sessions.length === 0 && <div className="text-center py-12 text-slate-500">No active sessions found.</div>}
            {!loading && sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">IP Address</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Expires</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{s.full_name}<br /><span className="text-xs text-slate-500">{s.email}</span></td>
                        <td className="py-3 px-4 text-slate-600">{s.ip_address || "-"}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{new Date(s.expires_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleRevokeSession(s.id)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 flex items-center gap-1">
                            <Ban className="w-3 h-3" /> Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <select value={alertFilters.status} onChange={(e) => setAlertFilters({ ...alertFilters, status: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <select value={alertFilters.severity} onChange={(e) => setAlertFilters({ ...alertFilters, severity: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button onClick={() => fetchAlerts(1)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && alerts.length === 0 && <div className="text-center py-12 text-slate-500">No security alerts found.</div>}
            {!loading && alerts.length > 0 && (
              <>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${severityBadge(alert.severity)}`}>{alert.severity}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alertStatusBadge(alert.status)}`}>{alert.status}</span>
                            <span className="text-xs text-slate-500">{alertTypeLabel(alert.alert_type)}</span>
                          </div>
                          <h3 className="font-medium text-slate-900">{alert.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{alert.description || "No description provided."}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(alert.created_at).toLocaleString()}</span>
                            {alert.related_user_name && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {alert.related_user_name}</span>}
                            {alert.related_ip && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {alert.related_ip}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {alert.status === "open" && (
                            <button onClick={() => handleUpdateAlertStatus(alert.id, "investigating")} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100">Investigate</button>
                          )}
                          {(alert.status === "open" || alert.status === "investigating") && (
                            <>
                              <button onClick={() => handleUpdateAlertStatus(alert.id, "resolved")} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100">Resolve</button>
                              <button onClick={() => handleUpdateAlertStatus(alert.id, "dismissed")} className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100">Dismiss</button>
                            </>
                          )}
                          {(alert.status === "resolved" || alert.status === "dismissed") && (
                            <button onClick={() => handleUpdateAlertStatus(alert.id, "open")} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">Reopen</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {alerts.length} of {alertPagination.total} alerts</p>
                  <div className="flex gap-2">
                    <button disabled={alertPagination.page <= 1} onClick={() => fetchAlerts(alertPagination.page - 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {alertPagination.page}</span>
                    <button disabled={alertPagination.page * alertPagination.limit >= alertPagination.total} onClick={() => fetchAlerts(alertPagination.page + 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Retention Tab */}
        {activeTab === "retention" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && retentionPolicies.length === 0 && <div className="text-center py-12 text-slate-500">No retention policies configured.</div>}
            {!loading && retentionPolicies.length > 0 && (
              <div className="space-y-4">
                {retentionPolicies.map((policy) => (
                  <div key={policy.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 capitalize">{policy.resource_type.replace(/_/g, " ")}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Retain for <strong>{policy.retention_days} days</strong>
                          {policy.last_purged_at && <span> · Last purged: {new Date(policy.last_purged_at).toLocaleString()}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={policy.auto_purge_enabled}
                            onChange={(e) => handleUpdateRetention(policy.id, policy.retention_days, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          Auto-purge
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={policy.retention_days}
                            onChange={(e) => handleUpdateRetention(policy.id, Number(e.target.value), policy.auto_purge_enabled)}
                            className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-500">days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
