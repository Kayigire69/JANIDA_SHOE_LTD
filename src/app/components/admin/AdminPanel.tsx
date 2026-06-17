import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Settings, Users, Package, Wrench, ClipboardCheck, Shield, Database,
  Search, Loader2, ChevronLeft, ChevronRight, Plus, X, Edit3, Trash2,
  Lock, Unlock, Activity, Server, HardDrive, AlertTriangle, CheckCircle2,
  PlusCircle, ArrowLeft, ListOrdered, Cog
} from "lucide-react";
import { adminApi } from "../../services/adminApi";

const tabs = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "products", label: "Products & BOM", icon: Package },
  { id: "lines", label: "Production Lines", icon: Server },
  { id: "quality", label: "Quality Standards", icon: ClipboardCheck },
  { id: "settings", label: "System Settings", icon: Settings },
  { id: "backups", label: "Backups", icon: Database },
] as const;

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Overview
  const [overview, setOverview] = useState<any>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [userFilters, setUserFilters] = useState({ search: "", role: "", department: "" });
  const [editingUser, setEditingUser] = useState<any>(null);

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productPagination, setProductPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Production lines
  const [productionLines, setProductionLines] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [lineMachines, setLineMachines] = useState<any[]>([]);
  const [showAddLine, setShowAddLine] = useState(false);
  const [lineForm, setLineForm] = useState({ lineCode: "", name: "", description: "", capacityPerHour: "", supervisorId: "" });

  // Quality standards
  const [qualityStandards, setQualityStandards] = useState<any[]>([]);
  const [editingStandard, setEditingStandard] = useState<any>(null);
  const [showStandardForm, setShowStandardForm] = useState(false);

  // Settings
  const [settings, setSettings] = useState<any[]>([]);
  const [editingSetting, setEditingSetting] = useState<any>(null);

  // Backups
  const [backups, setBackups] = useState<any[]>([]);
  const [backupName, setBackupName] = useState("");
  const [backupType, setBackupType] = useState("full");

  const fetchOverview = async () => {
    try {
      const data = await adminApi.getSystemOverview();
      setOverview(data);
    } catch (err: any) {
      console.error("Overview error:", err);
    }
  };

  const fetchUsers = async (page = userPagination.page) => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(userPagination.limit) };
      if (userFilters.search) params.search = userFilters.search;
      if (userFilters.role) params.role = userFilters.role;
      if (userFilters.department) params.department = userFilters.department;
      const data = await adminApi.listUsers(params);
      setUsers(data.users || []);
      setUserPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) { setError(err?.message || "Failed to load users"); }
    finally { setLoading(false); }
  };

  const fetchProducts = async (page = productPagination.page) => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(productPagination.limit) };
      if (productSearch) params.search = productSearch;
      const data = await adminApi.listProducts(params);
      setProducts(data.products || []);
      setProductPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) { setError(err?.message || "Failed to load products"); }
    finally { setLoading(false); }
  };

  const fetchProductionLines = async () => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.listProductionLines();
      setProductionLines(data.lines || []);
    } catch (err: any) { setError(err?.message || "Failed to load production lines"); }
    finally { setLoading(false); }
  };

  const fetchQualityStandards = async () => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.listQualityStandards();
      setQualityStandards(data.standards || []);
    } catch (err: any) { setError(err?.message || "Failed to load quality standards"); }
    finally { setLoading(false); }
  };

  const fetchSettings = async () => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.listSystemSettings();
      setSettings(data.settings || []);
    } catch (err: any) { setError(err?.message || "Failed to load settings"); }
    finally { setLoading(false); }
  };

  const fetchBackups = async () => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.listBackups();
      setBackups(data.backups || []);
    } catch (err: any) { setError(err?.message || "Failed to load backups"); }
    finally { setLoading(false); }
  };

  const fetchRawMaterials = async () => {
    try { const data = await adminApi.listRawMaterials(); setRawMaterials(data.materials || []); } catch {}
  };

  const fetchMachines = async () => {
    try { const data = await adminApi.listMachines(); setMachines(data.machines || []); } catch {}
  };

  const fetchSupervisors = async () => {
    try { const data = await adminApi.listSupervisors(); setSupervisors(data.employees || []); } catch {}
  };

  useEffect(() => { fetchOverview(); }, []);

  useEffect(() => {
    setError("");
    if (activeTab === "overview") fetchOverview();
    if (activeTab === "users") fetchUsers(1);
    if (activeTab === "products") { fetchProducts(1); fetchRawMaterials(); }
    if (activeTab === "lines") { fetchProductionLines(); fetchMachines(); fetchSupervisors(); }
    if (activeTab === "quality") fetchQualityStandards();
    if (activeTab === "settings") fetchSettings();
    if (activeTab === "backups") fetchBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleUserRoleUpdate = async (id: string, role: string, department: string) => {
    try { await adminApi.updateUserRole(id, { role, department }); fetchUsers(); setEditingUser(null); }
    catch (err: any) { setError(err?.message || "Update failed"); }
  };

  const handleToggleLock = async (id: string, locked: boolean) => {
    try { await adminApi.toggleUserLock(id, !locked); fetchUsers(); }
    catch (err: any) { setError(err?.message || "Lock toggle failed"); }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    try { await adminApi.createProduct(newProductName.trim()); setNewProductName(""); setShowAddProduct(false); fetchProducts(); }
    catch (err: any) { setError(err?.message || "Create failed"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try { await adminApi.deleteProduct(id); fetchProducts(); }
    catch (err: any) { setError(err?.message || "Delete failed"); }
  };

  const handleAddBomItem = async (productId: string, rawMaterialId: string, quantity: string) => {
    try {
      await adminApi.addBomItem(productId, rawMaterialId, Number(quantity));
      const data = await adminApi.getBomForProduct(productId);
      setBomItems(data.items || []);
    } catch (err: any) { setError(err?.message || "Add BOM item failed"); }
  };

  const handleRemoveBomItem = async (bomId: string, productId: string) => {
    if (!window.confirm("Remove this BOM item?")) return;
    try { await adminApi.removeBomItem(bomId); const data = await adminApi.getBomForProduct(productId); setBomItems(data.items || []); }
    catch (err: any) { setError(err?.message || "Remove failed"); }
  };

  const handleCreateLine = async () => {
    try {
      await adminApi.createProductionLine({
        lineCode: lineForm.lineCode, name: lineForm.name, description: lineForm.description,
        capacityPerHour: Number(lineForm.capacityPerHour), supervisorId: lineForm.supervisorId || null
      });
      setShowAddLine(false); setLineForm({ lineCode: "", name: "", description: "", capacityPerHour: "", supervisorId: "" });
      fetchProductionLines();
    } catch (err: any) { setError(err?.message || "Create failed"); }
  };

  const handleDeleteLine = async (id: string) => {
    if (!window.confirm("Delete this production line?")) return;
    try { await adminApi.deleteProductionLine(id); fetchProductionLines(); }
    catch (err: any) { setError(err?.message || "Delete failed"); }
  };

  const handleAddMachineToLine = async (lineId: string, machineId: string, seq: string) => {
    try { await adminApi.addMachineToLine(lineId, machineId, Number(seq) || 0); const data = await adminApi.getLineMachines(lineId); setLineMachines(data.machines || []); }
    catch (err: any) { setError(err?.message || "Add failed"); }
  };

  const handleRemoveMachineFromLine = async (lineId: string, assignmentId: string) => {
    if (!window.confirm("Remove machine from line?")) return;
    try { await adminApi.removeMachineFromLine(lineId, assignmentId); const data = await adminApi.getLineMachines(lineId); setLineMachines(data.machines || []); }
    catch (err: any) { setError(err?.message || "Remove failed"); }
  };

  const handleSaveStandard = async () => {
    try {
      if (editingStandard?.id) { await adminApi.updateQualityStandard(editingStandard.id, editingStandard); }
      else { await adminApi.createQualityStandard(editingStandard); }
      setShowStandardForm(false); setEditingStandard(null); fetchQualityStandards();
    } catch (err: any) { setError(err?.message || "Save failed"); }
  };

  const handleDeleteStandard = async (id: string) => {
    if (!window.confirm("Delete this quality standard?")) return;
    try { await adminApi.deleteQualityStandard(id); fetchQualityStandards(); }
    catch (err: any) { setError(err?.message || "Delete failed"); }
  };

  const handleSaveSetting = async (id: string, value: string) => {
    try { await adminApi.updateSystemSetting(id, value); setEditingSetting(null); fetchSettings(); }
    catch (err: any) { setError(err?.message || "Update failed"); }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) return;
    try { await adminApi.createBackup(backupName.trim(), backupType); setBackupName(""); fetchBackups(); }
    catch (err: any) { setError(err?.message || "Backup failed"); }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!window.confirm("Delete this backup record?")) return;
    try { await adminApi.deleteBackup(id); fetchBackups(); }
    catch (err: any) { setError(err?.message || "Delete failed"); }
  };

  const roleOptions = ["production_manager", "inventory_manager", "quality_officer", "sales_staff", "administrator"];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin & System Management</h1>
          <p className="text-slate-600 text-sm mt-1">System administration and configuration</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setSelectedProduct(null); setSelectedLine(null); setActiveTab(t.id); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === t.id ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: overview?.totalUsers ?? 0, icon: Users, color: "blue" },
              { label: "Active Employees", value: overview?.activeEmployees ?? 0, icon: Shield, color: "emerald" },
              { label: "Operational Equipment", value: overview?.operationalEquipment ?? 0, icon: Cog, color: "indigo" },
              { label: "Active Batches", value: overview?.activeBatches ?? 0, icon: Activity, color: "amber" },
              { label: "Pending Orders", value: overview?.pendingOrders ?? 0, icon: Package, color: "orange" },
              { label: "Open Security Alerts", value: overview?.openAlerts ?? 0, icon: AlertTriangle, color: "red" },
              { label: "Audit Logs (24h)", value: overview?.auditLogs24h ?? 0, icon: ClipboardCheck, color: "teal" },
            ].map((m) => (
              <div key={m.label} className={`bg-white rounded-xl shadow-md p-5 border-l-4 border-${m.color}-600`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">{m.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{m.value}</p>
                  </div>
                  <div className={`w-10 h-10 bg-${m.color}-100 rounded-lg flex items-center justify-center`}>
                    <m.icon className={`w-5 h-5 text-${m.color}-600`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={userFilters.search} onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={userFilters.role} onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="">All Roles</option>
                {roleOptions.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
              <button onClick={() => fetchUsers(1)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Filter</button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && users.length === 0 && <div className="text-center py-12 text-slate-500">No users found.</div>}
            {!loading && users.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">{u.full_name}<br /><span className="text-xs text-slate-500">{u.employee_id}</span></td>
                          <td className="py-3 px-4">{u.email}</td>
                          <td className="py-3 px-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">{u.role.replace(/_/g, " ")}</span></td>
                          <td className="py-3 px-4 text-slate-600">{u.department}</td>
                          <td className="py-3 px-4">
                            {u.locked_until && new Date(u.locked_until) > new Date() ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Locked</span>
                            ) : (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Active</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => setEditingUser(u)} className="p-1.5 bg-slate-100 rounded hover:bg-slate-200"><Edit3 className="w-4 h-4 text-slate-600" /></button>
                              <button onClick={() => handleToggleLock(u.id, !!(u.locked_until && new Date(u.locked_until) > new Date()))} className="p-1.5 bg-slate-100 rounded hover:bg-slate-200">
                                {u.locked_until && new Date(u.locked_until) > new Date() ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-red-600" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {users.length} of {userPagination.total} users</p>
                  <div className="flex gap-2">
                    <button disabled={userPagination.page <= 1} onClick={() => fetchUsers(userPagination.page - 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {userPagination.page}</span>
                    <button disabled={userPagination.page * userPagination.limit >= userPagination.total} onClick={() => fetchUsers(userPagination.page + 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Edit User</h2><button onClick={() => setEditingUser(null)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <div><label className="text-sm font-medium text-slate-700">Role</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg mt-1">
                    {roleOptions.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div><label className="text-sm font-medium text-slate-700">Department</label>
                  <input value={editingUser.department} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg mt-1" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleUserRoleUpdate(editingUser.id, editingUser.role, editingUser.department)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && !selectedProduct && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={() => fetchProducts(1)} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
              <button onClick={() => setShowAddProduct(true)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
            </div>

            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && products.length === 0 && <div className="text-center py-12 text-slate-500">No products found.</div>}
            {!loading && products.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr></thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedProduct(p); adminApi.getBomForProduct(p.id).then((d) => setBomItems(d.items || [])); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">View BOM</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {products.length} of {productPagination.total} products</p>
                  <div className="flex gap-2">
                    <button disabled={productPagination.page <= 1} onClick={() => fetchProducts(productPagination.page - 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {productPagination.page}</span>
                    <button disabled={productPagination.page * productPagination.limit >= productPagination.total} onClick={() => fetchProducts(productPagination.page + 1)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Add Product</h2><button onClick={() => setShowAddProduct(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button></div>
              <input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Product name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreateProduct} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create</button>
                <button onClick={() => setShowAddProduct(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* BOM Detail */}
        {activeTab === "products" && selectedProduct && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><ArrowLeft className="w-4 h-4" /></button>
                <div><h2 className="text-lg font-semibold text-slate-900">{selectedProduct.name}</h2><p className="text-sm text-slate-500">Bill of Materials</p></div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Add BOM Item</h3>
              <div className="flex gap-3">
                <select id="bom-mat" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                  <option value="">Select raw material</option>
                  {rawMaterials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.material_code})</option>)}
                </select>
                <input id="bom-qty" type="number" step="0.01" placeholder="Qty/pair" className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                <button onClick={() => { const mat = (document.getElementById("bom-mat") as HTMLSelectElement)?.value; const qty = (document.getElementById("bom-qty") as HTMLInputElement)?.value; if (mat && qty) handleAddBomItem(selectedProduct.id, mat, qty); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><PlusCircle className="w-4 h-4" /> Add</button>
              </div>
            </div>

            {bomItems.length === 0 && <div className="text-center py-8 text-slate-500">No BOM items configured.</div>}
            {bomItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Material</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Quantity/Pair</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Unit</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr></thead>
                  <tbody>
                    {bomItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.material_code}</td>
                        <td className="py-3 px-4">{item.quantity_per_pair}</td>
                        <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                        <td className="py-3 px-4"><button onClick={() => handleRemoveBomItem(item.id, selectedProduct.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Production Lines Tab */}
        {activeTab === "lines" && !selectedLine && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex justify-between">
              <button onClick={() => setShowAddLine(true)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Production Line</button>
            </div>
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && productionLines.length === 0 && <div className="text-center py-12 text-slate-500">No production lines configured.</div>}
            {!loading && productionLines.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productionLines.map((line) => (
                  <div key={line.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{line.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${line.status === "active" ? "bg-emerald-100 text-emerald-700" : line.status === "maintenance" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{line.status}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Code: {line.line_code}</p>
                    <p className="text-sm text-slate-600 mb-1">Capacity: {line.capacity_per_hour}/hr</p>
                    {line.supervisor_name && <p className="text-sm text-slate-600 mb-3">Supervisor: {line.supervisor_name}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedLine(line); adminApi.getLineMachines(line.id).then((d) => setLineMachines(d.machines || [])); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">Manage Machines</button>
                      <button onClick={() => handleDeleteLine(line.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Line Modal */}
        {showAddLine && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Add Production Line</h2><button onClick={() => setShowAddLine(false)} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button></div>
              <div className="space-y-3">
                <input value={lineForm.lineCode} onChange={(e) => setLineForm({ ...lineForm, lineCode: e.target.value })} placeholder="Line code" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={lineForm.name} onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })} placeholder="Line name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={lineForm.capacityPerHour} onChange={(e) => setLineForm({ ...lineForm, capacityPerHour: e.target.value })} type="number" placeholder="Capacity per hour" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <select value={lineForm.supervisorId} onChange={(e) => setLineForm({ ...lineForm, supervisorId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="">No supervisor</option>
                  {supervisors.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.employee_code})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreateLine} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Create</button>
                <button onClick={() => setShowAddLine(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Line Machines Detail */}
        {activeTab === "lines" && selectedLine && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedLine(null)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"><ArrowLeft className="w-4 h-4" /></button>
                <div><h2 className="text-lg font-semibold text-slate-900">{selectedLine.name}</h2><p className="text-sm text-slate-500">Machines</p></div>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Add Machine</h3>
              <div className="flex gap-3">
                <select id="line-machine" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                  <option value="">Select machine</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                </select>
                <input id="line-seq" type="number" placeholder="Sequence" className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                <button onClick={() => { const mid = (document.getElementById("line-machine") as HTMLSelectElement)?.value; const seq = (document.getElementById("line-seq") as HTMLInputElement)?.value; if (mid) handleAddMachineToLine(selectedLine.id, mid, seq); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><PlusCircle className="w-4 h-4" /> Add</button>
              </div>
            </div>
            {lineMachines.length === 0 && <div className="text-center py-8 text-slate-500">No machines assigned.</div>}
            {lineMachines.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Sequence</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Machine</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr></thead>
                  <tbody>
                    {lineMachines.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{m.sequence_order}</td>
                        <td className="py-3 px-4">{m.machine_name}</td>
                        <td className="py-3 px-4 text-slate-600">{m.machine_code}</td>
                        <td className="py-3 px-4"><button onClick={() => handleRemoveMachineFromLine(selectedLine.id, m.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quality Standards Tab */}
        {activeTab === "quality" && !showStandardForm && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex justify-between">
              <button onClick={() => { setEditingStandard({}); setShowStandardForm(true); }} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Standard</button>
            </div>
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && qualityStandards.length === 0 && <div className="text-center py-12 text-slate-500">No quality standards configured.</div>}
            {!loading && qualityStandards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qualityStandards.map((s) => (
                  <div key={s.id} className={`border rounded-lg p-4 ${s.is_active ? "border-slate-200" : "border-slate-200 opacity-60"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{s.standard_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{s.is_active ? "Active" : "Inactive"}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{s.product_type || "All products"}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                      <div>Size Accuracy: {s.size_accuracy_min}</div>
                      <div>Stitching: {s.stitching_quality_min}</div>
                      <div>Material: {s.material_integrity_min}</div>
                      <div>Color: {s.color_consistency_min}</div>
                      <div>Sole Adhesion: {s.sole_adhesion_min}</div>
                      <div>Dimension: {s.dimension_tolerance_min}</div>
                      <div className="col-span-2">Max Defect Rate: {s.max_defect_rate}%</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingStandard(s); setShowStandardForm(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100">Edit</button>
                      <button onClick={() => handleDeleteStandard(s.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Standard Form Modal */}
        {showStandardForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
              <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{editingStandard?.id ? "Edit Quality Standard" : "Add Quality Standard"}</h2><button onClick={() => { setShowStandardForm(false); setEditingStandard(null); }} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={editingStandard?.standardName || ""} onChange={(e) => setEditingStandard({ ...editingStandard, standardName: e.target.value })} placeholder="Standard name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.productType || ""} onChange={(e) => setEditingStandard({ ...editingStandard, productType: e.target.value })} placeholder="Product type" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.sizeAccuracyMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, sizeAccuracyMin: Number(e.target.value) })} type="number" placeholder="Size accuracy min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.stitchingQualityMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, stitchingQualityMin: Number(e.target.value) })} type="number" placeholder="Stitching quality min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.materialIntegrityMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, materialIntegrityMin: Number(e.target.value) })} type="number" placeholder="Material integrity min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.colorConsistencyMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, colorConsistencyMin: Number(e.target.value) })} type="number" placeholder="Color consistency min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.soleAdhesionMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, soleAdhesionMin: Number(e.target.value) })} type="number" placeholder="Sole adhesion min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.dimensionToleranceMin ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, dimensionToleranceMin: Number(e.target.value) })} type="number" placeholder="Dimension tolerance min" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <input value={editingStandard?.maxDefectRate ?? ""} onChange={(e) => setEditingStandard({ ...editingStandard, maxDefectRate: Number(e.target.value) })} type="number" placeholder="Max defect rate %" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={editingStandard?.isActive ?? true} onChange={(e) => setEditingStandard({ ...editingStandard, isActive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> Active
                </label>
              </div>
              <textarea value={editingStandard?.description || ""} onChange={(e) => setEditingStandard({ ...editingStandard, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveStandard} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save</button>
                <button onClick={() => { setShowStandardForm(false); setEditingStandard(null); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && settings.length === 0 && <div className="text-center py-12 text-slate-500">No system settings found.</div>}
            {!loading && settings.length > 0 && (
              <div className="space-y-3">
                {settings.map((s) => (
                  <div key={s.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{s.setting_key}</h3>
                      <p className="text-sm text-slate-500">{s.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingSetting?.id === s.id ? (
                        <>
                          <input value={editingSetting.settingValue} onChange={(e) => setEditingSetting({ ...editingSetting, settingValue: e.target.value })} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64" />
                          <button onClick={() => handleSaveSetting(s.id, editingSetting.settingValue)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700">Save</button>
                          <button onClick={() => setEditingSetting(null)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-slate-700 font-mono bg-slate-50 px-3 py-1.5 rounded">{s.setting_value}</span>
                          <button onClick={() => setEditingSetting(s)} className="p-1.5 bg-slate-100 rounded hover:bg-slate-200"><Edit3 className="w-4 h-4 text-slate-600" /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backups Tab */}
        {activeTab === "backups" && (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Create Backup</h3>
              <div className="flex gap-3">
                <input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="Backup name" className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                <select value={backupType} onChange={(e) => setBackupType(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                </select>
                <button onClick={handleCreateBackup} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1"><PlusCircle className="w-4 h-4" /> Create</button>
              </div>
            </div>
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
            {!loading && backups.length === 0 && <div className="text-center py-12 text-slate-500">No backups found.</div>}
            {!loading && backups.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200"><tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr></thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">{b.backup_name}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">{b.backup_type}</span></td>
                        <td className="py-3 px-4">
                          {b.status === "completed" ? <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                            : b.status === "running" ? <span className="flex items-center gap-1 text-amber-700 text-xs font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Running</span>
                            : <span className="flex items-center gap-1 text-red-700 text-xs font-medium"><X className="w-3 h-3" /> Failed</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{b.file_size_bytes ? `${(b.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : "-"}</td>
                        <td className="py-3 px-4 text-slate-600">{new Date(b.started_at).toLocaleString()}</td>
                        <td className="py-3 px-4"><button onClick={() => handleDeleteBackup(b.id)} className="p-1.5 bg-red-50 rounded hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
