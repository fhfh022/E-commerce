"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Loading from "@/components/layout/Loading";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { setProduct } from "@/lib/features/product/productSlice";
import {
  Trash2Icon,
  AlertTriangle,
  Edit3Icon,
  X,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// ปรับ Label เป็นภาษาไทย (ส่วน value เก็บเป็นอังกฤษเหมือนเดิมเพื่อไม่ให้กระทบ Database)
const CATEGORIES = [
  { label: "อัลตร้าบุ๊ก (Ultrabook)", value: "ultrabook" },
  { label: "เกมมิ่ง (Gaming)", value: "gaming" },
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

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Filter & Sort Logic
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredAndSortedProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aOnSale = a.sale_price > 0 && a.sale_price < a.price;
      const bOnSale = b.sale_price > 0 && b.sale_price < b.price;

      if (aOnSale && !bOnSale) return -1;
      if (!aOnSale && bOnSale) return 1;

      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Toggle Stock Logic
  const toggleStock = async (product) => {
    const newStatus = !product.in_stock;

    if (newStatus && (product.stock || 0) <= 0) {
      toast.error("ไม่สามารถเปิดใช้งานได้: สินค้าหมด! กรุณาเพิ่มจำนวนสต็อกก่อน");
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({ in_stock: newStatus })
        .eq("id", product.id);
      if (error) throw error;

      const updatedProducts = products.map((item) =>
        item.id === product.id ? { ...item, in_stock: newStatus } : item
      );
      dispatch(setProduct(updatedProducts));
    } catch (error) {
      toast.error("อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // Delete Logic
  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete.id);
      if (error) throw error;
      const updatedProducts = products.filter(
        (p) => p.id !== productToDelete.id
      );
      dispatch(setProduct(updatedProducts));
      toast.success("ลบสินค้าเรียบร้อยแล้ว");
    } catch (error) {
      toast.error("ลบสินค้าไม่สำเร็จ: " + error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // Edit Logic
  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const formData = new FormData(e.target);
    const stockQuantity = parseInt(formData.get("stock")) || 0;

    let inStockCheckbox = formData.get("in_stock") === "on";
    if (stockQuantity <= 0) {
      inStockCheckbox = false;
    }

    const specsData = {
      processor: formData.get("processor"),
      processor_detail: formData.get("processor_detail"),
      graphics: formData.get("graphics"),
      display_size: formData.get("display_size"),
      display_specs: formData.get("display_specs"),
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

    const updatedData = {
      name: formData.get("name"),
      brand: formData.get("brand"),
      model: formData.get("model"),
      category: formData.get("category"),
      price: parseFloat(formData.get("price")),
      in_stock: inStockCheckbox,
      stock: stockQuantity,
      specs: specsData,
    };

    try {
      const { error } = await supabase
        .from("products")
        .update(updatedData)
        .eq("id", editingProduct.id);

      if (error) throw error;

      const updatedList = products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...updatedData } : p
      );
      dispatch(setProduct(updatedList));

      toast.success("อัปเดตสินค้าเรียบร้อยแล้ว");
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error("อัปเดตไม่สำเร็จ: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            จัดการ <span className="text-slate-500 font-normal">สินค้า</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            พบสินค้าทั้งหมด {filteredAndSortedProducts.length} รายการ
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="ค้นหาจาก ชื่อ, แบรนด์..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-sm transition-all shadow-sm"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
        </div>
      </div>

      {/* ✅ Mobile Card View (แสดงเฉพาะหน้าจอเล็ก) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => {
            const isOnSale = product.sale_price > 0 && product.sale_price < product.price;
            return (
              <div key={product.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
                
                {/* Image & Title */}
                <div className="flex gap-4 mb-4">
                  <div className="relative size-20 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0 p-2">
                    <Image
                      fill
                      className="object-contain"
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.name}
                    />
                    {isOnSale && (
                      <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/product/${product.id}`} className="font-bold text-slate-800 text-sm line-clamp-2 hover:text-blue-600 mb-1">
                      {product.name}
                    </Link>
                    <p className="text-xs text-slate-400 uppercase mb-1">{product.brand} • {product.model}</p>
                    <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{product.category}</span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div>
                    <p className="text-xs text-slate-400">ราคา</p>
                    {isOnSale ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600">{currency}{Number(product.sale_price).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 line-through">{currency}{Number(product.price).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-800">{currency}{Number(product.price).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">สต็อก</p>
                    <span className={`font-bold ${ (product.stock || 0) > 0 ? "text-blue-600" : "text-red-500" }`}>
                      {product.stock || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">สถานะ:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={() => toggleStock(product)}
                        checked={product.in_stock}
                      />
                      <div className={`w-8 h-4 bg-slate-200 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 
                        ${product.in_stock ? "peer-checked:bg-green-500" : ""}
                      `}></div>
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit3Icon size={18} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(product)}
                      className="p-2 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2Icon size={18} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            ไม่พบสินค้าที่ตรงกับ "{searchTerm}"
          </div>
        )}
      </div>

      {/* ✅ Desktop Table View (แสดงเฉพาะหน้าจอใหญ่) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 w-[30%]">
                  สินค้า
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  หมวดหมู่
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  ราคา
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  สต็อก
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  สถานะ
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => {
                  const isOnSale = product.sale_price > 0 && product.sale_price < product.price;

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isOnSale
                          ? "bg-red-50/30 hover:bg-red-50/50"
                          : "hover:bg-slate-50/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex gap-4 items-center">
                          <div className="relative flex-shrink-0 size-12 bg-slate-50 rounded-lg border border-slate-100 p-1">
                            <Image
                              fill
                              className="object-contain p-1"
                              src={product.images?.[0] || "/placeholder.png"}
                              alt={product.name}
                            />
                            {isOnSale && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/product/${product.id}`}
                              className="font-medium text-slate-900 truncate max-w-[200px] block hover:text-blue-600 hover:underline transition-colors"
                            >
                              {product.name}
                            </Link>
                            <p className="text-[10px] text-slate-400 uppercase">
                              {product.brand} • {product.model}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="capitalize font-medium text-slate-700 block">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isOnSale ? (
                          <div className="flex flex-col items-center leading-tight">
                            <span className="font-bold text-red-600">
                              {currency}
                              {Number(product.sale_price).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              {currency}
                              {Number(product.price).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {currency}
                            {Number(product.price).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            (product.stock || 0) > 0
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {product.stock || 0}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            onChange={() => toggleStock(product)}
                            checked={product.in_stock}
                          />
                          <div
                            className={`w-9 h-5 bg-slate-200 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 
                            ${
                              product.in_stock
                                ? "peer-checked:bg-green-500"
                                : ""
                            }
                          `}
                          ></div>
                        </label>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-slate-400 hover:text-blue-600 transition rounded-lg hover:bg-slate-100"
                          >
                            <Edit3Icon size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(product)}
                            className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                          >
                            <Trash2Icon size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    ไม่พบสินค้าที่ตรงกับ "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedProducts.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-slate-600 px-2">
            หน้า {currentPage} จาก {totalPages}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                ลบสินค้า?
              </h3>
              <p className="text-slate-500 mt-2">
                คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
                <span className="font-bold">"{productToDelete?.name}"</span>?
              </p>
              <div className="grid grid-cols-1 gap-3 w-full mt-8">
                <button
                  disabled={isDeleting}
                  onClick={handleDeleteConfirm}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 disabled:opacity-70"
                >
                  {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 active:scale-95"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative my-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  แก้ไขสินค้า
                </h2>
                <p className="text-sm text-slate-500">
                  อัปเดตรายละเอียดข้อมูลจำเพาะ
                </p>
              </div>
            </div>

            <form
              key={editingProduct?.id}
              onSubmit={handleUpdateProduct}
              className="space-y-6"
            >
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    ชื่อสินค้า
                  </label>
                  <input
                    name="name"
                    defaultValue={editingProduct?.name}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    แบรนด์
                  </label>
                  <select
                    name="brand"
                    defaultValue={editingProduct?.brand?.toLowerCase()}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  >
                    {BRANDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    หมวดหมู่
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category?.toLowerCase()}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    รุ่น (Model)
                  </label>
                  <input
                    name="model"
                    defaultValue={editingProduct?.model}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    ราคา ({currency})
                  </label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingProduct?.price}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                    จำนวนสต็อก
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editingProduct?.stock || 0}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 mt-6 sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <input
                    name="in_stock"
                    type="checkbox"
                    defaultChecked={editingProduct?.in_stock}
                    className="size-5 accent-blue-600 cursor-pointer"
                  />
                  <div>
                    <label className="font-bold text-slate-700 block">
                      วางจำหน่าย?
                    </label>
                    <p className="text-xs text-slate-400">
                      หากสต็อกเป็น 0 ระบบจะปิดการใช้งานอัตโนมัติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Specs */}
              <div className="border-t border-slate-100 my-4 pt-4">
                <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{" "}
                  ข้อมูลจำเพาะทางเทคนิค
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Processor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      รุ่น CPU
                    </label>
                    <input
                      name="processor"
                      defaultValue={editingProduct?.specs?.processor}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  {/* ✅ CPU Detail */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      รายละเอียด CPU
                    </label>
                    <input
                      name="processor_detail"
                      defaultValue={editingProduct?.specs?.processor_detail}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Graphics */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      การ์ดจอ (Graphics)
                    </label>
                    <input
                      name="graphics"
                      defaultValue={editingProduct?.specs?.graphics}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Display */}
                  {/* ✅ Display Size */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      ขนาดหน้าจอ
                    </label>
                    <input
                      name="display_size"
                      defaultValue={editingProduct?.specs?.display_size}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  {/* ✅ Display Specs */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      สเปคหน้าจอ
                    </label>
                    <input
                      name="display_specs"
                      defaultValue={
                        editingProduct?.specs?.display_specs ||
                        editingProduct?.specs?.display
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Other Specs (คงเดิม) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      RAM
                    </label>
                    <input
                      name="ram"
                      defaultValue={editingProduct?.specs?.ram}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      พื้นที่เก็บข้อมูล (Storage)
                    </label>
                    <input
                      name="storage"
                      defaultValue={editingProduct?.specs?.storage}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      ระบบปฏิบัติการ (OS)
                    </label>
                    <input
                      name="os"
                      defaultValue={editingProduct?.specs?.os}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      พอร์ตเชื่อมต่อ
                    </label>
                    <input
                      name="ports"
                      defaultValue={editingProduct?.specs?.ports}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      Wireless
                    </label>
                    <input
                      name="wireless"
                      defaultValue={editingProduct?.specs?.wireless}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      Bluetooth
                    </label>
                    <input
                      name="bluetooth"
                      defaultValue={editingProduct?.specs?.bluetooth}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      แบตเตอรี่
                    </label>
                    <input
                      name="battery"
                      defaultValue={editingProduct?.specs?.battery}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      น้ำหนัก
                    </label>
                    <input
                      name="weight"
                      defaultValue={editingProduct?.specs?.weight}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                      เครือข่าย (Network)
                    </label>
                    <input
                      name="network"
                      defaultValue={editingProduct?.specs?.network}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3 mt-4 border-t border-slate-100">
                <div className="flex flex-[2] gap-3">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 transition active:scale-95 disabled:opacity-70"
                  >
                    {isUpdating ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}