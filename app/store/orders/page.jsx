"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import { 
    Clock, 
    Calendar,
    AlertCircle, 
    CheckCircle2, 
    XCircle 
} from "lucide-react";

export default function StoreOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ 1. ฟังก์ชันสำหรับลบออเดอร์ที่หมดเวลา (เกิน 10 นาทีแล้วยังไม่จ่าย)
  const cleanupExpiredOrders = async () => {
    // คำนวณเวลา 10 นาทีที่แล้ว
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString(); 

    try {
        // ลบออเดอร์ที่ยังเป็น pending และสร้างมานานกว่า 10 นาที
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('payment_status', 'pending')
            .lt('created_at', tenMinutesAgo); // created_at น้อยกว่า (เก่ากว่า) 10 นาทีที่แล้ว

        if (error) console.error("Auto-delete error:", error);
    } catch (err) {
        console.error("Cleanup failed:", err);
    }
  };

  // ดึงข้อมูล Orders ทั้งหมด (Admin View)
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // ✅ เรียก Cleanup ก่อนดึงข้อมูลเสมอ เพื่อให้ได้ข้อมูลที่อัปเดตล่าสุด
      await cleanupExpiredOrders();

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          user:users(name, email),
          address:addresses(*),
          order_items:order_items(
            *,
            product:products(*)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching store orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // อัปเดตสถานะ Order
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: status })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: status } : order
        )
      );
      
      // อัปเดตใน Modal ด้วยถ้าเปิดอยู่
      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: status });
      }

      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update status");
    }
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchOrders();
    
    // (Optional) ตั้ง Interval ให้เช็คทุกๆ 1 นาที เผื่อเปิดหน้าค้างไว้ จะได้ลบออเดอร์เก่าทิ้งเรื่อยๆ
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <h1 className="text-2xl text-slate-500 mb-5">
        Store <span className="text-slate-800 font-medium">Orders</span>
      </h1>
      
      {orders.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 rounded-lg border border-dashed text-slate-400">
            <div className="flex justify-center mb-2">
                <AlertCircle size={32} />
            </div>
            No active orders found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                {["No.", "Customer", "Total", "Payment", "Status", "Date & Time"].map((heading, i) => (
                  <th key={i} className="px-6 py-4">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order, index) => {
                // ✅ เช็คว่าจ่ายเงินหรือยัง
                const isPaid = order.payment_status === "paid";

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openModal(order)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {order.user?.name || "Guest"}
                      </p>
                      <p className="text-xs text-slate-400">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${order.total_amount?.toLocaleString()}
                    </td>

                    {/* ✅ เพิ่มช่อง Payment Status ให้เห็นชัดเจน */}
                    <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            isPaid
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {order.payment_status}
                        </span>
                    </td>

                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                            <select
                                value={order.status}
                                // ✅ LOGIC: ถ้ายังไม่จ่าย (pending) ให้ disable (ล็อคปุ่ม)
                                disabled={!isPaid} 
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className={`
                                    border-0 rounded-full px-3 py-1 text-xs font-bold uppercase cursor-pointer outline-none ring-1 ring-inset w-full
                                    ${!isPaid ? "cursor-not-allowed opacity-60 bg-slate-100 text-slate-400 ring-slate-200" : ""}
                                    ${isPaid && order.status === "processing" ? "bg-blue-50 text-blue-700 ring-blue-200" : ""}
                                    ${isPaid && order.status === "shipped" ? "bg-yellow-50 text-yellow-700 ring-yellow-200" : ""}
                                    ${isPaid && order.status === "delivered" ? "bg-green-50 text-green-700 ring-green-200" : ""}
                                    ${isPaid && order.status === "cancelled" ? "bg-red-50 text-red-700 ring-red-200" : ""}
                                `}
                            >
                                <option value="order_placed" hidden={isPaid ? true : false}>Placed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            
                            {/* แสดงข้อความเตือนถ้ายังไม่จ่าย */}
                            {!isPaid && (
                                <div className="text-[10px] text-red-400 mt-1 font-medium flex items-center gap-1 justify-center">
                                    Wait payment
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(order.created_at).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold">
                          <Clock size={12} />
                          {new Date(order.created_at).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )}{" "}
                          น.
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail (เหมือนเดิม) */}
      {isModalOpen && selectedOrder && (
        <div
          onClick={closeModal}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Order Details
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={12} /> Ordered on{" "}
                  {new Date(selectedOrder.created_at).toLocaleString("th-TH")}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedOrder.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {selectedOrder.status}
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Customer
                </h3>
                <p className="font-bold text-slate-800">
                  {selectedOrder.user?.name}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedOrder.user?.email}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
                  Shipping Address
                </h3>
                <p className="font-bold text-slate-800">
                  {selectedOrder.address?.receiver_name}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedOrder.address?.detail},{" "}
                  {selectedOrder.address?.sub_district}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedOrder.address?.province},{" "}
                  {selectedOrder.address?.postal_code}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  📞 {selectedOrder.address?.phone_number}
                </p>
              </div>
            </div>

            {/* Products List */}
            <h3 className="font-bold text-slate-800 mb-4">Items Ordered</h3>
            <div className="space-y-3 mb-8">
              {selectedOrder.order_items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="size-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src={item.product?.images?.[0] || "/placeholder.png"}
                      alt=""
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.product?.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">
                      ${item.price_at_time?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Payment Status</p>
                <p
                  className={`font-bold ${
                    selectedOrder.payment_status === "paid"
                      ? "text-green-600"
                      : "text-slate-600"
                  }`}
                >
                  {selectedOrder.payment_status?.toUpperCase() || "PENDING"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Amount</p>
                <p className="text-2xl font-black text-slate-900">
                  ${selectedOrder.total_amount?.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-500"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}