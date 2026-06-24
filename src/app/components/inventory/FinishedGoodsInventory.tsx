import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Package, TrendingUp, Download, AlertTriangle } from "lucide-react";
import { inventoryApi, FinishedGood } from "../../services/inventoryApi";

export function FinishedGoodsInventory() {
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFinishedGoods();
  }, []);

  const fetchFinishedGoods = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getFinishedGoods();
      setFinishedGoods(data);
    } catch (err: any) {
      setError(err.message || "Failed to load finished goods inventory");
    } finally {
      setLoading(false);
    }
  };

  const filteredGoods = finishedGoods.filter((item) => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalStock = finishedGoods.reduce((sum, item) => sum + item.stock, 0);
  const totalValue = finishedGoods.reduce((sum, item) => sum + (item.stock * item.unitCost), 0);
  const lowStockCount = finishedGoods.filter(item => item.status === "low" || item.status === "critical").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "low":
        return "bg-amber-100 text-amber-700";
      case "excess":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-emerald-100 text-emerald-700";
    }
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ["Product ID,Product Name,Stock,Target,Minimum,Warehouse Location,Unit Cost,Total Value,Last Produced,Status"];
    const rows = filteredGoods.map(item => 
      `"${item.id}","${item.product}",${item.stock},${item.target},${item.minimum},"${item.warehouseLocation}",${item.unitCost},${(item.stock * item.unitCost).toFixed(2)},"${item.lastProduced || ''}","${item.status}"`
    );
    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finished-goods-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Finished Goods Inventory</h1>
            <p className="text-slate-600 text-sm mt-1">Track and manage finished product stock levels</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Stock</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalStock.toLocaleString()}</p>
                <p className="text-slate-500 text-sm mt-1">units</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">RWF {(totalValue / 1000).toFixed(1)}k</p>
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  inventory value
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Low Stock Items</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{lowStockCount}</p>
                <p className="text-amber-600 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  needs attention
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Product Lines</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{finishedGoods.length}</p>
                <p className="text-slate-500 text-sm mt-1">active products</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or ID..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="normal">Normal</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="excess">Excess</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500 font-medium">Loading inventory...</div>
          ) : filteredGoods.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">No items found matching your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Stock</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Target</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Minimum</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Location</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Unit Cost</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Total Value</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Last Produced</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoods.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">{item.id}</td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">{item.product}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">{item.stock}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{item.target}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{item.minimum}</td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-mono">{item.warehouseLocation}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">RWF {item.unitCost.toFixed(2)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        RWF {(item.stock * item.unitCost).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{item.lastProduced || "-"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status === "critical" ? "Critical" :
                           item.status === "low" ? "Low Stock" :
                           item.status === "excess" ? "Excess" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
