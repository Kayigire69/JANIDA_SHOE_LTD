import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import {
  Receipt, CheckCircle2, AlertTriangle, DollarSign,
  RefreshCw, Loader2, Search, Clock, FileDown
} from "lucide-react";
import { salesApi } from "../../services/salesApi";

export function InvoiceLog() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadInvoices = () => {
    setLoading(true);
    salesApi.getInvoices()
      .then(setInvoices)
      .catch((e) => {
        setError(e.message);
        if (e.message?.toLowerCase().includes("auth")) navigate("/login");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInvoices(); }, []);

  const handlePay = async (id: string) => {
    setPayingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await salesApi.payInvoice(id);
      setSuccessMsg("Invoice marked as paid successfully.");
      loadInvoices();
    } catch (e: any) {
      setError(e.message || "Failed to process payment.");
    } finally {
      setPayingId(null);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.reduce((s, inv) => s + (inv.amountDue || 0), 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((s, inv) => s + (inv.amountDue || 0), 0);
  const unpaidAmount = invoices.filter((i) => i.status === "unpaid").reduce((s, inv) => s + (inv.amountDue || 0), 0);
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  const exportCSV = () => {
    const headers = ["Invoice #", "Order #", "Customer", "Amount Due", "Status", "Due Date", "Created"];
    const rows = filtered.map((inv) => [
      inv.invoiceNumber, inv.orderNumber, inv.customer,
      `RWF ${inv.amountDue?.toFixed(2)}`, inv.status, inv.dueDate, inv.createdAt
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "invoices_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" /> Invoices & Billing
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage invoices and process payments for customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadInvoices} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <FileDown className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border-l-4 border-blue-500 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Invoiced</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">RWF {totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 mt-1">{invoices.length} total invoices</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-emerald-500 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Paid</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">RWF {paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 mt-1">{paidCount} invoices collected</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-amber-500 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">RWF {unpaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 mt-1">{unpaidCount} invoices pending</p>
          </div>
          <div className="bg-white rounded-xl border-l-4 border-slate-300 shadow-sm p-5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Collection Rate</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">
              {totalRevenue > 0 ? Math.round((paidAmount / totalRevenue) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">of total billed</p>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number, order number, or customer..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "unpaid", "paid", "cancelled"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No invoices found</p>
              <p className="text-slate-300 text-sm mt-1">Invoices will appear here when orders are placed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Invoice #", "Order #", "Customer", "Amount Due", "Status", "Due Date", "Created", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => {
                    const isOverdue = inv.status === "unpaid" && new Date(inv.dueDate) < new Date();
                    return (
                      <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${isOverdue ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">{inv.orderNumber}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{inv.customer}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            RWF {inv.amountDue?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inv.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                            inv.status === "cancelled" ? "bg-slate-100 text-slate-500" :
                            isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {inv.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> :
                             isOverdue ? <AlertTriangle className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                            {isOverdue && inv.status === "unpaid" ? "Overdue" : inv.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 ${isOverdue ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                          {inv.dueDate}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{inv.createdAt}</td>
                        <td className="px-4 py-3">
                          {inv.status === "unpaid" ? (
                            <button onClick={() => handlePay(inv.id)} disabled={payingId === inv.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {payingId === inv.id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <DollarSign className="w-3 h-3" />}
                              Mark Paid
                            </button>
                          ) : inv.status === "paid" ? (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
