import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import { Loader2, PlusCircle, Trash2, CheckCircle2, X, AlertTriangle, Database } from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function Backups() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backups, setBackups] = useState<any[]>([]);
  const [backupName, setBackupName] = useState("");
  const [backupType, setBackupType] = useState("full");

  const fetchBackups = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const data = await adminApi.listBackups();
      setBackups(data.backups || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load backups");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  useEffect(() => {
    const hasRunning = backups.some(b => b.status === 'running');
    if (!hasRunning) return;

    const intervalId = setInterval(() => {
      fetchBackups(false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [backups]);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) return;
    try {
      await adminApi.createBackup(backupName.trim(), backupType);
      setBackupName("");
      fetchBackups();
    } catch (err: any) {
      setError(err?.message || "Backup creation failed");
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this backup record?")) return;
    try {
      await adminApi.deleteBackup(id);
      fetchBackups();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">System Backups</h1>
          <p className="text-slate-600 text-sm mt-1">Manage database backup generation, download links, and data recovery points</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            Generate New Backup
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="Backup file label (e.g. weekly-snapshot)"
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full Database Backup</option>
              <option value="partial">Partial Table Snapshots</option>
            </select>
            <button
              onClick={handleCreateBackup}
              disabled={!backupName.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Generate Backup
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && backups.length === 0 && (
            <div className="text-center py-12 text-slate-500">No backup history records found.</div>
          )}

          {!loading && backups.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Backup Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created At</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-400" />
                        {b.backup_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold capitalize">
                          {b.backup_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {b.status === "completed" ? (
                          <span className="flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : b.status === "running" ? (
                          <span className="flex items-center gap-1 text-amber-700 text-xs font-semibold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-700 text-xs font-semibold">
                            <X className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.file_size_bytes ? `${(b.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{new Date(b.started_at).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteBackup(b.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
