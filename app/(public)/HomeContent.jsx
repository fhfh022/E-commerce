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

    // 2. Best Selling
    const bestSellingProducts = [...allProducts]
        .sort((a, b) => b.price - a.price)
        .slice(0, 10);

    // 3. Gaming Category
    const gamingProducts = allProducts.filter(p => p.category?.toLowerCase() === 'gaming');

    // 4. Ultrabook Category
    const ultrabookProducts = allProducts.filter(p => p.category?.toLowerCase() === 'ultrabook');

    return (
        <div>
            <Hero />
            
            <div className="border-b border-slate-100 bg-slate-50/50">
                 <OurSpecs />
            </div>

            {/* 1. PROMOTION */}
            {promotionProducts.length > 0 && (
                <ProductSlider 
                    title="โปรโมชั่นและส่วนลดพิเศษ" 
                    description="คว้าโอกาสดีๆ เหล่านี้ก่อนที่จะหมด!"
                    products={promotionProducts}
                    bgColor="bg-red-50/30"
                />
            )}

            {/* 2. BEST SELLING */}
            <ProductSlider 
                title="สินค้าขายดี" 
                description="สินค้าที่ได้รับความนิยมสูงสุดสัปดาห์นี้"
                products={bestSellingProducts}
            />

            {/* 3. GAMING LAPTOPS */}
            {gamingProducts.length > 0 && (
                <ProductSlider 
                    title="เครื่องเกมมิ่งระดับตำนาน" 
                    description="แล็ปท็อปประสิทธิภาพสูงสำหรับเกมเมอร์ตัวยง"
                    products={gamingProducts}
                    // bgColor="bg-slate-900 text-white"
                />
            )}

            {/* 4. ULTRABOOKS */}
            {ultrabookProducts.length > 0 && (
                <ProductSlider 
                    title="อัลตร้าบุ๊คพรีเมียม" 
                    description="บาง เบา และทรงพลังสำหรับมืออาชีพ"
                    products={ultrabookProducts}
                    bgColor="bg-blue-50/30"
                />
            )}

            <Newsletter />
        </div>
    );
}