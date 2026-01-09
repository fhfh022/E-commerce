'use client'
import PageTitle from "@/components/layout/PageTitle"
import { useEffect, useState, useCallback } from "react";
import OrderItem from "@/components/product/OrderItem";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { useSearchParams, useRouter } from "next/navigation";
// ไม่จำเป็นต้อง import clearCart ที่นี่แล้ว เพราะทำที่หน้าก่อน
import toast from "react-hot-toast";
import { Package } from "lucide-react";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.auth.user);
    
    const searchParams = useSearchParams();
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    address:addresses(*),
                    order_items:order_items(
                        *,
                        product:products(*)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // ✅ 1. โหลดข้อมูลครั้งแรก (ใส่หน่วงเวลาตามที่ขอ เพื่อให้มั่นใจว่าข้อมูลจากหน้า Place Order มาครบ)
    useEffect(() => {
        // หน่วงเวลา 0.5 วินาที ก่อนดึงข้อมูลครั้งแรก
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    // ✅ 2. Logic จัดการหลังจ่ายเงินสำเร็จ (Stripe Redirect กลับมา)
    useEffect(() => {
        const handlePaymentReturn = async () => {
            const isSuccess = searchParams.get("success") === "true";
            const isCanceled = searchParams.get("canceled") === "true";
            const orderId = searchParams.get("orderId");

            if (isSuccess) {
                // อัปเดตสถานะเป็น Paid (ตะกร้าไม่ต้องล้างแล้ว เพราะว่างตั้งแต่สร้างออเดอร์)
                if (orderId) {
                    try {
                        const { error } = await supabase
                            .from('orders')
                            .update({ 
                                payment_status: 'paid', 
                                status: 'processing' 
                            })
                            .eq('id', orderId)
                            .eq('payment_status', 'pending');

                        // if (!error) {
                        //     toast.success("Payment confirmed!");
                        // }
                    } catch (err) {
                        console.error("Update Order Error:", err);
                    }
                } else {
                    toast.success("Payment successful!");
                }

                // Polling เพื่ออัปเดตปุ่ม Pay Now ให้หายไป
                fetchOrders();
                setTimeout(fetchOrders, 1000);
                setTimeout(fetchOrders, 3000);

                router.replace("/orders");
            }

            if (isCanceled) {
                toast.error("Payment was cancelled");
                router.replace("/orders");
            }
        };

        handlePaymentReturn();
    }, [searchParams, fetchOrders, router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] mx-6 my-2">
            {orders.length > 0 ? (
                <div className="my-20 max-w-7xl mx-auto">
                    <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full max-w-5xl text-slate-500 table-auto border-separate border-spacing-y-12 border-spacing-x-4">
                            <thead>
                                <tr className="max-sm:text-sm text-slate-600 max-md:hidden">
                                    <th className="text-left">Product</th>
                                    <th className="text-center">Total Price</th>
                                    <th className="text-left">Address</th>
                                    <th className="text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="min-h-[80vh] mx-6 flex flex-col items-center justify-center text-center">
                    <div className="size-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Package size={40} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">You have no orders</h1>
                    <p className="text-slate-500 mt-2">When you place an order, it will appear here.</p>
                </div>
            )}
        </div>
    )
}