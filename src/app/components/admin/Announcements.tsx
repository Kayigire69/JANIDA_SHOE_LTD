import { useState } from "react";
import { Layout } from "../Layout";
import { Loader2, Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function Announcements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", type: "info" });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      await adminApi.createAnnouncement(announcementForm);
      setSuccess("Announcement broadcasted successfully to all active system users.");
      setAnnouncementForm({ title: "", message: "", type: "info" });
    } catch (err: any) {
      setError(err?.message || "Failed to broadcast announcement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Broadcast Announcement</h1>
          <p className="text-slate-600 text-sm mt-1">Publish global notifications that appear immediately to all active employees</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
          <form onSubmit={handleCreateAnnouncement} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Announcement Title *</label>
              <input
                required
                type="text"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="e.g., Scheduled Core System Update"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message Detail *</label>
              <textarea
                required
                rows={4}
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                placeholder="Write the notification message here... Keep it clear and concise."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alert Classification</label>
              <select
                value={announcementForm.type}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="info">Info classification (Blue banner)</option>
                <option value="success">Success classification (Green banner)</option>
                <option value="warning">Warning classification (Yellow banner)</option>
                <option value="alert">Critical Alert classification (Red banner)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || !announcementForm.title.trim() || !announcementForm.message.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Broadcast Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
