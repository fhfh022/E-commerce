"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/product/ProductCard"; 
import Loading from "@/components/layout/Loading";
import { TicketPercent, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useSelector } from "react-redux";

export default function PromotionsPage() {
  const { user } = useUser();
  const role = useSelector((state) => state.user?.role)
  const [coupons, setCoupons] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ดึง Coupons
        const { data: couponsData } = await supabase
          .from("coupons")
          .select("*")
          .eq("is_active", true)
          .gte("expiry_date", new Date().toISOString())
          .order("discount_value", { ascending: false });

        // 2. ดึง Sale Products (ที่มี sale_price > 0)
        const { data: productsData } = await supabase
          .from("products")
          .select("*")
          .gt("sale_price", 0) 
          .order("sale_price", { ascending: true });

        setCoupons(couponsData || []);
        setSaleProducts(productsData || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon copied!");
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-4">Deals & Promotions</h1>
        <p className="text-slate-500">Grab the best deals and coupons before they expire!</p>
      </div>

      {/* --- Coupons Section --- */}
      {coupons.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
            <div className="bg-yellow-100 p-2 rounded-full text-yellow-600"><TicketPercent size={24} /></div>
            <h2 className="text-2xl font-bold text-slate-800">Available Coupons</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TicketPercent size={100} />
                 </div>
                 <div className="relative z-10">
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-4xl font-black text-yellow-400">
                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `฿${coupon.discount_value}`}
                        </span>
                        <span className="text-lg font-bold">OFF</span>
                    </div>
                    <p className="text-slate-300 text-sm mb-6">{coupon.description}</p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 flex justify-between items-center pl-4 border border-white/10">
                        <span className="font-mono font-bold tracking-widest">{coupon.code}</span>
                        
                        <button 
                            onClick={() => copyCoupon(coupon.code)}
                            className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition"
                            disabled={!user ? true : false}
                        >
                            COPY
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        Exp: {new Date(coupon.expiry_date).toLocaleDateString()} • Left: {coupon.quantity - coupon.used_count}
                    </p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Sale Products Section --- */}
      {saleProducts.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
            <div className="bg-red-100 p-2 rounded-full text-red-600"><Tag size={24} /></div>
            <h2 className="text-2xl font-bold text-slate-800">Flash Sale Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {saleProducts.map((item) => (
              // ✅ แก้ไขตรงนี้: เปลี่ยนจาก data={item} เป็น product={item}
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400">No products on sale right now. Check back later!</p>
        </div>
      )}
    </div>
  );
}