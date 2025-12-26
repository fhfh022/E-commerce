'use client'
import Loading from "@/components/layout/Loading"
import OrdersAreaChart from "@/components/product/OrdersAreaChart"
import { supabase } from "@/lib/supabase" 
import { CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

export default function AdminDashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        allOrders: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Total Revenue', value: currency + dashboardData.revenue.toLocaleString(), icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // 1. & 2. Count Queries (เหมือนเดิม)
            const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
            const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })

            // 3. ดึงข้อมูล Orders
            const { data: ordersData, error: ordersDataError } = await supabase
                .from('orders')
                .select('created_at, total_amount, payment_status')
                .order('created_at', { ascending: true })

            if (ordersDataError) throw new Error("Failed to fetch data")

            // ✅ 4. จุดแก้ Error: แปลงข้อมูลให้ปลอดภัยที่สุด (Sanitize Data)
            const safeOrders = (ordersData || []).reduce((acc, order) => {
                // ลองแปลงเป็น Date Object
                const dateObj = new Date(order.created_at);
                
                // เช็คว่าเป็นวันที่ที่ถูกต้องหรือไม่ (ไม่เป็น Invalid Date)
                if (order.created_at && !isNaN(dateObj.getTime())) {
                    acc.push({
                        ...order,
                        // แปลงเป็น ISO String มาตรฐานให้เลย กราฟจะได้ไม่ต้องแปลงเองแล้วพัง
                        created_at: dateObj.toISOString(),
                        // 🔥 เพิ่มตัวนี้เผื่อกราฟใช้ชื่อนี้ (Supabase ส่งมาเป็น created_at แต่กราฟอาจจะใช้ createdAt)
                        createdAt: dateObj.toISOString(), 
                        total_amount: Number(order.total_amount) || 0
                    });
                }
                return acc;
            }, []);

            // 5. คำนวณ Revenue
            const totalRevenue = safeOrders
                .filter(order => order.payment_status === 'paid')
                .reduce((acc, order) => acc + order.total_amount, 0)

            setDashboardData({
                products: productsCount || 0,
                revenue: totalRevenue,
                orders: ordersCount || 0,
                allOrders: safeOrders, // ✅ ส่งข้อมูลที่ผ่านการกรองและแปลงแล้วเท่านั้น
            })

        } catch (error) {
            console.error("Dashboard Error:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-20">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Cards Section */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-8 border border-slate-200 p-4 px-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow min-w-[250px] flex-1">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{card.title}</p>
                                <b className="text-2xl font-bold text-slate-800">{card.value}</b>
                            </div>
                            <card.icon size={48} className="p-3 text-blue-600 bg-blue-50 rounded-full ml-auto" />
                        </div>
                    ))
                }
            </div>

            {/* Area Chart Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Orders Overview</h3>
                <div className="h-[400px] w-full">
                    <OrdersAreaChart allOrders={dashboardData.allOrders} />
                </div>
            </div>
        </div>
    )
}