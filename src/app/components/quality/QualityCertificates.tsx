import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Award, Download, FileText, CheckCircle2, Calendar, Loader2, AlertCircle } from "lucide-react";
import { qualityApi, QualityCertificate } from "../../services/qualityApi";

export function QualityCertificates() {
  const [certificates, setCertificates] = useState<QualityCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await qualityApi.getCertificates();
      setCertificates(data);
    } catch (err: any) {
      setError(err.message || "Failed to load quality certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const filteredCertificates = certificates.filter((cert) => {
    const batchNo = cert.batch_number || "";
    const modelName = cert.shoe_model_name || "";
    const certNo = cert.certificate_no || "";

    const matchesSearch =
      batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getGradeColor = (grade: string) => {
    const g = grade.trim().toUpperCase();
    if (g === "A++" || g === "A+") return "bg-emerald-100 text-emerald-700";
    if (g === "A") return "bg-blue-100 text-blue-700";
    if (g === "A-") return "bg-slate-100 text-slate-700";
    return "bg-amber-100 text-amber-700";
  };

  const handleDownload = (cert: QualityCertificate) => {
    // Generate a downloadable JSON or TXT certificate
    const content = `
==================================================
        SMART SHOE FACTORY QUALITY CERTIFICATE
==================================================
Certificate No: ${cert.certificate_no}
Issued To: Batch ${cert.batch_number || "N/A"}
Product Model: ${cert.shoe_model_name || "N/A"}
Inspected By: ${cert.inspected_by}
Inspection Date: ${cert.inspection_date ? new Date(cert.inspection_date).toLocaleDateString() : "N/A"}
Expiry Date: ${cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "N/A"}
--------------------------------------------------
Passed Quantity: ${cert.passed_quantity} units
Defect Rate: ${Number(cert.defect_rate).toFixed(2)}%
Overall Grade: ${cert.grade}
Status: ${cert.status.toUpperCase()}
==================================================
This certificate verifies that the aforementioned batch
meets the standard premium build and inspection criteria.
    `;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Certificate-${cert.certificate_no}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Computations
  const totalCount = certificates.length;
  const premiumCount = certificates.filter(
    (c) => c.grade === "A+" || c.grade === "A++"
  ).length;
  
  const avgDefectRate =
    totalCount > 0
      ? (certificates.reduce((sum, c) => sum + Number(c.defect_rate), 0) / totalCount).toFixed(1)
      : "0.0";

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const thisMonthCount = certificates.filter((c) => {
    const date = new Date(c.inspection_date || c.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Quality Certificates</h1>
            <p className="text-slate-600 text-sm mt-1">Generate and manage quality assurance certificates</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 text-sm">Loading quality certificates...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Certificates</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{totalCount}</p>
                    <p className="text-slate-500 text-sm mt-1">issued</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">A+ / A++ Grade</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{premiumCount}</p>
                    <p className="text-emerald-600 text-sm mt-1">premium quality</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Avg Defect Rate</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{avgDefectRate}%</p>
                    <p className="text-slate-500 text-sm mt-1">across batches</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">This Month</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{thisMonthCount}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {new Date().toLocaleString("default", { month: "long" })} {currentYear}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by batch ID, product, or certificate number..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="issued">Issued</option>
                  <option value="pending">Pending</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredCertificates.map((cert) => (
                  <div key={cert.id} className="border border-slate-200 rounded-xl p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                          <Award className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">{cert.shoe_model_name || "Unknown Product"}</h3>
                          <p className="text-sm text-slate-600 font-mono">{cert.certificate_no}</p>
                          <p className="text-sm text-slate-600 mt-1">Batch: {cert.batch_number || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getGradeColor(cert.grade)}`}>
                          Grade {cert.grade}
                        </span>
                        <button
                          onClick={() => handleDownload(cert)}
                          className="p-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Certificate"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 bg-slate-50 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-slate-500">Passed Quantity</p>
                        <p className="text-sm font-semibold text-slate-900">{cert.passed_quantity} units</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Defect Rate</p>
                        <p className={`text-sm font-semibold ${
                          Number(cert.defect_rate) < 2 ? "text-emerald-600" : "text-amber-600"
                        }`}>{Number(cert.defect_rate).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Inspector</p>
                        <p className="text-sm font-semibold text-slate-900">{cert.inspected_by}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Inspection Date</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {cert.inspection_date ? new Date(cert.inspection_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expiry Date</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {cert.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCertificates.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-sm">No quality certificates found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

