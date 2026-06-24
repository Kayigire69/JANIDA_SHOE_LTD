import { useState, useEffect, useRef } from "react";
import { Layout } from "../Layout";
import {
  Package, Users, Settings, Plus, AlertCircle, Download,
  CheckCircle2, Loader2, Cpu, X, Trash2, UserPlus, Save, RefreshCw, Eye, PlayCircle, Pause, ChevronDown, Check
} from "lucide-react";
import { productionApi, PlanningData, OrdersData } from "../../services/productionApi";
import { toast } from "sonner";

type ModalType = "create-plan" | null;

// Custom MultiSelectDropdown Component
interface MultiSelectDropdownProps {
  options: Array<{ label: string; value: string }>;
  selectedValues: string[];
  onToggle: (value: string) => void;
  placeholder: string;
}

function MultiSelectDropdown({ options, selectedValues, onToggle, placeholder }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCount = selectedValues.length;
  const selectedLabels = options
    .filter(opt => selectedValues.includes(opt.value))
    .map(opt => opt.label);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm text-left flex items-center justify-between hover:border-slate-300"
      >
        <span className={selectedCount === 0 ? "text-slate-400" : "text-slate-700"}>
          {selectedCount === 0 ? placeholder : `${selectedCount} worker${selectedCount === 1 ? '' : 's'} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center">No workers available</div>
          ) : (
            options.map((option, idx) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <button
                  key={`${option.value}-${idx}`}
                  type="button"
                  onClick={() => onToggle(option.value)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={isSelected ? 'text-slate-900 font-medium' : 'text-slate-700'}>
                    {option.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function ProductionPlanning() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<PlanningData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
  const [error, setError] = useState("");
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // All machines and workers from separate manage endpoints
  const [allMachines, setAllMachines] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [managingLoading, setManagingLoading] = useState(false);

  const [formData, setFormData] = useState({
    productModelId: "",
    size: "",
    targetQuantity: "",
    deadline: "",
    machineId: "",
    workerIds: [] as string[],
  });

  const [materialsRequirement, setMaterialsRequirement] = useState<
    Array<{ name: string; required: number; available: number; unit: string }>
  >([]);

  const [machineForm] = useState({ code: "", name: "", status: "active" });
  const [workerForm] = useState({ workerId: "", name: "", role: "Production Operator", department: "Production", email: "", phone: "" });

  const loadPlanningData = async () => {
    try {
      setLoading(true);
      const res = await productionApi.getPlanningData();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load planning configurations");
      toast.error(err.message || "Failed to load planning configurations");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await productionApi.getOrders();
      setOrdersData(res);
    } catch (err: any) {
      toast.error("Failed to load production plans");
    }
  };

  const loadAllMachines = async () => {
    try {
      const res = await productionApi.listMachines();
      setAllMachines(res.machines || []);
    } catch { /* ignore */ }
  };

  const loadAllWorkers = async () => {
    try {
      const res = await productionApi.listProductionWorkers();
      setAllWorkers(res.workers || []);
    } catch (err: any) {
      console.error('Failed to load workers:', err);
      setAllWorkers([]);
    }
  };

  useEffect(() => {
    loadPlanningData();
    loadOrders();
    loadAllMachines();
    loadAllWorkers();
  }, []);

  const sizes = ["5", "6", "7", "8", "9", "10", "11", "12", "13"];

  const handleQuantityOrModelChange = (modelId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr) || 0;
    if (!data) return;
    const selectedBOM = data.boms[modelId] || [];
    const calculated = data.materials.map((m) => {
      const bomItem = selectedBOM.find((item) => item.name === m.name);
      const required = bomItem ? bomItem.qtyPerPair * qty : 0;
      return { name: m.name, required, available: m.available, unit: m.unit };
    });
    setMaterialsRequirement(calculated);
  };

  const handleModelSelect = (modelId: string) => {
    setFormData((prev) => ({ ...prev, productModelId: modelId }));
    handleQuantityOrModelChange(modelId, formData.targetQuantity);
  };

  const handleQuantityChange = (qty: string) => {
    setFormData((prev) => ({ ...prev, targetQuantity: qty }));
    handleQuantityOrModelChange(formData.productModelId, qty);
  };

  const handleWorkerToggle = (workerId: string) => {
    setFormData((prev) => ({
      ...prev,
      workerIds: prev.workerIds.includes(workerId)
        ? prev.workerIds.filter((id) => id !== workerId)
        : [...prev.workerIds, workerId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.productModelId || !formData.size || !formData.targetQuantity || !formData.deadline || !formData.machineId || formData.workerIds.length === 0) {
      toast.error("Please fill in all planning fields and assign at least one worker.");
      return;
    }
    try {
      setSubmitting(true);
      await productionApi.createPlan({
        shoeModelId: formData.productModelId,
        size: formData.size,
        targetQuantity: parseInt(formData.targetQuantity),
        deadline: formData.deadline,
        machineId: formData.machineId,
        workerIds: formData.workerIds,
      });
      setFormData({ productModelId: "", size: "", targetQuantity: "", deadline: "", machineId: "", workerIds: [] });
      setMaterialsRequirement([]);
      toast.success("Production plan created successfully!");
      closeModal();
      loadPlanningData();
      loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to create production plan");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Machine CRUD ----
  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineForm.code.trim() || !machineForm.name.trim()) {
      toast.error("Code and name are required.");
      return;
    }
    setManagingLoading(true);
    try {
      await productionApi.createMachine({ code: machineForm.code.trim(), name: machineForm.name.trim(), status: machineForm.status });
      setMachineForm({ code: "", name: "", status: "active" });
      toast.success("Machine added successfully!");
      await Promise.all([loadAllMachines(), loadPlanningData()]);
      setActiveModal("manage-machines"); // Return to list view
    } catch (err: any) {
      toast.error(err.message || "Failed to add machine");
    } finally {
      setManagingLoading(false);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (!window.confirm("Delete this machine?")) return;
    setManagingLoading(true);
    try {
      await productionApi.deleteMachine(id);
      toast.success("Machine deleted");
      await Promise.all([loadAllMachines(), loadPlanningData()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete machine");
    } finally {
      setManagingLoading(false);
    }
  };

  const handleToggleMachineStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "maintenance" : "active";
    try {
      await productionApi.updateMachine(id, { status: newStatus });
      toast.success("Machine status updated");
      await Promise.all([loadAllMachines(), loadPlanningData()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update machine status");
    }
  };

  // ---- Worker CRUD ----
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerForm.workerId.trim() || !workerForm.name.trim() || !workerForm.email.trim()) {
      toast.error("Worker ID, name, and email are required.");
      return;
    }
    setManagingLoading(true);
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
      toast.success("Worker added successfully!");
      await Promise.all([loadAllWorkers(), loadPlanningData()]);
      setActiveModal("manage-workers"); // return to list
    } catch (err: any) {
      toast.error(err.message || "Failed to add worker");
    } finally {
      setManagingLoading(false);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!window.confirm("Delete this production worker?")) return;
    setManagingLoading(true);
    try {
      await productionApi.deleteProductionWorker(id);
      toast.success("Worker deleted");
      await Promise.all([loadAllWorkers(), loadPlanningData()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete worker");
    } finally {
      setManagingLoading(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const isBOMAvailable = materialsRequirement.every((m) => m.available >= m.required);
  const isMachineAssigned = !!formData.machineId;
  const isWorkersAssigned = formData.workerIds.length >= 2;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700",
      maintenance: "bg-amber-100 text-amber-700",
      inactive: "bg-slate-100 text-slate-600",
      Completed: "bg-emerald-100 text-emerald-700 border-emerald-300 border",
      "In Progress": "bg-blue-100 text-blue-700 border-blue-300 border",
      Planned: "bg-slate-100 text-slate-700 border-slate-300 border",
      Paused: "bg-amber-100 text-amber-700 border-amber-300 border"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[status] || "bg-slate-100 text-slate-600 border border-slate-300"}`}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Production Planning</h1>
            <p className="text-slate-600 text-sm mt-1">Manage and create production plans</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
            onClick={() => { setActiveModal("create-plan"); loadAllWorkers(); loadPlanningData(); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Production Plan
            </button>
          </div>
        </div>

        {data?.machines.length === 0 && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              No machines found. Please <strong>manage machines</strong> when creating a plan.
            </p>
          </div>
        )}

        {/* Current Plans Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Current Production Plans
            </h2>
            <button onClick={loadOrders} className="text-slate-500 hover:text-blue-600 transition-colors p-1" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-600 text-sm">Loading plans...</p>
              </div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Plan Code</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Product</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Target Qty</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Deadline</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!ordersData?.orders || ordersData.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-sm text-slate-500 italic">No production plans found. Create one above.</td>
                    </tr>
                  ) : (
                    ordersData.orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">{order.plan_code}</td>
                        <td className="py-4 px-6 text-sm text-slate-700 font-semibold">{order.product}</td>
                        <td className="py-4 px-6 text-sm text-slate-700">{order.completed} / {order.quantity}</td>
                        <td className="py-4 px-6 text-sm text-slate-700">{order.deadline}</td>
                        <td className="py-4 px-6">{statusBadge(order.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          {/* Create Plan Modal */}
          {activeModal === "create-plan" && (
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-blue-600" /> Create Production Plan
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Configure models, materials, and allocate resources</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Product Details Form */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Package className="w-5 h-5 text-blue-600" /> Product Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Product Model <span className="text-red-500">*</span></label>
                          <select
                            value={formData.productModelId}
                            onChange={(e) => handleModelSelect(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                          >
                            <option value="">Select model...</option>
                            {data?.shoeModels.map((model) => (
                              <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Size <span className="text-red-500">*</span></label>
                          <select
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                          >
                            <option value="">Select size...</option>
                            {sizes.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Target Quantity <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            value={formData.targetQuantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            placeholder="e.g. 500"
                            min={1}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Deadline <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resource Allocation */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Settings className="w-5 h-5 text-blue-600" /> Resource Allocation
                      </h3>
                      <div className="space-y-6">
                        {/* Machine selector */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-blue-500" /> Assign Machine <span className="text-red-500">*</span>
                          </label>
                          {data?.machines.length === 0 ? (
                            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              No machines available. Add machines from the <strong>Workforce</strong> sidebar section.
                            </div>
                          ) : (
                            <select
                              value={formData.machineId}
                              onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                            >
                              <option value="">Select an active machine...</option>
                              {data?.machines.map((machine) => (
                                <option key={machine.id} value={machine.id} disabled={machine.status !== "active"}>
                                  {machine.code} – {machine.name} ({machine.status})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Worker selector */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-500" /> Assign Workers <span className="text-red-500">*</span>
                          </label>
                          {allWorkers.length === 0 ? (
                            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              No workers available. Go to <strong className="ml-1">Workforce</strong> in the sidebar to add workers first.
                            </div>
                          ) : (
                            <MultiSelectDropdown
                              options={allWorkers.map((worker, idx) => ({
                                label: `${worker.name} - ${worker.role || 'Worker'}`,
                                value: String(worker.id || worker.worker_id || idx),
                              }))}
                              selectedValues={formData.workerIds}
                              onToggle={handleWorkerToggle}
                              placeholder="Select workers"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: BOM & Optimization */}
                  <div className="space-y-6">
                    {/* Optimization Status */}
                    <div className={`rounded-xl p-5 border ${isMachineAssigned && isWorkersAssigned && isBOMAvailable && formData.productModelId ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                      <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isMachineAssigned && isWorkersAssigned && isBOMAvailable && formData.productModelId ? "text-emerald-800" : "text-slate-800"}`}>
                        <CheckCircle2 className="w-5 h-5" />
                        Plan Readiness
                      </h4>
                      <ul className="text-sm space-y-2.5">
                        <li className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isMachineAssigned ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                          <span className={isMachineAssigned ? "text-slate-700" : "text-slate-500"}>{isMachineAssigned ? "Machine allocated" : "Pending machine"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isWorkersAssigned ? "bg-emerald-500" : formData.workerIds.length > 0 ? "bg-amber-500" : "bg-slate-300"}`}></span>
                          <span className={isWorkersAssigned ? "text-slate-700" : formData.workerIds.length > 0 ? "text-amber-700" : "text-slate-500"}>
                            {isWorkersAssigned ? "Workers allocated (2+)" : formData.workerIds.length > 0 ? "More workers suggested" : "Pending workers"}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isBOMAvailable && materialsRequirement.length > 0 ? "bg-emerald-500" : materialsRequirement.length > 0 ? "bg-red-500" : "bg-slate-300"}`}></span>
                          <span className={isBOMAvailable && materialsRequirement.length > 0 ? "text-slate-700" : materialsRequirement.length > 0 ? "text-red-600 font-medium" : "text-slate-500"}>
                            {isBOMAvailable && materialsRequirement.length > 0 ? "Materials sufficient" : materialsRequirement.length > 0 ? "Material shortage!" : "Pending materials"}
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Bill of Materials Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[320px]">
                      <div className="p-5 border-b border-slate-100 flex-shrink-0">
                        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" /> Bill of Materials
                        </h3>
                      </div>
                      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                        {materialsRequirement.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500">Select model &amp; quantity<br/>to calculate demands.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {materialsRequirement.map((material, index) => {
                              const isAvailable = material.available >= material.required;
                              return (
                                <div key={index} className={`p-3.5 rounded-xl border ${isAvailable ? "bg-slate-50 border-slate-100" : "bg-red-50/50 border-red-200"}`}>
                                  <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-sm font-semibold text-slate-900">{material.name}</span>
                                    {!isAvailable && material.required > 0 && (
                                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs items-center">
                                      <span className="text-slate-500 font-medium">Required</span>
                                      <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">{material.required.toFixed(1)} {material.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                      <span className="text-slate-500 font-medium">Available</span>
                                      <span className={`font-semibold px-2 py-0.5 rounded border shadow-sm ${isAvailable ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"}`}>
                                        {material.available} {material.unit}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save & Create Plan
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </Layout>
  );
}
