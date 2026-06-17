import { useState } from "react";
import { Layout } from "../Layout";
import { FileText, Plus, Edit, Copy, Trash2 } from "lucide-react";

export function InspectionTemplates() {
  const [searchTerm, setSearchTerm] = useState("");

  const templates = [
    {
      id: "TPL-001",
      name: "Running Shoe Quality Inspection",
      product: "Running Shoe Pro",
      checkpoints: 12,
      parameters: ["Stitching Quality", "Material Integrity", "Sole Adhesion", "Color Consistency", "Size Accuracy", "Lace Strength"],
      lastUsed: "2026-05-10",
      usageCount: 45,
      passRate: 97.2,
    },
    {
      id: "TPL-002",
      name: "Casual Sneaker QC Checklist",
      product: "Casual Sneaker",
      checkpoints: 10,
      parameters: ["Stitching", "Material", "Sole", "Color Match", "Size", "Finish Quality"],
      lastUsed: "2026-05-09",
      usageCount: 38,
      passRate: 98.5,
    },
    {
      id: "TPL-003",
      name: "Sports Trainer Inspection",
      product: "Sports Trainer",
      checkpoints: 14,
      parameters: ["Durability Test", "Stitching", "Material", "Sole", "Cushioning", "Support Structure", "Breathability"],
      lastUsed: "2026-05-08",
      usageCount: 32,
      passRate: 96.8,
    },
    {
      id: "TPL-004",
      name: "General Footwear QA",
      product: "All Products",
      checkpoints: 15,
      parameters: ["Overall Structure", "Material Quality", "Stitching", "Sole", "Color", "Size", "Finish", "Safety Standards"],
      lastUsed: "2026-05-11",
      usageCount: 120,
      passRate: 97.5,
    },
  ];

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Inspection Templates</h1>
            <p className="text-slate-600 text-sm mt-1">Manage quality inspection checklists and standards</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Templates</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{templates.length}</p>
                <p className="text-slate-500 text-sm mt-1">active checklists</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Pass Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {(templates.reduce((sum, t) => sum + t.passRate, 0) / templates.length).toFixed(1)}%
                </p>
                <p className="text-emerald-600 text-sm mt-1">quality standard</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Usage</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {templates.reduce((sum, t) => sum + t.usageCount, 0)}
                </p>
                <p className="text-slate-500 text-sm mt-1">inspections</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Checkpoints</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {templates.reduce((sum, t) => sum + t.checkpoints, 0)}
                </p>
                <p className="text-slate-500 text-sm mt-1">total checks</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="border border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      <p className="text-sm text-slate-600 font-mono">{template.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Product Type:</span>
                    <span className="font-medium text-slate-900">{template.product}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Checkpoints:</span>
                    <span className="font-medium text-slate-900">{template.checkpoints} items</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Usage Count:</span>
                    <span className="font-medium text-slate-900">{template.usageCount} times</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Pass Rate:</span>
                    <span className={`font-semibold ${
                      template.passRate >= 98 ? "text-emerald-600" : "text-blue-600"
                    }`}>{template.passRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Last Used:</span>
                    <span className="text-slate-900">{template.lastUsed}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-600 mb-2">Key Parameters:</p>
                  <div className="flex flex-wrap gap-2">
                    {template.parameters.map((param, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
