import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import {
  Cpu, Users, Plus, Trash2, RefreshCw, Loader2, Save,
  UserPlus, X, Settings, CheckCircle2, AlertCircle, Search
} from "lucide-react";
import { productionApi } from "../../services/productionApi";
import { toast } from "sonner";

type ActiveModal = "add-machine" | "add-worker" | null;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    maintenance: "bg-amber-100 text-amber-700 border-amber-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] || map.inactive}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : status === "maintenance" ? "bg-amber-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
};

export function ProductionWorkforce() {
  const [machines, setMachines] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [machineSearch, setMachineSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  const [machineForm, setMachineForm] = useState({ code: "", name: "", status: "active" });
  const [workerForm, setWorkerForm] = useState({
    workerId: "", name: "", role: "Production Operator",
    department: "Production", email: "", phone: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const [mRes, wRes] = await Promise.all([
        productionApi.listMachines().catch(() => ({ machines: [] })),
        productionApi.listProductionWorkers().catch(() => ({ workers: [] })),
      ]);
      setMachines(mRes.machines || []);
      setWorkers(wRes.workers || []);
    } catch {
      toast.error("Failed to load workforce data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.code.trim() || !machineForm.name.trim()) {
      toast.error("Code and name are required.");
      return;
    }
    setSubmitting(true);
    try {
      await productionApi.createMachine({ code: machineForm.code.trim(), name: machineForm.name.trim(), status: machineForm.status });
      setMachineForm({ code: "", name: "", status: "active" });
      toast.success("Machine added successfully!");
      setActiveModal(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add machine");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (!window.confirm("Delete this machine? This cannot be undone.")) return;
    try {
      await productionApi.deleteMachine(id);
      toast.success("Machine removed");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete machine");
    }
  };

  const handleToggleMachineStatus = async (id: string, current: string) => {
    const next = current === "active" ? "maintenance" : "active";
    try {
      await productionApi.updateMachine(id, { status: next });
      toast.success("Status updated");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.workerId.trim() || !workerForm.name.trim() || !workerForm.email.trim()) {
      toast.error("Worker ID, name, and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      await productionApi.createProductionWorker({
        workerId: workerForm.workerId.trim(),
        name: workerForm.name.trim(),
        role: workerForm.role,
        department: workerForm.department,
        email: workerForm.email.trim(),
        phone: workerForm.phone.trim() || undefined,
      });
      setWorkerForm({ workerId: "", name: "", role: "Production Operator", department: "Production", email: "", phone: "" });
      toast.success("Worker registered!");
      setActiveModal(null);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to add worker");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!window.confirm("Remove this worker? This cannot be undone.")) return;
    try {
      await productionApi.deleteProductionWorker(id);
      toast.success("Worker removed");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete worker");
    }
  };

  const filteredMachines = machines.filter(m =>
    m.name?.toLowerCase().includes(machineSearch.toLowerCase()) ||
    m.code?.toLowerCase().includes(machineSearch.toLowerCase())
  );

  const filteredWorkers = workers.filter(w =>
    w.name?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.worker_id?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.role?.toLowerCase().includes(workerSearch.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Production Workforce</h1>
            <p className="text-slate-500 text-sm mt-1">Manage production machines and workers. Add them here first, then assign in the Production Plan.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveModal("add-machine")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgb(37,99,235,0.3)] hover:shadow-[0_6px_18px_rgb(37,99,235,0.4)] transition-all hover:-translate-y-0.5"
            >
              <Cpu className="w-4 h-4" /> Manage Machines
            </button>
            <button
              onClick={() => setActiveModal("add-worker")}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgb(124,58,237,0.3)] hover:shadow-[0_6px_18px_rgb(124,58,237,0.4)] transition-all hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" /> Manage Workers
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Machines", value: machines.length, icon: Cpu, color: "blue" },
            { label: "Active Machines", value: machines.filter(m => m.status === "active").length, icon: CheckCircle2, color: "emerald" },
            { label: "Total Workers", value: workers.length, icon: Users, color: "violet" },
            { label: "In Maintenance", value: machines.filter(m => m.status === "maintenance").length, icon: AlertCircle, color: "amber" },
          ].map((stat) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              emerald: "bg-emerald-50 text-emerald-600",
              violet: "bg-violet-50 text-violet-600",
              amber: "bg-amber-50 text-amber-600",
            };
            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{loading ? "—" : stat.value}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Machines Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" /> Production Machines
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{machines.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={machineSearch}
                  onChange={e => setMachineSearch(e.target.value)}
                  placeholder="Search machines..."
                  className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button onClick={load} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredMachines.length === 0 ? (
              <div className="text-center py-16">
                <Cpu className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">No machines found.</p>
                <p className="text-slate-400 text-sm mt-1">Click <strong>Manage Machines</strong> to add your first machine.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMachines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">{m.code}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-slate-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">{statusBadge(m.status)}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleMachineStatus(m.id, m.status)}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          >
                            {m.status === "active" ? "Set Maintenance" : "Set Active"}
                          </button>
                          <button
                            onClick={() => handleDeleteMachine(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" /> Production Workers
              <span className="ml-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">{workers.length}</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={workerSearch}
                  onChange={e => setWorkerSearch(e.target.value)}
                  placeholder="Search workers..."
                  className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button onClick={load} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-semibold">No workers found.</p>
                <p className="text-slate-400 text-sm mt-1">Click <strong>Manage Workers</strong> to register your first worker.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Worker</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="text-left py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="text-right py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredWorkers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm">
                            {w.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900">{w.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600 text-xs">{w.worker_id}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-semibold">{w.role}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{w.department}</td>
                      <td className="py-4 px-6 text-slate-500">{w.email}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDeleteWorker(w.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove worker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* Add Machine Modal */}
          {activeModal === "add-machine" && (
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Add New Machine</h2>
                    <p className="text-xs text-slate-500">Register a production machine</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleAddMachine} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Code <span className="text-red-500">*</span></label>
                    <input
                      required value={machineForm.code}
                      onChange={e => setMachineForm({ ...machineForm, code: e.target.value })}
                      placeholder="e.g. M-001"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={machineForm.status}
                      onChange={e => setMachineForm({ ...machineForm, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Machine Name <span className="text-red-500">*</span></label>
                  <input
                    required value={machineForm.name}
                    onChange={e => setMachineForm({ ...machineForm, name: e.target.value })}
                    placeholder="e.g. Cut Master 2000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Machine
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add Worker Modal */}
          {activeModal === "add-worker" && (
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Register New Worker</h2>
                    <p className="text-xs text-slate-500">Add a production worker to the system</p>
                  </div>
                </div>
                <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleAddWorker} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Worker ID <span className="text-red-500">*</span></label>
                    <input
                      required value={workerForm.workerId}
                      onChange={e => setWorkerForm({ ...workerForm, workerId: e.target.value })}
                      placeholder="e.g. EMP-010"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input
                      required value={workerForm.name}
                      onChange={e => setWorkerForm({ ...workerForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                    <input
                      required type="email" value={workerForm.email}
                      onChange={e => setWorkerForm({ ...workerForm, email: e.target.value })}
                      placeholder="worker@company.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel" value={workerForm.phone}
                      onChange={e => setWorkerForm({ ...workerForm, phone: e.target.value })}
                      placeholder="+250 78x xxx xxx"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                    <select
                      value={workerForm.role}
                      onChange={e => setWorkerForm({ ...workerForm, role: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    >
                      <option>Production Operator</option>
                      <option>Production Manager</option>
                      <option>Quality Inspector</option>
                      <option>Machine Operator</option>
                      <option>Maintenance Technician</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                    <select
                      value={workerForm.department}
                      onChange={e => setWorkerForm({ ...workerForm, department: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                    >
                      <option>Production</option>
                      <option>Quality Assurance</option>
                      <option>Inventory &amp; Logistics</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Register Worker
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
