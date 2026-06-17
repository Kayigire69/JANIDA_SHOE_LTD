import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Package, Users, Settings, Plus, AlertCircle, Download, CheckCircle2, Loader2 } from "lucide-react";
import { productionApi, PlanningData } from "../../services/productionApi";

export function ProductionPlanning() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<PlanningData | null>(null);
  const [error, setError] = useState("");

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

  // Fetch all planning metadata from database
  const loadPlanningData = async () => {
    try {
      setLoading(true);
      const res = await productionApi.getPlanningData();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load planning configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlanningData();
  }, []);

  const sizes = ["6", "7", "8", "9", "10", "11", "12"];

  // Handle live calculation of materials requirement based on database BOM and target quantity
  const handleQuantityOrModelChange = (modelId: string, qtyStr: string) => {
    const qty = parseInt(qtyStr) || 0;
    if (!data) return;

    const selectedBOM = data.boms[modelId] || [];
    const calculated = data.materials.map((m) => {
      const bomItem = selectedBOM.find((item) => item.name === m.name);
      const required = bomItem ? bomItem.qtyPerPair * qty : 0;
      return {
        name: m.name,
        required,
        available: m.available,
        unit: m.unit,
      };
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
      alert("Please fill in all planning fields and assign at least one worker.");
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

      alert("Production plan created successfully!");
      // Reset form
      setFormData({
        productModelId: "",
        size: "",
        targetQuantity: "",
        deadline: "",
        machineId: "",
        workerIds: [],
      });
      setMaterialsRequirement([]);
      loadPlanningData();
    } catch (err: any) {
      alert(err.message || "Failed to create production plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const selectedModel = data.shoeModels.find((m) => m.id === formData.productModelId)?.name || "N/A";
    const selectedMachine = data.machines.find((m) => m.id === formData.machineId)?.name || "N/A";

    const planData = {
      model: selectedModel,
      size: formData.size,
      targetQuantity: formData.targetQuantity,
      deadline: formData.deadline,
      machine: selectedMachine,
      workersCount: formData.workerIds.length,
      materials: materialsRequirement,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(planData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `production-plan-${Date.now()}.json`;
    link.click();
  };

  // Determine resource optimization checklist
  const isBOMAvailable = materialsRequirement.every((m) => m.available >= m.required);
  const isMachineAssigned = !!formData.machineId;
  const isWorkersAssigned = formData.workerIds.length >= 2;

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Production Planning</h1>
            <p className="text-slate-600 text-sm mt-1">Create a new production plan</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Fetching production configurations from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* Product Details Form */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Product Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Product Model
                    </label>
                    <select
                      value={formData.productModelId}
                      onChange={(e) => handleModelSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select model</option>
                      {data?.shoeModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select size</option>
                      {sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Target Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.targetQuantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      placeholder="Enter quantity"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resource Allocation */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Resource Allocation
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assign Machine
                    </label>
                    <select
                      value={formData.machineId}
                      onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select machine</option>
                      {data?.machines.map((machine) => (
                        <option key={machine.id} value={machine.id} disabled={machine.status !== "active"}>
                          {machine.name} ({machine.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Assign Workers
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data?.workers.map((worker) => (
                        <label
                          key={worker.id}
                          className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.workerIds.includes(worker.id)}
                            onChange={() => handleWorkerToggle(worker.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 font-medium">{worker.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill of Materials Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Bill of Materials
                </h3>
                <div className="space-y-3">
                  {materialsRequirement.length === 0 ? (
                    <p className="text-sm text-slate-500 italic text-center py-4">
                      Select model & quantity to calculate material demands.
                    </p>
                  ) : (
                    materialsRequirement.map((material, index) => {
                      const isAvailable = material.available >= material.required;
                      return (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-900">{material.name}</span>
                            {!isAvailable && material.required > 0 && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Required:</span>
                              <span className="font-semibold text-slate-900">
                                {material.required.toFixed(1)} {material.unit}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-600">Available:</span>
                              <span
                                className={`font-semibold ${
                                  isAvailable ? "text-emerald-600" : "text-red-600"
                                }`}
                              >
                                {material.available} {material.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Planning actions */}
              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  Create Production Plan
                </button>
                <button
                  onClick={handleExport}
                  disabled={!formData.productModelId}
                  className="w-full bg-slate-700 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export Plan
                </button>
              </div>

              {/* Resource Optimization Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Resource Optimization
                </h4>
                <ul className="text-sm text-emerald-800 space-y-1">
                  <li>
                    {isMachineAssigned ? "✓ Machine allocated optimally" : "• Machine allocation: Pending"}
                  </li>
                  <li>
                    {isWorkersAssigned ? "✓ Worker allocation: Within capacity" : "• Worker allocation: 2+ suggested"}
                  </li>
                  <li>
                    {isBOMAvailable ? "✓ Material availability: Sufficient" : "• Material availability: Shortage warning"}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
