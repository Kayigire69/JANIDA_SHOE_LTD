import { useState } from "react";
import { Layout } from "../Layout";
import { AlertCircle, CheckCircle2, XCircle, FileText } from "lucide-react";

export function InspectionResult() {
  const [formData, setFormData] = useState({
    batchId: "BTH-001234",
    defectType: "",
    defectClassification: "",
    result: "pass",
    notes: "",
  });

  const defectTypes = [
    "Stitching Defect",
    "Material Flaw",
    "Color Mismatch",
    "Size Variation",
    "Adhesion Failure",
    "Sole Defect",
  ];

  const handleSubmit = () => {
    console.log("Inspection result submitted:", formData);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Inspection Result</h1>
            <p className="text-slate-600 text-sm mt-1">Record inspection outcomes and defects</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Batch Information</h3>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Batch ID</p>
                    <p className="font-semibold text-slate-900 mt-1">{formData.batchId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Product</p>
                    <p className="font-semibold text-slate-900 mt-1">Running Shoe Pro</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Quantity Inspected</p>
                    <p className="font-semibold text-slate-900 mt-1">500 units</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Inspector</p>
                    <p className="font-semibold text-slate-900 mt-1">Sarah Williams</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Pass/Fail Decision</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({ ...formData, result: "pass" })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.result === "pass"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 ${formData.result === "pass" ? "text-emerald-600" : "text-slate-400"}`} />
                  <p className={`text-lg font-semibold ${formData.result === "pass" ? "text-emerald-900" : "text-slate-700"}`}>
                    Pass
                  </p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, result: "fail" })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.result === "fail"
                      ? "border-red-600 bg-red-50"
                      : "border-slate-200 hover:border-red-300"
                  }`}
                >
                  <XCircle className={`w-12 h-12 mx-auto mb-3 ${formData.result === "fail" ? "text-red-600" : "text-slate-400"}`} />
                  <p className={`text-lg font-semibold ${formData.result === "fail" ? "text-red-900" : "text-slate-700"}`}>
                    Fail
                  </p>
                </button>
              </div>
            </div>

            {formData.result === "fail" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Defect Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Defect Type</label>
                    <select
                      value={formData.defectType}
                      onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select defect type</option>
                      {defectTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Defect Classification</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Minor", "Major", "Critical"].map((classification) => (
                        <button
                          key={classification}
                          onClick={() => setFormData({ ...formData, defectClassification: classification })}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.defectClassification === classification
                              ? classification === "Critical"
                                ? "border-red-600 bg-red-50 text-red-900"
                                : classification === "Major"
                                ? "border-amber-600 bg-amber-50 text-amber-900"
                                : "border-blue-600 bg-blue-50 text-blue-900"
                              : "border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {classification}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Describe the defect in detail..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Inspection Summary
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-600">Decision</p>
                  <p className={`font-semibold mt-1 ${formData.result === "pass" ? "text-emerald-700" : "text-red-700"}`}>
                    {formData.result === "pass" ? "PASS" : "FAIL"}
                  </p>
                </div>
                {formData.result === "fail" && formData.defectType && (
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-600">Defect Type</p>
                    <p className="font-medium text-slate-900 mt-1">{formData.defectType}</p>
                  </div>
                )}
                {formData.result === "fail" && formData.defectClassification && (
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs text-slate-600">Classification</p>
                    <p
                      className={`font-semibold mt-1 ${
                        formData.defectClassification === "Critical"
                          ? "text-red-700"
                          : formData.defectClassification === "Major"
                          ? "text-amber-700"
                          : "text-blue-700"
                      }`}
                    >
                      {formData.defectClassification}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Submit Result
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
