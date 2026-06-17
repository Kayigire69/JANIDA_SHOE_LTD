import { useState } from "react";
import { Layout } from "../Layout";
import { PlayCircle, Truck, CheckCircle2, Filter } from "lucide-react";

export function OrderManagement() {
  const [filter, setFilter] = useState("all");

  const orders = [
    { id: "ORD-1001", customer: "Retail Chain A", product: "Running Shoe Pro", quantity: 500, date: "2026-05-01", status: "Pending" },
    { id: "ORD-1002", customer: "Sports Store B", product: "Casual Sneaker", quantity: 300, date: "2026-05-02", status: "Processing" },
    { id: "ORD-1003", customer: "Online Store C", product: "Sports Trainer", quantity: 450, date: "2026-04-30", status: "Shipped" },
    { id: "ORD-1004", customer: "Distribution Hub D", product: "Walking Comfort", quantity: 600, date: "2026-05-01", status: "Delivered" },
  ];

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status.toLowerCase() === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-700";
      case "Shipped":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-amber-100 text-amber-700";
      case "Pending":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Order Management</h1>
            <p className="text-slate-600 text-sm mt-1">Track and manage customer orders</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Filter by status:</span>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "processing", "shipped", "delivered"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-900">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Order ID</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Product</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Quantity</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Order Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">{order.id}</td>
                    <td className="py-4 px-6 text-sm text-slate-700">{order.customer}</td>
                    <td className="py-4 px-6 text-sm text-slate-700">{order.product}</td>
                    <td className="py-4 px-6 text-sm text-slate-700">{order.quantity}</td>
                    <td className="py-4 px-6 text-sm text-slate-700">{order.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {order.status === "Pending" && (
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === "Processing" && (
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === "Shipped" && (
                          <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
