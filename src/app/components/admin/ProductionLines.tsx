import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Loader2, Plus, X, Trash2, ArrowLeft, PlusCircle, Server
} from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function ProductionLines() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Production lines & assignments
  const [productionLines, setProductionLines] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [lineMachines, setLineMachines] = useState<any[]>([]);
  const [showAddLine, setShowAddLine] = useState(false);
  const [lineForm, setLineForm] = useState({ lineCode: "", name: "", description: "", capacityPerHour: "", supervisorId: "" });

  const fetchProductionLines = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listProductionLines();
      setProductionLines(data.lines || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load production lines");
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const data = await adminApi.listMachines();
      setMachines(data.machines || []);
    } catch {}
  };

  const fetchSupervisors = async () => {
    try {
      const data = await adminApi.listSupervisors();
      setSupervisors(data.employees || []);
    } catch {}
  };

  useEffect(() => {
    fetchProductionLines();
    fetchMachines();
    fetchSupervisors();
  }, []);

  const handleCreateLine = async () => {
    try {
      await adminApi.createProductionLine({
        lineCode: lineForm.lineCode,
        name: lineForm.name,
        description: lineForm.description,
        capacityPerHour: Number(lineForm.capacityPerHour),
        supervisorId: lineForm.supervisorId || null
      });
      setShowAddLine(false);
      setLineForm({ lineCode: "", name: "", description: "", capacityPerHour: "", supervisorId: "" });
      fetchProductionLines();
    } catch (err: any) {
      setError(err?.message || "Create line failed");
    }
  };

  const handleDeleteLine = async (id: string) => {
    if (!window.confirm("Delete this production line?")) return;
    try {
      await adminApi.deleteProductionLine(id);
      fetchProductionLines();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  const handleAddMachineToLine = async (lineId: string, machineId: string, seq: string) => {
    try {
      await adminApi.addMachineToLine(lineId, machineId, Number(seq) || 0);
      const data = await adminApi.getLineMachines(lineId);
      setLineMachines(data.machines || []);
    } catch (err: any) {
      setError(err?.message || "Add machine failed");
    }
  };

  const handleRemoveMachineFromLine = async (lineId: string, assignmentId: string) => {
    if (!window.confirm("Remove machine from line?")) return;
    try {
      await adminApi.removeMachineFromLine(lineId, assignmentId);
      const data = await adminApi.getLineMachines(lineId);
      setLineMachines(data.machines || []);
    } catch (err: any) {
      setError(err?.message || "Remove failed");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Production Lines</h1>
          <p className="text-slate-600 text-sm mt-1">Configure active production lines, hourly capacity, and machine sequence mapping</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {!selectedLine ? (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-800">Operational Lines</h2>
              <button
                onClick={() => setShowAddLine(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Production Line
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {!loading && productionLines.length === 0 && (
              <div className="text-center py-12 text-slate-500">No production lines configured.</div>
            )}

            {!loading && productionLines.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productionLines.map((line) => (
                  <div key={line.id} className="border border-slate-200 rounded-xl p-5 hover:bg-slate-50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-600" />
                        {line.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        line.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : line.status === "maintenance"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}>{line.status}</span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 mb-4">
                      <p>Line Code: <span className="font-semibold font-mono">{line.line_code}</span></p>
                      <p>Capacity: <span className="font-semibold text-slate-800">{line.capacity_per_hour}/hr</span></p>
                      {line.supervisor_name && <p>Supervisor: <span className="font-semibold text-slate-800">{line.supervisor_name}</span></p>}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          setSelectedLine(line);
                          setLoading(true);
                          try {
                            const d = await adminApi.getLineMachines(line.id);
                            setLineMachines(d.machines || []);
                          } catch (err: any) {
                            setError(err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Manage Machines
                      </button>
                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedLine(null)}
                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedLine.name}</h2>
                  <p className="text-sm text-slate-500">Machine Sequence Alignment</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Assign Machine Component</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  id="line-machine"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select machine</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
                <input
                  id="line-seq"
                  type="number"
                  placeholder="Sequence Order"
                  className="w-36 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const mid = (document.getElementById("line-machine") as HTMLSelectElement)?.value;
                    const seq = (document.getElementById("line-seq") as HTMLInputElement)?.value;
                    if (mid) {
                      handleAddMachineToLine(selectedLine.id, mid, seq);
                      (document.getElementById("line-seq") as HTMLInputElement).value = "";
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Add Machine
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}

            {!loading && lineMachines.length === 0 && (
              <div className="text-center py-12 text-slate-500">No machines assigned to this production line.</div>
            )}

            {!loading && lineMachines.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Sequence Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Machine Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Machine Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineMachines.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-900 font-semibold">{m.sequence_order}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{m.machine_name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{m.machine_code}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRemoveMachineFromLine(selectedLine.id, m.id)}
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
        )}

        {/* Add Line Modal */}
        {showAddLine && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add Production Line</h2>
                <button
                  onClick={() => setShowAddLine(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={lineForm.lineCode}
                  onChange={(e) => setLineForm({ ...lineForm, lineCode: e.target.value })}
                  placeholder="Line code (e.g. LN-A)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={lineForm.name}
                  onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })}
                  placeholder="Line name (e.g. Line Alpha)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={lineForm.description}
                  onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
                  placeholder="Description"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={lineForm.capacityPerHour}
                  onChange={(e) => setLineForm({ ...lineForm, capacityPerHour: e.target.value })}
                  type="number"
                  placeholder="Capacity per hour"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={lineForm.supervisorId}
                  onChange={(e) => setLineForm({ ...lineForm, supervisorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">No supervisor</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateLine}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddLine(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
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
