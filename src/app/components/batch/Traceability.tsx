import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../Layout";
import { Search, ChevronRight, QrCode, Download, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { batchApi, Batch, BatchRecall } from "../../services/batchApi";

export function Traceability() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchId, setSearchId] = useState("");
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Recall inputs
  const [recallReason, setRecallReason] = useState("");
  const [recallSeverity, setRecallSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [recallActions, setRecallActions] = useState("");
  const [submittingRecall, setSubmittingRecall] = useState(false);

  // Get current user role
  const currentUserRole = localStorage.getItem("userRole") || "Production Manager";
  const canManageRecalls = currentUserRole === "Quality Officer" || currentUserRole === "Administrator";

  const fetchBatch = async (num: string) => {
    if (!num) return;
    try {
      setLoading(true);
      setError(null);
      const data = await batchApi.getBatchByNumber(num);
      setBatch(data);
    } catch (err: any) {
      setError(err.message || "Batch not found in the records");
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  // Check query params on mount/change (for QR code scan redirection)
  useEffect(() => {
    const searchVal = searchParams.get("search");
    if (searchVal) {
      setSearchId(searchVal);
      fetchBatch(searchVal);
    }
  }, [searchParams]);

  const handleSearch = () => {
    if (searchId.trim()) {
      setSearchParams({ search: searchId.trim() });
      fetchBatch(searchId.trim());
    }
  };

  const handleExportCSV = () => {
    if (!batch) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Smart Shoe Factory Traceability Report\n";
    csvContent += `Batch Number,${batch.batch_number}\n`;
    csvContent += `Product Model,${batch.shoe_model_name}\n`;
    csvContent += `Created At,${new Date(batch.created_at).toLocaleString()}\n`;
    csvContent += `Status,${batch.status}\n`;
    csvContent += `Current Station,${batch.location}\n`;
    csvContent += `Operator,${batch.operator_name || "Unassigned"}\n\n`;

    csvContent += "--- Consumed Raw Materials ---\n";
    csvContent += "Material Name,Quantity Used,Supplier Lot/Batch\n";
    batch.rawMaterials?.forEach((mat) => {
      csvContent += `"${mat.material_name}",${mat.quantity_used} ${mat.unit},"${mat.material_batch_number}"\n`;
    });

    csvContent += "\n--- Production Parameters ---\n";
    csvContent += "Parameter Name,Value,Unit,Recorded At\n";
    batch.parameters?.forEach((p) => {
      csvContent += `"${p.parameter_name}","${p.parameter_value}","${p.unit || ""}","${new Date(p.recorded_at).toLocaleString()}"\n`;
    });

    if (batch.recalls && batch.recalls.length > 0) {
      csvContent += "\n--- Recall & Quarantine Incidents ---\n";
      csvContent += "Reason,Severity,Status,Date Initiated,Corrective Actions\n";
      batch.recalls.forEach((r) => {
        csvContent += `"${r.reason}","${r.severity}","${r.status}","${new Date(r.initiated_at).toLocaleDateString()}","${r.actions_taken || "None"}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Traceability_Report_${batch.batch_number}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInitiateRecall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !recallReason) return;

    try {
      setSubmittingRecall(true);
      setError(null);
      await batchApi.createRecall({
        batchId: batch.id,
        reason: recallReason,
        severity: recallSeverity,
      });
      setRecallReason("");
      // Refresh batch data
      await fetchBatch(batch.batch_number);
    } catch (err: any) {
      setError(err.message || "Failed to log recall event");
    } finally {
      setSubmittingRecall(false);
    }
  };

  const handleResolveRecall = async (recallId: string) => {
    if (!batch) return;
    try {
      setSubmittingRecall(true);
      setError(null);
      await batchApi.updateRecall(recallId, "resolved", recallActions);
      setRecallActions("");
      // Refresh batch data
      await fetchBatch(batch.batch_number);
    } catch (err: any) {
      setError(err.message || "Failed to resolve recall event");
    } finally {
      setSubmittingRecall(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Product Traceability</h1>
            <p className="text-slate-500 text-sm mt-1">End-to-end pedigree lookup from raw material lot to finished box</p>
          </div>
          {batch && (
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm"
            >
              <QrCode className="w-4 h-4" />
              Generate QR Label
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Alphanumeric Batch ID (e.g. BTH-001234)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              Trace Pedigree
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Searching records...</p>
          </div>
        ) : batch ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-blue-500 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Active Batch Trace
                </span>
                <h2 className="text-xl font-bold mt-2">{batch.shoe_model_name}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-300 font-medium">
                  <p>Batch ID: <span className="font-mono text-white">{batch.batch_number}</span></p>
                  <p>Operator: <span className="text-white">{batch.operator_name || "System Operator"}</span></p>
                  {batch.plan_code && <p>Plan Code: <span className="text-white">{batch.plan_code}</span></p>}
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs text-slate-400">Current Station</p>
                <p className="text-lg font-bold text-blue-400">{batch.location}</p>
                <span className={`inline-block mt-1 text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  batch.status === "completed" ? "bg-emerald-500 text-white" : batch.status === "quality_hold" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                }`}>
                  {batch.status}
                </span>
              </div>
            </div>

            {/* Geneology sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Raw Materials */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Material Genealogy
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {batch.rawMaterials && batch.rawMaterials.length > 0 ? (
                    batch.rawMaterials.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{material.material_name}</p>
                          <p className="text-xs text-slate-400 font-medium">Quantity: {material.quantity_used} {material.unit}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 mx-2" />
                        <div className="flex-1 text-right md:text-left">
                          <p className="text-xs text-slate-500"><span className="font-bold text-slate-600">Lot/Batch Number:</span></p>
                          <p className="text-xs text-slate-800 font-mono font-bold">{material.material_batch_number}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No raw material logs recorded for this batch.</p>
                  )}
                </div>
              </div>

              {/* Parameters logs */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Machine Logs & Parameters
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {batch.parameters && batch.parameters.length > 0 ? (
                      batch.parameters.map((param) => (
                        <div key={param.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <p className="text-xxs text-slate-400 font-bold uppercase tracking-wider mb-1">{param.parameter_name}</p>
                          <p className="text-lg font-extrabold text-slate-800">{param.parameter_value}{param.unit || ""}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {new Date(param.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm col-span-3">No parameter metrics logged.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recalls and quarantines */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Inspection, Recall & Quarantine Events
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {batch.recalls && batch.recalls.length > 0 ? (
                  <div className="space-y-4">
                    {batch.recalls.map((recall) => (
                      <div key={recall.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            recall.severity === "critical" || recall.severity === "high" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                          }`}>
                            {recall.severity} Severity Recall
                          </span>
                          <span className="text-xs font-bold text-amber-800 uppercase">{recall.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800">{recall.reason}</p>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                          <p>Initiated: <span className="font-semibold">{new Date(recall.initiated_at).toLocaleDateString()}</span></p>
                          <p>Author: <span className="font-semibold">{recall.initiated_by_name || "Quality Officer"}</span></p>
                          {recall.resolved_at && <p>Resolved: <span className="font-semibold">{new Date(recall.resolved_at).toLocaleDateString()}</span></p>}
                        </div>
                        {recall.actions_taken && (
                          <div className="mt-2 pt-2 border-t border-amber-200 text-xs text-slate-700">
                            <span className="font-bold">Corrective Actions Taken:</span> {recall.actions_taken}
                          </div>
                        )}

                        {/* Resolve recall sub-actions */}
                        {canManageRecalls && recall.status !== "resolved" && (
                          <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase">
                              Log Corrective Actions & Resolution
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={recallActions}
                                onChange={(e) => setRecallActions(e.target.value)}
                                placeholder="Enter action resolution steps..."
                                className="flex-1 px-4 py-2 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={submittingRecall || !recallActions}
                                onClick={() => handleResolveRecall(recall.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                              >
                                Resolve & Reinstate Batch
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                    <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span>No active recalls or quarantine events are currently logged for this batch.</span>
                  </div>
                )}

                {/* Initiate Recall Form for Quality Officers */}
                {canManageRecalls && (!batch.recalls || batch.recalls.filter(r => r.status !== "resolved").length === 0) && (
                  <form onSubmit={handleInitiateRecall} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Recall & Quarantine Declaration Form
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Reason for Hold/Recall
                        </label>
                        <input
                          type="text"
                          required
                          value={recallReason}
                          onChange={(e) => setRecallReason(e.target.value)}
                          placeholder="e.g. Failure in stitching strength test, sole peeling risk..."
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Severity Level
                        </label>
                        <select
                          value={recallSeverity}
                          onChange={(e) => setRecallSeverity(e.target.value as any)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingRecall}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all text-xs"
                      >
                        Quarantine Batch (Initiate Hold)
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Export options */}
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV Report
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Search for a Product</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Enter a batch number above to perform a complete genealogy and telemetry search.
            </p>
          </div>
        )}

        {/* QR Code label modal */}
        {showQRModal && batch && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Batch QR Identifier Label</h3>
                <p className="text-xs text-slate-500">Scan this code on the production floor or warehouse to pull up pedigree instantly.</p>
                
                <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `${window.location.origin}/traceability?search=${batch.batch_number}`
                    )}`}
                    alt="Batch QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                
                <div className="bg-slate-100 p-3 rounded-xl font-mono text-sm text-slate-700 font-bold">
                  {batch.batch_number}
                </div>
                <div className="text-xxs text-slate-400">
                  Target: {batch.shoe_model_name} (Qty: {batch.quantity})
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
