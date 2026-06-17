import { useState } from "react";
import { Layout } from "../Layout";
import { Plus, Edit, Trash2 } from "lucide-react";

export function ProductCatalog() {
  const [products, setProducts] = useState([
    {
      id: 1,
      model: "Running Shoe Pro",
      sizes: ["6", "7", "8", "9", "10", "11", "12"],
      materials: ["Premium Leather", "Rubber Sole", "Fabric Lining"],
      category: "Athletic",
      price: 129.99,
    },
    {
      id: 2,
      model: "Casual Sneaker",
      sizes: ["6", "7", "8", "9", "10", "11"],
      materials: ["Canvas", "Rubber Sole", "Cotton Lining"],
      category: "Casual",
      price: 79.99,
    },
    {
      id: 3,
      model: "Sports Trainer",
      sizes: ["7", "8", "9", "10", "11", "12"],
      materials: ["Synthetic", "EVA Sole", "Mesh Lining"],
      category: "Athletic",
      price: 149.99,
    },
    {
      id: 4,
      model: "Walking Comfort",
      sizes: ["6", "7", "8", "9", "10"],
      materials: ["Leather", "Memory Foam Sole", "Fabric Lining"],
      category: "Comfort",
      price: 99.99,
    },
  ]);

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Product Catalog</h1>
            <p className="text-slate-600 text-sm mt-1">Manage shoe models and specifications</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{product.model}</h3>
                  <span className="text-xs text-slate-600">{product.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Available Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <span
                        key={size}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Materials</p>
                  <div className="space-y-1">
                    {product.materials.map((material, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span className="text-sm text-slate-600">{material}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Base Price</span>
                    <span className="text-lg font-semibold text-slate-900">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
