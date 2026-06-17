import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import {
  AlertTriangle, CheckCircle2, Package, RefreshCw,
  Loader2, Clock, Search
} from "lucide-react";
import { salesApi } from "../../services/salesApi";

export function BackorderLog() {
  const navigate = useNavigate();
  const [backorders, setBackorders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const loadBackorders = () => {
    setLoading(true);
    salesApi.getBackorders()
      .then(setBackorders)
      .catch((e) => {
        setError(e.message);
        if (e.message?.toLowerCase().includes("auth")) navigate("/login");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBackorders(); }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await salesApi.resolveBackorder(id);
      setSuccessMsg("Backorder resolved and stock deducted successfully.");
      loadBackorders();
    } catch (e: any) {
      setError(e.message || "Failed to resolve backorder.");
    } finally {
      setResolvingId(null);
    }
  };

  const filtered = backorders.filter((b) =>
    !search ||
    b.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.customer?.toLowerCase().includes(search.toLowerCase()) ||
    b.product?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = backorders.filter((b) => b.status === "pending").length;
  const resolved = backorders.filter((b) => b.status === "resolved").length;

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" /> Backorder Log
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track and resolve items placed on backorder due to stock shortfalls</p>
          </div>
          <button onClick={loadBackorders} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors self-start">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border-l-4 border-amber-400 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pending Backorders</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{pending}</p>
            <p className="text-xs text-slate-400 mt-1">awaiting stock replenishment</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-emerald-400 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Resolved</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{resolved}</p>
            <p className="text-xs text-slate-400 mt-1">successfully fulfilled</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-slate-300 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Logged</p>
            <p className="text-3xl font-bold text-slate-700 mt-1">{backorders.length}</p>
            <p className="text-xs text-slate-400 mt-1">all time</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">{successMsg}</p>
          </div>
        )}
        {pending === 0 && !loading && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">All caught up! No pending backorders at this time.</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer, or product..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No backorders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Order #", "Customer", "Product", "SKU", "Qty Backordered", "Date Logged", "Status", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-700">{b.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{b.customer}</td>
                      <td className="px-4 py-3 text-slate-700">{b.product}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{b.sku}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <Package className="w-3 h-3" /> {b.quantityBackordered} pairs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{b.createdAt}</td>
                      <td className="px-4 py-3">
                        {b.status === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {b.status === "pending" ? (
                          <button onClick={() => handleResolve(b.id)} disabled={resolvingId === b.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {resolvingId === b.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle2 className="w-3 h-3" />}
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
