import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Database, Package, RefreshCw, BarChart2 } from "lucide-react";
import { inventoryApi } from "../../services/inventoryApi";

export function WarehouseLocations() {
  const [loading, setLoading] = useState(true);
  const [zoneStats, setZoneStats] = useState({
    zoneA: { current: 0, capacity: 2500, name: "Zone A - Raw Leather & Linings", itemsCount: 0 },
    zoneB: { current: 0, capacity: 3000, name: "Zone B - Soles & EVA Foams", itemsCount: 0 },
    zoneC: { current: 0, capacity: 1000, name: "Zone C - Chemicals & Adhesives", itemsCount: 0 },
    zoneFG: { current: 0, capacity: 8000, name: "Zone FG - Finished Shoes", itemsCount: 0 }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materials, finishedGoods] = await Promise.all([
        inventoryApi.getRawMaterials(),
        inventoryApi.getFinishedGoods()
      ]);

      const stats = {
        zoneA: { current: 0, capacity: 2500, name: "Zone A - Raw Leather & Linings", itemsCount: 0 },
        zoneB: { current: 0, capacity: 3000, name: "Zone B - Soles & EVA Foams", itemsCount: 0 },
        zoneC: { current: 0, capacity: 1000, name: "Zone C - Chemicals & Adhesives", itemsCount: 0 },
        zoneFG: { current: 0, capacity: 8000, name: "Zone FG - Finished Shoes", itemsCount: 0 }
      };

      // Sum raw materials
      materials.forEach(m => {
        const loc = (m.warehouseLocation || "").toUpperCase();
        if (loc.includes("WH-A")) {
          stats.zoneA.current += m.quantity;
          stats.zoneA.itemsCount += 1;
        } else if (loc.includes("WH-B")) {
          stats.zoneB.current += m.quantity;
          stats.zoneB.itemsCount += 1;
        } else if (loc.includes("WH-C")) {
          stats.zoneC.current += m.quantity;
          stats.zoneC.itemsCount += 1;
        } else {
          // Default fallbacks to prevent unassigned items
          stats.zoneA.current += m.quantity;
          stats.zoneA.itemsCount += 1;
        }
      });

      // Sum finished goods
      finishedGoods.forEach(fg => {
        stats.zoneFG.current += fg.stock;
        stats.zoneFG.itemsCount += 1;
      });

      setZoneStats(stats);
    } catch (err) {
      console.error("Failed to calculate warehouse stats", err);
    } finally {
      setLoading(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Warehouse Location Tracking</h1>
            <p className="text-slate-600 text-sm mt-1">Real-time space capacity utilization across zones</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors bg-white font-medium text-slate-700 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading warehouse analytics...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(zoneStats).map(([key, zone]) => {
              const pct = getPercent(zone.current, zone.capacity);
              return (
                <div key={key} className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{zone.name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{zone.itemsCount} material types stored</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-sm">
                      <span className="text-slate-600 font-medium">Space Utilization</span>
                      <span className="font-bold text-slate-900">{pct.toFixed(1)}%</span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
                      <div>
                        <p className="text-slate-500">Current Occupancy</p>
                        <p className="text-lg font-bold text-slate-800 mt-0.5">
                          {zone.current.toLocaleString()} units
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total Capacity</p>
                        <p className="text-lg font-bold text-slate-800 mt-0.5">
                          {zone.capacity.toLocaleString()} units
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
    </Layout>
  );
}
