'use client'
import { StarIcon, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { assets } from "@/assets/assets"
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from '@/lib/supabase'
import { addFavorite, removeFavorite } from '@/lib/features/favorite/favoriteSlice'
import { toast } from 'react-hot-toast'
import { useClerk } from "@clerk/nextjs";

// ✅ [แก้ไข 1] รับ prop 'hideLikeButton' เพิ่ม (default = false คือให้โชว์ปกติ)
const ProductCard = ({ product, hideLikeButton = false }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const { openSignIn } = useClerk();

    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const favorites = useSelector(state => state.favorite.items);
    const isFavorite = favorites.includes(product.id);

    const toggleFavorite = async (e) => {
        e.preventDefault();
        
        if (!user) {
            openSignIn();
            return;
        }

        try {
            if (isFavorite) {
                const { error } = await supabase.from('favorites').delete().eq('product_id', product.id).eq('user_id', user.id);
                if (error) throw error;
                dispatch(removeFavorite(product.id));
                toast.success("Removed from favorites");
            } else {
                const { error } = await supabase.from('favorites').insert({ product_id: product.id, user_id: user.id });
                if (error) throw error;
                dispatch(addFavorite(product.id));
                toast.success("Added to favorites");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        }
    };

    const rating = 4;
    const mainImage = product.images?.[0] || assets.upload_area || '/placeholder.png';

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto relative block'>
            
            <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center overflow-hidden relative'>
                
                {/* ✅ [แก้ไข 2] เช็คเงื่อนไข: ถ้า hideLikeButton เป็น false ถึงจะแสดงปุ่ม */}
                {!hideLikeButton && (
                    <button 
                        onClick={toggleFavorite}
                        className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition active:scale-95 group/btn"
                    >
                        <Heart 
                            size={18} 
                            className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400 group-hover/btn:text-red-400"}`} 
                        />
                    </button>
                )}

                <Image 
                    width={500} height={500} 
                    className='max-h-30 sm:max-h-40 w-auto group-hover:scale-110 transition duration-300 object-contain p-4' 
                    src={mainImage} 
                    alt={product.name || "Product Image"} 
                />
            </div>
            
            {/* ... (ส่วน Details ด้านล่างเหมือนเดิม) ... */}
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-3 max-w-60'>
                <div className='flex-1 overflow-hidden'>
                    <p className='font-medium truncate pr-2'>
                        {product.name} 
                        {product.model && <span className="text-slate-500 font-normal ml-1.5 text-xs uppercase">{product.model}</span>}
                    </p>
                    {product.specs?.processor && <p className='text-xs text-slate-500 truncate mt-0.5'>{product.specs.processor}</p>}
                    <div className='flex items-center gap-1 mt-1'>
                        <div className='flex'>
                            {Array(5).fill('').map((_, index) => (
                                <StarIcon key={index} size={14} className='mt-0.5' fill={rating >= index + 1 ? "#00C950" : "#E5E7EB"} color={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                            ))}
                        </div>
                    </div>
                </div>
                <p className='font-semibold whitespace-nowrap text-slate-900'>
                    {currency}{Number(product.price).toLocaleString()}
                </p>
            </div>
        </Link>
    )
}

export default ProductCard