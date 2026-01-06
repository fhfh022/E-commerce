"use client";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { assets } from "@/assets/assets";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import {
  addFavorite,
  removeFavorite,
} from "@/lib/features/favorite/favoriteSlice";
import { toast } from "react-hot-toast";
import { useClerk } from "@clerk/nextjs";

const ProductCard = ({ product, hideLikeButton = false }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const { openSignIn } = useClerk();

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const favorites = useSelector((state) => state.favorite.items);
  const isFavorite = favorites.includes(product.id);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openSignIn();
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("product_id", product.id)
          .eq("user_id", user.id);
        if (error) throw error;
        dispatch(removeFavorite(product.id));
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ product_id: product.id, user_id: user.id });
        if (error) throw error;
        dispatch(addFavorite(product.id));
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const mainImage = product.images?.[0] || assets.upload_area || "/placeholder.png";

  // ✅ FIX: แก้ Bug เลข 0 โผล่ โดยการเช็ค > 0 โดยตรงเพื่อให้ได้ค่า Boolean
  const isOnSale = product.sale_price > 0 && product.sale_price < product.price;
  
  const discountPercent = isOnSale
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  const generateSpecString = () => {
    const s = product.specs || {}; 
    const getFirstWord = (text) => text ? text.split(' ')[0] : null;

    const parts = [
      s.display_size ? `${s.display_size} inch` : null,
      s.processor,
      getFirstWord(s.ram),
      getFirstWord(s.storage),
      s.graphics,
    ];

    return parts.filter(Boolean).join(" / ");
  };

  const specString = generateSpecString();

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      <div className="group h-full flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative">
        
        {/* --- ส่วนรูปภาพ --- */}
        <div className="relative w-full aspect-square bg-slate-50 flex items-center justify-center overflow-hidden p-6">
          
          {/* ✅ เงื่อนไข isOnSale ตอนนี้เป็น Boolean แล้ว เลข 0 จะไม่หลุดมาตรงนี้แน่นอนครับ */}
          {isOnSale && (
            <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
              -{discountPercent}%
            </span>
          )}

          {!hideLikeButton && (
            <button
              onClick={toggleFavorite}
              className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition active:scale-95 group/btn opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
            >
              <Heart
                size={18}
                className={`transition-colors ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-slate-400 group-hover/btn:text-red-400"
                }`}
              />
            </button>
          )}

          <Image
            width={500}
            height={500}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-in-out"
            src={mainImage}
            alt={product.name || "Product Image"}
          />
        </div>

        {/* --- ส่วนเนื้อหา --- */}
        <div className="p-4 flex flex-col flex-1 gap-2"> 
          
          {/* Brand */}
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider truncate">
             {product.brand || "Device"}
          </p>

          {/* ชื่อสินค้า + Model */}
          <div className="mb-1">
            <h3 
                className="font-bold text-slate-800 text-sm sm:text-base leading-tight" 
                title={product.name}
            >
                {product.name}
            </h3>
            
            {product.model && (
                <span className="block text-xs font-semibold text-slate-500 mt-1">
                    {product.model}
                </span>
            )}
          </div>

          {/* Spec String */}
          <p className="text-xs text-slate-500 leading-relaxed">
            {specString || product.description || "View details for specifications"}
          </p>

          {/* ราคา */}
          <div className="mt-auto  border-t border-slate-50 flex items-center gap-2 flex-wrap">
            {isOnSale ? (
              <>
                <span className="font-bold text-red-600 text-base sm:text-lg">
                  {currency}{Number(product.sale_price).toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 line-through decoration-slate-400">
                  {currency}{Number(product.price).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="font-bold text-slate-900 text-base sm:text-lg">
                {currency}{Number(product.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;