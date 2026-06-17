import { useState } from "react";
import { Layout } from "../Layout";
import { Search, PackagePlus, PackageMinus, AlertTriangle, TrendingUp } from "lucide-react";

export function RawMaterialInventory() {
  const [searchQuery, setSearchQuery] = useState("");

  const materials = [
    { id: 1, name: "Premium Leather", current: 450, minimum: 200, maximum: 1000, unit: "sqm", status: "normal" },
    { id: 2, name: "Rubber Sole", current: 780, minimum: 300, maximum: 1500, unit: "pairs", status: "normal" },
    { id: 3, name: "Fabric Lining", current: 120, minimum: 150, maximum: 800, unit: "meters", status: "low" },
    { id: 4, name: "Shoe Laces", current: 980, minimum: 400, maximum: 2000, unit: "pairs", status: "normal" },
    { id: 5, name: "Industrial Adhesive", current: 90, minimum: 100, maximum: 500, unit: "liters", status: "low" },
    { id: 6, name: "Synthetic Mesh", current: 1200, minimum: 200, maximum: 1000, unit: "meters", status: "overstock" },
  ];

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIndicator = (material: any) => {
    if (material.current < material.minimum) {
      return { color: "bg-red-100 border-red-500", text: "Low Stock", icon: AlertTriangle, iconColor: "text-red-600" };
    } else if (material.current > material.maximum) {
      return { color: "bg-amber-100 border-amber-500", text: "Overstock", icon: TrendingUp, iconColor: "text-amber-600" };
    }
    return { color: "bg-emerald-100 border-emerald-500", text: "Normal", icon: null, iconColor: "" };
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Raw Material Inventory</h1>
            <p className="text-slate-600 text-sm mt-1">Manage and track raw material stock levels</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials by name..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Material Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Current Stock</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Minimum Level</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Maximum Level</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Stock Level</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => {
                  const status = getStatusIndicator(material);
                  const percentage = ((material.current - material.minimum) / (material.maximum - material.minimum)) * 100;
                  const Icon = status.icon;

                  return (
                    <tr
                      key={material.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        material.status === "low" ? "bg-red-50" : material.status === "overstock" ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">{material.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {material.current} {material.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {material.minimum} {material.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {material.maximum} {material.unit}
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              material.status === "low"
                                ? "bg-red-500"
                                : material.status === "overstock"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color} border`}
                        >
                          {Icon && <Icon className={`w-3 h-3 ${status.iconColor}`} />}
                          {status.text}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <PackageMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
