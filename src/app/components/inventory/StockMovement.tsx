import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { ArrowUpRight, ArrowDownLeft, Plus, Calendar, Search, AlertTriangle, X, BarChart3, ClipboardCheck, TrendingUp } from "lucide-react";
import { inventoryApi, StockMovement as Movement, RawMaterial, FinishedGood } from "../../services/inventoryApi";
import { exportToCSV, generateStyledPDF } from "../../utils/exportUtils";
import { useSettings } from "../../context/SettingsContext";
import { getCurrentRole } from "../../services/session";
import { toast } from "sonner";

export function StockMovement() {
  const { companyName, logoUrl, API_BASE_URL } = useSettings();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [newMovement, setNewMovement] = useState({
    itemType: "raw_material" as "raw_material" | "finished_good",
    rawMaterialId: "",
    finishedGoodId: "",
    quantity: 0,
    referenceNumber: "",
    warehouseLocation: "",
  });

  const userRole = getCurrentRole();
  const canManage = userRole === "Inventory Manager" || userRole === "Administrator";

  useEffect(() => {
    fetchMovements();
    fetchOptions();
  }, [filterMaterial, filterDate]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getStockMovements(filterMaterial, filterDate);
      setMovements(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load stock movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [mats, fgs] = await Promise.all([
        inventoryApi.getRawMaterials(),
        inventoryApi.getFinishedGoods()
      ]);
      setMaterials(mats);
      setFinishedGoods(fgs);
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Unauthorized: Only Inventory Managers or Administrators can record stock movements.");
      return;
    }
    const isRaw = newMovement.itemType === "raw_material";
    const itemId = isRaw ? newMovement.rawMaterialId : newMovement.finishedGoodId;
    if (!itemId || newMovement.quantity <= 0) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        itemType: newMovement.itemType,
        rawMaterialId: isRaw ? newMovement.rawMaterialId : undefined,
        finishedGoodId: !isRaw ? newMovement.finishedGoodId : undefined,
        quantity: Number(newMovement.quantity),
        type: adjustType,
        referenceNumber: newMovement.referenceNumber,
        warehouseLocation: newMovement.warehouseLocation || undefined,
      };

      if (adjustType === "in") {
        await inventoryApi.recordStockIn(payload);
      } else {
        await inventoryApi.recordStockOut(payload);
      }

      setShowAdjustModal(false);
      // Reset form
      setNewMovement({
        itemType: "raw_material",
        rawMaterialId: "",
        finishedGoodId: "",
        quantity: 0,
        referenceNumber: "",
        warehouseLocation: "",
      });
      fetchMovements();
      fetchOptions();
      toast.success("Stock movement recorded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to log movement");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Stock Movement Report"],
      [""],
      ["Log ID", "Item", "Type", "Direction", "Quantity", "Reference", "Location", "Date", "Operator"],
      ...movements.map(m => [
        m.id.substring(0, 8),
        m.material,
        m.unit === "pairs" ? "Finished Good" : "Raw Material",
        m.type.toUpperCase(),
        `${m.quantity} ${m.unit}`,
        m.reference || "-",
        m.location || "-",
        m.date,
        m.operator
      ])
    ];
    exportToCSV("stock_movement_report", rows);
  };

  const handleExportPDF = async () => {
    await generateStyledPDF({
      filename: "stock-movement-report",
      reportTitle: "Stock Movement Report",
      sectionTitle: "1. STOCK MOVEMENT IN PERIOD",
      periodStart: filterDate || "All Time",
      columns: ["Log ID", "Item", "Type", "Direction", "Quantity", "Reference", "Location", "Date"],
      rows: movements.map(m => [
        m.id.substring(0, 8),
        m.material,
        m.unit === "pairs" ? "Finished Good" : "Raw Material",
        m.type.toUpperCase(),
        `${m.type === "in" ? "+" : "-"}${m.quantity} ${m.unit}`,
        m.reference || "-",
        m.location || "-",
        new Date(m.date).toLocaleDateString()
      ]),
      companyName,
      logoUrl: logoUrl || undefined,
      apiBaseUrl: API_BASE_URL
    });
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Stock Movement Logs</h1>
              <p className="text-blue-100 text-sm mt-1.5 font-medium max-w-xl">Real-time recording and historical tracking of inventory transfers and adjustments.</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex gap-2 print:hidden mr-4">
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                Export PDF
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <BarChart3 className="w-4 h-4" />
                Export Excel
              </button>
            </div>
            {canManage && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAdjustType("in");
                    setShowAdjustModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_14px_0_rgb(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Stock-In
                </button>
                <button
                  onClick={() => {
                    setAdjustType("out");
                    setShowAdjustModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all text-sm shadow-[0_4px_14px_0_rgb(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Stock-Out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                placeholder="Search by material code or SKU..."
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
              />
            </div>
            <button
              onClick={() => {
                setFilterMaterial("");
                setFilterDate("");
              }}
              className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
            >
              Reset Filters
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500 font-medium">Loading ledger...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">No stock movements recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Log ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Item</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Direction</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Quantity</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Reference</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Location</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Recorded Date</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => (
                    <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm text-slate-600 font-mono">{mov.id.substring(0, 8)}...</td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-semibold">{mov.material}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {mov.unit === "pairs" ? "Finished Good" : "Raw Material"}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          mov.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {mov.type === "in" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {mov.type === "in" ? "STOCK IN" : "STOCK OUT"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        {mov.quantity} {mov.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-mono">{mov.reference || "-"}</td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-mono">{mov.location || "-"}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{mov.date}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">{mov.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className={`px-6 py-4 flex items-center justify-between text-white bg-gradient-to-r ${
              adjustType === "in" ? "from-emerald-600 to-emerald-700" : "from-red-600 to-red-700"
            }`}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {adjustType === "in" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                Record Stock-{adjustType === "in" ? "In" : "Out"}
              </h3>
              <button 
                onClick={() => setShowAdjustModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMovement({ ...newMovement, itemType: "raw_material" })}
                    className={`py-2 text-center rounded-lg text-sm font-medium border ${
                      newMovement.itemType === "raw_material"
                        ? "bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Raw Material
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMovement({ ...newMovement, itemType: "finished_good" })}
                    className={`py-2 text-center rounded-lg text-sm font-medium border ${
                      newMovement.itemType === "finished_good"
                        ? "bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    Finished SKU
                  </button>
                </div>
              </div>

              {newMovement.itemType === "raw_material" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Raw Material *</label>
                  <select
                    required
                    value={newMovement.rawMaterialId}
                    onChange={(e) => setNewMovement({ ...newMovement, rawMaterialId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Choose Material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.idCode})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Finished SKU *</label>
                  <select
                    required
                    value={newMovement.finishedGoodId}
                    onChange={(e) => setNewMovement({ ...newMovement, finishedGoodId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Choose SKU</option>
                    {finishedGoods.map(fg => (
                      <option key={fg.id} value={fg.id}>{fg.sku} - {fg.product}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement({ ...newMovement, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    placeholder="e.g. WH-A-01"
                    value={newMovement.warehouseLocation}
                    onChange={(e) => setNewMovement({ ...newMovement, warehouseLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference Number / Code</label>
                <input
                  type="text"
                  placeholder="e.g. ADJ-001"
                  value={newMovement.referenceNumber}
                  onChange={(e) => setNewMovement({ ...newMovement, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white rounded-lg font-medium transition-colors text-sm shadow-md ${
                    adjustType === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  Confirm Stock-{adjustType === "in" ? "In" : "Out"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
