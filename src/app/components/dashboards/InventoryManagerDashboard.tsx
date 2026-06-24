import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../Layout";
import { SystemAnnouncement } from "../common/SystemAnnouncement";
import { Package, TrendingUp, AlertTriangle, Truck, Warehouse, DollarSign, ArrowRight, Box, ShoppingCart, Clock, BarChart3 } from "lucide-react";
import { inventoryApi, RawMaterial, FinishedGood, PurchaseOrder, Supplier } from "../../services/inventoryApi";
import { dashboardApi } from "../../services/dashboardApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

export function InventoryManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardData, materials, goods, orders, supplierData] = await Promise.all([
          dashboardApi.getDashboard(),
          inventoryApi.getRawMaterials(),
          inventoryApi.getFinishedGoods(),
          inventoryApi.getPurchaseOrders(),
          inventoryApi.getSuppliers()
        ]);
        setRawMaterials(materials || []);
        setFinishedGoods(goods || []);
        setPurchaseOrders(orders || []);
        setSuppliers(supplierData || []);
        setAnnouncements(dashboardData.announcements || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const lowStockMaterials = rawMaterials.filter(m => m.status === 'low' || m.status === 'critical');
  const lowStockGoods = finishedGoods.filter(g => g.status === 'low' || g.status === 'critical');
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending' || po.status === 'approved');
  const totalInventoryValue = rawMaterials.reduce((sum, m) => sum + (m.quantity * m.unitCost), 0) +
                              finishedGoods.reduce((sum, g) => sum + (g.stock * g.unitCost), 0);

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-8">
        {announcements.map((item: any) => (
          <SystemAnnouncement key={item.id} message={item.message} type={item.type} />
        ))}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory Dashboard</h1>
          <p className="text-slate-600 mt-2">Monitor stock levels, purchase orders, and supplier performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Raw Materials</p>
                <p className="text-3xl font-bold text-slate-900">{rawMaterials.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Box className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Finished Goods</p>
                <p className="text-3xl font-bold text-slate-900">{finishedGoods.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending Orders</p>
                <p className="text-3xl font-bold text-slate-900">{pendingOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-slate-900">RWF {(totalInventoryValue / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {(lowStockMaterials.length > 0 || lowStockGoods.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Low Stock Alert</h3>
                <div className="mt-2 space-y-1 text-sm text-amber-800">
                  {lowStockMaterials.length > 0 && <p>• {lowStockMaterials.length} raw material(s) below minimum stock</p>}
                  {lowStockGoods.length > 0 && <p>• {lowStockGoods.length} finished good(s) below minimum stock</p>}
                </div>
                <Link to="/inventory/raw-materials" className="inline-block mt-3 text-sm font-medium text-amber-700 hover:text-amber-800">
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link 
              to="/inventory/raw-materials" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Raw Materials</p>
                <p className="text-sm text-slate-500">Manage stock</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link 
              to="/inventory/finished-goods" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <Box className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Finished Goods</p>
                <p className="text-sm text-slate-500">View inventory</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link 
              to="/inventory/purchase-orders" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Purchase Orders</p>
                <p className="text-sm text-slate-500">Track orders</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link 
              to="/inventory/stock-movement" 
              className="flex items-center gap-4 p-5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200 hover:border-blue-200 group"
            >
              <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 group-hover:text-blue-700">Stock Movement</p>
                <p className="text-sm text-slate-500">View logs</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Purchase Orders */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Purchase Orders</h2>
              <Link to="/inventory/purchase-orders" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {purchaseOrders.slice(0, 5).map((po) => (
                <div key={po.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    po.status === 'received' ? 'bg-emerald-500' :
                    po.status === 'approved' ? 'bg-blue-500' :
                    po.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{po.poNumber}</p>
                    <p className="text-sm text-slate-500">{po.material} - {po.quantity} {po.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">RWF {po.totalValue.toLocaleString()}</p>
                    <p className={`text-xs font-medium ${
                      po.status === 'received' ? 'text-emerald-600' :
                      po.status === 'approved' ? 'text-blue-600' :
                      po.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {po.status}
                    </p>
                  </div>
                </div>
              ))}
              {purchaseOrders.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No purchase orders yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Critical Stock Items */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Critical Stock Items</h2>
              <Link to="/inventory/raw-materials" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {lowStockMaterials.slice(0, 5).map((material) => (
                <div key={material.id} className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{material.name}</p>
                    <p className="text-sm text-slate-500">{material.idCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{material.quantity} {material.unit}</p>
                    <p className="text-xs text-slate-500">Min: {material.minimum}</p>
                  </div>
                </div>
              ))}
              {lowStockMaterials.length === 0 && lowStockGoods.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">All stock levels normal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Analytics Section ─── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">Inventory Analytics</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Stock Level Bar Chart — top 8 raw materials */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Raw Material Stock Levels</h3>
              {rawMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  <Package className="w-10 h-10" />
                  <p className="text-sm">No material data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rawMaterials.slice(0, 8).map(m => ({ name: m.name.length > 10 ? m.name.slice(0,10)+'…' : m.name, qty: m.quantity, min: m.minimum }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                      formatter={(v: any, name: string) => [v, name === 'qty' ? 'Current Stock' : 'Minimum']}
                    />
                    <Legend formatter={(v) => v === 'qty' ? 'Current Stock' : 'Minimum'} wrapperStyle={{ fontSize: 12 }} />
                    <defs>
                      <linearGradient id="invBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="qty" fill="url(#invBlue)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="min" fill="#fcd34d" radius={[6, 6, 0, 0]} opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Stock Status Pie Chart */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Stock Status</h3>
              {rawMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  <Package className="w-10 h-10" />
                  <p className="text-sm">No data</p>
                </div>
              ) : (() => {
                const normal   = rawMaterials.filter(m => m.status === 'normal').length;
                const low      = rawMaterials.filter(m => m.status === 'low').length;
                const critical = rawMaterials.filter(m => m.status === 'critical').length;
                const pieData  = [
                  { name: 'Normal',   value: normal,   color: '#10b981' },
                  { name: 'Low',      value: low,      color: '#f59e0b' },
                  { name: 'Critical', value: critical, color: '#ef4444' },
                ].filter(d => d.value > 0);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

          </div>

          {/* Purchase Orders Trend Line */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Purchase Order Values (Recent)</h3>
            {purchaseOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                <ShoppingCart className="w-10 h-10" />
                <p className="text-sm">No purchase orders yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={purchaseOrders.slice(0, 10).map((po, i) => ({ name: po.poNumber || `PO-${i+1}`, value: po.totalValue || 0, status: po.status }))} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                    formatter={(v: any) => [`RWF ${Number(v).toLocaleString()}`, 'Value']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Suppliers Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Top Suppliers</h2>
            <Link to="/inventory/suppliers" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.slice(0, 6).map((supplier) => (
              <div key={supplier.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-900">{supplier.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm font-semibold text-slate-700">{supplier.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{supplier.ordersCompleted} orders</span>
                  <span>{supplier.onTimeDelivery.toFixed(0)}% on-time</span>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No suppliers added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
