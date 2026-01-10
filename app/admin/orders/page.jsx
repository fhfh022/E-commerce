"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import OrderTimer from "@/components/product/OrderTimer";
import { 
    Clock, 
    Calendar,
    AlertCircle, 
    CheckCircle2, 
    ChevronLeft,
    ChevronRight 
} from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const cleanupExpiredOrders = async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString(); 
    try {
        const { error } = await supabase
            .from('orders')
            .update({ 
                status: 'cancelled',
                payment_status: 'not_paid'
            })
            .eq('payment_status', 'pending')
            .neq('status', 'cancelled')
            .lt('created_at', tenMinutesAgo); 

        if (error) console.error("Auto-cancel error:", error);
    } catch (err) {
        console.error("Cleanup failed:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
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
      console.error("Error fetching admin orders:", error);
      toast.error("ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem); 
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      
      if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: status });
      }

      toast.success(`อัปเดตสถานะเป็น ${status} เรียบร้อยแล้ว`);
    } catch (error) {
      console.error("Update error:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
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
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
        <h1 className="text-2xl text-slate-500">
            Admin <span className="text-slate-800 font-bold">Orders</span>
        </h1>
        <p className="text-sm text-slate-400 font-medium">
            แสดง {currentOrders.length} จาก {orders.length} รายการ
        </p>
      </div>
      
      {orders.length === 0 ? (
        <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed text-slate-400">
            <div className="flex justify-center mb-2">
                <AlertCircle size={32} />
            </div>
            ไม่พบรายการคำสั่งซื้อ
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50/80 text-slate-500 text-sm uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                {["ลำดับ", "ลูกค้า", "ยอดรวม", "การชำระเงิน", "สถานะ", "วัน & เวลา"].map((heading, i) => (
                  <th key={i} className="px-6 py-4 text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentOrders.map((order, index) => {
                const isPaid = order.payment_status === "paid";
                const isCancelled = order.status === "cancelled"; // ✅ เช็คสถานะยกเลิก
                const realIndex = indexOfFirstItem + index + 1;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => openModal(order)}
                  >
                    <td className="px-6 py-4 font-mono text-slate-400">
                      #{realIndex}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm leading-tight mb-0.5">
                            {order.user?.name || "ลูกค้าทั่วไป"}
                        </span>
                        <span className="text-sm text-slate-400 font-medium truncate max-w-[150px]">
                            {order.user?.email}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      ${order.total_amount?.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                            {/* ✅ ปรับ Logic การแสดงผล Badge */}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black uppercase border leading-none ${
                                isCancelled 
                                    ? "bg-red-50 text-red-600 border-red-100" // สียกเลิก
                                    : isPaid
                                        ? "bg-green-50 text-green-600 border-green-100"
                                        : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              <span className={`size-1.5 rounded-full ${
                                  isCancelled 
                                    ? "bg-red-500" 
                                    : isPaid 
                                        ? "bg-green-500" 
                                        : "bg-amber-500 animate-pulse"
                              }`}></span>
                              {isCancelled ? "ยกเลิก" : (isPaid ? "ชำระแล้ว" : "รอชำระเงิน")}
                            </span>

                            {!isPaid && !isCancelled && (
                                <div className="w-fit">
                                    <OrderTimer createdAt={order.created_at} onExpire={fetchOrders} />
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-full max-w-[160px] pb-4"> 
                            <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className={`
                                    appearance-none w-full pl-3 pr-8 py-1.5 rounded-md text-xs font-bold outline-none border transition-all cursor-pointer shadow-sm
                                    ${order.status === 'cancelled'
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : !isPaid 
                                            ? "bg-slate-50 text-slate-400 border-slate-100" 
                                            : order.status === 'delivered'
                                                ? "bg-green-50 text-green-700 border-green-200 hover:border-green-300"
                                                : order.status === 'shipped'
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300"
                                                    : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-100"
                                    }
                                `}
                            >
                                <option value="order_placed">ได้รับคำสั่งซื้อ</option>
                                <option value="processing">กำลังดำเนินการ</option>
                                <option value="shipped">จัดส่งแล้ว</option>
                                <option value="delivered">จัดส่งสำเร็จ</option>
                                <option value="cancelled">ยกเลิก</option>
                            </select>
                            
                            <div className="absolute top-1.5 right-2 flex items-center pointer-events-none">
                                <svg className={`size-3 ${order.status === 'cancelled' ? "text-red-300" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            {!isPaid && !isCancelled && (
                                <div className="absolute top-full left-0 text-[10px] text-red-400 font-bold tracking-wide pl-1 uppercase">
                                    รอการชำระเงิน
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(order.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-500 font-medium text-xs ml-0.5">
                          <Clock size={12} />
                          {new Date(order.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })} น.
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

      {/* Pagination UI */}
      {orders.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-8">
            <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <ChevronLeft size={16} />
            </button>
            
            <span className="text-sm font-bold text-slate-600 px-4 bg-white border border-slate-100 rounded-md py-2 shadow-sm">
                หน้า {currentPage} จาก {totalPages}
            </span>

            <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <ChevronRight size={16} />
            </button>
        </div>
      )}

      {/* Modal Detail */}
      {isModalOpen && selectedOrder && (
        <div
          onClick={closeModal}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">รายละเอียดคำสั่งซื้อ</h2>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={14} /> สั่งซื้อเมื่อ {new Date(selectedOrder.created_at).toLocaleString("th-TH")}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${selectedOrder.status === "delivered" ? "bg-green-100 text-green-700" : selectedOrder.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {selectedOrder.status === 'order_placed' && 'ได้รับคำสั่งซื้อ'}
                {selectedOrder.status === 'processing' && 'กำลังดำเนินการ'}
                {selectedOrder.status === 'shipped' && 'จัดส่งแล้ว'}
                {selectedOrder.status === 'delivered' && 'จัดส่งสำเร็จ'}
                {selectedOrder.status === 'cancelled' && 'ยกเลิก'}
                {!['order_placed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(selectedOrder.status) && selectedOrder.status}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">ข้อมูลลูกค้า</h3>
                <p className="font-bold text-slate-800 text-sm">{selectedOrder.user?.name}</p>
                <p className="text-sm text-slate-600">{selectedOrder.user?.email}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">ที่อยู่จัดส่ง</h3>
                <p className="font-bold text-slate-800 text-sm">{selectedOrder.address?.receiver_name}</p>
                <p className="text-sm text-slate-600">{selectedOrder.address?.detail}, {selectedOrder.address?.sub_district}</p>
                <p className="text-sm text-slate-600">{selectedOrder.address?.province}, {selectedOrder.address?.postal_code}</p>
                <p className="text-sm text-slate-600 mt-1">📞 {selectedOrder.address?.phone_number}</p>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-4">รายการสินค้า</h3>
            <div className="space-y-3 mb-8">
              {selectedOrder.order_items?.map((item, i) => {
                const isDiscounted = item.product?.price && item.price_at_time < item.product.price;

                return (
                <div key={i} className="flex items-center gap-4 border border-slate-100 p-3 rounded-xl hover:bg-slate-50 transition">
                  <div className="size-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                    <Image src={item.product?.images?.[0] || "/placeholder.png"} alt="" width={40} height={40} className="object-contain" />
                    {isDiscounted && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{item.product?.name}</p>
                    <p className="text-sm text-slate-500">{item.product?.model}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-bold text-sm ${isDiscounted ? 'text-red-600' : 'text-slate-800'}`}>
                        ${item.price_at_time?.toLocaleString()}
                    </p>
                    {isDiscounted && (
                        <p className="text-xs text-slate-400 line-through">
                            ${item.product?.price?.toLocaleString()}
                        </p>
                    )}
                    <p className="text-sm text-slate-500">จำนวน: {item.quantity}</p>
                  </div>
                </div>
              )})}
            </div>

            {/* ✅ ปรับ Logic การแสดงสถานะการชำระเงินใน Modal */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-400">สถานะการชำระเงิน</p>
                <p className={`font-bold text-sm ${
                    selectedOrder.status === 'cancelled' 
                    ? "text-red-600" 
                    : selectedOrder.payment_status === "paid" 
                        ? "text-green-600" 
                        : "text-slate-600"
                }`}>
                  {selectedOrder.status === 'cancelled' 
                    ? "ยกเลิก" 
                    : selectedOrder.payment_status === "paid" 
                        ? "ชำระเงินแล้ว" 
                        : "รอชำระเงิน"
                  }
                </p>
              </div>
              <div className="text-right">
                {selectedOrder.discount_amount > 0 ? (
                    <>
                        <p className="text-xs text-slate-400 line-through mb-1">
                            ${((selectedOrder.total_amount || 0) + (selectedOrder.discount_amount || 0)).toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 mb-1">ส่วนลด: -${selectedOrder.discount_amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-400">ยอดรวมสุทธิ</p>
                        <p className="text-2xl font-black text-red-600">${selectedOrder.total_amount?.toLocaleString()}</p>
                    </>
                ) : (
                    <>
                         <p className="text-sm text-slate-400">ยอดรวมสุทธิ</p>
                         <p className="text-2xl font-black text-slate-900">${selectedOrder.total_amount?.toLocaleString()}</p>
                    </>
                )}
              </div>
            </div>

            <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-500">✕</button>
          </div>
        </div>
      )}
    </>
  );
}