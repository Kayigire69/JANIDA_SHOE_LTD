import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Building2, Plus, Mail, Phone, MapPin, Clock, TrendingUp, Star, AlertTriangle, X } from "lucide-react";
import { inventoryApi, Supplier } from "../../services/inventoryApi";
import { toast } from "sonner";

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    address: "",
    leadTime: 5,
  });

  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const userRole = user?.role;
  const canManage = userRole === "inventory_manager" || userRole === "administrator";

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("Unauthorized: Only Inventory Managers or Administrators can add suppliers.");
      return;
    }
    try {
      await inventoryApi.createSupplier({
        name: newSupplier.name,
        contact: newSupplier.contact,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
        leadTime: Number(newSupplier.leadTime),
      });
      setShowAddModal(false);
      // Reset form
      setNewSupplier({
        name: "",
        contact: "",
        email: "",
        phone: "",
        address: "",
        leadTime: 5,
      });
      fetchSuppliers();
      toast.success("Supplier added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact && supplier.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const avgLeadTime = suppliers.length ? suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length : 0;
  const avgRating = suppliers.length ? suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length : 0;
  const avgOnTime = suppliers.length ? suppliers.reduce((sum, s) => sum + s.onTimeDelivery, 0) / suppliers.length : 0;

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Supplier Management</h1>
            <p className="text-slate-600 text-sm mt-1">Manage supplier information and performance</p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Suppliers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{suppliers.length}</p>
                <p className="text-slate-500 text-sm mt-1">active partners</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Rating</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgRating.toFixed(1)}</p>
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  out of 5.0
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Lead Time</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgLeadTime.toFixed(1)}</p>
                <p className="text-slate-500 text-sm mt-1">days</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">On-Time Delivery</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgOnTime.toFixed(1)}%</p>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  average
                </p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-slate-600" />
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
              placeholder="Search by supplier name or ID..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500 font-medium">Loading suppliers...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">No suppliers found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filteredSuppliers.map((supplier) => (
                <div key={supplier.id} className="border border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                        {supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-lg">{supplier.name}</h4>
                        <p className="text-sm text-slate-600 font-mono">{supplier.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {supplier.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900">{supplier.contact || "No Contact Person"}</p>
                        <p className="text-slate-600">{supplier.address || "No Address Added"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{supplier.email || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{supplier.phone || "-"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500">Lead Time</p>
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {supplier.leadTime} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Orders</p>
                        <p className="text-sm font-semibold text-slate-900">{supplier.ordersCompleted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">On-Time</p>
                        <p className={`text-sm font-semibold ${
                          supplier.onTimeDelivery >= 95 ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {supplier.onTimeDelivery.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Add New Supplier
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Super Sole Rubber Inc."
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Richard Hendricks"
                  value={newSupplier.contact}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. sales@supersoles.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555-8902"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 56 Manufacturing Way, Chicago IL"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
                  <input
                    type="number"
                    min="0"
                    value={newSupplier.leadTime}
                    onChange={(e) => setNewSupplier({ ...newSupplier, leadTime: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm shadow-md"
                >
                  Save Supplier
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
