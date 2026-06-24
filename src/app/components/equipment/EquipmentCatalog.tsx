import { useEffect, useMemo, useState } from "react";
import { Layout } from "../Layout";
import {
  Search, Settings, CheckCircle2, AlertTriangle, Wrench, X, Loader2,
  Plus, Download, Activity, Wrench as WrenchIcon, Clock, Gauge,
  HardHat, Package, ClipboardList, ChevronDown, ChevronUp, Cog
} from "lucide-react";
import { equipmentApi } from "../../services/equipmentApi";

const statusOptions = ["all", "operational", "maintenance", "idle", "retired"];

export function EquipmentCatalog() {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [types, setTypes] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedEq, setSelectedEq] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "maintenance" | "downtime" | "calibration">("overview");

  const [form, setForm] = useState({
    code: "", name: "", type: "", manufacturer: "", model: "", serialNumber: "",
    location: "", department: "", status: "operational", purchaseDate: "", warrantyExpiry: "", hourlyRate: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [maintenanceForm, setMaintenanceForm] = useState({ maintenanceType: "preventive", scheduledDate: "", technician: "", description: "", cost: "" });
  const [downtimeForm, setDowntimeForm] = useState({ startTime: "", endTime: "", reason: "", category: "mechanical", operatorNotes: "" });
  const [calibrationForm, setCalibrationForm] = useState({ calibratedAt: "", nextDue: "", calibratedBy: "", certificateNumber: "", result: "pass", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      const [eqRes, typeRes, mRes] = await Promise.all([
        equipmentApi.listEquipment(params),
        equipmentApi.types().catch(() => ({ types: [] })),
        equipmentApi.metrics().catch(() => null)
      ]);
      setEquipment(eqRes.equipment || []);
      setTypes(typeRes.types || []);
      if (mRes) setMetrics(mRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterStatus, filterType]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Required";
    if (!form.name.trim()) errs.name = "Required";
    if (!form.type.trim()) errs.type = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      await equipmentApi.createEquipment({
        code: form.code.trim(), name: form.name.trim(), type: form.type.trim(),
        manufacturer: form.manufacturer.trim() || undefined, model: form.model.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined, location: form.location.trim() || undefined,
        department: form.department.trim() || undefined, status: form.status,
        purchaseDate: form.purchaseDate || undefined, warrantyExpiry: form.warrantyExpiry || undefined,
        hourlyRate: Number(form.hourlyRate) || 0
      });
      setShowAdd(false);
      setForm({ code: "", name: "", type: "", manufacturer: "", model: "", serialNumber: "", location: "", department: "", status: "operational", purchaseDate: "", warrantyExpiry: "", hourlyRate: "" });
      fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to create equipment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) return;
    try {
      await equipmentApi.createMaintenance(selectedEq.id, {
        equipmentId: selectedEq.id, maintenanceType: maintenanceForm.maintenanceType,
        scheduledDate: maintenanceForm.scheduledDate, technician: maintenanceForm.technician.trim() || undefined,
        description: maintenanceForm.description.trim() || undefined, cost: Number(maintenanceForm.cost) || 0
      });
      setMaintenanceForm({ maintenanceType: "preventive", scheduledDate: "", technician: "", description: "", cost: "" });
      openDetail(selectedEq, "maintenance");
    } catch (err: any) {
      setError(err?.message || "Failed to add maintenance");
    }
  };

  const handleAddDowntime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) return;
    try {
      await equipmentApi.createDowntime(selectedEq.id, {
        equipmentId: selectedEq.id, startTime: downtimeForm.startTime,
        endTime: downtimeForm.endTime || undefined, reason: downtimeForm.reason.trim(),
        category: downtimeForm.category, operatorNotes: downtimeForm.operatorNotes.trim() || undefined
      });
      setDowntimeForm({ startTime: "", endTime: "", reason: "", category: "mechanical", operatorNotes: "" });
      openDetail(selectedEq, "downtime");
    } catch (err: any) {
      setError(err?.message || "Failed to add downtime");
    }
  };

  const handleAddCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) return;
    try {
      await equipmentApi.createCalibration(selectedEq.id, {
        equipmentId: selectedEq.id, calibratedAt: calibrationForm.calibratedAt,
        nextDue: calibrationForm.nextDue || undefined, calibratedBy: calibrationForm.calibratedBy.trim() || undefined,
        certificateNumber: calibrationForm.certificateNumber.trim() || undefined,
        result: calibrationForm.result, notes: calibrationForm.notes.trim() || undefined
      });
      setCalibrationForm({ calibratedAt: "", nextDue: "", calibratedBy: "", certificateNumber: "", result: "pass", notes: "" });
      openDetail(selectedEq, "calibration");
    } catch (err: any) {
      setError(err?.message || "Failed to add calibration");
    }
  };

  const openDetail = async (eq: any, tab: typeof detailTab = "overview") => {
    setSelectedEq(eq);
    setDetailTab(tab);
    setError("");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      operational: "bg-emerald-100 text-emerald-700 border-emerald-600",
      maintenance: "bg-amber-100 text-amber-700 border-amber-600",
      idle: "bg-slate-100 text-slate-700 border-slate-600",
      retired: "bg-red-100 text-red-700 border-red-600",
    };
    return map[status] || "bg-slate-100 text-slate-700 border-slate-600";
  };

  const exportCSV = () => {
    const headers = ["Code", "Name", "Type", "Manufacturer", "Model", "Serial", "Location", "Department", "Status", "Hourly Rate"];
    const rows = equipment.map(e => [e.code, e.name, e.type, e.manufacturer, e.model, e.serial_number, e.location, e.department, e.status, e.hourly_rate].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equipment_catalog.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Equipment Catalog</h1>
            <p className="text-slate-600 text-sm mt-1">Monitor and manage factory equipment</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowAdd(true); setError(""); }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
              <Plus className="w-4 h-4" />
              Add Equipment
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Units</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.total ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cog className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Operational</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.operational ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">In Maintenance</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.maintenance ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <WrenchIcon className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Availability</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics?.availabilityPercent ?? "0.0"}%</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {statusOptions.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
          {!loading && equipment.length === 0 && (
            <div className="text-center py-12 text-slate-500">No equipment found. Add a unit to get started.</div>
          )}
          {!loading && equipment.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Hourly Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => openDetail(eq)}>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{eq.code}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{eq.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-700">{eq.type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(eq.status)}`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">{eq.location || "-"}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">${eq.hourly_rate}/hr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Add Equipment</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.code ? "border-red-300" : "border-slate-200"}`} placeholder="EQ-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? "border-red-300" : "border-slate-200"}`} placeholder="Sole Press Machine" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.type ? "border-red-300" : "border-slate-200"}`} placeholder="Press" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                  <input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="SP-5000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
                  <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="SN12345" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Building A - Floor 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Production" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="idle">Idle</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate</label>
                  <input type="number" min={0} step={0.01} value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Expiry</label>
                  <input type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-slate-700 bg-slate-100 rounded-lg font-medium hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Detail Modal */}
      {selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedEq.name}</h2>
                <p className="text-sm text-slate-500">{selectedEq.code} · {selectedEq.type}</p>
              </div>
              <button onClick={() => setSelectedEq(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-3 border-b border-slate-200 flex gap-2 overflow-x-auto">
              {(["overview", "maintenance", "downtime", "calibration"] as const).map((t) => (
                <button key={t} onClick={() => setDetailTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="p-6 space-y-4">
              {detailTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <p><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadge(selectedEq.status)}`}>{selectedEq.status}</span></p>
                    <p><span className="text-slate-500">Manufacturer:</span> {selectedEq.manufacturer || "-"}</p>
                    <p><span className="text-slate-500">Model:</span> {selectedEq.model || "-"}</p>
                    <p><span className="text-slate-500">Serial:</span> {selectedEq.serial_number || "-"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <p><span className="text-slate-500">Location:</span> {selectedEq.location || "-"}</p>
                    <p><span className="text-slate-500">Department:</span> {selectedEq.department || "-"}</p>
                    <p><span className="text-slate-500">Hourly Rate:</span> ${selectedEq.hourly_rate}/hr</p>
                    <p><span className="text-slate-500">Purchase Date:</span> {selectedEq.purchase_date || "-"}</p>
                    <p><span className="text-slate-500">Warranty Expiry:</span> {selectedEq.warranty_expiry || "-"}</p>
                  </div>
                </div>
              )}

              {detailTab === "maintenance" && (
                <MaintenanceTab equipmentId={selectedEq.id} onAdd={handleAddMaintenance} form={maintenanceForm} setForm={setMaintenanceForm} />
              )}
              {detailTab === "downtime" && (
                <DowntimeTab equipmentId={selectedEq.id} onAdd={handleAddDowntime} form={downtimeForm} setForm={setDowntimeForm} />
              )}
              {detailTab === "calibration" && (
                <CalibrationTab equipmentId={selectedEq.id} onAdd={handleAddCalibration} form={calibrationForm} setForm={setCalibrationForm} />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function MaintenanceTab({ equipmentId, onAdd, form, setForm }: { equipmentId: string; onAdd: (e: React.FormEvent) => Promise<void>; form: any; setForm: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await equipmentApi.listMaintenance(equipmentId);
      setItems(data.maintenance || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [equipmentId]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { scheduled: "bg-blue-100 text-blue-700", in_progress: "bg-amber-100 text-amber-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700" };
    return map[s] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
        {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Add Maintenance Record
      </button>
      {showForm && (
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
            <select value={form.maintenanceType} onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="preventive">Preventive</option>
              <option value="corrective">Corrective</option>
              <option value="calibration">Calibration</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Scheduled Date</label>
            <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Technician</label>
            <input value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
            <input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Description of work" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </form>
      )}
      {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>}
      {!loading && items.length === 0 && <div className="text-sm text-slate-500 py-4">No maintenance records.</div>}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left py-2 px-3 font-medium text-slate-700">Type</th><th className="text-left py-2 px-3 font-medium text-slate-700">Scheduled</th><th className="text-left py-2 px-3 font-medium text-slate-700">Status</th><th className="text-left py-2 px-3 font-medium text-slate-700">Technician</th><th className="text-left py-2 px-3 font-medium text-slate-700">Cost</th></tr></thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="py-2 px-3">{m.maintenance_type}</td>
                  <td className="py-2 px-3">{m.scheduled_date}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span></td>
                  <td className="py-2 px-3">{m.technician || "-"}</td>
                  <td className="py-2 px-3">${m.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DowntimeTab({ equipmentId, onAdd, form, setForm }: { equipmentId: string; onAdd: (e: React.FormEvent) => Promise<void>; form: any; setForm: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const data = await equipmentApi.listDowntime(equipmentId); setItems(data.downtime || []); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [equipmentId]);

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
        {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Add Downtime Record
      </button>
      {showForm && (
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label><input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">End Time</label><input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Reason</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Reason" /></div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mechanical">Mechanical</option><option value="electrical">Electrical</option><option value="operator">Operator</option><option value="material">Material</option><option value="planned">Planned</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Operator Notes</label><input value={form.operatorNotes} onChange={(e) => setForm({ ...form, operatorNotes: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Notes" /></div>
          <div className="md:col-span-2 flex justify-end"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button></div>
        </form>
      )}
      {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>}
      {!loading && items.length === 0 && <div className="text-sm text-slate-500 py-4">No downtime records.</div>}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left py-2 px-3 font-medium text-slate-700">Start</th><th className="text-left py-2 px-3 font-medium text-slate-700">End</th><th className="text-left py-2 px-3 font-medium text-slate-700">Reason</th><th className="text-left py-2 px-3 font-medium text-slate-700">Category</th><th className="text-left py-2 px-3 font-medium text-slate-700">Impact (min)</th></tr></thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="py-2 px-3">{new Date(d.start_time).toLocaleString()}</td>
                  <td className="py-2 px-3">{d.end_time ? new Date(d.end_time).toLocaleString() : "Ongoing"}</td>
                  <td className="py-2 px-3">{d.reason}</td>
                  <td className="py-2 px-3">{d.category}</td>
                  <td className="py-2 px-3">{d.impact_minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CalibrationTab({ equipmentId, onAdd, form, setForm }: { equipmentId: string; onAdd: (e: React.FormEvent) => Promise<void>; form: any; setForm: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { const data = await equipmentApi.listCalibration(equipmentId); setItems(data.calibrations || []); } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, [equipmentId]);

  const resultBadge = (r: string) => {
    const map: Record<string, string> = { pass: "bg-emerald-100 text-emerald-700", fail: "bg-red-100 text-red-700", adjustment: "bg-amber-100 text-amber-700" };
    return map[r] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
        {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Add Calibration Record
      </button>
      {showForm && (
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Calibrated At</label><input type="datetime-local" value={form.calibratedAt} onChange={(e) => setForm({ ...form, calibratedAt: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Next Due</label><input type="datetime-local" value={form.nextDue} onChange={(e) => setForm({ ...form, nextDue: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Calibrated By</label><input value={form.calibratedBy} onChange={(e) => setForm({ ...form, calibratedBy: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" /></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Certificate #</label><input value={form.certificateNumber} onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="CERT-001" /></div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Result</label>
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pass">Pass</option><option value="fail">Fail</option><option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Notes" /></div>
          <div className="md:col-span-2 flex justify-end"><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button></div>
        </form>
      )}
      {loading && <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>}
      {!loading && items.length === 0 && <div className="text-sm text-slate-500 py-4">No calibration records.</div>}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left py-2 px-3 font-medium text-slate-700">Date</th><th className="text-left py-2 px-3 font-medium text-slate-700">Next Due</th><th className="text-left py-2 px-3 font-medium text-slate-700">Result</th><th className="text-left py-2 px-3 font-medium text-slate-700">By</th><th className="text-left py-2 px-3 font-medium text-slate-700">Certificate</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-2 px-3">{new Date(c.calibrated_at).toLocaleString()}</td>
                  <td className="py-2 px-3">{c.next_due ? new Date(c.next_due).toLocaleString() : "-"}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultBadge(c.result)}`}>{c.result}</span></td>
                  <td className="py-2 px-3">{c.calibrated_by || "-"}</td>
                  <td className="py-2 px-3">{c.certificate_number || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

