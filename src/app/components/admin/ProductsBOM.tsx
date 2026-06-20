import { useEffect, useState } from "react";
import { Layout } from "../Layout";
import {
  Search, Loader2, ChevronLeft, ChevronRight, Plus, X, Trash2, ArrowLeft, PlusCircle
} from "lucide-react";
import { adminApi } from "../../services/adminApi";

export function ProductsBOM() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [productPagination, setProductPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // BOM Items
  const [bomItems, setBomItems] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);

  const fetchProducts = async (page = productPagination.page) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(page), limit: String(productPagination.limit) };
      if (productSearch) params.search = productSearch;
      const data = await adminApi.listProducts(params);
      setProducts(data.products || []);
      setProductPagination(data.pagination || { page, limit: 25, total: 0 });
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const data = await adminApi.listRawMaterials();
      setRawMaterials(data.materials || []);
    } catch {}
  };

  useEffect(() => {
    fetchProducts(1);
    fetchRawMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    try {
      await adminApi.createProduct(newProductName.trim());
      setNewProductName("");
      setShowAddProduct(false);
      fetchProducts();
    } catch (err: any) {
      setError(err?.message || "Create product failed");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await adminApi.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      setError(err?.message || "Delete product failed");
    }
  };

  const handleAddBomItem = async (productId: string, rawMaterialId: string, quantity: string) => {
    try {
      await adminApi.addBomItem(productId, rawMaterialId, Number(quantity));
      const data = await adminApi.getBomForProduct(productId);
      setBomItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Add BOM item failed");
    }
  };

  const handleRemoveBomItem = async (bomId: string, productId: string) => {
    if (!window.confirm("Remove this BOM item?")) return;
    try {
      await adminApi.removeBomItem(bomId);
      const data = await adminApi.getBomForProduct(productId);
      setBomItems(data.items || []);
    } catch (err: any) {
      setError(err?.message || "Remove BOM item failed");
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products & BOM Configuration</h1>
          <p className="text-slate-600 text-sm mt-1">Configure shoe catalogs and assign the raw material Bill of Materials per pair</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm flex items-center gap-2">
            <X className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {!selectedProduct ? (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchProducts(1)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                onClick={() => fetchProducts(1)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-12 text-slate-500">No products found in catalog.</div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Product Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date Created</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  setSelectedProduct(p);
                                  setLoading(true);
                                  try {
                                    const d = await adminApi.getBomForProduct(p.id);
                                    setBomItems(d.items || []);
                                  } catch (err: any) {
                                    setError(err.message);
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                              >
                                View BOM
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-600">Showing {products.length} of {productPagination.total} products</p>
                  <div className="flex gap-2">
                    <button
                      disabled={productPagination.page <= 1}
                      onClick={() => fetchProducts(productPagination.page - 1)}
                      className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-slate-700">Page {productPagination.page}</span>
                    <button
                      disabled={productPagination.page * productPagination.limit >= productPagination.total}
                      onClick={() => fetchProducts(productPagination.page + 1)}
                      className="px-3 py-2 bg-slate-100 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedProduct.name}</h2>
                  <p className="text-sm text-slate-500">Bill of Materials Configuration</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Add Material Component</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  id="bom-mat"
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select raw material</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.material_code}) — {m.unit}
                    </option>
                  ))}
                </select>
                <input
                  id="bom-qty"
                  type="number"
                  step="0.001"
                  placeholder="Quantity per pair"
                  className="w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const mat = (document.getElementById("bom-mat") as HTMLSelectElement)?.value;
                    const qty = (document.getElementById("bom-qty") as HTMLInputElement)?.value;
                    if (mat && qty) {
                      handleAddBomItem(selectedProduct.id, mat, qty);
                      (document.getElementById("bom-qty") as HTMLInputElement).value = "";
                    }
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Add Component
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}

            {!loading && bomItems.length === 0 && (
              <div className="text-center py-12 text-slate-500">No BOM items configured for this product.</div>
            )}

            {!loading && bomItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Material Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Material Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Qty/Pair</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{item.material_code}</td>
                        <td className="py-3 px-4 text-slate-900 font-semibold">{item.quantity_per_pair}</td>
                        <td className="py-3 px-4 text-slate-600">{item.unit}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleRemoveBomItem(item.id, selectedProduct.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Product name (e.g. Air Runner V2)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateProduct}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
