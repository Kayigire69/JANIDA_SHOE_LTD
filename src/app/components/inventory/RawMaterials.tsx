import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Package, Plus, Edit, AlertTriangle, TrendingDown, Download, DollarSign, X } from "lucide-react";
import { inventoryApi, RawMaterial } from "../../services/inventoryApi";
import { toast } from "sonner";

export function RawMaterials() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
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

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role;
  const canManage = userRole === "inventory_manager" || userRole === "administrator";

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await inventoryServiceGet();
      setMaterials(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load raw materials");
    } finally {
      setLoading(false);
    }
  };

  const inventoryServiceGet = async () => {
    return await inventoryApi.getRawMaterials();
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
        warehouseLocation: "WH-A-01",
      });
      fetchMaterials();
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

  const handleExport = () => {
    // Generate CSV
    const headers = ["Material ID,Name,Quantity,Unit,Minimum,Maximum,Warehouse Location,Unit Cost,Total Value,Supplier,Last Restocked,Status"];
    const rows = filteredMaterials.map(m => 
      `"${m.idCode}","${m.name}",${m.quantity},"${m.unit}",${m.minimum},${m.maximum},"${m.warehouseLocation}",${m.unitCost},${(m.quantity * m.unitCost).toFixed(2)},"${m.supplier || ''}","${m.lastRestocked || ''}","${m.status}"`
    );
    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raw-materials-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Raw Materials Inventory</h1>
            <p className="text-slate-600 text-sm mt-1">Manage and track raw material stock levels</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Materials</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{materials.length}</p>
                <p className="text-slate-500 text-sm mt-1">types in stock</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Normal Stock</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{normalCount}</p>
                <p className="text-emerald-600 text-sm mt-1">Above minimum</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{lowCount}</p>
                <p className="text-amber-600 text-sm mt-1">Needs restocking</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Critical Stock</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{criticalCount}</p>
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Urgent action
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Inventory Value</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">${(totalInventoryValue / 1000).toFixed(1)}k</p>
                <p className="text-slate-500 text-sm mt-1">total stock value</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-slate-600" />
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
              placeholder="Search by material code, name, or supplier..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <td className="py-4 px-6 text-sm text-slate-700">${material.unitCost.toFixed(2)}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900">
                        ${(material.quantity * material.unitCost).toLocaleString()}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
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
                  <input
                    type="text"
                    placeholder="e.g. WH-A-02"
                    value={newMaterial.warehouseLocation}
                    onChange={(e) => setNewMaterial({ ...newMaterial, warehouseLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
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
