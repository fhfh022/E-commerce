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
                
                {/* หัวข้อ (Title) */}
                <div className="mb-8">
                    <Title title={title} description={description} visibleButton={true} href="/shop" />
                </div>

                {/* ✅ ปุ่มซ้าย (แสดงเฉพาะ Desktop + อยู่กึ่งกลางแนวตั้ง) */}
                <button 
                    onClick={slideLeft} 
                    className='hidden md:flex absolute top-1/2 -translate-y-1/2 -left-5 z-20 bg-white border border-slate-200 p-3 rounded-full shadow-lg text-slate-800 hover:bg-slate-50 hover:scale-110 transition-all duration-300 active:scale-95 disabled:opacity-50'
                    aria-label="Slide Left"
                >
                    <ChevronLeft size={24} />
                </button>

                {/* ✅ ปุ่มขวา (แสดงเฉพาะ Desktop + อยู่กึ่งกลางแนวตั้ง) */}
                <button 
                    onClick={slideRight} 
                    className='hidden md:flex absolute top-1/2 -translate-y-1/2 -right-5 z-20 bg-white border border-slate-200 p-3 rounded-full shadow-lg text-slate-800 hover:bg-slate-50 hover:scale-110 transition-all duration-300 active:scale-95 disabled:opacity-50'
                    aria-label="Slide Right"
                >
                    <ChevronRight size={24} />
                </button>

                {/* Slider Container */}
                <div 
                    ref={sliderRef}
                    className='flex gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-10 -mx-6 px-6 md:mx-0 md:px-0 items-stretch' 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {products.map((product, index) => (
                        // ✅ ใช้ w-[...] Fixed Width เพื่อให้การ์ดเท่ากันทุกใบ
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