'use client'
import Hero from "@/components/layout/Hero";
import Newsletter from "@/components/layout/Newsletter";
import OurSpecs from "@/components/product/OurSpec"; // แก้ path ตามจริงนะพี่
import ProductSlider from "@/components/product/ProductSlider"; // Component ใหม่ที่เพิ่งสร้าง
import { useSelector } from 'react-redux';

export default function Home() {
    // ดึงข้อมูลสินค้าทั้งหมดจาก Redux
    const allProducts = useSelector(state => state.product.list);

    // --- LOGIC การแบ่งกลุ่มสินค้า ---

    // 1. Promotion Products (เอาที่มี sale_price > 0)
    const promotionProducts = allProducts.filter(p => p.sale_price && p.sale_price > 0);

    // 2. Best Selling (Logic ใหม่: สมมุติเรียงตามยอดขาย หรือถ้าไม่มี field นี้ ให้เรียงตาม Rating หรือ Price แทนไปก่อน)
    // *ถ้าพี่มี field 'sold' ใน Database ให้ใช้ b.sold - a.sold ครับ
    const bestSellingProducts = [...allProducts]
        .sort((a, b) => b.price - a.price) // ตัวอย่าง: เอาของแพงขึ้นก่อน (พี่เปลี่ยน logic ตรงนี้ได้เลย)
        .slice(0, 10); // เอาแค่ 10 ตัว

    // 3. Gaming Category
    const gamingProducts = allProducts.filter(p => p.category?.toLowerCase() === 'gaming');

    // 4. Ultrabook Category
    const ultrabookProducts = allProducts.filter(p => p.category?.toLowerCase() === 'ultrabook');

    return (
        <div>
            <Hero />
            
            {/* OurSpecs: เอาไว้ตรงนี้เพื่อบอกจุดเด่นร้านก่อนเลย */}
            <div className="border-b border-slate-100 bg-slate-50/50">
                 <OurSpecs />
            </div>

            {/* 1. PROMOTION (สำคัญสุดต้องเด่น) */}
            {promotionProducts.length > 0 && (
                <ProductSlider 
                    title="Flash Sale & Promotions" 
                    description="Grab these deals before they are gone!"
                    products={promotionProducts}
                    bgColor="bg-red-50/30" // ใส่พื้นหลังสีแดงจางๆ ให้ดูเป็นของร้อนแรง
                />
            )}

            {/* 2. BEST SELLING */}
            <ProductSlider 
                title="Best Selling Products" 
                description="Our most popular picks this week."
                products={bestSellingProducts}
            />

            {/* 3. GAMING LAPTOPS */}
            {gamingProducts.length > 0 && (
                <ProductSlider 
                    title="Gaming Beasts" 
                    description="High performance laptops for hardcore gamers."
                    products={gamingProducts}
                    bgColor="bg-slate-900 text-white"
                    textColor="text-white" // ลองเปลี่ยน Theme เป็นมืดสำหรับ Gaming (ต้องไปแก้ ProductSlider ให้รับ prop text color เพิ่มถ้าอยากเป๊ะ)
                />
            )}

            {/* 4. ULTRABOOKS */}
            {ultrabookProducts.length > 0 && (
                <ProductSlider 
                    title="Premium Ultrabooks" 
                    description="Thin, light, and powerful for professionals."
                    products={ultrabookProducts}
                    bgColor="bg-blue-50/30"
                />
            )}

            <Newsletter />
        </div>
    );
}