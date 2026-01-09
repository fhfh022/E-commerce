'use client'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Banner() {
    // เริ่มต้นเป็น false เพื่อป้องกันปัญหา Hydration Mismatch ระหว่าง Server และ Client
    const [isOpen, setIsOpen] = useState(false);
    const [coupon, setCoupon] = useState(null);

    useEffect(() => {
        // 1. ตรวจสอบใน localStorage ว่าผู้ใช้เคยปิดแบนเนอร์ไปหรือยัง
        const bannerStatus = localStorage.getItem('hidePromoBanner');
        
        // ถ้ายังไม่เคยปิด ให้ดึงข้อมูลคูปอง
        if (bannerStatus !== 'true') {
            const fetchPromoCoupon = async () => {
                try {
                    const { data } = await supabase
                        .from('coupons')
                        .select('code, discount_percent')
                        .eq('code', 'WELCOME')
                        .eq('is_active', true)
                        .maybeSingle(); // ใช้ maybeSingle เพื่อป้องกัน error ถ้าไม่เจอข้อมูล
                    
                    if (data) {
                        setCoupon(data);
                        setIsOpen(true); // แสดงแบนเนอร์เฉพาะเมื่อมีคูปองและยังไม่ถูกปิด
                    }
                } catch (error) {
                    console.error("Banner fetch error:", error);
                }
            };
            fetchPromoCoupon();
        }
    }, []);

    const handleClaim = () => {
        if (!coupon) return;
        
        // คัดลอกรหัสคูปอง
        navigator.clipboard.writeText(coupon.code);
        toast.success(`Coupon code "${coupon.code}" copied to clipboard!`);
        
        // บันทึกสถานะลง localStorage เพื่อไม่ให้แบนเนอร์แสดงอีก
        localStorage.setItem('hidePromoBanner', 'true');
        setIsOpen(false);
    };

    const handleClose = () => {
        // บันทึกสถานะการปิดลง localStorage
        localStorage.setItem('hidePromoBanner', 'true');
        setIsOpen(false);
    };

    // ถ้าไม่มีคูปอง หรือถูกสั่งปิด ไม่ต้อง Render
    if (!isOpen || !coupon) return null;

    return (
        <div 
            className={`
                w-full bg-gradient-to-r from-violet-600 via-[#9938CA] to-[#E0724A] text-white 
                overflow-hidden transition-all duration-500 ease-in-out shadow-sm relative z-50
                ${isOpen ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'}
            `}
        >
            <div className="px-4 sm:px-6 h-[50px] sm:h-[60px] flex items-center justify-center font-medium text-xs sm:text-sm">
                <div className='flex items-center justify-between w-full max-w-7xl mx-auto gap-4'>
                    
                    <p className="truncate">
                        Get <span className="font-bold text-yellow-300">{coupon.discount_percent}% OFF</span> on Your First Order! 
                        <span className="hidden sm:inline ml-1 text-white/90"> 
                            Use code: <span className="font-mono bg-white/20 px-2 py-0.5 rounded border border-white/10">{coupon.code}</span>
                        </span>
                    </p>

                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                        <button 
                            onClick={handleClaim} 
                            type="button" 
                            className="text-gray-900 bg-white px-4 sm:px-6 py-1.5 rounded-full text-[10px] sm:text-sm font-bold hover:bg-gray-100 active:scale-95 transition shadow-sm whitespace-nowrap"
                        >
                            Claim Offer
                        </button>
                        
                        <button 
                            onClick={handleClose} 
                            type="button" 
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}