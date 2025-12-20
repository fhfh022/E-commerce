'use client'
import { StarIcon, Heart } from 'lucide-react' // [เพิ่ม] Heart icon
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { assets } from "@/assets/assets"
import { useDispatch, useSelector } from 'react-redux' // [เพิ่ม] Hooks
import { supabase } from '@/lib/supabase' // [เพิ่ม] Supabase client
import { addFavorite, removeFavorite } from '@/lib/features/favorite/favoriteSlice' // [เพิ่ม] Actions
import { toast } from 'react-hot-toast' // [แนะนำ] ใช้ Toast แจ้งเตือน

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    // --- Redux & User Logic ---
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user); // ดึงข้อมูล User (ต้องมั่นใจว่า Login แล้ว)
    const favorites = useSelector(state => state.favorite.items); // ดึงรายการ ID ที่ชอบ
    const isFavorite = favorites.includes(product.id); // เช็คว่าสินค้านี้กดใจไว้หรือยัง
    // --- Toggle Favorite Function ---
    const toggleFavorite = async (e) => {
        e.preventDefault(); // สำคัญ: ป้องกันไม่ให้ Link ทำงาน (ไม่ให้เด้งไปหน้า Product)

        if (!user) {
            // ถ้ายังไม่ Login ให้แจ้งเตือน (หรือ redirect ไปหน้า login)
            return toast.error("Please login to favorite products");
        }

        try {
            if (isFavorite) {
                // 1. ลบออกจาก Database
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('product_id', product.id)
                    .eq('user_id', user.id);

                if (error) throw error;

                // 2. อัปเดต Redux UI ทันที
                dispatch(removeFavorite(product.id));
                toast.success("Removed from favorites");
            } else {
                // 1. เพิ่มลง Database
                const { error } = await supabase
                    .from('favorites')
                    .insert({ 
                        product_id: product.id, 
                        user_id: user.id 
                    });

                if (error) throw error;

                // 2. อัปเดต Redux UI ทันที
                dispatch(addFavorite(product.id));
                toast.success("Added to favorites");
            }
        } catch (err) {
            console.error("Favorite Error:", err);
            toast.error("Something went wrong");
        }
    };

    // --- Display Logic ---
    const rating = 4; // Fix ค่า Rating ไว้ก่อน
    const mainImage = product.images?.[0] || assets.upload_area || '/placeholder.png';

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto relative block'>
            
            {/* Image Container */}
            <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden relative'>
                
                {/* [✨ ปุ่มหัวใจ ✨] */}
                {/* <button 
                    onClick={toggleFavorite}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition active:scale-95 group/btn"
                >
                    <Heart 
                        size={18} 
                        className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400 group-hover/btn:text-red-400"}`} 
                    />
                </button> */}

                <Image 
                    width={500} 
                    height={500} 
                    className='max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300 object-contain p-4' 
                    src={mainImage} 
                    alt={product.name || "Product Image"} 
                />
            </div>
            
            {/* Details Container */}
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-3 max-w-60'>
                <div className='flex-1 overflow-hidden'>
                    {/* ชื่อสินค้า + รุ่น (บรรทัดเดียวกัน) */}
                    <p className='font-medium truncate pr-2'>
                        {product.name} 
                        {/* แสดง Model เฉพาะถ้ามีข้อมูล */}
                        {product.model && (
                            <span className="text-slate-500 font-normal ml-1.5 text-xs uppercase">
                                {product.model}
                            </span>
                        )}
                    </p>
                    
                    {/* Processor info (ถ้ามี) */}
                    {product.specs?.processor && (
                        <p className='text-xs text-slate-500 truncate mt-0.5'>
                            {product.specs.processor}
                        </p>
                    )}
                    
                    {/* Stars */}
                    <div className='flex items-center gap-1 mt-1'>
                        <div className='flex'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon 
                                    key={index} 
                                    size={14} 
                                    className='mt-0.5' 
                                    fill={rating >= index + 1 ? "#00C950" : "#E5E7EB"} 
                                    color={rating >= index + 1 ? "#00C950" : "#D1D5DB"}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Price */}
                <p className='font-semibold whitespace-nowrap text-slate-900'>
                    {currency}{Number(product.price).toLocaleString()}
                </p>
            </div>
        </Link>
    )
}

export default ProductCard