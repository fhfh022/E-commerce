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
    ChevronRight,
    Eye,
    Search,
    Filter,
    Download,
    RefreshCw,
    MoreVertical,
    Trash2,
    Package,
    Truck,
    CheckCircle,
    X,
    AlertTriangle,
    Loader2
} from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
        // case "paid": return "ชำระเงินแล้ว";
        case "pending": return "รอชำระเงิน";
        case "processing": return "กำลังดำเนินการ";
        case "shipped": return "กำลังจัดส่ง";
        case "delivered": return "จัดส่งสำเร็จ";
        case "cancelled": return "ยกเลิกแล้ว";
        case "not_paid": return "ไม่ได้ชำระเงิน";
        default: return status;
    }
  };

  // ✅ ปรับสี UI ให้ตรงตามโจทย์ (หน้า Admin)
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case "processing": return "bg-purple-100 text-purple-700 border-purple-200"; // 🟣 สีม่วง
        case "shipped": return "bg-yellow-100 text-yellow-700 border-yellow-200"; // 🟡 สีเหลือง
        case "delivered": return "bg-green-100 text-green-700 border-green-200"; // 🟢 สีเขียว
        case "paid": return "bg-green-100 text-green-700 border-green-200";
        case "cancelled": 
        case "not_paid": return "bg-slate-100 text-slate-500 border-slate-200 line-through";
        default: return "bg-orange-100 text-orange-700 border-orange-200"; // สีส้ม
    }
  };

  const getPaymentStatusDisplay = (order) => {
    if (order.status === 'cancelled' || order.payment_status === 'not_paid') {
        return {
            label: "ยกเลิก / ไม่ได้ชำระ",
            className: "bg-red-100 text-red-700 border border-red-200",
            icon: <X size={12} />
        };
    }
    if (order.payment_status === 'paid') {
        return {
            label: "ชำระเงินแล้ว",
            className: "bg-green-100 text-green-700 border border-green-200",
            icon: <CheckCircle2 size={12} />
        };
    }
    return {
        label: "รอชำระเงิน",
        className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        icon: null
    };
  };

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
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          user:users (name, email),
          address:addresses (*), 
          order_items (
            quantity,
            price_at_time,
            product:products (name, price, images)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cleanupExpiredOrders();
    fetchOrders();
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(); 
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (error) throw error;
        toast.success(`อัปเดตสถานะเป็น "${getStatusLabel(newStatus)}" เรียบร้อย`);
        
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }
    } catch (error) {
        console.error("Update status error:", error);
        toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const promptDeleteOrder = (orderId) => {
    setOrderToDelete(orderId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);

    try {
        const { error } = await supabase.from('orders').delete().eq('id', orderToDelete);
        if (error) throw error;

        setOrders(prev => prev.filter(order => order.id !== orderToDelete));
        toast.success("ลบคำสั่งซื้อสำเร็จ");
        setIsDeleteModalOpen(false);
        if (selectedOrder?.id === orderToDelete) closeModal();
        setOrderToDelete(null);

    } catch (error) {
        console.error("Delete error:", error);
        toast.error("ไม่สามารถลบคำสั่งซื้อได้");
    } finally {
        setIsDeleting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        order.user?.name?.toLowerCase().includes(searchLower) ||
        order.user?.email?.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <PageTitle heading="จัดการคำสั่งซื้อ" text="ตรวจสอบและจัดการรายการสั่งซื้อของลูกค้า" />
        <div className="flex gap-2">
            <button onClick={fetchOrders} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500">
                <RefreshCw size={20} />
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-500">
                <Download size={20} />
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ หรือชื่อลูกค้า..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex gap-4">
            <div className="relative min-w-[180px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition appearance-none cursor-pointer"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">สถานะทั้งหมด</option>
                    <option value="pending">รอชำระเงิน</option>
                    {/* <option value="paid">ชำระเงินแล้ว</option> */}
                    <option value="processing">กำลังดำเนินการ</option>
                    <option value="shipped">กำลังจัดส่ง</option>
                    <option value="delivered">จัดส่งสำเร็จ</option>
                    <option value="cancelled">ยกเลิกแล้ว</option>
                </select>
            </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">รหัสคำสั่งซื้อ</th>
                <th className="px-6 py-4">ลูกค้า</th>
                <th className="px-6 py-4">วันที่</th>
                <th className="px-6 py-4 text-center">ยอดรวม</th>
                <th className="px-6 py-4 text-center">การชำระเงิน</th>
                <th className="px-6 py-4 text-center">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => {
                  const paymentStatus = getPaymentStatusDisplay(order);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-slate-700">#{order.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{order.user?.name || "Guest"}</span>
                            <span className="text-xs text-slate-400">{order.user?.email}</span>
                        </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400"/>
                                {new Date(order.created_at).toLocaleDateString('th-TH')}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <Clock size={12} />
                                {new Date(order.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit', hour12: false})}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                        ฿{order.total_amount?.toLocaleString()}
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${paymentStatus.className}`}>
                                {paymentStatus.icon}
                                {paymentStatus.label}
                            </span>
                        </td>

                        <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => openModal(order)}
                                    className="p-2 text-slate-400 hover:text-blue-600 transition rounded-lg hover:bg-slate-100"
                                    title="ดูรายละเอียด / แก้ไขสถานะ"
                                >
                                    <Eye size={18} />
                                </button>
                                <button 
                                    onClick={() => promptDeleteOrder(order.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                                    title="ลบคำสั่งซื้อ"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <AlertCircle size={32} className="text-slate-300" />
                        </div>
                        <p>ไม่พบรายการคำสั่งซื้อ</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                    แสดง {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} จาก {filteredOrders.length}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => paginate(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => paginate(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        )}
      </div>

      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">รายละเอียดคำสั่งซื้อ</h2>
                    <p className="text-sm text-slate-500 font-mono mt-1">#{selectedOrder.id}</p>
                </div>
                
                <div className="flex gap-3 items-start">
                    <div className="flex flex-col items-end">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">เปลี่ยนสถานะ</label>
                        <select 
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition ${getStatusColor(selectedOrder.status)}`}
                            value={selectedOrder.status}
                            onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                        >
                            <option value="pending">รอชำระเงิน</option>
                            {/* <option value="paid">ชำระเงินแล้ว</option> */}
                            <option value="processing">กำลังดำเนินการ</option>
                            <option value="shipped">กำลังจัดส่ง</option>
                            <option value="delivered">จัดส่งสำเร็จ</option>
                            <option value="cancelled">ยกเลิกแล้ว</option>
                        </select>
                    </div>

                    <button onClick={closeModal} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition text-slate-500 mt-1">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {selectedOrder.payment_status === 'pending' && selectedOrder.status !== 'cancelled' && (
               <div className="mb-6">
                   <OrderTimer createdAt={selectedOrder.created_at} />
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> ข้อมูลลูกค้า
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-bold text-slate-500 w-20 inline-block">ชื่อ:</span> {selectedOrder.address?.receiver_name || selectedOrder.user?.name}</p>
                        <p><span className="font-bold text-slate-500 w-20 inline-block">เบอร์โทร:</span> {selectedOrder.address?.phone_number || "-"}</p>
                        <p><span className="font-bold text-slate-500 w-20 inline-block">อีเมล:</span> {selectedOrder.user?.email}</p>
                        <hr className="border-slate-200 my-2" />
                        <p className="font-bold text-slate-500 mb-1">ที่อยู่จัดส่ง:</p>
                        <p className="leading-relaxed text-slate-700 bg-white p-2 rounded border border-slate-200">
                            {selectedOrder.address?.detail ? `${selectedOrder.address.detail} ` : ""}
                            {selectedOrder.address?.sub_district ? `ต.${selectedOrder.address.sub_district} ` : ""}
                            {selectedOrder.address?.district ? `อ.${selectedOrder.address.district} ` : ""}
                            {selectedOrder.address?.province ? `จ.${selectedOrder.address.province} ` : ""}
                            {selectedOrder.address?.postal_code || ""}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> ข้อมูลการสั่งซื้อ
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-bold text-slate-500 w-24 inline-block">วันที่:</span> {new Date(selectedOrder.created_at).toLocaleDateString('th-TH')}</p>
                        <p><span className="font-bold text-slate-500 w-24 inline-block">เวลา:</span> {new Date(selectedOrder.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit', hour12: false})}</p>
                        <p><span className="font-bold text-slate-500 w-24 inline-block">วิธีชำระ:</span> {selectedOrder.payment_method?.toUpperCase() || "N/A"}</p>
                        
                        <p><span className="font-bold text-slate-500 w-24 inline-block">สถานะการเงิน:</span> 
                            <span className={`font-bold ${
                                selectedOrder.status === 'cancelled' || selectedOrder.payment_status === 'not_paid'
                                ? 'text-red-600' 
                                : selectedOrder.payment_status === 'paid' 
                                    ? 'text-green-600' 
                                    : 'text-yellow-600'
                            }`}>
                                {selectedOrder.status === 'cancelled' || selectedOrder.payment_status === 'not_paid'
                                    ? "ยกเลิก / ไม่ได้ชำระ" 
                                    : selectedOrder.payment_status === "paid" 
                                        ? "ชำระเงินแล้ว" 
                                        : "รอชำระเงิน"
                                }
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">รายการสินค้า</h3>
              {selectedOrder.order_items?.map((item, index) => {
                const itemPrice = item.price_at_time || item.product?.price;
                return (
                <div key={index} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <Image 
                        src={item.product?.images?.[0] || "/placeholder.png"} 
                        alt={item.product?.name || "Product"} 
                        width={40} 
                        height={40} 
                        className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{item.product?.name || "Unknown Product"}</p>
                    <p className="text-xs text-slate-500">ราคาต่อชิ้น: ฿{itemPrice?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">฿{(itemPrice * item.quantity).toLocaleString()}</p>
                    {item.product?.price > itemPrice && (
                        <p className="text-xs text-slate-400 line-through">
                            ฿{item.product?.price?.toLocaleString()}
                        </p>
                    )}
                    <p className="text-sm text-slate-500">จำนวน: {item.quantity}</p>
                  </div>
                </div>
              )})}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-400">สถานะการชำระเงิน</p>
                <p className={`font-bold text-sm ${
                    selectedOrder.status === 'cancelled' || selectedOrder.payment_status === 'not_paid'
                    ? 'text-red-600' 
                    : selectedOrder.payment_status === "paid" 
                        ? "text-green-600" 
                        : "text-yellow-600"
                }`}>
                  {selectedOrder.status === 'cancelled' || selectedOrder.payment_status === 'not_paid'
                    ? "ยกเลิก / ไม่ได้ชำระ" 
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

          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                ลบคำสั่งซื้อ?
              </h3>
              <p className="text-slate-500 mt-2">
                คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อนี้?<br/>การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="grid grid-cols-1 gap-3 w-full mt-8">
                <button
                  disabled={isDeleting}
                  onClick={confirmDeleteOrder}
                  className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : "ยืนยันการลบ"}
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

    </div>
  );
}