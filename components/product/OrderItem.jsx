'use client'
import Image from "next/image";
import { DotIcon, CreditCard, Trash2, AlertTriangle } from "lucide-react";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";
import toast from "react-hot-toast"; 
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import OrderTimer from "./OrderTimer";

const OrderItem = ({ order }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false); 

    const { ratings } = useSelector(state => state.rating);
    const user = useSelector(state => state.auth.user); 
    const [isActionLoading, setIsActionLoading] = useState(false); 

    const addr = order.address || {};

    const confirmPayment = async () => {
        setIsActionLoading(true);
        try {
            const checkoutItems = order.order_items.map(item => ({
                product: item.product, 
                quantity: item.quantity,
                price: item.price_at_time 
            }));

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: checkoutItems,
                    orderId: order.id,
                    userEmail: user?.email,
                    discountAmount: order.discount_amount || 0 
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
            toast.error(error.message || "Failed to initiate payment");
        } finally {
            setIsActionLoading(false);
            setShowPayModal(false);
        }
    };

    const confirmCancelOrder = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('orders').delete().eq('id', order.id);
            if (error) throw error;
            toast.success("Order cancelled successfully");
            window.location.reload(); 
        } catch (error) {
            console.error("Cancel Error:", error);
            toast.error("Failed to cancel order");
        } finally {
            setIsActionLoading(false);
            setShowCancelModal(false);
        }
    };

    return (
        <>
            <tr className="text-sm shadow-sm bg-white rounded-lg">
                <td className="text-left p-4">
                    <div className="flex flex-col gap-6 pb-4">
                        {order.order_items?.map((item, index) => {
                            // ✅ Logic เช็คว่าซื้อตอนลดราคาหรือไม่
                            // ถ้าราคาที่ซื้อ (price_at_time) น้อยกว่า ราคาปัจจุบัน (product.price) แสดงว่าลดราคา
                            const isDiscounted = item.product?.price && item.price_at_time < item.product.price;

                            return (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-20 aspect-square bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0 relative">
                                    <Image
                                        className="h-14 w-auto object-contain"
                                        src={item.product?.images?.[0] || '/placeholder.png'}
                                        alt="product_img"
                                        width={50}
                                        height={50}
                                    />
                                    {isDiscounted && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md font-bold">
                                            SALE
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center text-sm">
                                    <Link href={`/product/${item.product?.id}`} className="hover:text-blue-600 font-semibold transition">{item.product?.name} - {item.product?.model}</Link>
                                    
                                    {/* ✅ แสดงราคา */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-bold text-slate-700">
                                            {currency}{Number(item.price_at_time).toLocaleString()}
                                        </p>
                                        {isDiscounted && (
                                            <p className="text-xs text-slate-400 line-through">
                                                {currency}{Number(item.product.price).toLocaleString()}
                                            </p>
                                        )}
                                        <span className="text-xs text-slate-500">| Qty: {item.quantity}</span>
                                    </div>

                                    <p className="text-xs text-slate-400 mb-1 mt-1">{new Date(order.created_at).toDateString()}</p>
                                    
                                    <div>
                                        {ratings.find(rating => order.id === rating.orderId && item.product?.id === rating.productId)
                                            ? (
                                                <div className="flex flex-col gap-1">
                                                    <Rating value={ratings.find(r => order.id === r.orderId && item.product?.id === r.productId).rating} />
                                                    <button onClick={() => setRatingModal({ orderId: order.id, productId: item.product?.id })} className="text-[10px] text-blue-600 hover:underline font-bold text-left">Edit Review</button>
                                                </div>
                                            )
                                            : (
                                                <button onClick={() => setRatingModal({ orderId: order.id, productId: item.product?.id })} className={`text-xs font-medium text-green-600 hover:text-green-700 hover:underline transition ${order.status !== "delivered" && 'hidden'}`}>Rate Product</button>
                                            )
                                        }
                                    </div>
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                </div>
                            </div>
                        )})}
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
                    <div className="flex flex-col items-start gap-2">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'processing' ? 'text-blue-600 bg-blue-50' : ''} ${order.status === 'order_placed' ? 'text-slate-600 bg-slate-100' : ''} ${order.status === 'shipped' ? 'text-yellow-600 bg-yellow-50' : ''} ${order.status === 'delivered' ? 'text-green-600 bg-green-50' : ''} ${order.status === 'cancelled' ? 'text-red-600 bg-red-50' : ''}`}>
                            <DotIcon size={16} className="-ml-1 mr-1" />
                            {order.status === 'order_placed' ? 'Pending' : order.status}
                        </div>
                        {order.payment_status === 'pending' && order.status === 'order_placed' && (
                            <OrderTimer createdAt={order.created_at} />
                        )}
                    </div>

                    {order.payment_status === 'pending' && order.status === 'order_placed' && (
                        <div className="flex flex-col gap-2 mt-2">
                            <button onClick={() => setShowPayModal(true)} className="flex items-center justify-center gap-1 bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition"><CreditCard size={14} /> Pay Now</button>
                            <button onClick={() => setShowCancelModal(true)} className="flex items-center justify-center gap-1 bg-white border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg hover:bg-red-50 transition"><Trash2 size={14} /> Cancel</button>
                        </div>
                    )}
                    
                    {showPayModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6"><CreditCard size={36} /></div>
                                    <h3 className="text-2xl font-black text-slate-900">Complete Payment?</h3>
                                    <p className="text-slate-500 mt-2 leading-relaxed text-sm">You are about to be redirected to Stripe to pay <span className="font-bold text-slate-800">{currency}{order.total_amount?.toLocaleString()}</span> for this order.</p>
                                    <div className="grid grid-cols-1 gap-3 w-full mt-8">
                                        <button disabled={isActionLoading} onClick={confirmPayment} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center gap-2">{isActionLoading ? "Connecting..." : "Confirm & Pay"}</button>
                                        <button disabled={isActionLoading} onClick={() => setShowPayModal(false)} className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showCancelModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={36} /></div>
                                    <h3 className="text-2xl font-black text-slate-900">Cancel Order?</h3>
                                    <p className="text-slate-500 mt-2 leading-relaxed text-sm">Are you sure you want to cancel this order? This action cannot be undone.</p>
                                    <div className="grid grid-cols-1 gap-3 w-full mt-8">
                                        <button disabled={isActionLoading} onClick={confirmCancelOrder} className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 disabled:opacity-70 transition-all">{isActionLoading ? "Cancelling..." : "Yes, Cancel Order"}</button>
                                        <button disabled={isActionLoading} onClick={() => setShowCancelModal(false)} className="w-full py-3.5 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 active:scale-95 transition-all">No, Keep it</button>
                                    </div>
                                </div>
                            </div>
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
                        <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{order.status === 'order_placed' ? 'Pending' : order.status}</span>
                            {order.payment_status === 'pending' && order.status === 'order_placed' && <OrderTimer createdAt={order.created_at} />}
                        </div>
                    </div>
                    {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                        <div className="flex gap-2">
                            <button onClick={() => setShowPayModal(true)} disabled={isActionLoading} className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-bold">Pay Now</button>
                            <button onClick={() => setShowCancelModal(true)} disabled={isActionLoading} className="flex-1 bg-white border border-red-200 text-red-500 text-xs py-2 rounded-lg font-bold">Cancel</button>
                        </div>
                    )}
                </td>
            </tr>
        </>
    )
}

export default OrderItem