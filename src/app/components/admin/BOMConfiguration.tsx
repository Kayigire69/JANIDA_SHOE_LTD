import { useState } from "react";
import { Layout } from "../Layout";
import { Plus, Trash2, Save } from "lucide-react";

export function BOMConfiguration() {
  const [selectedProduct, setSelectedProduct] = useState("Running Shoe Pro");
  const [bomItems, setBomItems] = useState([
    { id: 1, material: "Premium Leather", quantity: 2.5, unit: "sqm", cost: 45.0 },
    { id: 2, material: "Rubber Sole", quantity: 1, unit: "pair", cost: 12.5 },
    { id: 3, material: "Fabric Lining", quantity: 0.8, unit: "meters", cost: 8.0 },
    { id: 4, material: "Laces", quantity: 1, unit: "pair", cost: 2.5 },
    { id: 5, material: "Adhesive", quantity: 0.05, unit: "liters", cost: 3.2 },
  ]);

  const products = ["Running Shoe Pro", "Casual Sneaker", "Sports Trainer", "Walking Comfort"];
  const materials = [
    "Premium Leather",
    "Rubber Sole",
    "Fabric Lining",
    "Laces",
    "Adhesive",
    "Canvas",
    "Synthetic",
    "EVA Sole",
    "Mesh Lining",
    "Memory Foam Sole",
  ];

  const addItem = () => {
    setBomItems([
      ...bomItems,
      { id: Date.now(), material: "", quantity: 0, unit: "units", cost: 0 },
    ]);
  };

  const removeItem = (id: number) => {
    setBomItems(bomItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: any) => {
    setBomItems(
      bomItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalCost = bomItems.reduce((sum, item) => sum + item.cost, 0);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">BOM Configuration</h1>
            <p className="text-slate-600 text-sm mt-1">
              Configure Bill of Materials for each product
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
            <Save className="w-4 h-4" />
            Save BOM
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full max-w-md px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Material
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Quantity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Unit
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Cost ($)
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                  >
                    <td className="py-3 px-4">
                      <select
                        value={item.material}
                        onChange={(e) => updateItem(item.id, "material", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select material</option>
                        {materials.map((material) => (
                          <option key={material} value={material}>
                            {material}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, "quantity", parseFloat(e.target.value))
                        }
                        step="0.01"
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                        className="w-28 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sqm">sqm</option>
                        <option value="pair">pair</option>
                        <option value="meters">meters</option>
                        <option value="liters">liters</option>
                        <option value="units">units</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updateItem(item.id, "cost", parseFloat(e.target.value))}
                        step="0.01"
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-sm font-semibold text-slate-900">
                    Total Cost per Unit
                  </td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900">
                    ${totalCost.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button
            onClick={addItem}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        </div>
      </div>
    </Layout>
  );
}
