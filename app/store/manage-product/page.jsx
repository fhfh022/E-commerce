"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Loading from "@/components/layout/Loading";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { setProduct } from "@/lib/features/product/productSlice";
import { Trash2Icon, AlertTriangle, Edit3Icon, X, Package, Check } from "lucide-react";

// ✅ ตัวเลือก Dropdown
const CATEGORIES = [
  { label: "Ultrabook", value: "ultrabook" },
  { label: "Gaming", value: "gaming" },
];

const BRANDS = [
  { label: "Asus", value: "asus" },
  { label: "Acer", value: "acer" },
  { label: "HP", value: "hp" },
  { label: "Lenovo", value: "lenovo" },
  { label: "MSI", value: "msi" },
  { label: "Gigabyte", value: "gigabyte" },
];

export default function StoreManageProducts() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const dispatch = useDispatch();

  const products = useSelector((state) => state.product.list);
  const [loading, setLoading] = useState(products.length === 0);

  // States: Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Products
  const fetchProductsFromDB = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) dispatch(setProduct(data));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length === 0) {
      fetchProductsFromDB();
    } else {
      setLoading(false);
    }
  }, []);

  // 2. Toggle Stock
  const toggleStock = async (productId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const { error } = await supabase.from("products").update({ in_stock: newStatus }).eq("id", productId);
      if (error) throw error;
      const updatedProducts = products.map((item) =>
        item.id === productId ? { ...item, in_stock: newStatus } : item
      );
      dispatch(setProduct(updatedProducts));
      return "Stock updated";
    } catch (error) {
      throw new Error("Failed to update");
    }
  };

  // 3. Delete Logic
  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", productToDelete.id);
      if (error) throw error;
      const updatedProducts = products.filter((p) => p.id !== productToDelete.id);
      dispatch(setProduct(updatedProducts));
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete: " + error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // 4. Edit Logic
  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const formData = new FormData(e.target);
    const inStock = formData.get("in_stock") === "on";

    // ✅ รวบรวมข้อมูล Specs (JSON)
    const specsData = {
        processor: formData.get("processor"),
        graphics: formData.get("graphics"),
        display: formData.get("display"),
        ram: formData.get("ram"),
        storage: formData.get("storage"),
        ports: formData.get("ports"),
        wireless: formData.get("wireless"),
        bluetooth: formData.get("bluetooth"),
        network: formData.get("network"),
        battery: formData.get("battery"),
        os: formData.get("os"),
        weight: formData.get("weight"),
    };

    // ✅ รวบรวมข้อมูลหลัก
    const updatedData = {
        name: formData.get("name"),
        brand: formData.get("brand"), // ค่าจาก Select
        model: formData.get("model"),
        category: formData.get("category"), // ค่าจาก Select
        price: parseFloat(formData.get("price")),
        in_stock: inStock,
        specs: specsData // ส่ง JSON เข้าไปใน column specs
    };

    try {
      const { error } = await supabase
        .from("products")
        .update(updatedData)
        .eq("id", editingProduct.id);

      if (error) throw error;

      // Update Redux
      const updatedList = products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...updatedData } : p
      );
      dispatch(setProduct(updatedList));

      toast.success("Product updated successfully");
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("Failed to update: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">
          Manage <span className="text-slate-500 font-normal">Products</span>
        </h1>
       
      </div>

      {/* Mobile View (Cards) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative size-20 bg-[#F5F5F5] rounded-xl flex-shrink-0 p-2">
                <Image fill className="object-contain p-1" src={product.images?.[0] || "/placeholder.png"} alt={product.name} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 truncate pr-2">{product.name}</h3>
                <p className="text-xs text-slate-500 uppercase mt-1">{product.brand} | {product.model}</p>
                <p className="text-blue-600 font-bold mt-2">{currency}{Number(product.price).toLocaleString()}</p>
              </div>
            </div>
            <div className="h-px bg-slate-50 w-full"></div>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg">
                    <span className="text-xs font-bold text-slate-500 uppercase">Stock</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id, product.in_stock), { loading: "Updating...", success: (msg) => msg, error: (err) => err.message })} checked={product.in_stock} />
                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(product)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-100 rounded-lg shadow-sm active:scale-95 transition"><Edit3Icon size={18} /></button>
                    <button onClick={() => openDeleteModal(product)} className="p-2 text-red-500 hover:text-red-600 bg-red-50 border border-red-100 rounded-lg shadow-sm active:scale-95 transition"><Trash2Icon size={18} /></button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 w-[35%]">Product</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Category & Model</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Specs</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Price</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">In Stock</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-shrink-0 size-12 bg-slate-50 rounded-lg border border-slate-100 p-1">
                        <Image fill className="object-contain p-1" src={product.images?.[0] || "/placeholder.png"} alt={product.name} />
                      </div>
                      <div className="min-w-0">
                         <p className="font-medium text-slate-900 truncate max-w-[200px]">{product.name}</p>
                         <p className="text-[10px] text-slate-400 uppercase">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="capitalize font-medium text-slate-700 block">{product.category}</span>
                    <span className="text-xs uppercase text-slate-400">{product.model}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate">
                    {product.specs?.processor || "-"} / {product.specs?.ram || "-"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{currency}{Number(product.price).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id, product.in_stock), { loading: "Updating...", success: (msg) => msg, error: (err) => err.message })} checked={product.in_stock} />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(product)} className="p-2 text-slate-400 hover:text-blue-600 transition rounded-lg hover:bg-slate-100"><Edit3Icon size={18} /></button>
                      <button onClick={() => openDeleteModal(product)} className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"><Trash2Icon size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
             {/* ... (เนื้อหา Delete Modal เหมือนเดิม) ... */}
             <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={36} /></div>
              <h3 className="text-2xl font-black text-slate-900">Delete Product?</h3>
              <p className="text-slate-500 mt-2">Sure you want to delete <span className="font-bold">"{productToDelete?.name}"</span>?</p>
              <div className="grid grid-cols-1 gap-3 w-full mt-8">
                <button disabled={isDeleting} onClick={handleDeleteConfirm} className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 disabled:opacity-70">{isDeleting ? "Deleting..." : "Yes, Delete it"}</button>
                <button disabled={isDeleting} onClick={() => setIsDeleteModalOpen(false)} className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 active:scale-95">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit Modal (Complete Fields) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative my-auto">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition"><X size={20}/></button>

                <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Package size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Edit Product</h2>
                        <p className="text-sm text-slate-500">Update detailed specifications</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProduct} className="space-y-6">
                    {/* Main Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Product Name</label>
                            <input name="name" defaultValue={editingProduct?.name} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Brand</label>
                            <select name="brand" defaultValue={editingProduct?.brand?.toLowerCase()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800">
                                {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Category</label>
                            <select name="category" defaultValue={editingProduct?.category?.toLowerCase()} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800">
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Model</label>
                            <input name="model" defaultValue={editingProduct?.model} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Price ({currency})</label>
                            <input name="price" type="number" defaultValue={editingProduct?.price} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800" required />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-4 pt-4">
                        <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Technical Specifications
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* Processor */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Processor</label>
                                <input name="processor" defaultValue={editingProduct?.specs?.processor} placeholder="e.g. Intel Core i9" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                             {/* Graphics */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Graphics Card</label>
                                <input name="graphics" defaultValue={editingProduct?.specs?.graphics} placeholder="e.g. RTX 4080" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* RAM */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">RAM</label>
                                <input name="ram" defaultValue={editingProduct?.specs?.ram} placeholder="e.g. 32GB DDR5" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* Storage */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Storage</label>
                                <input name="storage" defaultValue={editingProduct?.specs?.storage} placeholder="e.g. 1TB SSD" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* Display */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Display</label>
                                <input name="display" defaultValue={editingProduct?.specs?.display} placeholder="e.g. 16-inch OLED" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* OS */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">OS</label>
                                <input name="os" defaultValue={editingProduct?.specs?.os} placeholder="e.g. Windows 11" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* Ports */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Ports</label>
                                <input name="ports" defaultValue={editingProduct?.specs?.ports} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                             {/* Wireless */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Wireless</label>
                                <input name="wireless" defaultValue={editingProduct?.specs?.wireless} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                             {/* Bluetooth */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Bluetooth</label>
                                <input name="bluetooth" defaultValue={editingProduct?.specs?.bluetooth} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                             {/* Battery */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Battery</label>
                                <input name="battery" defaultValue={editingProduct?.specs?.battery} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                            {/* Weight */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Weight</label>
                                <input name="weight" defaultValue={editingProduct?.specs?.weight} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                             {/* Network */}
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Network</label>
                                <input name="network" defaultValue={editingProduct?.specs?.network} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 mt-4 border-t border-slate-100">
                        
                        <div className="flex flex-[2] gap-3">
                            <button type="submit" disabled={isUpdating} className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition active:scale-95 disabled:opacity-70">
                                {isUpdating ? "Saving..." : "Save Update"}
                            </button>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}