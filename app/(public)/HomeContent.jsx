'use client'
import Hero from "@/components/layout/Hero";
import Newsletter from "@/components/layout/Newsletter";
import OurSpecs from "@/components/product/OurSpec";
import ProductSlider from "@/components/product/ProductSlider";
import { useSelector } from 'react-redux';

export default function HomeContent() {
    // ดึงข้อมูลสินค้าทั้งหมดจาก Redux
    const allProducts = useSelector(state => state.product.list);

    // --- LOGIC การแบ่งกลุ่มสินค้า ---

    // 1. Promotion Products
    const promotionProducts = allProducts.filter(p => p.sale_price && p.sale_price > 0);

    // 2. Best Selling (สมมติว่า sort ตามราคา หรือ logic อื่น)
    const bestSellingProducts = [...allProducts]
        .sort((a, b) => b.price - a.price)
        .slice(0, 10);

    // 3. Gaming Category
    const gamingProducts = allProducts.filter(p => p.category?.toLowerCase() === 'gaming');

    // 4. Ultrabook Category
    const ultrabookProducts = allProducts.filter(p => p.category?.toLowerCase() === 'ultrabook');

    return (
        <div className="overflow-x-hidden"> {/* ป้องกัน scroll แนวนอนจาก animation */}
            <Hero />
            
            <div className="border-b border-slate-100 bg-slate-50/50">
                 <OurSpecs />
            </div>

            {/* 1. PROMOTION (Theme: Red/Pink - ตื่นเต้น) */}
            {promotionProducts.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <ProductSlider 
                        title="🔥 โปรโมชั่นและส่วนลดพิเศษ" 
                        description="คว้าโอกาสดีๆ เหล่านี้ก่อนที่จะหมด!"
                        products={promotionProducts}
                        bgColor="bg-gradient-to-r from-red-50 via-white to-pink-50 border-y border-red-100"
                    />
                </div>
            )}

            {/* 2. BEST SELLING (Theme: Gold/Orange - ยอดนิยม) */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                <ProductSlider 
                    title="🏆 สินค้าขายดี" 
                    description="สินค้าที่ได้รับความนิยมสูงสุดสัปดาห์นี้"
                    products={bestSellingProducts}
                    bgColor="bg-gradient-to-r from-orange-50 via-white to-yellow-50 border-y border-orange-100"
                />
            </div>

            {/* 3. GAMING LAPTOPS (Theme: Dark/Purple - ดุดัน เกมมิ่ง) */}
            {gamingProducts.length > 0 && (
                <div className="animate-in zoom-in-95 fade-in duration-1000 view-transition">
                    <ProductSlider 
                        title="🎮 เครื่องเกมมิ่งระดับตำนาน" 
                        description="แล็ปท็อปประสิทธิภาพสูงสำหรับเกมเมอร์ตัวยง"
                        products={gamingProducts}
                        // ใช้สีพื้นหลังแบบ Dark Mode + Gradient ม่วง
                        
                    />
                </div>
            )}

            {/* 4. ULTRABOOKS (Theme: Blue/Cyan - ทันสมัย พรีเมียม) */}
            {ultrabookProducts.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <ProductSlider 
                        title="💻 อัลตร้าบุ๊คพรีเมียม" 
                        description="บาง เบา และทรงพลังสำหรับมืออาชีพ"
                        products={ultrabookProducts}
                        
                    />
                </div>
            )}

            <Newsletter />
        </div>
    );
}