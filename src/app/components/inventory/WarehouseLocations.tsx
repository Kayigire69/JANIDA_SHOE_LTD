import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Database, Package, RefreshCw, BarChart2, MapPin, Plus, X } from "lucide-react";
import { inventoryApi, Warehouse } from "../../services/inventoryApi";
import { getCurrentRole } from "../../services/session";
import { toast } from "sonner";

export function WarehouseLocations() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<(Warehouse & { current: number, itemsCount: number })[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: "", capacity: 1000, type: "Raw Materials" });

  const userRole = getCurrentRole();
  const canManage = userRole === "Inventory Manager" || userRole === "Administrator";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materials, fetchedWarehouses] = await Promise.all([
        inventoryApi.getRawMaterials(),
        inventoryApi.getWarehouses()
      ]);

      const stats = fetchedWarehouses.map(wh => ({
        ...wh,
        current: 0,
        itemsCount: 0
      }));

      // Sum raw materials into their assigned warehouses
      materials.forEach(m => {
        const loc = m.warehouseLocation || "";
        const wh = stats.find(w => w.id === loc || w.name === loc) || stats[0];
        if (wh) {
          wh.current += m.quantity;
          wh.itemsCount += 1;
        }
      });

      setWarehouses(stats);
    } catch (err) {
      console.error("Failed to calculate warehouse stats", err);
      toast.error("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await inventoryApi.createWarehouse(newWarehouse);
      setShowAddModal(false);
      setNewWarehouse({ name: "", capacity: 1000, type: "Raw Materials" });
      toast.success("Warehouse added successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to add warehouse.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPercent = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return "bg-red-600";
    if (pct >= 75) return "bg-amber-500";
    return "bg-blue-600";
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
              <MapPin className="w-8 h-8 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Warehouse Location Tracking</h1>
              <p className="text-blue-100 text-sm mt-1.5 font-medium max-w-xl">Real-time space capacity utilization, zone management, and bin tracking.</p>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-[0_5px_15px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_20px_rgb(79,70,229,0.4)] hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Warehouse
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading warehouse analytics...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {warehouses.map((zone) => {
              const pct = getPercent(zone.current, zone.capacity);
              return (
                <div key={zone.id} className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xl">{zone.name}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">{zone.itemsCount} material types stored</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-slate-600 font-bold">Space Utilization</span>
                      <span className="font-extrabold text-slate-900 text-lg">{pct.toFixed(1)}%</span>
                    </div>

                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 mt-4 border-t border-slate-100/80 text-sm">
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-slate-500 font-medium mb-1">Current Occupancy</p>
                        <p className="text-xl font-extrabold text-slate-800">
                          {zone.current.toLocaleString()} <span className="text-sm font-bold text-slate-400">units</span>
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-4">
                        <p className="text-slate-500 font-medium mb-1">Total Capacity</p>
                        <p className="text-xl font-extrabold text-slate-800">
                          {zone.capacity.toLocaleString()} <span className="text-sm font-bold text-slate-400">units</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Add New Warehouse
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddWarehouse} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone D - Outsoles"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Capacity (units) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newWarehouse.capacity}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Storage Type</label>
                <input
                  type="text"
                  value={newWarehouse.type}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, type: e.target.value })}
                  placeholder="e.g. Raw Materials"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  Save Warehouse
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
