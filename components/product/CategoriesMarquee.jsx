import React from 'react';

// รายชื่อแบรนด์ (พี่ชายสามารถเพิ่ม/ลบตรงนี้ได้เลย)
const BRANDS = [
    "ACER", "ASUS", "LENOVO", "HP", "DELL","MSI", "GIGABYTE"];

const CategoriesMarquee = () => {
    return (
        <div className="w-full max-w-7xl mx-auto mt-16 mb-24 px-6">
            
            {/* Header เล็กๆ */}
            <div className="text-center mb-10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Official Partners
                </p>
                <div className="w-12 h-1 bg-slate-200 mx-auto mt-3 rounded-full"></div>
            </div>

            <div className="overflow-hidden w-full relative select-none group py-2">
                
                {/* 🌟 Gradient Fade ด้านข้าง (บังขอบให้ดูเนียน) */}
                <div className="absolute left-0 top-0 h-full w-24 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
                <div className="absolute right-0 top-0 h-full w-24 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

                {/* แถบวิ่ง */}
                <div className="flex min-w-[200%] animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] items-center gap-6">
                    {/* Render ซ้ำ 3 ชุดเพื่อให้วิ่งวนได้ไม่ขาดตอน */}
                    {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, index) => (
                        <div 
                            key={index} 
                            className="
                                flex-shrink-0 px-8 py-3 
                                border border-slate-200 bg-white 
                                rounded-xl shadow-sm 
                                transition-all duration-300 cursor-pointer
                                hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-100 hover:-translate-y-1
                                group-hover:opacity-100 opacity-80
                            "
                        >
                            <span className="text-sm sm:text-base font-bold text-slate-600 group-hover:text-slate-800 tracking-wider">
                                {brand}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoriesMarquee;