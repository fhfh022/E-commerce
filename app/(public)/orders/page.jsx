'use client'
import PageTitle from "@/components/layout/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/product/OrderItem";
import { supabase } from "@/lib/supabase";
import { useSelector, useDispatch } from "react-redux"; // เพิ่ม useDispatch
import { useSearchParams, useRouter } from "next/navigation"; // เพิ่ม useSearchParams
import { clearCart } from "@/lib/features/cart/cartSlice"; // import action
import toast from "react-hot-toast";
import { Package } from "lucide-react";
import { setUserRatings } from "@/lib/features/rating/ratingSlice";


export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = useSelector(state => state.auth.user);
    
    // Hooks สำหรับจัดการ URL และ Redux
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();

    // -------------------------------------------------------
    // ✅ Logic ใหม่: ตรวจสอบสถานะการจ่ายเงินเมื่อกลับมาจาก Stripe
    // -------------------------------------------------------
    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (!user) return;

            // 1. เช็คว่ามี ?success=true ใน URL ไหม
            if (searchParams.get("success") === "true") {
                try {
                    // 2. ลบตะกร้าใน Database
                    await supabase
                        .from("cart")
                        .delete()
                        .eq("user_id", user.id); // สมมติว่าในตาราง cart มี user_id หรือเชื่อมกับตาราง users

                    // 3. ลบตะกร้าใน Redux (หน้าจอ)
                    dispatch(clearCart());

                    // 4. แจ้งเตือนลูกค้า
                    toast.success("Payment Successful! Thank you for your order.");

                    // 5. ล้าง URL ให้สะอาด (ลบ ?success=true ออก) เพื่อไม่ให้ลบซ้ำเมื่อ refresh
                    router.replace("/orders"); 

                } catch (error) {
                    console.error("Error clearing cart:", error);
                }
            }

            // (Optional) กรณี User กดยกเลิกกลับมา
            if (searchParams.get("canceled") === "true") {
                toast.error("Payment was canceled.");
                router.replace("/orders");
            }
        };

        checkPaymentStatus();
    }, [searchParams, user, dispatch, router]);
    // -------------------------------------------------------


    // ... ส่วนการ Fetch Orders เดิม ...
    useEffect(() => {
        const fetchOrders = async () => {
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
        };

        if (user) fetchOrders();
        else setLoading(false);
    }, [user]);

    useEffect(() => {
        const fetchOrdersAndReviews = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // 1. ดึง Orders (โค้ดเดิม)
                const { data: ordersData, error: ordersError } = await supabase
                    // ... (query เดิมของคุณ) ...
                
                if (ordersError) throw ordersError;
                setOrders(ordersData || []);

                // 2. ✅ ดึง Reviews ของ User คนนี้เพื่อเช็คว่าอันไหนรีวิวไปแล้ว
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('product_id, order_id, rating')
                    .eq('user_id', user.id);
                
                // แปลงข้อมูลให้ตรงกับ structure ที่ OrderItem ใช้เช็ค
                if (reviewsData) {
                    const formattedRatings = reviewsData.map(r => ({
                        orderId: r.order_id,
                        productId: r.product_id,
                        rating: r.rating
                    }));
                    dispatch(setUserRatings(formattedRatings));
                }

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchOrdersAndReviews();
    }, [user, dispatch]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                {/* คุณสามารถใช้ Component Loading ที่คุณมีอยู่ได้เลย */}
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] mx-6">
            {/* ✅ 2. เมื่อโหลดเสร็จแล้วค่อยมาเช็คว่ามี Order หรือไม่ */}
            {orders.length > 0 ? (
                <div className="my-20 max-w-7xl mx-auto">
                    <PageTitle 
                        heading="My Orders" 
                        text={`Showing total ${orders.length} orders`} 
                        linkText={'Go to home'} 
                    />
                    
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
                // ✅ 3. ส่วนนี้จะแสดงก็ต่อเมื่อ Loading เสร็จแล้ว และผลลัพธ์คือไม่มีข้อมูลจริงๆ
                <div className="min-h-[80vh] mx-6 flex flex-col items-center justify-center text-center">
                    <div className="size-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Package size={40} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">You have no orders</h1>
                    <p className="text-slate-500 mt-2">When you place an order, it will appear here.</p>
                </div>
            )}
        </div>
    );
}