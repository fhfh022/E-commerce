'use client'
import Loading from "@/components/layout/Loading"
import { supabase } from "@/lib/supabase"
import { 
    CircleDollarSignIcon, 
    ShoppingBasketIcon, 
    StarIcon, 
    TagsIcon, 
    Trash2Icon, 
    AlertTriangle, 
    X 
} from "lucide-react"
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
        totalRatingsCount: 0,
        ratings: [],
    })

    // State สำหรับ Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [reviewToDelete, setReviewToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const dashboardCardsData = [
        { title: 'สินค้าทั้งหมด', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'รายได้ทั้งหมด', value: currency + dashboardData.totalEarnings.toLocaleString(), icon: CircleDollarSignIcon },
        { title: 'คำสั่งซื้อทั้งหมด', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'รีวิวทั้งหมด', value: dashboardData.totalRatingsCount, icon: StarIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // 1. Count Products
            const { count: productsCount, error: productError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })

            // 2. Count Orders
            const { count: ordersCount, error: orderError } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })

            // 3. Calculate Earnings
            const { data: paidOrders, error: earningsError } = await supabase
                .from('orders')
                .select('total_amount')
                .eq('payment_status', 'paid')

            const totalEarnings = paidOrders?.reduce((acc, order) => acc + (order.total_amount || 0), 0) || 0

            // 4. Fetch Reviews
            const { data: reviews, count: ratingsCount, error: reviewError } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:users(name, avatar), 
                    product:products(id, name, category, model) 
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                // ^ เพิ่ม model ใน select ด้วยนะครับ (product:products(...))

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
            toast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const openDeleteModal = (review) => {
        setReviewToDelete(review)
        setIsDeleteModalOpen(true)
    }

    const formatDateTH = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("th-TH", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDeleteConfirm = async () => {
        if (!reviewToDelete) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewToDelete.id)

            if (error) throw error

            setDashboardData(prev => ({
                ...prev,
                totalRatingsCount: prev.totalRatingsCount - 1,
                ratings: prev.ratings.filter(r => r.id !== reviewToDelete.id)
            }))

            toast.success("ลบรีวิวเรียบร้อยแล้ว")
            setIsDeleteModalOpen(false)
            setReviewToDelete(null)

        } catch (error) {
            console.error("Delete Error:", error)
            toast.error("เกิดข้อผิดพลาดในการลบรีวิว")
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28 relative">
            <h1 className="text-2xl">Store <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Dashboard Stats Cards */}
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

            <h2 className="text-xl font-bold text-slate-800 mb-4">รีวิวทั้งหมด</h2>

            <div className="mt-5 space-y-4">
                {dashboardData.ratings.length === 0 ? (
                     <div className="text-center py-10 bg-slate-50 rounded-lg text-slate-400">ยังไม่มีรีวิวในขณะนี้</div>
                ) : (
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="relative group flex max-sm:flex-col gap-5 sm:items-center justify-between p-6 border border-slate-200 rounded-xl bg-white shadow-sm hover:border-red-200 transition-colors max-w-4xl">
                            
                            <button 
                                onClick={() => openDeleteModal(review)}
                                className="absolute -top-2 -right-2 p-2 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="ลบรีวิว"
                            >
                                <Trash2Icon size={16} />
                            </button>

                            <div>
                                <div className="flex gap-3 items-center">
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
                                        <p className="font-medium text-slate-800">{review.user?.name || "ไม่ระบุตัวตน"}</p>
                                        <p className="font-light text-xs text-slate-400">{formatDateTH(review.created_at)}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-slate-600 max-w-lg text-sm leading-relaxed">{review.comment}</p>
                            </div>

                            <div className="flex flex-col justify-between gap-4 sm:items-end min-w-[150px]">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">{review.product?.category}</p>
                                    
                                    {/* ✅ 1. เพิ่ม Model ต่อท้ายชื่อสินค้า */}
                                    <p className="font-bold text-slate-700 text-sm mb-1 flex items-center gap-1">
                                        {review.product?.name}
                                        {review.product?.model && (
                                            <span className="text-xs text-slate-400 font-normal">
                                                ({review.product.model})
                                            </span>
                                        )}
                                    </p>

                                    <div className='flex items-center gap-0.5'>
                                        {Array(5).fill('').map((_, idx) => (
                                            <StarIcon 
                                                key={idx} 
                                                size={16} 
                                                className={idx < review.rating ? "fill-green-400 text-green-400" : "fill-slate-200 text-slate-200"} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => router.push(`/product/${review.product?.id}`)} 
                                    className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-all self-start sm:self-end"
                                >
                                    ดูสินค้า
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ✅ 2. ปรับ UI Modal เป็นภาษาไทย */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 relative">
                        
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)} 
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">ยืนยันการลบรีวิว?</h3>
                            <p className="text-sm text-slate-500 mt-2 mb-6">
                                คุณต้องการลบรีวิวของ <span className="font-bold text-slate-800">{reviewToDelete?.user?.name}</span> ใช่หรือไม่? <br/> เมื่อลบแล้วจะไม่สามารถกู้คืนได้
                            </p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)} 
                                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                                    disabled={isDeleting}
                                >
                                    ยกเลิก
                                </button>
                                <button 
                                    onClick={handleDeleteConfirm} 
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-100 transition flex justify-center items-center gap-2 disabled:opacity-70"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>กำลังลบ...</>
                                    ) : (
                                        <>
                                            <Trash2Icon size={16} /> ยืนยัน
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}