import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import {
  ShoppingCart, Plus, Trash2, AlertTriangle, CheckCircle2,
  Package, User, Calendar, MapPin, Loader2
} from "lucide-react";
import { salesApi } from "../../services/salesApi";
import { inventoryApi } from "../../services/inventoryApi";

interface FinishedGood {
  id: string;
  product: string;
  sku: string;
  stock: number;
  unitCost: number;
  status: string;
}

interface Customer { id: string; name: string; address: string; }

interface OrderItem {
  finishedGoodId: string;
  product: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

export function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);

  // For adding a new item row
  const [selectedFgId, setSelectedFgId] = useState("");
  const [selectedQty, setSelectedQty] = useState("");

  useEffect(() => {
    Promise.all([salesApi.getCustomers(), inventoryApi.getFinishedGoods()])
      .then(([cust, fg]) => {
        setCustomers(cust);
        setFinishedGoods(fg);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-fill shipping address from customer selection
  useEffect(() => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) setShippingAddress(cust.address || "");
  }, [customerId, customers]);

  const addItem = () => {
    if (!selectedFgId || !selectedQty || parseInt(selectedQty) < 1) return;
    const fg = finishedGoods.find((f) => f.id === selectedFgId);
    if (!fg) return;
    if (items.find((i) => i.finishedGoodId === selectedFgId)) {
      setError("This product is already added. Update the quantity in the list.");
      return;
    }
    setItems([...items, {
      finishedGoodId: fg.id,
      product: fg.product,
      sku: fg.sku,
      quantity: parseInt(selectedQty),
      unitPrice: fg.unitCost,
      availableStock: fg.stock,
    }]);
    setSelectedFgId("");
    setSelectedQty("");
    setError("");
  };

  const removeItem = (fgId: string) => setItems(items.filter((i) => i.finishedGoodId !== fgId));

  const updateQty = (fgId: string, qty: number) => {
    setItems(items.map((i) => i.finishedGoodId === fgId ? { ...i, quantity: qty } : i));
  };

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const hasBackorderRisk = items.some((i) => i.quantity > i.availableStock);

  const handleSubmit = async () => {
    if (!customerId || !deliveryDate || !shippingAddress || items.length === 0) {
      setError("Please fill in all required fields and add at least one product.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await salesApi.createOrder({
        customerId,
        deliveryDate,
        priority,
        shippingAddress,
        notes,
        items: items.map((i) => ({
          finishedGoodId: i.finishedGoodId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      setSuccess(`Order ${res.orderNumber} created successfully! Invoice: ${res.invoiceNumber}`);
      setTimeout(() => navigate("/orders/manage"), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading order form...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Order</h1>
            <p className="text-slate-500 text-sm mt-1">Process a customer sales order with live inventory verification</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-sm font-medium">{finishedGoods.length} SKUs available</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 text-sm font-medium">{success}</p>
          </div>
        )}
        {hasBackorderRisk && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm">
              <strong>Backorder Warning:</strong> One or more items exceed available stock. Shortfalls will be recorded as backorders and fulfilled when stock is replenished.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column - form */}
          <div className="xl:col-span-2 space-y-6">

            {/* Customer & Delivery Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Customer & Delivery
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer <span className="text-red-500">*</span></label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Delivery Date <span className="text-red-500">*</span></label>
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                    Shipping Address <span className="text-red-500">*</span>
                  </label>
                  <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)}
                    rows={2} placeholder="Enter full delivery address..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={2} placeholder="Special delivery instructions or comments..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Products
              </h3>

              {/* Add Item Row */}
              <div className="flex gap-3 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <select value={selectedFgId} onChange={(e) => setSelectedFgId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select product / SKU</option>
                    {finishedGoods.map((fg) => (
                      <option key={fg.id} value={fg.id}>
                        {fg.product} ({fg.sku}) — {fg.stock} in stock
                      </option>
                    ))}
                  </select>
                </div>
                <input type="number" value={selectedQty} onChange={(e) => setSelectedQty(e.target.value)}
                  placeholder="Qty" min="1"
                  className="w-24 px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addItem}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              {/* Items Table */}
              {items.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">No products added yet. Select a product above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Product</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase">In Stock</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Qty</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Line Total</th>
                        <th className="py-2 px-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const shortage = item.quantity > item.availableStock;
                        return (
                          <tr key={item.finishedGoodId} className={shortage ? "bg-amber-50" : ""}>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{item.product}</td>
                            <td className="py-2.5 px-3 text-slate-500">{item.sku}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                item.availableStock <= 0 ? "bg-red-100 text-red-700" :
                                shortage ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}>{item.availableStock}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <input type="number" min="1" value={item.quantity}
                                onChange={(e) => updateQty(item.finishedGoodId, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-slate-200 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              {shortage && <p className="text-xs text-amber-600 mt-0.5">+{item.quantity - item.availableStock} backorder</p>}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-700">${item.unitPrice.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                              ${(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              <button onClick={() => removeItem(item.finishedGoodId)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              ><Trash2 className="w-4 h-4" /></button>
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

          {/* Right Column - Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-slate-900 text-right max-w-32 truncate">
                    {customers.find((c) => c.id === customerId)?.name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Date</span>
                  <span className="font-medium text-slate-900">{deliveryDate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority</span>
                  <span className={`font-semibold capitalize ${
                    priority === "high" ? "text-red-600" :
                    priority === "medium" ? "text-amber-600" : "text-slate-600"
                  }`}>{priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items</span>
                  <span className="font-medium text-slate-900">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Units</span>
                  <span className="font-medium text-slate-900">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-700">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {hasBackorderRisk && (
                <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Partial backorders will be created for shortage items
                </div>
              )}

              <button onClick={handleSubmit}
                disabled={submitting || !customerId || !deliveryDate || !shippingAddress || items.length === 0}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? "Creating Order..." : "Confirm & Create Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
