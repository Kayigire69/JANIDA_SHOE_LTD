import { useState } from "react";
import { Layout } from "../Layout";
import { Search, MapPin, Package } from "lucide-react";

export function FinishedGoods() {
  const [searchQuery, setSearchQuery] = useState("");

  const products = [
    { id: 1, name: "Running Shoe Pro - Size 10", stock: 450, location: "Warehouse A - Shelf 12", status: "Available" },
    { id: 2, name: "Casual Sneaker - Size 9", stock: 320, location: "Warehouse B - Shelf 5", status: "Available" },
    { id: 3, name: "Sports Trainer - Size 11", stock: 15, location: "Warehouse A - Shelf 8", status: "Low Stock" },
    { id: 4, name: "Walking Comfort - Size 8", stock: 580, location: "Warehouse C - Shelf 3", status: "Available" },
    { id: 5, name: "Running Shoe Pro - Size 9", stock: 0, location: "Warehouse A - Shelf 12", status: "Out of Stock" },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-100 text-emerald-700";
      case "Low Stock":
        return "bg-amber-100 text-amber-700";
      case "Out of Stock":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Finished Goods Inventory</h1>
            <p className="text-slate-600 text-sm mt-1">Track finished product stock and locations</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search finished products..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <p className="text-slate-600 text-sm font-medium">Total Products</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">1,365</p>
            <p className="text-slate-500 text-sm mt-1">units in stock</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <p className="text-slate-600 text-sm font-medium">Available</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">1,350</p>
            <p className="text-slate-500 text-sm mt-1">ready to ship</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <p className="text-slate-600 text-sm font-medium">Low Stock</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">1</p>
            <p className="text-slate-500 text-sm mt-1">needs restock</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <p className="text-slate-600 text-sm font-medium">Out of Stock</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">1</p>
            <p className="text-slate-500 text-sm mt-1">urgent action</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Stock Level</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Warehouse Location</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Availability Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-slate-100 hover:bg-slate-50 ${
                      product.status === "Out of Stock" ? "bg-red-50" : product.status === "Low Stock" ? "bg-amber-50" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{product.stock} units</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">{product.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
