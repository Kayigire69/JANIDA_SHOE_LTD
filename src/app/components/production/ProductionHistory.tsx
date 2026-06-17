import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Calendar, Filter, Download, Search, Eye, TrendingUp, AlertCircle, Loader2, X, Settings } from "lucide-react";
import { productionApi, HistoryData } from "../../services/productionApi";

export function ProductionHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<HistoryData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      const res = await productionApi.getHistory();
      setData(res);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load production history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, []);

  const filteredHistory = (data?.history || []).filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    
    let matchesDate = true;
    if (dateRange.start && item.startDate !== "-") {
      matchesDate = matchesDate && item.startDate >= dateRange.start;
    }
    if (dateRange.end && item.endDate !== "-") {
      matchesDate = matchesDate && item.endDate <= dateRange.end;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    if (filteredHistory.length === 0) return;
    
    const headers = [
      "Production ID",
      "Product",
      "Size",
      "Completed Qty",
      "Target Qty",
      "Start Date",
      "End Date",
      "Operator",
      "Machine",
      "Efficiency (%)",
      "Defect Rate (%)",
      "Status"
    ];
    
    const csvRows = [
      headers.join(","),
      ...filteredHistory.map((item) => [
        `"${item.id}"`,
        `"${item.product}"`,
        `"${item.size}"`,
        item.completed,
        item.quantity,
        `"${item.startDate}"`,
        `"${item.endDate}"`,
        `"${item.operator}"`,
        `"${item.machine}"`,
        item.efficiency,
        item.status === "Completed" ? item.defectRate : "-",
        `"${item.status}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `production_history_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "Planned":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Paused":
        return "bg-amber-100 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return "text-emerald-600 font-semibold";
    if (efficiency >= 90) return "text-blue-600 font-semibold";
    if (efficiency >= 85) return "text-amber-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Production History</h1>
            <p className="text-slate-600 text-sm mt-1">
              Complete production records and performance analysis
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredHistory.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Completed</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loading ? "..." : (data?.metrics.totalCompleted || 0).toLocaleString()}
                </p>
                <p className="text-slate-500 text-sm mt-1">units this period</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Efficiency</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loading ? "..." : (data?.metrics.avgEfficiency || "0%")}
                </p>
                <p className="text-emerald-600 text-sm mt-1">Dynamic run metrics</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Defect Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loading ? "..." : (data?.metrics.avgDefectRate || "0%")}
                </p>
                <p className="text-emerald-600 text-sm mt-1">Target under 2.0%</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Production Runs</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {loading ? "..." : (data?.metrics.totalBatches || 0)}
                </p>
                <p className="text-slate-500 text-sm mt-1">total batches</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, product, or operator name..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Planned">Planned</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                title="Start Date filter"
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={dateRange.end}
                title="End Date filter"
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-slate-600 text-sm">Fetching production history from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Production ID
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Quantity
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Period
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Operator
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Efficiency
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Defect Rate
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-sm text-slate-500 italic">
                        No production history records found.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-6 text-sm font-semibold font-mono text-slate-900">{item.id}</td>
                        <td className="py-4 px-6 text-sm text-slate-700">
                          {item.product} - Size {item.size}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700">
                          {item.completed} / {item.quantity}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-600">
                          {item.startDate} to {item.endDate}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700">{item.operator}</td>
                        <td className="py-4 px-6">
                          <span className={`text-sm ${getEfficiencyColor(item.efficiency)}`}>
                            {item.status === "Completed" ? `${item.efficiency}%` : "-"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-700">
                          {item.status === "Completed" ? `${item.defectRate}%` : "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View batch details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Batch details modal overlay */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-slate-800 to-slate-950 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <span className="text-xs text-blue-400 font-semibold tracking-wider uppercase">Production Details</span>
                <h3 className="text-lg font-bold font-mono">{selectedItem.id}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Shoe Model</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedItem.product}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Shoe Size</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">Size {selectedItem.size}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Completed Output</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {selectedItem.completed} / {selectedItem.quantity} pairs
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Workstation / Line</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedItem.machine}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Timeline</p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    {selectedItem.startDate} to {selectedItem.endDate}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Lead Operator</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{selectedItem.operator}</p>
                </div>
              </div>

              {selectedItem.status === "Completed" && (
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                  <h4 className="font-semibold text-blue-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Performance Run Indicators
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Average Efficiency</p>
                      <p className={`text-xl font-bold ${getEfficiencyColor(selectedItem.efficiency)}`}>
                        {selectedItem.efficiency}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Defect Rate</p>
                      <p className="text-xl font-bold text-red-600">
                        {selectedItem.defectRate}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm mb-2">Status History</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status}
                  </span>
                  <p className="text-xs text-slate-500">
                    Plan was fully processed on {selectedItem.endDate !== "-" ? selectedItem.endDate : "N/A"}.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
