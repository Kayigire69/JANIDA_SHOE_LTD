import { useState } from "react";
import { Layout } from "../Layout";
import { FileText, Calendar as CalendarIcon, Download, CheckCircle2, FileDown, AlertCircle } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { generateStyledPDF, exportToCSV } from "../../utils/exportUtils";
import { toast } from "sonner";

const reportCategories = [
  { id: "production", name: "Production Report" },
  { id: "inventory", name: "Inventory Report" },
  { id: "quality", name: "Quality Assurance Report" },
  { id: "workforce", name: "Workforce Report" },
  { id: "supplier", name: "Supplier Report" },
  { id: "sales", name: "Sales & Distribution Report" },
  { id: "ai_forecast", name: "AI Forecast & Recommendation Report" }
];

import { productionApi } from "../../services/productionApi";
import { inventoryApi } from "../../services/inventoryApi";
import { qualityApi } from "../../services/qualityApi";
import { workforceApi } from "../../services/workforceApi";
import { salesApi } from "../../services/salesApi";



export function ReportsCenter() {
  const { companyName, logoUrl, API_BASE_URL } = useSettings();
  
  const [reportType, setReportType] = useState(reportCategories[0].id);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error("Please select a valid date range.");
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date.");
      return;
    }

    setIsGenerating(true);
    
    // Simulate data fetching
    setTimeout(async () => {
      try {
        const selectedCategory = reportCategories.find(c => c.id === reportType)?.name || "Report";
        
        let columns: string[] = [];
        let rows: string[][] = [];

        if (reportType === "production") {
          const data = await productionApi.getOrders().then(res => res.orders).catch(() => []);
          if (data.length === 0) throw new Error("No report data yet");
          columns = ["Order ID", "Product", "Quantity", "Status"];
          rows = data.map((o: any) => [o.id, o.product || "-", o.quantity?.toString() || "-", o.status]);
        } else if (reportType === "inventory") {
          const data = await inventoryApi.getRawMaterials().catch(() => []);
          const actualData = Array.isArray(data) ? data : (data.materials || []);
          if (actualData.length === 0) throw new Error("No report data yet");
          columns = ["Material ID", "Name", "Quantity", "Unit"];
          rows = actualData.map((m: any) => [m.idCode || m.id, m.name, m.quantity?.toString() || "0", m.unit || "-"]);
        } else if (reportType === "quality") {
          const data = await qualityApi.getInspections().then(res => res.inspections).catch(() => []);
          if (data.length === 0) throw new Error("No report data yet");
          columns = ["Inspection ID", "Batch", "Result", "Inspector"];
          rows = data.map((i: any) => [i.id, i.batchId, i.result, i.inspectorName || "-"]);
        } else if (reportType === "workforce") {
          const data = await workforceApi.getTasks().then(res => res.tasks).catch(() => []);
          if (data.length === 0) throw new Error("No report data yet");
          columns = ["Task", "Assignee", "Status", "Priority"];
          rows = data.map((t: any) => [t.title, t.assigneeName || "-", t.status, t.priority]);
        } else if (reportType === "supplier") {
          const data = await inventoryApi.getSuppliers().then(res => res.suppliers).catch(() => []);
          if (data.length === 0) throw new Error("No report data yet");
          columns = ["Supplier", "Contact", "Rating", "Status"];
          rows = data.map((s: any) => [s.name, s.contactPerson || "-", s.rating?.toString() || "-", s.status]);
        } else if (reportType === "sales") {
          const data = await salesApi.getOrders().catch(() => []);
          
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          const filtered = Array.isArray(data) ? data.filter((o: any) => {
             const d = new Date(o.createdAt || o.created_at || new Date());
             return d >= start && d <= end;
          }) : [];
          
          if (filtered.length === 0) throw new Error("No sales data found for the selected dates");
          
          columns = ["Order #", "Customer", "Date", "Status", "Total Amount"];
          rows = filtered.map((o: any) => [
             o.orderNumber || o.id, 
             o.customerName || o.customer || "Walk-in", 
             new Date(o.createdAt || o.created_at || new Date()).toLocaleDateString(), 
             o.status || "N/A", 
             `${o.totalAmount || o.total || 0} RWF`
          ]);
        } else {
           throw new Error("No report data yet");
        }

        if (exportFormat === "pdf") {
          await generateStyledPDF({
            filename: `${reportType}_report_${startDate}_to_${endDate}`,
            reportTitle: `${selectedCategory}`,
            sectionTitle: `Period: ${startDate} to ${endDate}`,
            periodStart: startDate,
            columns: columns,
            rows: rows,
            companyName,
            logoUrl: logoUrl || undefined,
            apiBaseUrl: API_BASE_URL
          });
          toast.success("PDF Report generated successfully!");
        } else {
          const csvRows = [
            [`${companyName} - ${selectedCategory}`],
            [`Period: ${startDate} to ${endDate}`],
            [""],
            columns,
            ...rows
          ];
          exportToCSV(`${reportType}_report`, csvRows);
          toast.success("Excel Report generated successfully!");
        }
      } catch (err: any) {
        toast.info(err.message || "Failed to generate report.");
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reports Center</h1>
            <p className="text-slate-600 text-sm mt-1">Generate and export detailed factory operation reports</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-5">
            <h3 className="text-lg font-semibold text-slate-800">Report Configuration</h3>
            <p className="text-sm text-slate-500">Select parameters to generate your customized report</p>
          </div>

          <form onSubmit={handleGenerateReport} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Report Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Report Category</label>
                <div className="relative">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm text-slate-700"
                  >
                    {reportCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>📄 {cat.name}</option>
                    ))}
                  </select>
                  <FileText className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Reporting Period</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-700"
                      />
                      <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs text-slate-500 mb-1">End Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm text-slate-700"
                      />
                      <CalendarIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Format */}
              <div className="space-y-3 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700">Export Format</label>
                <div className="flex flex-wrap gap-4">
                  <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${exportFormat === 'pdf' ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="format" 
                      value="pdf" 
                      checked={exportFormat === 'pdf'} 
                      onChange={() => setExportFormat("pdf")}
                      className="sr-only" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${exportFormat === 'pdf' ? 'border-red-500' : 'border-slate-300'}`}>
                      {exportFormat === 'pdf' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                    </div>
                    <FileDown className="w-6 h-6" />
                    <span className="font-semibold">PDF Document (.pdf)</span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${exportFormat === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input 
                      type="radio" 
                      name="format" 
                      value="excel" 
                      checked={exportFormat === 'excel'} 
                      onChange={() => setExportFormat("excel")}
                      className="sr-only" 
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${exportFormat === 'excel' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {exportFormat === 'excel' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                    </div>
                    <Download className="w-6 h-6" />
                    <span className="font-semibold">Excel Spreadsheet (.csv)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                Reports are generated based on real-time database records.
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
