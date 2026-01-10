"use client";
import { useState, useEffect, useCallback } from "react";
import { 
    Clock, CheckCircle, Truck, XCircle, FileText, Box, Star, Edit3, AlertTriangle, CreditCard, Trash2, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ReceiptModal from "@/components/order/ReceiptModal";
import RatingModal from "@/components/product/RatingModal";
import OrderTimer from "@/components/product/OrderTimer";
import toast from "react-hot-toast";

export default function OrderItem({ order }) {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    
    // Modal States
    const [showReceipt, setShowReceipt] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [productToRate, setProductToRate] = useState(null);
    const [existingReviews, setExistingReviews] = useState({});
    
    // Action States
    const [showPayModal, setShowPayModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    // 1. Auto-Cancel Logic (ถ้าเกิน 10 นาที)
    useEffect(() => {
        if (order.payment_status === 'pending' && order.status !== 'cancelled') {
            const createdTime = new Date(order.created_at).getTime();
            const expireTime = createdTime + 10 * 60 * 1000;
            const currentTime = Date.now();
            const timeLeft = expireTime - currentTime;

            const cancelOrder = async () => {
                try {
                    const { error } = await supabase
                        .from('orders')
                        .update({ 
                            status: 'cancelled', 
                            payment_status: 'not_paid'
                        })
                        .eq('id', order.id);
                    
                    if (!error) window.location.reload();
                } catch (error) {
                    console.error("Error auto-cancelling order:", error);
                }
            };

            if (timeLeft <= 0) {
                setIsExpired(true);
                cancelOrder();
            } else {
                const timerId = setTimeout(() => {
                    setIsExpired(true);
                    cancelOrder();
                }, timeLeft);
                return () => clearTimeout(timerId);
            }
        }
    }, [order]);

    // 2. Fetch Reviews (เฉพาะออเดอร์ที่จ่ายแล้ว)
    const fetchReviews = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('order_id', order.id);

            if (error) throw error;
            const reviewsMap = {};
            data?.forEach(review => {
                reviewsMap[review.product_id] = review;
            });
            setExistingReviews(reviewsMap);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    }, [order.id]);

    useEffect(() => {
        if (order.payment_status === 'paid') {
            fetchReviews();
        }
    }, [fetchReviews, order.payment_status]);

    // 3. Action Handlers
    const handleConfirmPayment = async () => {
        setIsActionLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    userEmail: order.user?.email,
                    discountAmount: order.discount_amount 
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || "Payment failed");
            }
        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Failed to initialize payment");
            setIsActionLoading(false);
            setShowPayModal(false);
        }
    };

    const handleCancelOrder = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

            if (error) throw error;
            toast.success("Order cancelled");
            window.location.reload();
        } catch (error) {
            toast.error("Failed to cancel");
            setIsActionLoading(false);
        }
    };

    const handleOpenRating = (product) => {
        setProductToRate(product);
        setShowRating(true);
    };

    const handleReviewSaved = () => {
        fetchReviews();
    };

    // Helpers
    const formatDateTH = (dateString) => {
        if(!dateString) return "-";
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "processing": return "bg-blue-100 text-blue-700 border-blue-200";
            case "shipped": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "delivered": return "bg-green-100 text-green-700 border-green-200";
            case "paid": return "bg-green-100 text-green-700 border-green-200";
            case "cancelled": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700 border-slate-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case "paid": case "delivered": return <CheckCircle size={14} />;
            case "shipped": return <Truck size={14} />;
            case "cancelled": return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    // คำนวณราคาเต็มก่อนลด
    const originalTotal = (order.total_amount || 0) + (order.discount_amount || 0);

    return (
        <>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-200 mb-6">
                
                {/* --- Header --- */}
                <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100">
                    <div className="flex flex-wrap gap-4 sm:gap-8">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Order ID</p>
                            <p className="text-sm font-mono text-slate-700 font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date</p>
                            <p className="text-sm text-slate-700">{formatDateTH(order.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</p>
                            {order.discount_amount > 0 ? (
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] text-slate-400 line-through">
                                        {currency}{originalTotal.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-red-600">
                                        {currency}{order.total_amount?.toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-slate-800">{currency}{order.total_amount?.toLocaleString()}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status?.toUpperCase() || "PENDING"}
                        </span>

                        {/* ✅ ปุ่ม Receipt: แสดงเฉพาะจ่ายเงินแล้ว */}
                        {order.payment_status === 'paid' && (
                            <button 
                                onClick={() => setShowReceipt(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:border-indigo-300 hover:text-indigo-600 transition shadow-sm active:scale-95"
                            >
                                <FileText size={14} /> Receipt
                            </button>
                        )}
                    </div>
                </div>

                {/* --- Timer Alert --- */}
                {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                    <div className="bg-orange-50 px-6 py-3 border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 text-orange-700">
                            <div className="p-1 bg-orange-100 rounded-full">
                                <AlertTriangle size={14} />
                            </div>
                            <span className="text-xs font-bold">Waiting for payment</span>
                            <span className="text-xs text-orange-600 hidden sm:inline">• Please pay within 10 mins.</span>
                        </div>
                        <OrderTimer createdAt={order.created_at} />
                    </div>
                )}

                {/* --- Items List --- */}
                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        {order.order_items?.map((item, i) => {
                            const review = existingReviews[item.product?.id];
                            const isSaleItem = item.product?.price > item.price_at_time;

                            return (
                                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                                    <div className="relative size-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {item.product?.images?.[0] ? (
                                            <img src={item.product.images[0]} alt={item.product.name} className="object-contain w-full h-full p-1" />
                                        ) : (
                                            <Box size={20} className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 w-full">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 truncate mb-0.5" title={`${item.product?.name} ${item.product?.model}`}>
                                                    {item.product?.name} <span className="text-slate-400 font-normal text-xs">({item.product?.model})</span>
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    {isSaleItem ? (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-slate-400 line-through text-[10px]">
                                                                {currency}{item.product.price.toLocaleString()}
                                                            </span>
                                                            <span className="font-bold text-red-600">
                                                                {currency}{item.price_at_time?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="font-medium text-slate-900">
                                                            {currency}{item.price_at_time?.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* ✅ ปุ่ม Rating: แสดงเฉพาะจ่ายเงินแล้ว */}
                                            {order.payment_status === 'paid' && (
                                                <button 
                                                    onClick={() => handleOpenRating(item.product)}
                                                    className={`p-2 rounded-lg border transition-all flex-shrink-0 ${
                                                        review 
                                                        ? "text-indigo-500 bg-indigo-50 border-indigo-100 hover:bg-indigo-100" 
                                                        : "text-slate-300 bg-slate-50 border-slate-100 hover:text-yellow-400 hover:bg-yellow-50"
                                                    }`}
                                                    title={review ? "Edit your review" : "Rate this product"}
                                                >
                                                    {review ? <Edit3 size={16} /> : <Star size={16} className={review ? "fill-current" : ""} />}
                                                </button>
                                            )}
                                        </div>
                                        {review && (
                                            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="font-bold text-slate-600">Your Review:</span>
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-slate-500 italic">"{review.comment || "No comment provided."}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- Bottom Actions (Pay Now / Cancel) --- */}
                {/* แสดงเฉพาะตอนยังไม่จ่าย และยังไม่ถูกยกเลิก */}
                {order.payment_status === 'pending' && order.status !== 'cancelled' && (
                    <div className="px-6 pb-4 flex gap-3 justify-end border-t border-slate-50 pt-4">
                        <button 
                            onClick={() => setShowCancelModal(true)} 
                            disabled={isActionLoading} 
                            className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Cancel Order
                        </button>
                        <button 
                            onClick={() => setShowPayModal(true)} 
                            disabled={isActionLoading || isExpired}
                            className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 transition flex items-center gap-2 disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            <CreditCard size={16} /> {isExpired ? "Expired" : "Pay Now"}
                        </button>
                    </div>
                )}
            </div>

            {/* Modals Confirm Pay / Cancel */}
            {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <div className="size-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Proceed to Payment?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6">
                            You will be redirected to Stripe to complete your payment of <span className="font-bold text-slate-900">{currency}{order.total_amount?.toLocaleString()}</span>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleConfirmPayment} disabled={isActionLoading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2">
                                {isActionLoading && <Loader2 size={16} className="animate-spin" />} Pay Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
                        <div className="size-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Cancel Order?</h3>
                        <p className="text-sm text-slate-500 mt-2 mb-6">
                            Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Keep Order</button>
                            <button onClick={handleCancelOrder} disabled={isActionLoading} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex justify-center items-center gap-2">
                                {isActionLoading && <Loader2 size={16} className="animate-spin" />} Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReceipt && <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
            {showRating && productToRate && (
                <RatingModal
                    isOpen={showRating}
                    setRatingModal={setShowRating} 
                    product={productToRate}
                    orderId={order.id}
                    userId={order.user_id}
                    existingReview={existingReviews[productToRate.id]} 
                    onReviewSaved={handleReviewSaved}
                />
            )}
        </>
    );
}