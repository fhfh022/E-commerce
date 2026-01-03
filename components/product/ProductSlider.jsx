'use client'
import React, { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import Title from '../layout/Title'

const ProductSlider = ({ title, description, products, bgColor = "bg-white" }) => {
    const sliderRef = useRef(null);

    const slideLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollLeft -= 320;
        }
    };

    const slideRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollLeft += 320;
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <div className={`py-16 ${bgColor}`}>
            <div className='max-w-7xl mx-auto px-6 relative group'>
                <div className="mb-8 {}">
                    <Title title={title} description={description} visibleButton={true} href="/shop" />
                </div>

                {/* ปุ่มกด */}
                <button 
                    onClick={slideLeft} 
                    className='hidden md:flex absolute top-[60%] -left-4 z-10 bg-white border border-slate-100 p-3 rounded-full shadow-lg text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-30'
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={slideRight} 
                    className='hidden md:flex absolute top-[60%] -right-4 z-10 bg-white border border-slate-100 p-3 rounded-full shadow-lg text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95'
                >
                    <ChevronRight size={24} />
                </button>

                {/* Slider Container */}
                <div 
                    ref={sliderRef}
                    // ✅ 1. เพิ่ม items-stretch เพื่อดึงให้ทุกการ์ดสูงเท่ากัน
                    className='flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-10 -mx-6 px-6 md:mx-0 md:px-0 items-stretch' 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product, index) => (
                        // ✅ 2. เปลี่ยน min-w เป็น w-... (Fixed Width) เพื่อล็อคขนาดให้เท่ากันเป๊ะๆ
                        // ✅ 3. ใส่ h-auto เพื่อให้ยืดตามเพื่อนตัวที่สูงที่สุด
                        <div key={index} className='w-[280px] sm:w-[300px] flex-shrink-0 h-auto'>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductSlider