import { Layout } from "../Layout";
import { TrendingUp, Package, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AnalyticsDashboard() {
  const productionData = [
    { month: "Jan", efficiency: 92, defects: 3.2 },
    { month: "Feb", efficiency: 94, defects: 2.8 },
    { month: "Mar", efficiency: 91, defects: 3.5 },
    { month: "Apr", efficiency: 96, defects: 2.1 },
    { month: "May", efficiency: 95, defects: 1.8 },
  ];

  const inventoryData = [
    { category: "Raw Materials", value: 450 },
    { category: "Work in Progress", value: 280 },
    { category: "Finished Goods", value: 620 },
  ];

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Business Intelligence Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">Key performance indicators and analytics</p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Production Efficiency</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">95%</p>
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +4% vs last month
                </p>
              </div>
              <Package className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Defect Rate</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">1.8%</p>
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  -0.3% improvement
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Inventory Turnover</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">12.4</p>
                <p className="text-slate-500 text-sm mt-1">days average</p>
              </div>
              <Package className="w-12 h-12 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Order Fulfillment</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">98.2%</p>
                <p className="text-emerald-600 text-sm mt-1">on-time delivery</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Production Efficiency Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#2563eb" strokeWidth={3} name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Inventory Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
}
