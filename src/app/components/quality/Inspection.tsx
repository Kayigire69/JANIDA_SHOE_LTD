import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { ClipboardCheck, Plus, CheckCircle2, Award, Wrench, Loader2, AlertCircle } from "lucide-react";
import { batchApi, Batch } from "../../services/batchApi";
import { qualityApi, QualityInspection, InspectionTemplate } from "../../services/qualityApi";

export function Inspection() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [recentInspections, setRecentInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [inspectedBy, setInspectedBy] = useState("");
  const [inspectedQuantity, setInspectedQuantity] = useState("");
  const [passedQuantity, setPassedQuantity] = useState("");
  const [failedQuantity, setFailedQuantity] = useState("");
  const [defectType, setDefectType] = useState("");
  const [defectClassification, setDefectClassification] = useState<"minor" | "major" | "critical">("minor");
  const [notes, setNotes] = useState("");

  // Parameter measurements
  const [sizeAccuracy, setSizeAccuracy] = useState("");
  const [stitchingQuality, setStitchingQuality] = useState("");
  const [materialIntegrity, setMaterialIntegrity] = useState("");
  const [colorConsistency, setColorConsistency] = useState("");
  const [soleAdhesion, setSoleAdhesion] = useState("");
  const [dimensionTolerance, setDimensionTolerance] = useState("");

  const defectTypes = ["None", "Stitching Defect", "Material Flaw", "Color Mismatch", "Size Variance", "Sole Detachment", "Other"];

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [batchesData, templatesData, inspectionsData] = await Promise.all([
          batchApi.getBatches(),
          qualityApi.getTemplates(),
          qualityApi.getInspections(),
        ]);
        setBatches(batchesData);
        setTemplates(templatesData);
        setRecentInspections(inspectionsData);

        // Autofill inspector from local storage user profile if available
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.full_name) {
              setInspectedBy(user.full_name);
            }
          }
        } catch (e) {
          console.error("Error reading user from localStorage:", e);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data from server");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // When a batch is selected, prefill inspected quantity
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const batch = batches.find((b) => b.id === batchId);
    if (batch) {
      setInspectedQuantity(String(batch.quantity));
      // Guess template if there is one matching the shoe model
      const matchingTemplate = templates.find(
        (t) => t.product_type.toLowerCase() === batch.shoe_model_name?.toLowerCase()
      );
      if (matchingTemplate) {
        setSelectedTemplateId(matchingTemplate.id);
      }
    } else {
      setInspectedQuantity("");
    }
  };

  // Recalculate passed or failed quantities
  const handleInspectedQtyChange = (val: string) => {
    setInspectedQuantity(val);
    const total = parseInt(val) || 0;
    const passed = parseInt(passedQuantity) || 0;
    if (total >= passed) {
      setFailedQuantity(String(total - passed));
    }
  };

  const handlePassedQtyChange = (val: string) => {
    setPassedQuantity(val);
    const passed = parseInt(val) || 0;
    const total = parseInt(inspectedQuantity) || 0;
    if (total >= passed) {
      setFailedQuantity(String(total - passed));
    }
  };

  const handleFailedQtyChange = (val: string) => {
    setFailedQuantity(val);
    const failed = parseInt(val) || 0;
    const total = parseInt(inspectedQuantity) || 0;
    if (total >= failed) {
      setPassedQuantity(String(total - failed));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const total = parseInt(inspectedQuantity);
    const passed = parseInt(passedQuantity);
    const failed = parseInt(failedQuantity);

    if (!selectedBatchId) {
      setError("Please select a production batch");
      return;
    }
    if (!inspectedBy.trim()) {
      setError("Please enter the inspector name");
      return;
    }
    if (isNaN(total) || total <= 0) {
      setError("Inspected quantity must be greater than zero");
      return;
    }
    if (isNaN(passed) || passed < 0 || passed > total) {
      setError("Passed quantity must be a non-negative number less than or equal to inspected quantity");
      return;
    }
    if (isNaN(failed) || failed < 0 || passed + failed !== total) {
      setError("Passed quantity plus Failed quantity must equal Inspected quantity");
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        batchId: selectedBatchId,
        templateId: selectedTemplateId || undefined,
        inspectedQuantity: total,
        passedQuantity: passed,
        failedQuantity: failed,
        defectType: failed > 0 ? defectType || "General Defect" : "None",
        defectClassification: failed > 0 ? defectClassification : undefined,
        inspectorName: inspectedBy,
        sizeAccuracy: sizeAccuracy ? Number(sizeAccuracy) : undefined,
        stitchingQuality: stitchingQuality ? Number(stitchingQuality) : undefined,
        materialIntegrity: materialIntegrity ? Number(materialIntegrity) : undefined,
        colorConsistency: colorConsistency ? Number(colorConsistency) : undefined,
        soleAdhesion: soleAdhesion ? Number(soleAdhesion) : undefined,
        dimensionTolerance: dimensionTolerance ? Number(dimensionTolerance) : undefined,
        notes: notes.trim(),
        status: (failed > 0 ? "rework" : "completed") as "rework" | "completed",
      };

      await qualityApi.createInspection(data);

      setSuccessMsg(
        failed > 0
          ? "Inspection submitted. Rework order has been automatically generated."
          : "Inspection submitted successfully. Quality certificate issued."
      );

      // Reset form fields
      setSelectedBatchId("");
      setSelectedTemplateId("");
      setInspectedQuantity("");
      setPassedQuantity("");
      setFailedQuantity("");
      setDefectType("");
      setNotes("");
      setSizeAccuracy("");
      setStitchingQuality("");
      setMaterialIntegrity("");
      setColorConsistency("");
      setSoleAdhesion("");
      setDimensionTolerance("");

      // Fetch fresh inspection list
      const inspectionsData = await qualityApi.getInspections();
      setRecentInspections(inspectionsData);
    } catch (err: any) {
      setError(err.message || "Failed to submit inspection record");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quality Inspection</h1>
          <p className="text-slate-600 text-sm mt-1">Record real-time batch checks and generate rework logs</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Loading QA inspection environment...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                    New Inspection Record
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Production Batch</label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => handleBatchChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select active batch</option>
                        {batches
                          .filter((b) => b.status === "in_progress" || b.status === "quality_hold")
                          .map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_number} - {batch.shoe_model_name} (Qty: {batch.quantity})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">QC Checklist Template</label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Standard Checklist (General)</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.product_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Inspected By</label>
                      <input
                        type="text"
                        value={inspectedBy}
                        onChange={(e) => setInspectedBy(e.target.value)}
                        placeholder="Inspector name"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Inspected Quantity</label>
                      <input
                        type="number"
                        value={inspectedQuantity}
                        onChange={(e) => handleInspectedQtyChange(e.target.value)}
                        placeholder="0"
                        min="1"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Passed Quantity</label>
                      <input
                        type="number"
                        value={passedQuantity}
                        onChange={(e) => handlePassedQtyChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Failed Quantity</label>
                      <input
                        type="number"
                        value={failedQuantity}
                        onChange={(e) => handleFailedQtyChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {parseInt(failedQuantity) > 0 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Primary Defect Type</label>
                          <select
                            value={defectType}
                            onChange={(e) => setDefectType(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select defect type</option>
                            {defectTypes.filter(x => x !== "None").map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Severity Classification</label>
                          <select
                            value={defectClassification}
                            onChange={(e) => setDefectClassification(e.target.value as any)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="minor">Minor</option>
                            <option value="major">Major</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-4">Measurement Parameters</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Size Accuracy (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sizeAccuracy}
                        onChange={(e) => setSizeAccuracy(e.target.value)}
                        placeholder="e.g. 99.2"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Stitching Quality (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={stitchingQuality}
                        onChange={(e) => setStitchingQuality(e.target.value)}
                        placeholder="Scale 1-10"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Material Integrity (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={materialIntegrity}
                        onChange={(e) => setMaterialIntegrity(e.target.value)}
                        placeholder="e.g. 98.5"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Color Consistency (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={colorConsistency}
                        onChange={(e) => setColorConsistency(e.target.value)}
                        placeholder="e.g. 97.0"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Sole Adhesion (N/cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={soleAdhesion}
                        onChange={(e) => setSoleAdhesion(e.target.value)}
                        placeholder="e.g. 10.5"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Dimension Tolerance (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dimensionTolerance}
                        onChange={(e) => setDimensionTolerance(e.target.value)}
                        placeholder="e.g. 1.2"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Inspection Notes / Comments</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any observational notes or specific defects noticed..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Inspection...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Submit Inspection Record
                    </>
                  )}
                </button>
              </form>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 h-fit space-y-4">
                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-700" />
                  {selectedTemplate ? selectedTemplate.name : "Standard Guidelines"}
                </h4>
                <p className="text-xs text-blue-700">
                  {selectedTemplate
                    ? `Product type: ${selectedTemplate.product_type} - Checklist specifies ${selectedTemplate.checkpoints} checkpoints`
                    : "No specific template selected. Standard casual/running parameters will be checked by default."}
                </p>

                <div className="space-y-3 pt-2 max-h-[350px] overflow-y-auto pr-1">
                  {selectedTemplate && selectedTemplate.checklist && selectedTemplate.checklist.length > 0 ? (
                    selectedTemplate.checklist.map((item) => (
                      <div key={item.id} className="text-xs bg-white/60 p-3 rounded-lg border border-blue-100 flex flex-col gap-1">
                        <span className="font-semibold text-blue-900">{item.category}: {item.item}</span>
                        <span className="text-slate-600">Method: {item.measurement}</span>
                        <span className="text-emerald-700 font-medium">Criteria: {item.passedCriteria}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Inspect total unit volume for the batch run.</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Check size accuracy (should be ±1.5mm tolerance limit).</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Inspect seams, lines, and outer soles for stitch alignment.</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Perform pull and flex tests on rubber outer sole bonding.</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <span>Verify clean aesthetics and packaging/labeling readiness.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Recent Inspections</h3>
                <span className="text-xs bg-white/20 text-slate-200 px-3 py-1 rounded-full">
                  Real-time database records
                </span>
              </div>
              <div className="p-6 overflow-x-auto">
                {recentInspections.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    No inspection logs recorded in database yet.
                  </div>
                ) : (
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Inspection ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Batch Number</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Shoe Model</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Inspector</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Inspected</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Passed</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Failed</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInspections.map((inspection) => {
                        const passRatePercent = inspection.inspected_quantity > 0
                          ? ((inspection.passed_quantity / inspection.inspected_quantity) * 100).toFixed(1)
                          : "0.0";
                        return (
                          <tr key={inspection.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 font-mono">
                              INS-{inspection.id.substring(0, 6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700 font-semibold">{inspection.batch_number}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{inspection.shoe_model_name || "General"}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {new Date(inspection.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{inspection.inspector_name}</td>
                            <td className="py-3 px-4 text-sm text-slate-700">{inspection.inspected_quantity}</td>
                            <td className="py-3 px-4 text-sm text-emerald-600 font-medium">{inspection.passed_quantity}</td>
                            <td className="py-3 px-4 text-sm text-red-600 font-medium">{inspection.failed_quantity}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                Number(passRatePercent) >= 98 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              }`}>
                                {passRatePercent}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
