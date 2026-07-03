"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/product/ProductCard";
import Loading from "@/components/layout/Loading";
import { TicketPercent, Tag, Zap, Copy, Clock, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import { useSelector } from "react-redux";

export default function PromotionsPage() {
  const { user } = useUser();
  const role = useSelector((state) => state.user?.role);
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
        toast.error("Failed to load promotions");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอกโค้ดแล้ว!");
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        
        {/* --- Unique Hero Header (Hot Deals Theme) --- */}
        <div className="relative py-12 md:py-20 px-4 md:px-6 overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl mb-8">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

            <div className="max-w-7xl mx-auto relative z-10 text-center">
                <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-full mb-6 shadow-lg border border-white/20 animate-bounce-slow">
                    <Gift size={40} className="text-white drop-shadow-md" />
                </div>
                <h1 className="text-3xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-sm">
                    Exclusive Promotions
                </h1>
                <p className="text-base md:text-xl max-w-2xl mx-auto font-medium text-orange-100">
                    ดีลสุดพิเศษและคูปองส่วนลดสำหรับคุณโดยเฉพาะ ช้อปเลยก่อนหมดเวลา!
                </p>
            </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* --- Coupons Section --- */}
        {coupons.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shadow-sm">
                    <TicketPercent size={28} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">
                    คูปองส่วนลด
                </h2>
            </div>

            {/* Mobile slider */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-2 pb-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="snap-start flex-shrink-0 w-[86%] sm:w-80">
                    <div className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-orange-100 group">
                      <div className="absolute top-0 right-0 p-20 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                      <div className="relative p-5 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">ส่วนลดพิเศษ</p>
                              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                                {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `฿${coupon.discount_value.toLocaleString()}`}
                                <span className="text-lg font-bold text-slate-400 ml-1">OFF</span>
                              </h3>
                            </div>
                            <div className="p-2 bg-white rounded-full shadow-sm text-orange-300 border border-orange-50">
                              <TicketPercent size={20} />
                            </div>
                          </div>

                          <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">
                            {coupon.description}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div onClick={() => copyCode(coupon.code)} className="flex items-center justify-between bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-3 px-4 cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors group/code active:scale-95" title="คลิกเพื่อคัดลอก">
                            <span className="font-mono font-bold text-lg text-slate-700 tracking-widest group-hover/code:text-orange-600">
                              {coupon.code}
                            </span>
                            <div className="flex items-center gap-1 text-slate-400 group-hover/code:text-orange-500 text-xs font-bold">
                              <Copy size={14} /> COPY
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>หมดอายุ: {new Date(coupon.expiry_date).toLocaleDateString("th-TH")}</span>
                            </div>
                            <span>เหลือ: {coupon.quantity - coupon.used_count} สิทธิ์</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div 
                    key={coupon.id} 
                    className="relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-orange-100 group"
                >
                    <div className="absolute top-0 right-0 p-20 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                    <div className="relative p-6 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">ส่วนลดพิเศษ</p>
                                    <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `฿${coupon.discount_value.toLocaleString()}`}
                                        <span className="text-lg font-bold text-slate-400 ml-1">OFF</span>
                                    </h3>
                                </div>
                                <div className="p-2 bg-white rounded-full shadow-sm text-orange-300 border border-orange-50">
                                    <TicketPercent size={24} />
                                </div>
                            </div>
                            
                            <p className="text-slate-600 text-sm mb-6 leading-relaxed line-clamp-2">
                                {coupon.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div 
                                onClick={() => copyCode(coupon.code)}
                                className="flex items-center justify-between bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-3 px-4 cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors group/code active:scale-95"
                                title="คลิกเพื่อคัดลอก"
                            >
                                <span className="font-mono font-bold text-lg text-slate-700 tracking-widest group-hover/code:text-orange-600">
                                    {coupon.code}
                                </span>
                                <div className="flex items-center gap-1 text-slate-400 group-hover/code:text-orange-500 text-xs font-bold">
                                    <Copy size={16} /> COPY
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>หมดอายุ: {new Date(coupon.expiry_date).toLocaleDateString("th-TH")}</span>
                                </div>
                                <span>เหลือ: {coupon.quantity - coupon.used_count} สิทธิ์</span>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- Flash Sale Products Section --- */}
        {saleProducts.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl animate-pulse shadow-sm">
                    <Zap size={28} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Flash Sale</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">ดีลเด็ด ลดแรง ห้ามพลาด!</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {saleProducts.map((item) => (
                <div key={item.id} className="relative group">
                    {/* Sale Badge */}
                    {/* <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                        <Zap size={10} fill="currentColor" /> SALE
                    </div> */}
                    
                    {/* Product Card Container */}
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden hover:border-red-100">
                        <ProductCard product={item} />
                    </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {coupons.length === 0 && saleProducts.length === 0 && (
            <div className="text-center py-32 opacity-60">
                <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Tag size={40} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-600">ยังไม่มีโปรโมชั่นในขณะนี้</h3>
                <p className="text-slate-400 mt-2">โปรดติดตามโปรโมชั่นใหม่ๆ เร็วๆ นี้!</p>
            </div>
        )}

      </div>
    </div>
  );
}