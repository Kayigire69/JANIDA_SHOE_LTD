import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../Layout";
import {
  ShoppingCart, Package, TrendingUp, Clock, Users, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, Plus, X, ChevronRight,
  Truck, BarChart3, Star, ArrowUpRight, ArrowDownRight, Search,
  Eye, Edit2, DollarSign, Target, Zap
} from "lucide-react";
import { salesApi } from "../../services/salesApi";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ─── helpers ────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

const statusColor: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  delivered:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled:  "bg-red-100 text-red-700 border-red-200",
  paid:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid:     "bg-red-100 text-red-700 border-red-200",
  overdue:    "bg-rose-100 text-rose-700 border-rose-200",
};
const StatusBadge = ({ s }: { s: string }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusColor[s?.toLowerCase()] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
    {s}
  </span>
);

const priorityColor: Record<string, string> = {
  high:   "text-red-600 bg-red-50 border-red-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low:    "text-slate-600 bg-slate-50 border-slate-200",
};

/* ─── main component ─────────────────────────────────────────────── */
export function SalesAdminDashboard() {
  const [orders,    setOrders]    = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices,  setInvoices]  = useState<any[]>([]);
  const [backorders,setBackorders]= useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  // UI state
  const [tab,         setTab]         = useState<"orders"|"customers"|"shipments"|"invoices">("orders");
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchQ,     setSearchQ]     = useState("");
  const [showCustModal, setShowCustModal] = useState(false);
  const [editCust,    setEditCust]    = useState<any|null>(null);
  const [custForm,    setCustForm]    = useState({ name:"", email:"", phone:"", address:"" });
  const [submitting,  setSubmitting]  = useState(false);

  /* ── load data ── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ord, cust, inv, back] = await Promise.all([
        salesApi.getOrders().catch(() => []),
        salesApi.getCustomers().catch(() => []),
        salesApi.getInvoices().catch(() => []),
        salesApi.getBackorders().catch(() => []),
      ]);
      setOrders(Array.isArray(ord) ? ord : []);
      setCustomers(Array.isArray(cust) ? cust : []);
      setInvoices(Array.isArray(inv) ? inv : []);
      setBackorders(Array.isArray(back) ? back : []);
    } catch {
      toast.error("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── derived KPIs ── */
  const pending   = orders.filter(o => o.status?.toLowerCase() === "pending").length;
  const delivered = orders.filter(o => o.status?.toLowerCase() === "delivered").length;
  const shipped   = orders.filter(o => o.status?.toLowerCase() === "shipped").length;
  const revenue   = invoices.filter(i => i.status?.toLowerCase() === "paid").reduce((s, i) => s + (i.total || i.amount || i.amountDue || 0), 0);
  const lateDeliveries = orders.filter(o => {
    if (!o.deliveryDate && !o.deadline) return false;
    const due = new Date(o.deliveryDate || o.deadline);
    return due < new Date() && o.status?.toLowerCase() !== "delivered";
  }).length;

  // Top customers by order count
  const customerOrderMap: Record<string, { name: string; count: number; value: number }> = {};
  orders.forEach(o => {
    const key = o.customerId || o.customer_id || o.customer?.id;
    const name = o.customerName || o.customer?.name || o.customer || "Unknown";
    if (!key) return;
    if (!customerOrderMap[key]) customerOrderMap[key] = { name, count: 0, value: 0 };
    customerOrderMap[key].count++;
    customerOrderMap[key].value += o.totalAmount || o.total || 0;
  });
  const topCustomers = Object.values(customerOrderMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend chart data — group orders by month
  const monthlyData: Record<string, { month: string; orders: number; revenue: number }> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt || o.orderDate || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (!monthlyData[key]) monthlyData[key] = { month: label, orders: 0, revenue: 0 };
    monthlyData[key].orders++;
    monthlyData[key].revenue += o.totalAmount || o.total || 0;
  });
  const chartData = Object.values(monthlyData).slice(-6);

  /* ── filtered orders for table ── */
  const filteredOrders = orders.filter(o => {
    const matchStatus = orderFilter === "all" || o.status?.toLowerCase() === orderFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q || 
      (o.orderNumber || o.order_number || o.id || "").toString().toLowerCase().includes(q) ||
      (o.customerName || o.customer?.name || o.customer || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  /* ── customer CRUD ── */
  const openAddCust = () => { setEditCust(null); setCustForm({ name:"", email:"", phone:"", address:"" }); setShowCustModal(true); };
  const openEditCust = (c: any) => { setEditCust(c); setCustForm({ name:c.name||"", email:c.email||"", phone:c.phone||"", address:c.address||"" }); setShowCustModal(true); };

  const handleSaveCust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) { toast.error("Name is required"); return; }
    setSubmitting(true);
    try {
      if (editCust) {
        await salesApi.updateCustomer(editCust.id, custForm);
        toast.success("Customer updated");
      } else {
        await salesApi.createCustomer(custForm);
        toast.success("Customer added");
      }
      setShowCustModal(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCust = async (id: string) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await salesApi.deleteCustomer(id);
      toast.success("Customer removed");
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete customer");
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await salesApi.updateOrderStatus(id, status);
      toast.success(`Order marked as ${status}`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  /* ── KPI cards data ── */
  const kpis = [
    {
      label: "Pending Orders",
      value: pending,
      icon: Clock,
      color: "amber",
      delta: null,
      sub: `${orders.length} total`,
    },
    {
      label: "Delivered Orders",
      value: delivered,
      icon: CheckCircle2,
      color: "emerald",
      delta: delivered > 0 ? `+${Math.round((delivered/Math.max(orders.length,1))*100)}%` : null,
      sub: `${shipped} in transit`,
    },
    {
      label: "Total Revenue",
      value: fmt(revenue),
      icon: DollarSign,
      color: "blue",
      delta: null,
      sub: `${invoices.filter(i=>i.status?.toLowerCase()==="paid").length} paid invoices`,
    },
    {
      label: "Late Deliveries",
      value: lateDeliveries,
      icon: AlertTriangle,
      color: "red",
      delta: null,
      sub: "overdue orders",
    },
    {
      label: "Backorders",
      value: backorders.length,
      icon: Package,
      color: "violet",
      delta: null,
      sub: "awaiting stock",
    },
  ];

  const colorMap: Record<string, string> = {
    amber:  "bg-amber-50 text-amber-600",
    emerald:"bg-emerald-50 text-emerald-600",
    blue:   "bg-blue-50 text-blue-600",
    red:    "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  const borderMap: Record<string, string> = {
    amber:  "border-amber-100",
    emerald:"border-emerald-100",
    blue:   "border-blue-100",
    red:    "border-red-100",
    violet: "border-violet-100",
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading Sales Dashboard…</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Track orders, customers, revenue and deliveries in real time</p>
          </div>
          <div className="flex gap-3">
            <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link to="/orders/create" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgb(37,99,235,0.3)] hover:shadow-[0_6px_18px_rgb(37,99,235,0.4)] transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> New Order
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`bg-white rounded-2xl border ${borderMap[k.color]} shadow-sm p-5 hover:shadow-md transition-all hover:-translate-y-0.5`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[k.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {k.delta && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />{k.delta}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{k.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{k.label}</p>
                <p className="text-xs text-slate-400 mt-1">{k.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Area chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" /> Revenue & Orders Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No order data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius:"12px", border:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Legend />
                  <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" dot={{ r:4, fill:"#3b82f6", strokeWidth:0 }} name="Orders" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-amber-500" /> Top Customers
            </h2>
            {topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No customer data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      "bg-orange-50 text-orange-600"
                    }`}>
                      #{i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.count} orders</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {(["orders","customers","shipments","invoices"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-shrink-0 px-6 py-4 text-sm font-bold capitalize transition-all border-b-2 ${
                  tab === t
                    ? "border-blue-600 text-blue-600 bg-blue-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t === "orders" && <ShoppingCart className="w-4 h-4 inline mr-2" />}
                {t === "customers" && <Users className="w-4 h-4 inline mr-2" />}
                {t === "shipments" && <Truck className="w-4 h-4 inline mr-2" />}
                {t === "invoices" && <DollarSign className="w-4 h-4 inline mr-2" />}
                {t}
                {t === "orders" && orders.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{orders.length}</span>
                )}
                {t === "customers" && customers.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full text-xs">{customers.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Orders Tab ── */}
          {tab === "orders" && (
            <div>
              <div className="p-5 border-b border-slate-50 flex flex-wrap items-center gap-3 bg-slate-50/40">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search orders or customers…"
                    className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                {/* Status filter */}
                <div className="flex gap-2 flex-wrap">
                  {["all","pending","processing","shipped","delivered","cancelled"].map(f => (
                    <button
                      key={f} onClick={() => setOrderFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                        orderFilter === f ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                      }`}
                    >{f}</button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center">
                    <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No orders found</p>
                    <Link to="/orders/create" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium">
                      <Plus className="w-4 h-4" /> Create first order
                    </Link>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        {["Order #","Customer","Date","Items","Total","Priority","Status","Actions"].map(h => (
                          <th key={h} className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredOrders.map(o => {
                        const isLate = (() => {
                          const due = o.deliveryDate || o.deadline;
                          return due && new Date(due) < new Date() && o.status?.toLowerCase() !== "delivered";
                        })();
                        return (
                          <tr key={o.id} className={`hover:bg-slate-50/60 transition-colors ${isLate ? "bg-red-50/30" : ""}`}>
                            <td className="py-4 px-5 font-mono font-bold text-slate-700 text-xs">
                              {o.orderNumber || o.order_number || `#${o.id?.slice(-6)}`}
                              {isLate && <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">LATE</span>}
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {(o.customerName || o.customer?.name || o.customer || "?").charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-800">{o.customerName || o.customer?.name || o.customer || "—"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-slate-500 text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}</td>
                            <td className="py-4 px-5 text-slate-600">{o.items?.length ?? o.itemCount ?? "—"}</td>
                            <td className="py-4 px-5 font-bold text-slate-900">{fmt(o.totalAmount || o.total || 0)}</td>
                            <td className="py-4 px-5">
                              <span className={`px-2 py-1 rounded-lg text-xs font-bold border capitalize ${priorityColor[o.priority?.toLowerCase()] || priorityColor.low}`}>
                                {o.priority || "medium"}
                              </span>
                            </td>
                            <td className="py-4 px-5"><StatusBadge s={o.status} /></td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-1">
                                {o.status?.toLowerCase() === "pending" && (
                                  <button onClick={() => handleUpdateStatus(o.id, "processing")}
                                    className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                                    Process
                                  </button>
                                )}
                                {o.status?.toLowerCase() === "processing" && (
                                  <button onClick={() => handleUpdateStatus(o.id, "shipped")}
                                    className="px-2.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
                                    Ship
                                  </button>
                                )}
                                {o.status?.toLowerCase() === "shipped" && (
                                  <button onClick={() => handleUpdateStatus(o.id, "delivered")}
                                    className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap">
                                    Delivered
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Customers Tab ── */}
          {tab === "customers" && (
            <div>
              <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/40">
                <p className="text-sm font-semibold text-slate-700">{customers.length} registered customers</p>
                <button
                  onClick={openAddCust}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Customer
                </button>
              </div>
              <div className="overflow-x-auto">
                {customers.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No customers yet</p>
                    <button onClick={openAddCust} className="mt-3 text-sm text-violet-600 hover:underline font-medium">
                      Add first customer
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        {["Customer","Email","Phone","Address","Orders","Actions"].map(h => (
                          <th key={h} className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {customers.map(c => {
                        const cOrders = orders.filter(o => (o.customerId || o.customer_id || o.customer?.id) === c.id).length;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                  {c.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-900">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-slate-500">{c.email || "—"}</td>
                            <td className="py-4 px-5 text-slate-500">{c.phone || "—"}</td>
                            <td className="py-4 px-5 text-slate-500 max-w-[180px] truncate">{c.address || "—"}</td>
                            <td className="py-4 px-5">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{cOrders}</span>
                            </td>
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditCust(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteCust(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Shipments Tab ── */}
          {tab === "shipments" && (
            <div>
              <div className="p-5 border-b border-slate-50 bg-slate-50/40">
                <p className="text-sm font-semibold text-slate-700">Active shipment tracking</p>
              </div>
              <div className="overflow-x-auto">
                {orders.filter(o => ["shipped","processing"].includes(o.status?.toLowerCase())).length === 0 ? (
                  <div className="py-16 text-center">
                    <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No active shipments</p>
                    <p className="text-slate-400 text-sm mt-1">Orders in "Processing" or "Shipped" status will appear here</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        {["Order #","Customer","Carrier","Tracking #","Expected Delivery","Status"].map(h => (
                          <th key={h} className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.filter(o => ["shipped","processing","pending"].includes(o.status?.toLowerCase())).map(o => {
                        const isLate = o.deliveryDate && new Date(o.deliveryDate) < new Date() && o.status?.toLowerCase() !== "delivered";
                        return (
                          <tr key={o.id} className={`hover:bg-slate-50/60 transition-colors ${isLate ? "bg-red-50/30" : ""}`}>
                            <td className="py-4 px-5 font-mono font-bold text-xs text-slate-700">
                              {o.orderNumber || `#${o.id?.slice(-6)}`}
                            </td>
                            <td className="py-4 px-5 font-semibold text-slate-800">{o.customerName || o.customer?.name || "—"}</td>
                            <td className="py-4 px-5 text-slate-500">{o.carrier || <span className="text-slate-300">Not assigned</span>}</td>
                            <td className="py-4 px-5">
                              {o.trackingNumber
                                ? <span className="font-mono text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">{o.trackingNumber}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-5 text-slate-500 text-xs">
                              {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : "—"}
                              {isLate && <span className="ml-2 text-red-600 font-bold">OVERDUE</span>}
                            </td>
                            <td className="py-4 px-5"><StatusBadge s={o.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Invoices Tab ── */}
          {tab === "invoices" && (
            <div>
              <div className="p-5 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">{invoices.length} invoices</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-bold">Paid: {fmt(invoices.filter(i=>i.status?.toLowerCase()==="paid").reduce((s,i)=>s+(i.total||i.amount||0),0))}</span>
                  <span className="text-red-500 font-bold">Unpaid: {fmt(invoices.filter(i=>i.status?.toLowerCase()!=="paid").reduce((s,i)=>s+(i.total||i.amount||0),0))}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                {invoices.length === 0 ? (
                  <div className="py-16 text-center">
                    <DollarSign className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No invoices yet</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        {["Invoice #","Customer","Date","Amount","Status","Action"].map(h => (
                          <th key={h} className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-5 font-mono font-bold text-xs text-slate-700">
                            {inv.invoiceNumber || inv.invoice_number || `#${inv.id?.slice(-6)}`}
                          </td>
                          <td className="py-4 px-5 font-semibold text-slate-800">{inv.customerName || inv.customer?.name || "—"}</td>
                          <td className="py-4 px-5 text-slate-500 text-xs">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}</td>
                          <td className="py-4 px-5 font-bold text-slate-900">{fmt(inv.total || inv.amount || 0)}</td>
                          <td className="py-4 px-5"><StatusBadge s={inv.status} /></td>
                          <td className="py-4 px-5">
                            {inv.status?.toLowerCase() !== "paid" && (
                              <button
                                onClick={async () => { try { await salesApi.payInvoice(inv.id); toast.success("Invoice marked paid"); await loadAll(); } catch(e:any){toast.error(e.message);} }}
                                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Backorders Alert ── */}
        {backorders.length > 0 && (
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-amber-50 bg-amber-50/60 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Backorders ({backorders.length})
              </h2>
              <Link to="/orders/backorders" className="text-sm text-amber-700 font-bold hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40">
                    {["Order #","Product","Qty Pending","Status","Action"].map(h => (
                      <th key={h} className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {backorders.slice(0, 5).map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-xs text-slate-700">{b.orderNumber || `#${b.id?.slice(-6)}`}</td>
                      <td className="py-4 px-5 font-semibold text-slate-800">{b.product || b.productName || "—"}</td>
                      <td className="py-4 px-5 text-slate-600">{b.quantityPending || b.qty || "—"}</td>
                      <td className="py-4 px-5"><StatusBadge s={b.status || "backorder"} /></td>
                      <td className="py-4 px-5">
                        <button
                          onClick={async () => { try { await salesApi.resolveBackorder(b.id); toast.success("Backorder resolved"); await loadAll(); } catch(e:any){toast.error(e.message);} }}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Modal ── */}
      {showCustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{editCust ? "Edit Customer" : "Add Customer"}</h2>
                  <p className="text-xs text-slate-500">Customer information</p>
                </div>
              </div>
              <button onClick={() => setShowCustModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveCust} className="p-6 space-y-4">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Kigali Stores Ltd", required: true },
                { label: "Email", key: "email", type: "email", placeholder: "contact@company.com", required: false },
                { label: "Phone", key: "phone", type: "tel", placeholder: "+250 78x xxx xxx", required: false },
                { label: "Address", key: "address", type: "text", placeholder: "KG 123 St, Kigali", required: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.type} required={f.required}
                    value={(custForm as any)[f.key]}
                    onChange={e => setCustForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCustModal(false)} className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editCust ? "Save Changes" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
