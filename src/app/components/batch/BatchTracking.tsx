import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Package, MapPin, Play, Pause, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { batchApi, Batch } from "../../services/batchApi";

export function BatchTracking() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const stations = ["Cutting", "Stitching", "Assembly", "Quality Check", "Packaging", "Finished Goods"];

  async function loadBatches() {
    try {
      setLoading(true);
      const data = await batchApi.getBatches();
      setBatches(data);
      if (data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load active batches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "border-blue-500 bg-blue-50 text-blue-700";
      case "completed":
        return "border-emerald-500 bg-emerald-50 text-emerald-700";
      case "quality_hold":
        return "border-amber-500 bg-amber-50 text-amber-700";
      default:
        return "border-slate-500 bg-slate-50 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "quality_hold": return "On Hold (QC)";
      default: return status;
    }
  };

  const getProgressFromLocation = (location: string) => {
    switch (location) {
      case "Cutting": return 15;
      case "Stitching": return 35;
      case "Assembly": return 55;
      case "Quality Check": return 75;
      case "Packaging": return 90;
      case "Finished Goods": return 100;
      default: return 10;
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const progress = selectedBatch ? getProgressFromLocation(selectedBatch.location) : 0;

  // Build dynamic lifecycle stages based on location
  const currentStationIndex = selectedBatch ? stations.indexOf(selectedBatch.location) : -1;
  const stages = stations.map((station, index) => ({
    name: station,
    completed: selectedBatch?.status === "completed" || index < currentStationIndex,
    active: index === currentStationIndex && selectedBatch?.status !== "completed"
  }));

  const handleStatusChange = async (status: "in_progress" | "completed" | "quality_hold") => {
    if (!selectedBatchId) return;
    try {
      setActionLoading(true);
      await batchApi.updateBatchStatus(selectedBatchId, status);
      // Reload batches
      const data = await batchApi.getBatches();
      setBatches(data);
    } catch (err: any) {
      setError(err.message || "Failed to update batch status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLocationChange = async (location: string) => {
    if (!selectedBatchId) return;
    try {
      setActionLoading(true);
      await batchApi.updateBatchLocation(selectedBatchId, location);
      const data = await batchApi.getBatches();
      setBatches(data);
    } catch (err: any) {
      setError(err.message || "Failed to update batch location");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex items-center justify-between">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
              <RefreshCw className="w-8 h-8 text-indigo-200" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Batch Tracking</h1>
              <p className="text-indigo-100 text-sm mt-1.5 font-medium max-w-xl">Real-time status monitoring and station transitions across the factory floor.</p>
            </div>
          </div>
          <button
            onClick={loadBatches}
            className="relative z-10 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-bold transition-all backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Tracker
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading active batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Batches</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">Initialize a batch from the Create page to begin monitoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className={`bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden ${
                    selectedBatchId === batch.id ? "ring-2 ring-indigo-500 ring-offset-2" : ""
                  }`}
                  onClick={() => setSelectedBatchId(batch.id)}
                >
                  <div className={`h-1.5 w-full ${getStatusColor(batch.status).replace("border-", "bg-").replace("bg-", "bg-")}`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-md font-bold text-slate-900">{batch.batch_number}</h3>
                            {batch.plan_code && (
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xxs font-semibold">
                                {batch.plan_code}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 font-medium">{batch.shoe_model_name} • Qty: {batch.quantity}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(batch.status)}`}>
                        {getStatusLabel(batch.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700">{batch.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-xs">
                        <Play className="w-4 h-4 text-slate-400" />
                        <span>Created: {new Date(batch.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Lifecycle Progress</span>
                        <span>{getProgressFromLocation(batch.location)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            batch.status === "completed"
                              ? "bg-emerald-500"
                              : batch.status === "quality_hold"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${getProgressFromLocation(batch.location)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {selectedBatch ? (
                <>
                  {/* Lifecycle Stages */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-8 space-y-6">
                    <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-500" />
                      Batch Lifecycle
                    </h3>
                    <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6 py-2">
                      {stages.map((stage, index) => (
                        <div key={index} className="relative flex items-start gap-4">
                          <div
                            className={`absolute -left-[35px] w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white ${
                              stage.completed
                                ? "border-emerald-500 text-emerald-500"
                                : stage.active
                                ? "border-blue-500 text-blue-500"
                                : "border-slate-200 text-slate-300"
                            }`}
                          >
                            {stage.completed ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-50 text-white" />
                            ) : (
                              <div className={`w-2.5 h-2.5 rounded-full ${stage.active ? "bg-blue-500 animate-ping" : "bg-slate-200"}`}></div>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${stage.active ? "text-blue-600" : stage.completed ? "text-slate-800" : "text-slate-400"}`}>
                              {stage.name}
                            </p>
                            <p className="text-xxs text-slate-400">
                              {stage.active ? "Currently at this station" : stage.completed ? "Completed phase" : "Pending"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 p-8 space-y-6">
                    <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                      <Play className="w-5 h-5 text-blue-500" />
                      Transition Controls
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Station Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Move to Station
                        </label>
                        <select
                          disabled={actionLoading || selectedBatch.status === "completed"}
                          value={selectedBatch.location}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-800 transition-all hover:bg-white"
                        >
                          {stations.map(station => (
                            <option key={station} value={station}>{station}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status Buttons */}
                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {selectedBatch.status === "quality_hold" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange("in_progress")}
                            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_14px_0_rgb(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:-translate-y-0.5"
                          >
                            <Play className="w-4 h-4" />
                            Resume Batch
                          </button>
                        )}

                        {selectedBatch.status === "in_progress" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange("quality_hold")}
                            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_14px_0_rgb(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5"
                          >
                            <Pause className="w-4 h-4" />
                            Place On Quality Hold
                          </button>
                        )}

                        {selectedBatch.status !== "completed" && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleStatusChange("completed")}
                            className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_14px_0_rgb(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Batch
                          </button>
                        )}

                        {selectedBatch.status === "completed" && (
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs text-center font-medium py-3 px-4 rounded-xl">
                            Batch is archived in Finished Goods.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  Select a batch from the list to view lifecycle details and execute transition controls.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
