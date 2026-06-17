import { useState } from "react";
import { Layout } from "../Layout";
import { ShoppingCart, AlertCircle, CheckCircle2 } from "lucide-react";

export function OrderCreation() {
  const [formData, setFormData] = useState({
    customer: "",
    product: "",
    size: "",
    quantity: "",
  });

  const [availability, setAvailability] = useState<number | null>(null);

  const customers = ["Retail Chain A", "Sports Store B", "Online Store C", "Distribution Hub D"];
  const products = ["Running Shoe Pro", "Casual Sneaker", "Sports Trainer", "Walking Comfort"];
  const sizes = ["6", "7", "8", "9", "10", "11", "12"];

  const checkAvailability = () => {
    const available = Math.floor(Math.random() * 500) + 50;
    setAvailability(available);
  };

  const handleSubmit = () => {
    console.log("Order created:", formData);
  };

  return (
    <Layout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create New Order</h1>
            <p className="text-slate-600 text-sm mt-1">Process new customer orders</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Order Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                  <select
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer} value={customer}>
                        {customer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                  <select
                    value={formData.product}
                    onChange={(e) => {
                      setFormData({ ...formData, product: e.target.value });
                      setAvailability(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                  <select
                    value={formData.size}
                    onChange={(e) => {
                      setFormData({ ...formData, size: e.target.value });
                      setAvailability(null);
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select size</option>
                    {sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.product && formData.size && (
                <button
                  onClick={checkAvailability}
                  className="mt-4 w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  Check Inventory Availability
                </button>
              )}

              {availability !== null && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${
                  availability >= parseInt(formData.quantity || "0")
                    ? "bg-emerald-50 border-emerald-500"
                    : "bg-red-50 border-red-500"
                }`}>
                  <div className="flex items-center gap-2">
                    {availability >= parseInt(formData.quantity || "0") ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        availability >= parseInt(formData.quantity || "0") ? "text-emerald-900" : "text-red-900"
                      }`}>
                        {availability >= parseInt(formData.quantity || "0")
                          ? "Stock Available"
                          : "Insufficient Stock"}
                      </p>
                      <p className={`text-sm ${
                        availability >= parseInt(formData.quantity || "0") ? "text-emerald-700" : "text-red-700"
                      }`}>
                        {availability} units in stock
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-blue-900 mb-3">Order Summary</h4>
              <div className="space-y-2">
                {formData.customer && (
                  <div className="text-sm">
                    <span className="text-slate-600">Customer:</span>
                    <p className="font-medium text-slate-900">{formData.customer}</p>
                  </div>
                )}
                {formData.product && (
                  <div className="text-sm">
                    <span className="text-slate-600">Product:</span>
                    <p className="font-medium text-slate-900">{formData.product} - Size {formData.size}</p>
                  </div>
                )}
                {formData.quantity && (
                  <div className="text-sm">
                    <span className="text-slate-600">Quantity:</span>
                    <p className="font-medium text-slate-900">{formData.quantity} units</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formData.customer || !formData.product || !formData.size || !formData.quantity}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Create Order
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
