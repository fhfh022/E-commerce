'use client'
import Image from "next/image";
import { DotIcon, CreditCard, Trash2 } from "lucide-react"; // เพิ่ม Icon
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import toast from "react-hot-toast"; // เพิ่ม Toast
import { supabase } from "@/lib/supabase"; // เพิ่ม Supabase

const OrderItem = ({ order }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);
    const { ratings } = useSelector(state => state.rating);
    const user = useSelector(state => state.auth.user); // ดึง User เพื่อใช้ Email
    const [isActionLoading, setIsActionLoading] = useState(false); // State สำหรับ Loading ปุ่ม

    const addr = order.address || {};

    // ✅ ฟังก์ชันจ่ายเงิน (เรียก Stripe)
    const handlePayNow = async () => {
        setIsActionLoading(true);
        try {
            // สร้าง items array ในรูปแบบที่ API Checkout ต้องการ
            const checkoutItems = order.order_items.map(item => ({
                product: item.product, // API ต้องการ object product ที่มี name, images
                quantity: item.quantity,
                price: item.price_at_time // ใช้ราคาตอนที่สั่งซื้อ
            }));

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: checkoutItems,
                    orderId: order.id,
                    userEmail: user?.email,
                    discountAmount: order.discount_amount || 0 // ส่งส่วนลดไปด้วยถ้ามี
                }),
            });

            const { url, error } = await response.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error(error || "Payment initiation failed");
            }

        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Failed to initiate payment");
        } finally {
            setIsActionLoading(false);
        }
    };

    // ✅ ฟังก์ชันยกเลิกออเดอร์ (ลบ)
    const handleCancelOrder = async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);

            if (error) throw error;

            toast.success("Order cancelled successfully");
            window.location.reload(); // Refresh หน้าจอเพื่อลบรายการออก

        } catch (error) {
            console.error("Cancel Error:", error);
            toast.error("Failed to cancel order");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <>
            <tr className="text-sm shadow-sm bg-white rounded-lg">
                <td className="text-left p-4">
                    <div className="flex flex-col gap-6">
                        {order.order_items?.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0">
                                    <Image
                                        className="h-14 w-auto object-contain"
                                        src={item.product?.images?.[0] || '/placeholder.png'}
                                        alt="product_img"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                                <div className="flex flex-col justify-center text-sm">
                                    <p className="font-medium text-slate-600 text-base">{item.product?.name}</p>
                                    <p>{currency}{Number(item.price_at_time || item.product?.price).toLocaleString()} | Qty: {item.quantity}</p>
                                    <p className="text-xs text-slate-400 mb-1">{new Date(order.created_at).toDateString()}</p>
                                    
                                    {/* ส่วน Rating (เหมือนเดิม) */}
                                    <div>
                                        {ratings.find(rating => order.id === rating.orderId && item.product?.id === rating.productId)
                                            ? (
                                                <div className="flex flex-col gap-1">
                                                    <Rating value={ratings.find(r => order.id === r.orderId && item.product?.id === r.productId).rating} />
                                                    <button 
                                                        onClick={() => setRatingModal({ orderId: order.id, productId: item.product?.id })}
                                                        className="text-[10px] text-blue-600 hover:underline font-bold text-left"
                                                    >
                                                        Edit Review
                                                    </button>
                                                </div>
                                            )
                                            : (
                                                <button 
                                                    onClick={() => setRatingModal({ orderId: order.id, productId: item.product?.id })} 
                                                    className={`text-xs font-medium text-green-600 hover:text-green-700 hover:underline transition ${order.status !== "delivered" && 'hidden'}`}
                                                >
                                                    Rate Product
                                                </button>
                                            )
                                        }
                                    </div>
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </td>

                <td className="text-center font-semibold text-slate-700 max-md:hidden align-top pt-8">
                    {currency}{Number(order.total_amount)?.toLocaleString()}
                </td>

                <td className="text-left max-md:hidden text-xs leading-relaxed text-slate-500 align-top pt-8">
                    <p className="font-bold text-slate-700">{addr.receiver_name}</p>
                    <p>{addr.detail} {addr.sub_district}</p>
                    <p>{addr.district}, {addr.province} {addr.postal_code}</p>
                    <p className="mt-1 flex items-center gap-1">📞 {addr.phone_number}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden p-4 align-top pt-8">
                    <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                        ${order.status === 'processing' ? 'text-blue-600 bg-blue-50' : ''}
                        ${order.status === 'order_placed' ? 'text-slate-600 bg-slate-100' : ''} 
                        ${order.status === 'shipped' ? 'text-yellow-600 bg-yellow-50' : ''}
                        ${order.status === 'delivered' ? 'text-green-600 bg-green-50' : ''}
                        ${order.status === 'cancelled' ? 'text-red-600 bg-red-50' : ''}
                        `}
                    >
                        <DotIcon size={16} className="-ml-1 mr-1" />
                        {order.status === 'order_placed' ? 'Pending' : order.status}
                    </div>

                    {/* ✅ ปรับเงื่อนไข: แสดงเฉพาะเมื่อยังไม่จ่ายเงิน และสถานะยังเป็นแค่ order_placed เท่านั้น */}
                    {order.payment_status === 'pending' && order.status === 'order_placed' && (
                        <div className="flex flex-col gap-2 mt-2">
                            <button 
                                onClick={handlePayNow}
                                className="flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                <CreditCard size={14} /> Pay Now
                            </button>
                            <button 
                                onClick={handleCancelOrder}
                                className="flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg hover:bg-red-50 transition"
                            >
                                <Trash2 size={14} /> Cancel
                            </button>
                        </div>
                    )}
                                    </td>
            </tr>

            {/* Mobile View */}
            <tr className="md:hidden border-b border-slate-100">
                <td colSpan={5} className="p-4 bg-slate-50/50">
                    <div className="text-xs text-slate-500 mb-3">
                         <p className="font-bold">{addr.receiver_name}</p>
                         <p>{addr.detail}, {addr.province}</p>
                         <p>{addr.phone_number}</p>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-slate-800">Total: {currency}{order.total_amount?.toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                            {order.status === 'order_placed' ? 'Pending' : order.status}
                        </span>
                    </div>

                    {/* Mobile Action Buttons */}
                    {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={handlePayNow}
                                disabled={isActionLoading}
                                className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold"
                            >
                                Pay Now
                            </button>
                            <button 
                                onClick={handleCancelOrder}
                                disabled={isActionLoading}
                                className="flex-1 bg-white border border-red-200 text-red-500 text-xs py-2 rounded-lg font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </td>
            </tr>
        </>
    )
}

export default OrderItem