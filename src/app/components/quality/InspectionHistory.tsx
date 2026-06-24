import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { ClipboardCheck, Download, Search, TrendingUp, TrendingDown, Award, Loader2, AlertCircle } from "lucide-react";
import { qualityApi, QualityInspection, QualityCertificate } from "../../services/qualityApi";

export function InspectionHistory() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [certificates, setCertificates] = useState<QualityCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [inspectionsData, certificatesData] = await Promise.all([
          qualityApi.getInspections(),
          qualityApi.getCertificates(),
        ]);
        setInspections(inspectionsData);
        setCertificates(certificatesData);
      } catch (err: any) {
        setError(err.message || "Failed to fetch inspection history");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic
  const filteredInspections = inspections.filter((inspection) => {
    const pRate = inspection.inspected_quantity > 0
      ? (inspection.passed_quantity / inspection.inspected_quantity) * 100
      : 0;

    const matchesSearch =
      inspection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.batch_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.shoe_model_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inspection.defect_type || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || inspection.status === filterStatus;

    const inspDate = new Date(inspection.created_at).toISOString().split("T")[0];
    const matchesDateFrom = !filterDateFrom || inspDate >= filterDateFrom;
    const matchesDateTo = !filterDateTo || inspDate <= filterDateTo;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Analytics based on all loaded inspections
  const totalInspections = inspections.length;
  const totalInspected = inspections.reduce((sum, i) => sum + i.inspected_quantity, 0);
  const totalPassed = inspections.reduce((sum, i) => sum + i.passed_quantity, 0);
  const totalFailed = inspections.reduce((sum, i) => sum + i.failed_quantity, 0);
  const avgPassRate = totalInspected > 0 ? (totalPassed / totalInspected) * 100 : 0;
  const avgDefectRate = totalInspected > 0 ? (totalFailed / totalInspected) * 100 : 0;
  const certificatesIssued = certificates.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "rework":
        return "bg-amber-100 text-amber-700 font-semibold";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 98) return "text-emerald-600 font-bold";
    if (rate >= 95) return "text-blue-600 font-semibold";
    return "text-amber-600 font-semibold";
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Inspection History</h1>
            <p className="text-slate-600 text-sm mt-1">Complete dynamic quality inspection logs and metrics</p>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredInspections.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export JSON Report
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Aggregating historical QA logs...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Inspections</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalInspections}</p>
                    <p className="text-slate-500 text-xs mt-1">logged records</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Units Inspected</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalInspected.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs mt-1">pairs checked</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Avg Pass Rate</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{avgPassRate.toFixed(1)}%</p>
                    <p className="text-emerald-600 text-xs mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {avgPassRate >= 95 ? "Excellent" : "Monitoring"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Avg Defect Rate</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{avgDefectRate.toFixed(1)}%</p>
                    <p className="text-rose-600 text-xs mt-1 flex items-center gap-1 font-semibold">
                      <TrendingDown className="w-3 h-3" />
                      {totalFailed} units failed
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Certificates Issued</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{certificatesIssued}</p>
                    <p className="text-slate-500 text-xs mt-1">quality certified</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative md:col-span-2">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID, batch, model, inspector, defect..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Inspection Status</option>
                  <option value="completed">Completed / Pass</option>
                  <option value="rework">Rework Required</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="From date"
                  />
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="To date"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Inspection Records</h3>
              </div>
              <div className="overflow-x-auto">
                {filteredInspections.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    No inspection records match your filters.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Inspection ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Batch ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Product model</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Inspector</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Inspected</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Passed</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Failed</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Pass Rate</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Defect Type</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInspections.map((inspection) => {
                        const passRate = inspection.inspected_quantity > 0
                          ? (inspection.passed_quantity / inspection.inspected_quantity) * 100
                          : 0;
                        const hasCert = certificates.some(c => c.inspection_id === inspection.id);

                        return (
                          <tr key={inspection.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 font-mono">
                              INS-{inspection.id.substring(0, 6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-slate-900 font-mono">
                              {inspection.batch_number}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{inspection.shoe_model_name || "General"}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {new Date(inspection.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-700">{inspection.inspector_name}</td>
                            <td className="py-3 px-4 text-sm font-medium text-slate-900">{inspection.inspected_quantity}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-emerald-600">{inspection.passed_quantity}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-red-600">{inspection.failed_quantity}</td>
                            <td className="py-3 px-4">
                              <span className={`text-sm ${getPassRateColor(passRate)}`}>
                                {passRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">{inspection.defect_type || "None"}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                                {inspection.status === "rework" ? "Rework Required" : "Pass"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {hasCert ? (
                                <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                                  <Award className="w-4 h-4" />
                                  Issued
                                </span>
                              ) : (
                                <span className="text-slate-400 text-sm">None</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
