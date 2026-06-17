import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import { Package, Thermometer, Gauge, Clock, User, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { productionApi, PlanningData, OrdersData } from "../../services/productionApi";
import { batchApi } from "../../services/batchApi";

export function BatchCreation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [planningData, setPlanningData] = useState<PlanningData | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersData | null>(null);

  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [formData, setFormData] = useState({
    shoeModelId: "",
    quantity: "",
    rawMaterialId: "",
    materialBatchNumber: "",
    temperature: "150",
    pressure: "45",
    time: "120",
    operatorId: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [planRes, ordersRes] = await Promise.all([
          productionApi.getPlanningData(),
          productionApi.getOrders(),
        ]);
        setPlanningData(planRes);
        setOrdersData(ordersRes);
      } catch (err: any) {
        setError(err.message || "Failed to load production parameters");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Auto-fill shoe model when plan is selected
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (!planId) {
      setFormData(prev => ({ ...prev, shoeModelId: "", quantity: "" }));
      return;
    }

    const selectedPlan = ordersData?.orders.find(o => o.id === planId);
    if (selectedPlan && planningData) {
      const model = planningData.shoeModels.find(m => m.name === selectedPlan.product);
      setFormData(prev => ({
        ...prev,
        shoeModelId: model?.id || "",
        quantity: String(selectedPlan.quantity - selectedPlan.completed),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shoeModelId || !formData.quantity || !formData.operatorId || !formData.rawMaterialId || !formData.materialBatchNumber) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await batchApi.createBatch({
        planId: selectedPlanId || undefined,
        shoeModelId: formData.shoeModelId,
        quantity: Number(formData.quantity),
        operatorId: formData.operatorId,
        rawMaterialId: formData.rawMaterialId,
        materialBatchNumber: formData.materialBatchNumber,
        temperature: formData.temperature,
        pressure: formData.pressure,
        time: formData.time,
      });

      setSuccess("Batch successfully initialized!");
      setTimeout(() => {
        navigate("/batch-tracking");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create production batch.");
    } finally {
      setSubmitting(false);
    }
  };

  const activePlans = ordersData?.orders.filter(o => o.status === "Planned" || o.status === "In Progress") || [];

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create New Batch</h1>
          <p className="text-slate-500 text-sm mt-1">Initialize a new production batch backed by materials and active orders</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-pulse">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{success} Redirecting to Tracking...</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading dynamic order and material data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Batch Association */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  Order & Model Linkage
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Associated Production Order
                    </label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    >
                      <option value="">Standalone Batch (No Order)</option>
                      {activePlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.plan_code} - {plan.product} (Qty: {plan.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Shoe Model
                    </label>
                    <select
                      value={formData.shoeModelId}
                      onChange={(e) => setFormData({ ...formData, shoeModelId: e.target.value })}
                      disabled={!!selectedPlanId}
                      className={`w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium ${
                        selectedPlanId ? "bg-slate-100 cursor-not-allowed opacity-80" : "bg-slate-50"
                      }`}
                    >
                      <option value="">Select Shoe Model</option>
                      {planningData?.shoeModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Batch Quantity (Pairs)
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="e.g. 150"
                      min="1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Materials Consumed */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Raw Materials Allocation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Raw Material Stock Item
                    </label>
                    <select
                      value={formData.rawMaterialId}
                      onChange={(e) => setFormData({ ...formData, rawMaterialId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    >
                      <option value="">Select Material</option>
                      {planningData?.materials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.code} - {mat.name} ({mat.available} {mat.unit} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Supplier Batch/Lot Number
                    </label>
                    <input
                      type="text"
                      value={formData.materialBatchNumber}
                      onChange={(e) => setFormData({ ...formData, materialBatchNumber: e.target.value })}
                      placeholder="e.g. LOT-202604A"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Parameters */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Production Telemetry</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-blue-600" />
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      placeholder="150"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-blue-600" />
                      Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      value={formData.pressure}
                      onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                      placeholder="45"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Curing Time (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="120"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar checklist & actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-indigo-600" />
                  Operator Assignment
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Lead Operator
                  </label>
                  <select
                    value={formData.operatorId}
                    onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-medium"
                  >
                    <option value="">Select lead operator</option>
                    {planningData?.workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} - {worker.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-xl">
                <h4 className="font-bold text-md tracking-wide text-indigo-400">Pre-Initialization Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${formData.shoeModelId && formData.quantity ? "bg-indigo-400" : "bg-slate-600"}`}></div>
                    <span className="text-slate-300">Model & qty specified</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${formData.rawMaterialId && formData.materialBatchNumber ? "bg-indigo-400" : "bg-slate-600"}`}></div>
                    <span className="text-slate-300">Materials linked</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${formData.operatorId ? "bg-indigo-400" : "bg-slate-600"}`}></div>
                    <span className="text-slate-300">Operator assigned</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !formData.shoeModelId || !formData.quantity || !formData.operatorId || !formData.rawMaterialId || !formData.materialBatchNumber}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Initialize Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
