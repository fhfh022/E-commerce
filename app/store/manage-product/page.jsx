"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Loading from "@/components/layout/Loading";
import { useDispatch, useSelector } from "react-redux"; // [เพิ่ม]
import { supabase } from "@/lib/supabase"; // [เพิ่ม]
import { setProduct } from "@/lib/features/product/productSlice"; // [เพิ่ม]

export default function StoreManageProducts() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const dispatch = useDispatch();

  // ดึงข้อมูลสินค้าจาก Redux Store แทน State ท้องถิ่น
  const products = useSelector((state) => state.product.list);
  const [loading, setLoading] = useState(products.length === 0);

  // ฟังก์ชันดึงข้อมูลใหม่เพื่อ Refresh Store
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

  // ฟังก์ชันสลับสถานะสต็อกใน Database
  const toggleStock = async (productId, currentStatus) => {
    // กำหนดค่าใหม่ที่จะเปลี่ยน
    const newStatus = !currentStatus;

    try {
      // 1. อัปเดตข้อมูลที่ Supabase
      const { error } = await supabase
        .from("products")
        .update({ in_stock: newStatus }) // ใช้ชื่อคอลัมน์ in_stock ตาม Schema
        .eq("id", productId);

      if (error) throw error;

      // 2. อัปเดตข้อมูลใน Redux Store ทันทีเพื่อให้ UI เปลี่ยนตามโดยไม่ต้องโหลดหน้าใหม่
      // โดยการ Map สินค้าตัวที่ถูกแก้ไขในรายการเดิม
      const updatedProducts = products.map((item) =>
        item.id === productId ? { ...item, in_stock: newStatus } : item
      );

      dispatch(setProduct(updatedProducts));

      return "Status updated successfully!";
    } catch (error) {
      console.error("Update Error:", error.message);
      throw new Error("Failed to update stock status");
    }
  };

  useEffect(() => {
    // ถ้าใน Store ยังไม่มีข้อมูล ให้ดึงใหม่
    if (products.length === 0) {
      fetchProductsFromDB();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-2xl font-semibold text-slate-800">
          Manage <span className="text-slate-500 font-normal">Products</span>
        </h1>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 w-[40%]">
                  Product
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 hidden lg:table-cell">
                  Brand & Model
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700">
                  Price
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">
                  In Stock
                </th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-shrink-0 size-14 bg-slate-50 rounded-lg border border-slate-100 p-1.5">
                        <Image
                          fill
                          className="object-contain p-1"
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.name}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 lg:hidden truncate">
                          {product.brand} • {product.model}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-slate-600 font-normal">
                    <span className="capitalize">{product.brand}</span>
                    <span className="text-slate-400 mx-1.5">—</span>
                    <span className="text-xs uppercase tracking-tight">
                      {product.model}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    {currency}
                    {Number(product.price).toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          // ส่งค่า id และสถานะปัจจุบัน (in_stock) เข้าไป
                          onChange={() =>
                            toast.promise(
                              toggleStock(product.id, product.in_stock),
                              {
                                loading: "Updating stock...",
                                success: (msg) => msg,
                                error: (err) => err.message,
                              }
                            )
                          }
                          checked={product.in_stock} // ผูกสถานะ checkbox กับข้อมูลใน Redux
                        />
                        {/* UI ของ Toggle Switch */}
                        <div
                          className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:bg-green-500 transition-all 
                after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full 
                after:h-4.5 after:w-4.5 after:transition-all peer-checked:after:translate-x-4.5 shadow-inner"
                        ></div>
                      </label>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 font-medium">
                      <button className="text-slate-600 hover:text-blue-600 transition-colors">
                        Edit
                      </button>
                      <span className="text-slate-200">|</span>
                      <button className="text-red-500 hover:text-red-700 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <p className="text-lg">No products available</p>
            <p className="text-sm">Click "+ Add New Product" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
