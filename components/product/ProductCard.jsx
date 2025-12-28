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

const ProductCard = ({
  product,
  hideLikeButton = false,
}) => {
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

  // Logic คำนวณส่วนลด
  const isOnSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
  const discountPercent = isOnSale 
    ? Math.round(((product.price - product.sale_price) / product.price) * 100) 
    : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative block w-full h-full" // ✅ เปลี่ยนเป็น w-full h-full เพื่อให้ยืดเต็ม Grid
    >
      {/* --- ส่วนรูปภาพ --- */}
      <div className="bg-[#F8F9FA] w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden relative border border-transparent group-hover:border-slate-200 transition-all">
        
        {/* ป้าย SALE */}
        {isOnSale && (
            <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                -{discountPercent}%
            </span>
        )}

        {/* ปุ่ม Favorite */}
        {!hideLikeButton && (
          <button
            onClick={toggleFavorite}
            className="absolute top-2 right-2 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition active:scale-95 group/btn opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-200"
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
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition duration-500 ease-in-out" // เพิ่ม padding ในรูปไม่ให้ชิดขอบ
          src={mainImage}
          alt={product.name || "Product Image"}
        />
      </div>

      {/* --- ส่วนรายละเอียด (แก้ตามรูป) --- */}
      <div className="pt-3 px-1 flex flex-col gap-1">
        {/* 1. ชื่อสินค้า */}
        <h3 className="font-bold text-slate-900 text-sm truncate" title={product.name}>
          {product.name}
        </h3>

        {/* 2. รายละเอียดสเปค (Description) [Cite: image_f0a2a5.png] */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2.5em]">
          {product.description || product.model || "No description available"}
        </p>

        {/* 3. ราคา (อยู่ล่างสุด) */}
        <div className="mt-auto flex items-center gap-2">
            {isOnSale ? (
                <>
                    <span className="font-bold text-red-600 text-base">
                        {currency}{Number(product.sale_price).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 line-through decoration-slate-400">
                        {currency}{Number(product.price).toLocaleString()}
                    </span>
                </>
            ) : (
                <span className="font-bold text-slate-900 text-base">
                    {currency}{Number(product.price).toLocaleString()}
                </span>
            )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;