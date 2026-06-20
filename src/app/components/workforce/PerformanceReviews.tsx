import { useState, useEffect } from "react";
import { Layout } from "../Layout";
import { Plus, Search, Star, Award, TrendingUp, BarChart3, ClipboardCheck, X } from "lucide-react";
import { exportToCSV, generateStyledPDF } from "../../utils/exportUtils";
import { workforceApi } from "../../services/workforceApi";
import { useSettings } from "../../context/SettingsContext";
import { toast } from "sonner";

export function PerformanceReviews() {
  const { companyName, logoUrl, API_BASE_URL } = useSettings();
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newReview, setNewReview] = useState({
    employeeId: "",
    reviewPeriod: "Q1 2026",
    productivityScore: 0,
    qualityScore: 0,
    attendanceScore: 0,
    comments: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      workforceApi.listAllReviews().catch(() => ({ reviews: [] })),
      workforceApi.listEmployees().catch(() => ({ employees: [] }))
    ]).then(([reviewsRes, empRes]) => {
      setReviews(reviewsRes.reviews || []);
      setEmployees(empRes.employees || []);
    }).finally(() => setLoading(false));
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workforceApi.createReview({
        ...newReview,
        productivityScore: Number(newReview.productivityScore),
        qualityScore: Number(newReview.qualityScore),
        attendanceScore: Number(newReview.attendanceScore)
      });
      setShowModal(false);
      fetchData();
      toast.success("Review created successfully");
    } catch (err) {
      toast.error("Failed to create review");
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Performance Reviews Report"],
      [""],
      ["Employee", "Period", "Productivity", "Quality", "Attendance", "Overall Score", "Date"],
      ...reviews.map(r => [
        r.employee_name || r.employee_id, 
        r.review_period, 
        `${r.productivity_score}%`, 
        `${r.quality_score}%`, 
        `${r.attendance_score}%`, 
        `${r.overall_score}%`, 
        new Date(r.created_at).toLocaleDateString()
      ])
    ];
    exportToCSV("performance_reviews", rows);
  };

  const handleExportPDF = async () => {
    await generateStyledPDF({
      filename: "performance-reviews",
      reportTitle: "Performance Reviews Report",
      sectionTitle: "1. PERFORMANCE REVIEWS DETAIL IN PERIOD",
      periodStart: new Date().toLocaleDateString(),
      columns: ["Worker", "Productivity", "Quality", "Attendance", "Overall", "Date"],
      rows: reviews.map(r => [
        r.worker_name,
        `${r.productivity_score}%`,
        `${r.quality_score}%`,
        `${r.attendance_score}%`,
        `${r.overall_score}%`,
        new Date(r.created_at).toLocaleDateString()
      ]),
      companyName,
      logoUrl: logoUrl || undefined,
      apiBaseUrl: API_BASE_URL
    });
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Performance Reviews</h1>
            <p className="text-slate-600 text-sm mt-1">Monitor employee performance and conduct reviews</p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              Export PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Export Excel
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Review
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Average Performance</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">88.6%</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Top Performers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">5</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search reviews..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Productivity</th>
                  <th className="px-4 py-3">Quality</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Overall Score</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading reviews...</td></tr>
                ) : reviews.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-500">No reviews found.</td></tr>
                ) : reviews.map((review) => (
                  <tr key={review.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{review.employee_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{review.employee_code || review.employee_id}</p>
                    </td>
                    <td className="px-4 py-4">{review.review_period}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${review.productivity_score}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{review.productivity_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${review.quality_score}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{review.quality_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${review.attendance_score}%` }}></div>
                        </div>
                        <span className="text-xs font-medium">{review.attendance_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        review.overall_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        review.overall_score >= 70 ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {review.overall_score}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Review Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Star className="w-5 h-5" /> Submit Review
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReview} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
                  <select required value={newReview.employeeId} onChange={e => setNewReview({...newReview, employeeId: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">Select...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
                  <input type="text" required placeholder="e.g. Q1 2026" value={newReview.reviewPeriod} onChange={e => setNewReview({...newReview, reviewPeriod: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Productivity (%)</label>
                  <input type="number" min="0" max="100" required value={newReview.productivityScore} onChange={e => setNewReview({...newReview, productivityScore: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quality (%)</label>
                  <input type="number" min="0" max="100" required value={newReview.qualityScore} onChange={e => setNewReview({...newReview, qualityScore: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Attendance (%)</label>
                  <input type="number" min="0" max="100" required value={newReview.attendanceScore} onChange={e => setNewReview({...newReview, attendanceScore: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
                <textarea rows={3} value={newReview.comments} onChange={e => setNewReview({...newReview, comments: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-md">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
