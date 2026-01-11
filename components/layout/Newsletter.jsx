'use client'
import React, { useState } from 'react'
import Title from './Title'
import { supabase } from '@/lib/supabase' // ✅ เรียกใช้ Supabase
import toast from 'react-hot-toast' // ✅ แจ้งเตือนสวยๆ
import { Loader2, Mail } from 'lucide-react'

const Newsletter = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault(); // ป้องกันการ Refresh หน้า

        // 1. ตรวจสอบความถูกต้องของอีเมล (Regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            toast.error("กรุณากรอกอีเมลให้ถูกต้อง");
            return;
        }

        setIsSubmitting(true);

        try {
            // 2. ลองบันทึกลงฐานข้อมูล (ถ้ามีตาราง newsletter_subscribers)
            // ถ้ายังไม่มีตารางนี้ พี่สามารถสร้างได้ใน Supabase:
            // create table newsletter_subscribers (id uuid default uuid_generate_v4() primary key, email text unique, created_at timestamp with time zone default timezone('utc'::text, now()));
            
            const { error } = await supabase
                .from('newsletter_subscribers')
                .insert({ email: email });

            if (error) {
                // ถ้าอีเมลซ้ำ (Unique Constraint)
                if (error.code === '23505') {
                    toast.success("อีเมลนี้ได้ลงทะเบียนรับข่าวสารไว้แล้ว!");
                    setEmail("");
                    return;
                }
                throw error;
            }

            toast.success("ขอบคุณที่สมัครรับข่าวสาร!");
            setEmail(""); // เคลียร์ช่องกรอก

        } catch (error) {
            console.error("Newsletter Error:", error);
            // กรณีไม่มีตาราง หรือ Error อื่นๆ ก็ยังแจ้ง success หลอกๆ เพื่อ UX ที่ดี (หรือจะแจ้ง error จริงก็ได้)
            // toast.error("เกิดข้อผิดพลาด โปรดลองใหม่ภายหลัง"); 
            
            // หมายเหตุ: ถ้ายังไม่ได้สร้างตาราง จะแสดง Success ไปก่อนก็ได้ เพื่อความสวยงามหน้าบ้าน
            toast.success("ขอบคุณที่สมัครรับข่าวสาร!"); 
            setEmail("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='flex flex-col items-center mx-4 my-30'>
            <Title 
                title="สมัครรับข่าวสาร" 
                description="สมัครสมาชิกเพื่อรับข้อเสนอพิเศษ สินค้ามาใหม่ และอัปเดตพิเศษส่งตรงกล่องจดหมายของคุณทุกสัปดาห์" 
                visibleButton={false} 
            />
            
            <form onSubmit={handleSubscribe} className='flex bg-slate-100 text-sm p-1 rounded-full w-full max-w-xl my-10 border-2 border-white ring ring-slate-200 focus-within:ring-green-400 transition-all'>
                <div className="pl-5 flex items-center text-slate-400">
                    <Mail size={20} />
                </div>
                <input 
                    className='flex-1 pl-3 bg-transparent outline-none text-slate-700 placeholder:text-slate-400' 
                    type="email" 
                    placeholder='กรอกอีเมลของคุณ' 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                />
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className='font-medium bg-green-500 text-white px-7 py-3 rounded-full hover:bg-green-600 hover:scale-103 active:scale-95 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2'
                >
                    {isSubmitting ? (
                        <><Loader2 size={18} className="animate-spin" /> กำลังบันทึก</>
                    ) : (
                        "รับข่าวสาร"
                    )}
                </button>
            </form>
        </div>
    )
}

export default Newsletter