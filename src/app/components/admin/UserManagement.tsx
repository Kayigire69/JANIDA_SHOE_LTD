import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Users, Search, Loader2, ChevronLeft, ChevronRight, X, Edit3, Trash2,
  Lock, Unlock, AlertTriangle, Download, FileText
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import { generateStyledPDF } from "../../utils/exportUtils";
import { useSettings } from "../../context/SettingsContext";

export function UserManagement() {
  const { companyName, logoUrl, API_BASE_URL } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [userFilters, setUserFilters] = useState({ search: "", role: "", department: "" });
  const [editingUser, setEditingUser] = useState<any>(null);

  const roleOptions = ["pending", "production_manager", "inventory_manager", "quality_officer", "sales_staff", "supervisor", "administrator"];
  const departmentOptions = [
    "Production",
    "Inventory & Logistics",
    "Quality Assurance",
    "Sales & Marketing",
    "IT & Administration",
  ];

  const fetchUsers = async (page = userPagination.page) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(userPagination.limit) };
      if (userFilters.search) params.search = userFilters.search;
      if (userFilters.role) params.role = userFilters.role;
      if (userFilters.department) params.department = userFilters.department;
      
      const data = await adminApi.listUsers(params);
      setUsers(data.users || []);
      setUserPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserRoleUpdate = async (id: string, role: string, department: string) => {
    try {
      await adminApi.updateUserRole(id, { role, department });
      fetchUsers();
      setEditingUser(null);
    } catch (err: any) {
      setError(err?.message || "Update failed");
    }
  };

  const handleToggleLock = async (id: string, locked: boolean) => {
    try {
      await adminApi.toggleUserLock(id, !locked);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Lock toggle failed");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await adminApi.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Delete user failed");
    }
  };

  const handleExportPDF = async () => {
    if (users.length === 0) return;
    const columns = ["Name", "Email", "Role", "Department", "Status", "Employee ID"];
    const rows = users.map(u => [
      u.full_name || "",
      u.email || "",
      (u.role || "").replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
      u.department || "N/A",
      u.locked_until && new Date(u.locked_until) > new Date() ? "Locked" : "Active",
      u.employee_id || "N/A"
    ]);

    await generateStyledPDF({
      filename: "system_users_report",
      reportTitle: "SYSTEM USERS REPORT",
      sectionTitle: "Registered Users List",
      periodStart: new Date().toLocaleDateString(),
      columns: columns,
      rows: rows,
      companyName,
      logoUrl: logoUrl || undefined,
      apiBaseUrl: API_BASE_URL
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
            <p className="text-slate-600 text-sm mt-1">Manage system users, roles, departments, and account access</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={users.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={userFilters.search}
                onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={userFilters.role}
              onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <select
              value={userFilters.department}
              onChange={(e) => setUserFilters({ ...userFilters, department: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchUsers(1)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Search & Filter
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="text-center py-12 text-slate-500">No users found.</div>
          )}

          {!loading && users.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isLocked = !!(u.locked_until && new Date(u.locked_until) > new Date());
                      return (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900">{u.full_name}</span>
                            <br />
                            <span className="text-xs text-slate-500 font-mono">{u.employee_id || "No ID assigned"}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold capitalize">
                              {u.role.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{u.department || "N/A"}</td>
                          <td className="py-3 px-4">
                            {isLocked ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">Locked</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Active</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingUser(u)}
                                title="Edit Role/Dept"
                                className="p-1.5 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                              >
                                <Edit3 className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                onClick={() => handleToggleLock(u.id, isLocked)}
                                title={isLocked ? "Unlock User" : "Lock User"}
                                className="p-1.5 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                              >
                                {isLocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-600" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                title="Delete User"
                                className="p-1.5 bg-red-50 rounded hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-600">Showing {users.length} of {userPagination.total} users</p>
                <div className="flex gap-2">
                  <button
                    disabled={userPagination.page <= 1}
                    onClick={() => fetchUsers(userPagination.page - 1)}
                    className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {userPagination.page}</span>
                  <button
                    disabled={userPagination.page * userPagination.limit >= userPagination.total}
                    onClick={() => fetchUsers(userPagination.page + 1)}
                    className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {editingUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Assign Role & Department</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{editingUser.full_name || editingUser.email}</p>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-slate-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {editingUser.role === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>This user is <strong>pending</strong>. Assigning a role will activate their account and assign them an Employee ID.</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                  <select
                    value={editingUser.department || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select Department —</option>
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {!editingUser.department && (
                    <p className="text-xs text-amber-600 mt-1">⚠ Please assign a department before saving.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleUserRoleUpdate(editingUser.id, editingUser.role, editingUser.department)}
                  disabled={!editingUser.department}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save & Assign
                </button>
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
