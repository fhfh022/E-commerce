'use client'
import Loading from "@/components/layout/Loading"
import { supabase } from "@/lib/supabase" // ✅ อย่าลืม import supabase
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

export default function Dashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        totalRatingsCount: 0, // แยกตัวแปรนับจำนวนรีวิว
        ratings: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'Total Earnings', value: currency + dashboardData.totalEarnings.toLocaleString(), icon: CircleDollarSignIcon }, // ✅ ใส่ toLocaleString() ให้สวยงาม
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'Total Ratings', value: dashboardData.totalRatingsCount, icon: StarIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // 1. หาจำนวนสินค้าทั้งหมด (Products Count)
            const { count: productsCount, error: productError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true }) // head: true คือโหลดแค่ header เพื่อนับจำนวน (ประหยัด resource)

            // 2. หาจำนวนออเดอร์ทั้งหมด (Orders Count)
            const { count: ordersCount, error: orderError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })

            // 3. หา Earnings (ยอดขายรวมเฉพาะที่จ่ายเงินแล้ว)
            const { data: paidOrders, error: earningsError } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('payment_status', 'paid') // ✅ นับเฉพาะที่จ่ายเงินแล้ว

            const totalEarnings = paidOrders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0

            // 4. ดึงข้อมูลรีวิว (Ratings List & Count)
            const { data: reviews, count: ratingsCount, error: reviewError } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:users(name, avatar), 
                    product:products(id, name, category)
                `, { count: 'exact' })
                .order('created_at', { ascending: false }) // เรียงจากใหม่ไปเก่า

            if (productError || orderError || earningsError || reviewError) throw new Error("Failed to fetch data")

            setDashboardData({
                totalProducts: productsCount || 0,
                totalEarnings: totalEarnings,
                totalOrders: ordersCount || 0,
                totalRatingsCount: ratingsCount || 0,
                ratings: reviews || [],
            })

        } catch (error) {
            console.error("Dashboard Error:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className=" text-slate-500 mb-28">
            <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-3 text-xs">
                                <p className="uppercase tracking-wider font-semibold text-slate-400">{card.title}</p>
                                <b className="text-2xl font-bold text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className="w-12 h-12 p-3 text-blue-500 bg-blue-50 rounded-full" />
                        </div>
                    ))
                }
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-4">Latest Reviews</h2>

            <div className="mt-5 space-y-4">
                {dashboardData.ratings.length === 0 ? (
                     <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-400">No reviews yet</div>
                ) : (
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between p-6 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-200 transition-colors max-w-4xl">
                            <div>
                                <div className="flex gap-3 items-center">
                                    {/* ✅ แสดงรูป Avatar ที่ถูกต้อง */}
                                    {review.user?.avatar ? (
                                        <Image 
                                            src={review.user.avatar} 
                                            alt={review.user.name} 
                                            className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                                            width={40} 
                                            height={40} 
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                                            {review.user?.name?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    
                                    <div>
                                        <p className="font-medium text-slate-800">{review.user?.name || "Anonymous"}</p>
                                        {/* ✅ แก้ไข field วันที่ */}
                                        <p className="font-light text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {/* ✅ แก้ไข field comment */}
                                <p className="mt-3 text-slate-600 max-w-lg text-sm leading-relaxed">{review.comment}</p>
                            </div>

                            <div className="flex flex-col justify-between gap-4 sm:items-end min-w-[150px]">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">{review.product?.category}</p>
                                    <p className="font-bold text-slate-700 text-sm mb-1">{review.product?.name}</p>
                                    <div className='flex items-center gap-0.5'>
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon 
                                                key={index} 
                                                size={16} 
                                                className={index < review.rating ? "fill-green-400 text-green-400" : "fill-slate-200 text-slate-200"} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => router.push(`/product/${review.product?.id}`)} 
                                    className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all self-start sm:self-end"
                                >
                                    View Product
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}