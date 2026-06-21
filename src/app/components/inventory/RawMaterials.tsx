import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Package, Plus, Edit, AlertTriangle, TrendingDown, DollarSign, X } from "lucide-react";
import { inventoryApi, RawMaterial, Warehouse } from "../../services/inventoryApi";
import { getCurrentRole } from "../../services/session";
import { toast } from "sonner";

export function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newMaterial, setNewMaterial] = useState({
    materialCode: "",
    name: "",
    quantity: 0,
    unit: "sqm",
    minimum: 100,
    maximum: 1000,
    unitCost: 0,
    supplier: "",
    warehouseLocation: "WH-A-01",
  });

  const userRole = getCurrentRole();
  const canManage = userRole === "Inventory Manager" || userRole === "Administrator";

  useEffect(() => {
    fetchMaterialsAndWarehouses();
  }, []);

  const fetchMaterialsAndWarehouses = async () => {
    try {
      setLoading(true);
      const [materialsData, warehousesData] = await Promise.all([
        inventoryApi.getRawMaterials(),
        inventoryApi.getWarehouses()
      ]);
      setMaterials(materialsData);
      setWarehouses(warehousesData);
      if (warehousesData.length > 0 && newMaterial.warehouseLocation === "WH-A-01") {
        setNewMaterial(prev => ({ ...prev, warehouseLocation: warehousesData[0].id }));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Unauthorized: Only Inventory Managers or Administrators can add raw materials.");
      return;
    }
    try {
      await inventoryApi.createRawMaterial({
        materialCode: newMaterial.materialCode,
        name: newMaterial.name,
        quantity: Number(newMaterial.quantity),
        unit: newMaterial.unit,
        minimum: Number(newMaterial.minimum),
        maximum: Number(newMaterial.maximum),
        unitCost: Number(newMaterial.unitCost),
        supplier: newMaterial.supplier,
        warehouseLocation: newMaterial.warehouseLocation,
      });
      setShowAddModal(false);
      // Reset form
      setNewMaterial({
        materialCode: "",
        name: "",
        quantity: 0,
        unit: "sqm",
        minimum: 100,
        maximum: 1000,
        unitCost: 0,
        supplier: "",
        warehouseLocation: warehouses.length > 0 ? warehouses[0].id : "",
      });
      fetchMaterialsAndWarehouses();
      toast.success("Raw material added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to create raw material");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-600";
      case "low":
        return "bg-amber-100 text-amber-700 border-amber-600";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-600";
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.idCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInventoryValue = materials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0);
  const criticalCount = materials.filter(m => m.status === "critical").length;
  const lowCount = materials.filter(m => m.status === "low").length;
  const normalCount = materials.filter(m => m.status === "normal").length;



  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
              <Package className="w-8 h-8 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Raw Materials Inventory</h1>
              <p className="text-blue-100 text-sm mt-1.5 font-medium max-w-xl">Manage and track raw material stock levels, reorder points, and supplier logistics.</p>
            </div>
          </div>
          <div className="relative z-10">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-[0_5px_15px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_20px_rgb(79,70,229,0.4)] hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                Add Material
              </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Total Materials</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{materials.length}</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">types in stock</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="w-full h-1 bg-blue-100 mt-4 rounded-full overflow-hidden">
              <div className="w-full h-full bg-blue-500 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Normal Stock</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{normalCount}</p>
                <p className="text-emerald-500 text-xs mt-1 font-medium">Above minimum</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="w-full h-1 bg-emerald-100 mt-4 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Low Stock</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{lowCount}</p>
                <p className="text-amber-500 text-xs mt-1 font-medium">Needs restocking</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="w-full h-1 bg-amber-100 mt-4 rounded-full overflow-hidden">
              <div className="w-full h-full bg-amber-500 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Critical Stock</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{criticalCount}</p>
                <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Urgent action
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="w-full h-1 bg-red-100 mt-4 rounded-full overflow-hidden">
              <div className="w-full h-full bg-red-500 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100/80 p-6 flex flex-col justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-semibold tracking-wide">Inventory Value</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalInventoryValue.toLocaleString()} <span className="text-base font-bold text-slate-400">RWF</span></p>
                <p className="text-slate-400 text-xs mt-1 font-medium">total stock value</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="w-full h-1 bg-slate-100 mt-4 rounded-full overflow-hidden">
              <div className="w-full h-full bg-slate-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by material code, name, or supplier..."
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading raw materials...</div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No raw materials found matching your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Material ID</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Quantity</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Min / Max</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Location</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Unit Cost</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Total Value</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Supplier</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Last Restocked</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((material) => (
                    <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-6 text-sm font-medium text-slate-900 font-mono">{material.idCode}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">{material.name}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-900">
                        {material.quantity} {material.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {material.minimum} / {material.maximum} {material.unit}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 font-mono">{material.warehouseLocation}</td>
                      <td className="py-4 px-6 text-sm text-slate-700">{material.unitCost.toLocaleString()} RWF</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        {(material.quantity * material.unitCost).toLocaleString()} RWF
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">{material.supplier || "-"}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{material.lastRestocked || "-"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-l-4 ${getStatusColor(material.status)}`}>
                          {material.status === "critical" ? "Critical" : material.status === "low" ? "Low Stock" : "Normal"}
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

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Add New Raw Material
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Material Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM-007"
                    value={newMaterial.materialCode}
                    onChange={(e) => setNewMaterial({ ...newMaterial, materialCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nylon Fabric"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit *</label>
                  <select
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="sqm">sqm</option>
                    <option value="kg">kg</option>
                    <option value="meters">meters</option>
                    <option value="pairs">pairs</option>
                    <option value="sheets">sheets</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.unitCost}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.minimum}
                    onChange={(e) => setNewMaterial({ ...newMaterial, minimum: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newMaterial.maximum}
                    onChange={(e) => setNewMaterial({ ...newMaterial, maximum: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse Location</label>
                  <select
                    value={newMaterial.warehouseLocation}
                    onChange={(e) => setNewMaterial({ ...newMaterial, warehouseLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="" disabled>Select a Warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Global Leather Co."
                    value={newMaterial.supplier}
                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  Save Material
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
