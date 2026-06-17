import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { FileText, Plus, CheckSquare, Loader2, AlertCircle, Trash2, X } from "lucide-react";
import { qualityApi, InspectionTemplate, QualityInspection, Checkpoint } from "../../services/qualityApi";

export function QualityTemplates() {
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplProductType, setTplProductType] = useState("");
  const [checkpoints, setCheckpoints] = useState<Omit<Checkpoint, "id">[]>([
    { category: "Upper Construction", item: "Stitching quality and alignment", measurement: "Visual check", passedCriteria: "No loose threads" }
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, inspectionsData] = await Promise.all([
        qualityApi.getTemplates(),
        qualityApi.getInspections(),
      ]);
      setTemplates(templatesData);
      setInspections(inspectionsData);

      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load quality templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addCheckpointRow = () => {
    setCheckpoints([...checkpoints, { category: "", item: "", measurement: "", passedCriteria: "" }]);
  };

  const removeCheckpointRow = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleCheckpointChange = (index: number, field: keyof Omit<Checkpoint, "id">, val: string) => {
    const updated = [...checkpoints];
    updated[index][field] = val;
    setCheckpoints(updated);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!tplName.trim()) {
      setModalError("Template name is required");
      return;
    }
    if (!tplProductType.trim()) {
      setModalError("Product type is required");
      return;
    }
    if (checkpoints.length === 0) {
      setModalError("At least one checkpoint item is required");
      return;
    }

    // Validate checkpoints have content
    for (let i = 0; i < checkpoints.length; i++) {
      const item = checkpoints[i];
      if (!item.category.trim() || !item.item.trim() || !item.measurement.trim() || !item.passedCriteria.trim()) {
        setModalError(`All fields are required in checkpoint row #${i + 1}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      // Map checkpoints to include standard 1-based IDs
      const mappedCheckpoints: Checkpoint[] = checkpoints.map((c, i) => ({
        id: i + 1,
        category: c.category.trim(),
        item: c.item.trim(),
        measurement: c.measurement.trim(),
        passedCriteria: c.passedCriteria.trim(),
      }));

      const payload = {
        name: tplName.trim(),
        productType: tplProductType.trim(),
        checkpoints: mappedCheckpoints.length,
        checklist: mappedCheckpoints,
      };

      const newTpl = await qualityApi.createTemplate(payload);

      // Clean up and refresh
      setTplName("");
      setTplProductType("");
      setCheckpoints([{ category: "Upper Construction", item: "Stitching quality and alignment", measurement: "Visual check", passedCriteria: "No loose threads" }]);
      setShowModal(false);
      setSelectedTemplate(newTpl.id);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create quality template");
    } finally {
      setSubmitting(false);
    }
  };

  // Correlate templates with inspections to calculate usage metrics dynamically
  const templateMetrics = templates.map((tpl) => {
    const usages = inspections.filter((i) => i.template_id === tpl.id);
    const usageCount = usages.length;
    let lastUsed = "Never";
    if (usageCount > 0) {
      const dates = usages.map((u) => new Date(u.created_at).getTime());
      const maxDate = new Date(Math.max(...dates));
      lastUsed = maxDate.toLocaleDateString();
    }
    return {
      ...tpl,
      usageCount,
      lastUsed,
    };
  });

  const selectedTemplateData = templateMetrics.find((t) => t.id === selectedTemplate);

  const totalTemplates = templates.length;
  const totalCheckpoints = templates.reduce((sum, t) => sum + (t.checkpoints || 0), 0);
  const totalUsage = templateMetrics.reduce((sum, t) => sum + t.usageCount, 0);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Quality Inspection Templates</h1>
            <p className="text-slate-600 text-sm mt-1">Standardized checklists for consistent quality control</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Loading QA inspection templates...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Templates</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalTemplates}</p>
                    <p className="text-slate-500 text-xs mt-1">active checklists</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Checkpoints</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalCheckpoints}</p>
                    <p className="text-slate-500 text-xs mt-1">across all templates</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Usages</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalUsage}</p>
                    <p className="text-slate-500 text-xs mt-1">runs checked with templates</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 space-y-4">
                {templateMetrics.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 bg-white border border-slate-200 rounded-xl">
                    No templates configured yet.
                  </div>
                ) : (
                  templateMetrics.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-blue-600 bg-blue-50/70 shadow-md scale-[1.01]"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm leading-tight">{template.name}</h4>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">TPL-{template.id.substring(0, 6).toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Model:</span>
                          <span className="font-semibold text-slate-800">{template.product_type}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Checkpoints:</span>
                          <span className="font-semibold text-blue-600">{template.checkpoints}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Correlated Runs:</span>
                          <span className="font-semibold text-slate-800">{template.usageCount} times</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Last Used:</span>
                          <span className="text-slate-600 font-semibold">{template.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="lg:col-span-2">
                {selectedTemplateData ? (
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{selectedTemplateData.name}</h3>
                        <p className="text-slate-300 text-xs mt-1">
                          Applies to product model: <strong>{selectedTemplateData.product_type}</strong> • Contains {selectedTemplateData.checkpoints} guidelines
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {Object.entries(
                          selectedTemplateData.checklist.reduce((acc, item) => {
                            if (!acc[item.category]) acc[item.category] = [];
                            acc[item.category].push(item);
                            return acc;
                          }, {} as Record<string, typeof selectedTemplateData.checklist>)
                        ).map(([category, items]) => (
                          <div key={category} className="border border-slate-100 rounded-xl p-4 shadow-sm bg-slate-50/40">
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200/60 pb-2">
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                              {category}
                            </h4>
                            <div className="space-y-3">
                              {items.map((checkpoint) => (
                                <div key={checkpoint.id} className="border-l-4 border-blue-500 bg-white rounded-r-lg p-3 shadow-xs border border-slate-100 border-l-0">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inspection Item</p>
                                      <p className="text-sm font-semibold text-slate-900">{checkpoint.item}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Method / Tool</p>
                                      <p className="text-sm text-slate-700 font-medium">{checkpoint.measurement}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pass Criteria</p>
                                      <p className="text-sm text-emerald-700 font-semibold">{checkpoint.passedCriteria}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg font-medium">Select a template to view details</p>
                    <p className="text-slate-400 text-sm mt-2">Click on any template from the list on the left to see checkpoints</p>
                  </div>
                )}
              </div>
            </div>

            {/* Create Template Modal */}
            {showModal && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <h3 className="font-semibold text-lg">Create Inspection Checklist Template</h3>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTemplate} className="p-6 overflow-y-auto flex-1 space-y-6">
                    {modalError && (
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{modalError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name</label>
                        <input
                          type="text"
                          value={tplName}
                          onChange={(e) => setTplName(e.target.value)}
                          placeholder="e.g. Premium Sports Runner Inspection"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Product Model Type</label>
                        <input
                          type="text"
                          value={tplProductType}
                          onChange={(e) => setTplProductType(e.target.value)}
                          placeholder="e.g. Running Shoe Pro"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-900 text-sm">Checklist Checkpoints ({checkpoints.length})</h4>
                        <button
                          type="button"
                          onClick={addCheckpointRow}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Checkpoint
                        </button>
                      </div>

                      <div className="space-y-3">
                        {checkpoints.map((row, index) => (
                          <div key={index} className="flex gap-2 items-start bg-slate-50 border border-slate-100 rounded-lg p-3 relative">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                              <div>
                                <input
                                  type="text"
                                  value={row.category}
                                  onChange={(e) => handleCheckpointChange(index, "category", e.target.value)}
                                  placeholder="Category (e.g. Upper)"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={row.item}
                                  onChange={(e) => handleCheckpointChange(index, "item", e.target.value)}
                                  placeholder="Inspection Item"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={row.measurement}
                                  onChange={(e) => handleCheckpointChange(index, "measurement", e.target.value)}
                                  placeholder="Measurement Tool"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  value={row.passedCriteria}
                                  onChange={(e) => handleCheckpointChange(index, "passedCriteria", e.target.value)}
                                  placeholder="Pass Criteria"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>
                            </div>
                            {checkpoints.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCheckpointRow(index)}
                                className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all self-center"
                                title="Remove row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50"
                      >
                        {submitting ? "Saving template..." : "Save Template"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
