import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../Layout";
import {
  ShoppingCart, Plus, Trash2, AlertTriangle, CheckCircle2,
  Package, User, Calendar, MapPin, Loader2, Banknote,
  Smartphone, Building2, X, Printer, Download, FileText,
  ChevronDown, Tag, Users, Hash, ArrowRight, Phone, Mail,
  CreditCard, Search, RefreshCw
} from "lucide-react";
import { salesApi } from "../../services/salesApi";
import { inventoryApi } from "../../services/inventoryApi";
import { batchApi } from "../../services/batchApi";
import { toast } from "sonner";

/* ─── types ────────────────────────────────────────────────────── */
interface FinishedGood { id: string; product: string; stock: number; unitCost: number; status: string; sku?: string; }
interface Customer { id: string; name: string; address: string; email?: string; phone?: string; }
interface OrderItem { finishedGoodId: string; product: string; quantity: number; unitPrice: number; availableStock: number; sku?: string; }

type PaymentMode = "cash" | "momo" | "bank";
type CustomerMode = "registered" | "walkin";

/* ─── helpers ──────────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("rw-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

const PAYMENT_MODES: { id: PaymentMode; label: string; icon: any; color: string; desc: string }[] = [
  { id: "cash",  label: "Cash",          icon: Banknote,   color: "emerald", desc: "Pay at counter / on delivery" },
  { id: "momo",  label: "MoMo Pay",      icon: Smartphone, color: "yellow",  desc: "MTN or Airtel Mobile Money" },
  { id: "bank",  label: "Bank Transfer", icon: Building2,  color: "blue",    desc: "Wire / Bank transfer" },
];

const colorMap: Record<string, string> = {
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
  yellow:  "border-yellow-500 bg-yellow-50 text-yellow-700",
  blue:    "border-blue-500 bg-blue-50 text-blue-700",
};
const iconBg: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  yellow:  "bg-yellow-100 text-yellow-600",
  blue:    "bg-blue-100 text-blue-600",
};

/* ─── invoice print styles ─────────────────────────────────────── */
const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
    #invoice-print-area { position: fixed !important; top: 0; left: 0; width: 100%; z-index: 9999; background: white; }
    @page { margin: 12mm; }
  }
