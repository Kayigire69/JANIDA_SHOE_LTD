import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Loader2, Plus, X, Trash2, ShieldCheck, ClipboardCheck
} from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function QualityStandards() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quality standards
  const [qualityStandards, setQualityStandards] = useState<any[]>([]);
  const [editingStandard, setEditingStandard] = useState<any>(null);
  const [showStandardForm, setShowStandardForm] = useState(false);

  const fetchQualityStandards = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listQualityStandards();
      setQualityStandards(data.standards || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load quality standards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityStandards();
  }, []);

  const handleSaveStandard = async () => {
    try {
      if (editingStandard?.id) {
        await adminApi.updateQualityStandard(editingStandard.id, editingStandard);
      } else {
        await adminApi.createQualityStandard(editingStandard);
      }
      setShowStandardForm(false);
      setEditingStandard(null);
      fetchQualityStandards();
    } catch (err: any) {
      setError(err?.message || "Save quality standard failed");
    }
  };

  const handleDeleteStandard = async (id: string) => {
    if (!window.confirm("Delete this quality standard?")) return;
    try {
      await adminApi.deleteQualityStandard(id);
      fetchQualityStandards();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quality Standards</h1>
          <p className="text-slate-600 text-sm mt-1">Configure threshold scores (out of 10) for shoe size accuracy, stitching, soles, and defect limits</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {!showStandardForm ? (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-800">Standard Specifications</h2>
              <button
                onClick={() => {
                  setEditingStandard({
                    standardName: "",
                    productType: "",
                    sizeAccuracyMin: 8.5,
                    stitchingQualityMin: 8.5,
                    materialIntegrityMin: 8.5,
                    colorConsistencyMin: 8.5,
                    soleAdhesionMin: 8.5,
                    dimensionToleranceMin: 8.5,
                    maxDefectRate: 2.0,
                    isActive: true,
                    description: ""
                  });
                  setShowStandardForm(true);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Standard
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {!loading && qualityStandards.length === 0 && (
              <div className="text-center py-12 text-slate-500">No quality standards configured.</div>
            )}

            {!loading && qualityStandards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {qualityStandards.map((s) => (
                  <div key={s.id} className={`border rounded-xl p-5 hover:shadow-md transition-all bg-white ${
                    s.is_active ? "border-slate-200" : "border-slate-200 opacity-60"
                  }`}>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 flex items-center gap-1.5 text-base">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          {s.standard_name}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">Model Match: {s.product_type || "All products"}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}>{s.is_active ? "Active" : "Inactive"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div>Size Accuracy: <span className="font-semibold text-slate-800">{s.size_accuracy_min}/10</span></div>
                      <div>Stitching Quality: <span className="font-semibold text-slate-800">{s.stitching_quality_min}/10</span></div>
                      <div>Material Integrity: <span className="font-semibold text-slate-800">{s.material_integrity_min}/10</span></div>
                      <div>Color Consistency: <span className="font-semibold text-slate-800">{s.color_consistency_min}/10</span></div>
                      <div>Sole Adhesion: <span className="font-semibold text-slate-800">{s.sole_adhesion_min}/10</span></div>
                      <div>Dimension Tolerance: <span className="font-semibold text-slate-800">{s.dimension_tolerance_min}/10</span></div>
                      <div className="col-span-2 pt-2 border-t border-slate-200 mt-1 flex justify-between text-slate-700 font-medium">
                        <span>Max Defect Margin:</span>
                        <span>{s.max_defect_rate}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 italic line-clamp-2">{s.description || "No description provided."}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingStandard({
                            id: s.id,
                            standardName: s.standard_name,
                            productType: s.product_type,
                            sizeAccuracyMin: s.size_accuracy_min,
                            stitchingQualityMin: s.stitching_quality_min,
                            materialIntegrityMin: s.material_integrity_min,
                            colorConsistencyMin: s.color_consistency_min,
                            soleAdhesionMin: s.sole_adhesion_min,
                            dimensionToleranceMin: s.dimension_tolerance_min,
                            maxDefectRate: s.max_defect_rate,
                            isActive: s.is_active,
                            description: s.description
                          });
                          setShowStandardForm(true);
                        }}
                        className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Edit Specs
                      </button>
                      <button
                        onClick={() => handleDeleteStandard(s.id)}
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
          <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingStandard?.id ? "Edit Quality Standard" : "Add Quality Standard"}
              </h2>
              <button
                onClick={() => {
                  setShowStandardForm(false);
                  setEditingStandard(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Name *</label>
                  <input
                    value={editingStandard?.standardName || ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, standardName: e.target.value })}
                    placeholder="e.g. Sports Sneaker Standard"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Model Match (Optional)</label>
                  <input
                    value={editingStandard?.productType || ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, productType: e.target.value })}
                    placeholder="e.g. Running Shoe Pro"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size Accuracy Min (0-10) *</label>
                  <input
                    value={editingStandard?.sizeAccuracyMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, sizeAccuracyMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stitching Quality Min (0-10) *</label>
                  <input
                    value={editingStandard?.stitchingQualityMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, stitchingQualityMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Integrity Min (0-10) *</label>
                  <input
                    value={editingStandard?.materialIntegrityMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, materialIntegrityMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color Consistency Min (0-10) *</label>
                  <input
                    value={editingStandard?.colorConsistencyMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, colorConsistencyMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sole Adhesion Min (0-10) *</label>
                  <input
                    value={editingStandard?.soleAdhesionMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, soleAdhesionMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dimension Tolerance Min (0-10) *</label>
                  <input
                    value={editingStandard?.dimensionToleranceMin ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, dimensionToleranceMin: Number(e.target.value) })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Defect Rate Margin (%) *</label>
                  <input
                    value={editingStandard?.maxDefectRate ?? ""}
                    onChange={(e) => setEditingStandard({ ...editingStandard, maxDefectRate: Number(e.target.value) })}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStandard?.isActive ?? true}
                      onChange={(e) => setEditingStandard({ ...editingStandard, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    Active Specification Standard
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editingStandard?.description || ""}
                  onChange={(e) => setEditingStandard({ ...editingStandard, description: e.target.value })}
                  placeholder="Standard specifications overview details"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={handleSaveStandard}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Standard
                </button>
                <button
                  onClick={() => {
                    setShowStandardForm(false);
                    setEditingStandard(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
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
