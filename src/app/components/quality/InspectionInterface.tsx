import { useState } from "react";
import { Layout } from "../Layout";
import { ClipboardCheck, CheckCircle2 } from "lucide-react";

export function InspectionInterface() {
  const [formData, setFormData] = useState({
    batchId: "",
    template: "",
    size: "",
    stitching: "",
    material: "",
    color: "",
    weight: "",
    flexibility: "",
    adhesion: "",
  });

  const batches = ["BTH-001234", "BTH-001235", "BTH-001236", "BTH-001237"];
  const templates = ["Standard Shoe Inspection", "Premium Quality Check", "Quick Inspection"];

  const handleSubmit = () => {
    console.log("Inspection submitted:", formData);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Quality Inspection</h1>
            <p className="text-slate-600 text-sm mt-1">Perform quality checks on production batches</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                Batch Selection
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Batch ID</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select batch</option>
                    {batches.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Inspection Template</label>
                  <select
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select template</option>
                    {templates.map((template) => (
                      <option key={template} value={template}>
                        {template}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Physical Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Size Accuracy</label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Weight (grams)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Enter weight"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quality Checks</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Stitching Quality</label>
                  <select
                    value={formData.stitching}
                    onChange={(e) => setFormData({ ...formData, stitching: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Material Integrity</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color Consistency</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Flexibility Test</label>
                  <select
                    value={formData.flexibility}
                    onChange={(e) => setFormData({ ...formData, flexibility: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Adhesion Test</label>
                  <select
                    value={formData.adhesion}
                    onChange={(e) => setFormData({ ...formData, adhesion: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select rating</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Inspection Progress
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full ${formData.batchId ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <span className="text-slate-700">Batch selected</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full ${formData.template ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <span className="text-slate-700">Template selected</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full ${formData.size && formData.weight ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <span className="text-slate-700">Physical checks done</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded-full ${formData.stitching && formData.material && formData.color ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <span className="text-slate-700">Quality checks done</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="w-5 h-5" />
              Submit Inspection
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
