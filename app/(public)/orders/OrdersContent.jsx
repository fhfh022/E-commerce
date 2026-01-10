"use client";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/layout/Loading";
import OrderItem from "@/components/product/OrderItem"; // ✅ เรียกใช้ Item
import { Package, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 5;

export default function OrdersContent() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(`
            *,
            address:addresses(*),
            order_items (
                id,
                quantity,
                price_at_time,
                product:products (id, name, images, price, model) 
            )
        `, { count: "exact" }) // ✅ Query นี้สำคัญ (ต้องมี model)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setOrders(data || []);
      setTotalOrders(count || 0);
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [user, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  if (loading && orders.length === 0) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 min-h-[60vh] animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">รายการสั่งซื้อทั้งหมด</h1>
      <p className="text-slate-500 mb-8">ประวัติการสั่งซื้อและสถานะสินค้า</p>

      {orders.length === 0 && !loading ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
            <Package size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">ไม่พบรายการสั่งซื้อ</h3>
          <p className="text-slate-400 mb-6">ดูเหมือนคุณจะยังไม่มีการสั่งซื้อสินค้าใดๆ ยัง</p>
          <button 
            onClick={() => router.push('/shop')}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-200 font-medium"
          >
            เริ่มช้อปปิ้งกันเถอะ!
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ✅ เรียกใช้ OrderItem แทนการเขียน Code ยาวๆ */}
          {orders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}

          {/* Pagination Controls */}
          {totalOrders > ITEMS_PER_PAGE && (
            <div className="flex justify-center items-center gap-4 mt-10 pt-6 border-t border-slate-100">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-sm"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>

              <span className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-sm"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}