`;

/* ═══════════════════════════════════════════════════════════════ */
export function CreateOrder() {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  /* ── data ── */
  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [finishedGoods,setFinishedGoods]= useState<FinishedGood[]>([]);
  const [loading,      setLoading]      = useState(true);

  /* ── form ── */
  const [customerMode, setCustomerMode] = useState<CustomerMode>("registered");
  const [customerId,   setCustomerId]   = useState("");
  const [walkinName,   setWalkinName]   = useState("");
  const [walkinPhone,  setWalkinPhone]  = useState("");
  const [walkinEmail,  setWalkinEmail]  = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority,     setPriority]     = useState("medium");
  const [shippingAddr, setShippingAddr] = useState("");
  const [notes,        setNotes]        = useState("");
  const [items,        setItems]        = useState<OrderItem[]>([]);
  const [paymentMode,  setPaymentMode]  = useState<PaymentMode>("cash");
  const [momoNumber,   setMomoNumber]   = useState("");
  const [bankRef,      setBankRef]      = useState("");

  /* ── item row ── */
  const [selFgId,      setSelFgId]      = useState("");
  const [selQty,       setSelQty]       = useState("");
  const [itemSearch,   setItemSearch]   = useState("");

  /* ── submit / invoice ── */
  const [submitting,   setSubmitting]   = useState(false);
  const [invoice,      setInvoice]      = useState<any>(null); // created order response
  const [showInvoice,  setShowInvoice]  = useState(false);

  /* ── new customer modal ── */
  const [showNewCust,  setShowNewCust]  = useState(false);
  const [newCustForm,  setNewCustForm]  = useState({ name: "", phone: "", email: "", address: "" });
  const [creatingCust, setCreatingCust] = useState(false);

  /* ── load ── */
  useEffect(() => {
    const extractArray = (data: any) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      if (data && Array.isArray(data.batches)) return data.batches;
      return [];
    };

    Promise.all([
      salesApi.getCustomers().catch(() => []), 
      inventoryApi.getFinishedGoods().catch(() => []), 
      batchApi.getBatches().catch(() => [])
    ])
      .then(([c, fg, b]) => { 
        setCustomers(extractArray(c)); 
        
        const goodsList = extractArray(fg);
        const completedBatches = extractArray(b)
          .filter(batch => batch.status === "completed")
          .map(batch => ({
            id: batch.id,
            product: `${batch.shoe_model_name} (Batch ${batch.batch_number})`,
            stock: batch.quantity,
            unitCost: 0, // Allows user to input price if not set
            status: "normal",
            sku: batch.batch_number
          }));
          
        // Combine finished goods and completed batches
        setFinishedGoods([...goodsList, ...completedBatches]); 
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  /* ── auto-fill address ── */
  useEffect(() => {
    if (customerMode !== "registered") return;
    const c = customers.find(x => x.id === customerId);
    if (c?.address) setShippingAddr(c.address);
  }, [customerId, customers, customerMode]);

  /* ── computed ── */
  const selectedCustomer = customers.find(c => c.id === customerId);
  const subTotal   = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax        = 0; // VAT can be added later
  const totalAmt   = subTotal + tax;
  const hasBackorder = items.some(i => i.quantity > i.availableStock);
  const effectiveName = customerMode === "walkin" ? (walkinName || "Walk-in Customer") : (selectedCustomer?.name || "—");

  const filteredGoods = finishedGoods.filter(fg =>
    !itemSearch || fg.product.toLowerCase().includes(itemSearch.toLowerCase()) || fg.sku?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  /* ── item operations ── */
  const addItem = () => {
    if (!selFgId || !selQty || parseInt(selQty) < 1) { toast.error("Select a product and enter a valid quantity."); return; }
    const fg = finishedGoods.find(f => f.id === selFgId);
    if (!fg) return;
    if (items.find(i => i.finishedGoodId === selFgId)) { toast.error("Product already added. Update the quantity below."); return; }
    setItems(prev => [...prev, { finishedGoodId: fg.id, product: fg.product, quantity: parseInt(selQty), unitPrice: fg.unitCost, availableStock: fg.stock, sku: fg.sku }]);
    setSelFgId(""); setSelQty("");
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.finishedGoodId !== id));
  const updateQty  = (id: string, qty: number) => setItems(prev => prev.map(i => i.finishedGoodId === id ? { ...i, quantity: Math.max(1, qty) } : i));
  const updatePrice= (id: string, price: number) => setItems(prev => prev.map(i => i.finishedGoodId === id ? { ...i, unitPrice: Math.max(0, price) } : i));

  /* ── validation ── */
  const canSubmit = () => {
    if (customerMode === "registered" && !customerId) return false;
    if (customerMode === "walkin" && !walkinName.trim()) return false;
    if (!deliveryDate) return false;
    if (!shippingAddr.trim()) return false;
    if (items.length === 0) return false;
    if (paymentMode === "momo" && !momoNumber.trim()) return false;
    if (paymentMode === "bank" && !bankRef.trim()) return false;
    return true;
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!canSubmit()) { toast.error("Please complete all required fields."); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        deliveryDate, priority, shippingAddress: shippingAddr, notes,
        paymentMode,
        momoNumber:  paymentMode === "momo" ? momoNumber : undefined,
        bankRef:     paymentMode === "bank" ? bankRef    : undefined,
        items: items.map(i => ({ finishedGoodId: i.finishedGoodId, quantity: i.quantity, unitPrice: i.unitPrice })),
      };
      if (customerMode === "registered") {
        payload.customerId = customerId;
      } else {
        payload.walkinCustomer = { name: walkinName.trim(), phone: walkinPhone.trim(), email: walkinEmail.trim() };
      }
      const res = await salesApi.createOrder(payload);
      const invoiceData = res.data || res;
      toast.success(`Order ${invoiceData.orderNumber || invoiceData.id} created successfully!`);
      setInvoice({ ...invoiceData, items, customerName: effectiveName, subTotal, tax, totalAmt, paymentMode, momoNumber, bankRef, deliveryDate, shippingAddr, priority });
      setShowInvoice(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── create new customer ── */
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) return toast.error("Customer name is required");
    setCreatingCust(true);
    try {
      const res = await salesApi.createCustomer(newCustForm);
      const newCust = res.data || res;
      setCustomers(prev => [...prev, newCust]);
      setCustomerId(newCust.id);
      if (newCust.address) setShippingAddr(newCust.address);
      toast.success("Customer registered successfully!");
      setShowNewCust(false);
      setNewCustForm({ name: "", phone: "", email: "", address: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to register customer.");
    } finally {
      setCreatingCust(false);
    }
  };

  /* ── print invoice ── */
  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = PRINT_STYLES;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  /* ── after invoice ── */
  const handleDone = () => { setShowInvoice(false); navigate("/orders/manage"); };

  /* ─── loading ─── */
  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading order form…</p>
        </div>
      </div>
    </Layout>
  );

  /* ═══════════════════════ MAIN RENDER ══════════════════════════ */
  return (
    <Layout>
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">

        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              New Sales Order
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-14">Create and process a customer order with payment and invoice</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700 text-sm font-semibold">{finishedGoods.length} products available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ═══ LEFT: FORM ═══ */}
          <div className="xl:col-span-2 space-y-5">

            {/* ── Step 1: Customer ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
                <h2 className="text-base font-extrabold text-slate-900">Customer Information</h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Toggle */}
                <div className="flex gap-3">
                  {(["registered","walkin"] as const).map(m => (
                    <button
                      key={m} onClick={() => { setCustomerMode(m); setCustomerId(""); setWalkinName(""); setWalkinPhone(""); setWalkinEmail(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        customerMode === m
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {m === "registered" ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      {m === "registered" ? "Registered Customer" : "Walk-in Customer"}
                    </button>
                  ))}
                </div>

                {customerMode === "registered" ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-slate-700">Select Customer <span className="text-red-500">*</span></label>
                      <button onClick={() => setShowNewCust(true)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Register New
                      </button>
                    </div>
                    <select
                      value={customerId} onChange={e => setCustomerId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    >
                      <option value="">— Choose a customer —</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
                    </select>
                    {selectedCustomer && (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <p className="font-bold text-slate-900">{selectedCustomer.name}</p>
                          {selectedCustomer.email && <p className="text-slate-500 text-xs">{selectedCustomer.email}</p>}
                          {selectedCustomer.phone && <p className="text-slate-500 text-xs">{selectedCustomer.phone}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Customer Name <span className="text-red-500">*</span></label>
                      <input value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone</label>
                      <input value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="+250 78x xxx xxx"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email (optional)</label>
                      <input type="email" value={walkinEmail} onChange={e => setWalkinEmail(e.target.value)} placeholder="customer@email.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Step 2: Order Details ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
                <h2 className="text-base font-extrabold text-slate-900">Delivery & Priority</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Delivery Date <span className="text-red-500">*</span></label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {["low","medium","high"].map(p => (
                      <button key={p} onClick={() => setPriority(p)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize border-2 transition-all ${
                          priority === p
                            ? p === "high" ? "border-red-500 bg-red-50 text-red-700"
                              : p === "medium" ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-slate-400 bg-slate-100 text-slate-700"
                            : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                        }`}
                      >{p}</button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Shipping Address <span className="text-red-500">*</span></label>
                  <textarea value={shippingAddr} onChange={e => setShippingAddr(e.target.value)} rows={2}
                    placeholder="Enter full delivery address…"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Special delivery instructions…"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* ── Step 3: Products ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
                <h2 className="text-base font-extrabold text-slate-900">Products</h2>
                {items.length > 0 && <span className="ml-auto px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{items.length} item{items.length !== 1 ? "s" : ""}</span>}
              </div>
              <div className="p-6 space-y-4">
                {/* Add item row */}
                <div className="flex gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select value={selFgId} onChange={e => setSelFgId(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select product…</option>
                      {finishedGoods.map(fg => (
                        <option key={fg.id} value={fg.id} disabled={fg.stock <= 0}>
                          {fg.product}{fg.sku ? ` [${fg.sku}]` : ""} — {fg.stock > 0 ? `${fg.stock} in stock` : "OUT OF STOCK"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input type="number" value={selQty} onChange={e => setSelQty(e.target.value)}
                    placeholder="Qty" min="1"
                    className="w-24 px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold" />
                  <button onClick={addItem}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all whitespace-nowrap">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Backorder warning */}
                {hasBackorder && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 text-sm font-bold">Backorder Warning</p>
                      <p className="text-amber-700 text-xs mt-0.5">One or more items exceed available stock. Shortfalls will be recorded as backorders.</p>
                    </div>
                  </div>
                )}

                {/* Items table */}
                {items.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">No products added yet</p>
                    <p className="text-slate-300 text-xs mt-1">Select a product and quantity above</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                          <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                          <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unit Price</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                          <th className="py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map(item => {
                          const shortage = item.quantity > item.availableStock;
                          return (
                            <tr key={item.finishedGoodId} className={`transition-colors hover:bg-slate-50/50 ${shortage ? "bg-amber-50/40" : ""}`}>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-slate-900">{item.product}</p>
                                {item.sku && <p className="text-xs text-slate-400 mt-0.5 font-mono">{item.sku}</p>}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                  item.availableStock <= 0 ? "bg-red-100 text-red-600" :
                                  shortage ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                }`}>{item.availableStock}</span>
                                {shortage && <p className="text-xs text-amber-600 mt-0.5">+{item.quantity - item.availableStock} BO</p>}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <input type="number" min="1" value={item.quantity}
                                  onChange={e => updateQty(item.finishedGoodId, parseInt(e.target.value) || 1)}
                                  className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <input type="number" min="0" value={item.unitPrice}
                                  onChange={e => updatePrice(item.finishedGoodId, parseFloat(e.target.value) || 0)}
                                  className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-right text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                              </td>
                              <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">{fmt(item.quantity * item.unitPrice)}</td>
                              <td className="py-3.5 px-4">
                                <button onClick={() => removeItem(item.finishedGoodId)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td colSpan={4} className="py-3.5 px-4 text-right text-sm font-bold text-slate-700">Subtotal</td>
                          <td className="py-3.5 px-4 text-right text-base font-extrabold text-slate-900">{fmt(subTotal)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>{/* end left col */}

          {/* ═══ RIGHT: SUMMARY & PAYMENT ═══ */}
          <div className="space-y-5">
            {/* ── Payment Method ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">4</div>
                <h2 className="text-base font-extrabold text-slate-900">Payment Method</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-3">
                  {PAYMENT_MODES.map(pm => {
                    const Icon = pm.icon;
                    const selected = paymentMode === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPaymentMode(pm.id)}
                        className={`flex items-center gap-4 p-3 rounded-2xl border-2 text-left transition-all ${
                          selected ? `${colorMap[pm.color]} shadow-md` : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? iconBg[pm.color] : "bg-slate-100 text-slate-500"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-extrabold ${selected ? "" : "text-slate-700"}`}>{pm.label}</p>
                          <p className={`text-xs ${selected ? "opacity-70" : "text-slate-400"}`}>{pm.desc}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* MoMo detail */}
                {paymentMode === "momo" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">MoMo Number <span className="text-red-500">*</span></label>
                    <input value={momoNumber} onChange={e => setMomoNumber(e.target.value)}
                      placeholder="+250 78x xxx xxx"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all" />
                  </div>
                )}

                {/* Bank detail */}
                {paymentMode === "bank" && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Reference / TXN ID <span className="text-red-500">*</span></label>
                      <input value={bankRef} onChange={e => setBankRef(e.target.value)}
                        placeholder="e.g. TXN-20240623-001"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                      <p className="font-bold mb-1">Bank Details:</p>
                      <p>Bank of Kigali · JANIDA SHOE LTD</p>
                      <p>Account: <span className="font-mono font-bold">00123-456-789</span></p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden sticky top-4">
              {/* Summary header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-3xl">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Order Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {/* Customer */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Customer</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{effectiveName}</p>
                    {customerMode === "walkin" && walkinPhone && <p className="text-xs text-slate-500">{walkinPhone}</p>}
                    {customerMode === "registered" && selectedCustomer?.phone && <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>}
                  </div>
                </div>

                {/* Delivery */}
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Delivery Date", value: deliveryDate || "—" },
                    { label: "Priority", value: priority, className: priority === "high" ? "text-red-600 font-bold capitalize" : priority === "medium" ? "text-amber-600 font-bold capitalize" : "text-slate-600 capitalize" },
                    { label: "Items", value: `${items.length} product${items.length !== 1 ? "s" : ""}` },
                    { label: "Total Units", value: items.reduce((s, i) => s + i.quantity, 0).toString() },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={r.className || "font-semibold text-slate-900"}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Payment mode */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Payment</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                    paymentMode === "cash" ? "bg-emerald-100 text-emerald-700" :
                    paymentMode === "momo" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                  }`}>{paymentMode === "momo" ? "MoMo" : paymentMode === "bank" ? "Bank" : "Cash"}</span>
                </div>

                {/* Total */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Subtotal</span>
                    <span className="text-sm font-semibold text-slate-700">{fmt(subTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-slate-500 text-sm">Tax (0%)</span>
                    <span className="text-sm text-slate-400">—</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 p-3 bg-slate-900 rounded-xl">
                    <span className="text-white font-bold text-sm">Total Amount</span>
                    <span className="text-xl font-extrabold text-white">{fmt(totalAmt)}</span>
                  </div>
                </div>

                {/* Backorder note */}
                {hasBackorder && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Partial backorders will be created for shortage items</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none mt-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                  {submitting ? "Creating Order…" : "Confirm & Create Order"}
                </button>

                {/* Validation hints */}
                {!canSubmit() && items.length === 0 && (
                  <p className="text-xs text-center text-slate-400">Add at least one product to continue</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ INVOICE MODAL ═══════════════ */}
      {showInvoice && invoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Order Created Successfully!</p>
                  <p className="text-xs text-slate-500">Invoice ready to print or download</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={handleDone}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors">
                  <ArrowRight className="w-4 h-4" /> Done
                </button>
              </div>
            </div>

            {/* Invoice content */}
            <div id="invoice-print-area" ref={invoiceRef} className="overflow-y-auto flex-1 p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30">
                    <span className="text-white font-extrabold text-xl">J</span>
                  </div>
                  <p className="text-lg font-extrabold text-slate-900">JANIDA SHOE LTD</p>
                  <p className="text-xs text-slate-500 mt-0.5">KG 123 St, Kigali, Rwanda</p>
                  <p className="text-xs text-slate-500">+250 788 000 000 · info@janida.rw</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900">INVOICE</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">#{invoice.invoiceNumber || invoice.orderNumber || invoice.id}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Order: #{invoice.orderNumber || invoice.id}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Date: {new Date().toLocaleDateString("en-RW", { day:"2-digit", month:"long", year:"numeric" })}</p>
                </div>
              </div>

              {/* Bill To / Ship To */}
              <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                  <p className="text-sm font-extrabold text-slate-900">{invoice.customerName}</p>
                  {invoice.momoNumber && <p className="text-xs text-slate-500 mt-1">MoMo: {invoice.momoNumber}</p>}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ship To</p>
                  <p className="text-xs text-slate-700">{invoice.shippingAddr}</p>
                  <p className="text-xs text-slate-500 mt-1">Expected: {invoice.deliveryDate}</p>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="text-left py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                    <th className="text-center py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Unit Price</th>
                    <th className="text-right py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: OrderItem, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-3">
                        <p className="font-semibold text-slate-900">{item.product}</p>
                        {item.sku && <p className="text-xs text-slate-400 font-mono">{item.sku}</p>}
                      </td>
                      <td className="py-3 text-center text-slate-700">{item.quantity}</td>
                      <td className="py-3 text-right text-slate-700">{fmt(item.unitPrice)}</td>
                      <td className="py-3 text-right font-bold text-slate-900">{fmt(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-semibold text-slate-900">{fmt(invoice.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax (0%)</span>
                    <span className="text-slate-400">—</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
                    <span className="text-base font-extrabold text-slate-900">TOTAL DUE</span>
                    <span className="text-xl font-black text-slate-900">{fmt(invoice.totalAmt)}</span>
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Information</p>
                <div className="flex items-center gap-3">
                  {invoice.paymentMode === "cash" && <><Banknote className="w-5 h-5 text-emerald-600" /><div><p className="text-sm font-bold text-slate-900">Cash Payment</p><p className="text-xs text-slate-500">Amount collected at delivery or counter</p></div></>}
                  {invoice.paymentMode === "momo" && <><Smartphone className="w-5 h-5 text-yellow-600" /><div><p className="text-sm font-bold text-slate-900">MoMo Payment</p><p className="text-xs text-slate-500">Number: {invoice.momoNumber}</p></div></>}
                  {invoice.paymentMode === "bank" && <><Building2 className="w-5 h-5 text-blue-600" /><div><p className="text-sm font-bold text-slate-900">Bank Transfer</p><p className="text-xs text-slate-500">Ref: {invoice.bankRef}</p></div></>}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center border-t border-slate-100 pt-5">
                <p className="text-sm font-bold text-slate-700">Thank you for your business!</p>
                <p className="text-xs text-slate-400 mt-1">JANIDA SHOE LTD · TIN: 123-456-789 · www.janida.rw</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ NEW CUSTOMER MODAL ═══════════════ */}
      {showNewCust && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                Register New Customer
              </h3>
              <button onClick={() => setShowNewCust(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input value={newCustForm.name} onChange={e => setNewCustForm({...newCustForm, name: e.target.value})} autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="e.g. Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                  <input value={newCustForm.phone} onChange={e => setNewCustForm({...newCustForm, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="+250..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input type="email" value={newCustForm.email} onChange={e => setNewCustForm({...newCustForm, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" placeholder="@" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Default Address</label>
                <textarea value={newCustForm.address} onChange={e => setNewCustForm({...newCustForm, address: e.target.value})} rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" placeholder="Delivery address..." />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={creatingCust || !newCustForm.name.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                  {creatingCust ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
