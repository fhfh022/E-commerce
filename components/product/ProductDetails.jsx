"use client";

import { addToCart } from "@/lib/features/cart/cartSlice";
import {
  addFavorite,
  removeFavorite,
} from "@/lib/features/favorite/favoriteSlice";
import { supabase } from "@/lib/supabase";
import {
  StarIcon,
  EarthIcon,
  CreditCardIcon,
  UserIcon,
  Heart,
  AlertCircle,
  Eye,
  Truck,
  Ban // เพิ่ม icon Ban สำหรับสถานะไม่พร้อมจำหน่าย
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const ProductDetails = ({ product }) => {
  const productId = product.id;
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const cart = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector((state) => state.auth.user);
  const favorites = useSelector((state) => state.favorite.items);
  const isFavorite = favorites.includes(productId);

  // Logic คำนวณส่วนลด
  const isOnSale = product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = isOnSale ? product.sale_price : product.price;

  const [ratingStats, setRatingStats] = useState({
    average: 0,
    count: 0,
  });
  
  // 🔥 ลูกเล่น: สุ่มจำนวนคนดูเพื่อกระตุ้นความอยากซื้อ (Social Proof)
  const [viewers, setViewers] = useState(3);
  useEffect(() => {
    setViewers(Math.floor(Math.random() * 10) + 5);
  }, []);

  useEffect(() => {
    const fetchRatingStats = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", productId);

        if (error) throw error;

        if (data && data.length > 0) {
          const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
          const average = totalRating / data.length;
          setRatingStats({ average: average, count: data.length });
        } else {
          setRatingStats({ average: 0, count: 0 });
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };

    if (productId) {
      fetchRatingStats();
    }
  }, [productId]);

  const toggleFavoriteHandler = async () => {
    if (!user) return toast.error("Please login to favorite products");

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id);

        if (error) throw error;
        dispatch(removeFavorite(productId));
        toast.success("ลบออกจากสินค้าที่ชื่นชอบแล้ว");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ product_id: productId, user_id: user.id });

        if (error) throw error;
        dispatch(addFavorite(productId));
        toast.success("เพิ่มไปยังสินค้าที่ชื่นชอบแล้ว");
      }
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถอัปเดตรายการโปรดได้");
    }
  };

  const currentQtyInCart = cart[productId] || 0;
  const realStock = product.stock || 0;
  
  // ✅ แก้ไข Logic: เช็คทั้ง in_stock และ จำนวนสินค้า
  const isAvailable = product.in_stock && realStock > 0;

  const addToCartHandler = async () => {
    // ✅ แจ้งเตือนแยกกรณี
    if (!product.in_stock && realStock > 0) {
        return toast.error("สินค้านี้ยังไม่พร้อมจำหน่ายในขณะนี้");
    }
    if (realStock <= 0) {
        return toast.error("ขออภัย สินค้าหมดชั่วคราว");
    }
    
    if (currentQtyInCart + 1 > realStock)
      return toast.error(`ขออภัย! เหลือสินค้าเพียง ${realStock} ชิ้น`);

    dispatch(addToCart({ productId: product.id, quantity: 1 }));

    if (user) {
      const { error } = await supabase
        .from("cart")
        .upsert(
          { user_id: user.id, product_id: product.id, quantity: 1 },
          { onConflict: "user_id, product_id" }
        );
      if (error) toast.error("ไม่สามารถซิงค์ตะกร้าสินค้ากับเซิร์ฟเวอร์ได้");
    }
    toast.success("เพิ่มสินค้าลงในตะกร้าแล้ว!");
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
          {product.name}
          {product.model && (
            <span className="block text-lg text-slate-400 font-normal mt-1">
              {product.model}
            </span>
          )}
        </h1>

        <button
          onClick={toggleFavoriteHandler}
          className="p-2.5 bg-white rounded-full hover:bg-red-50 transition shadow-sm border border-slate-100 active:scale-90"
        >
          <Heart
            size={22}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}
          />
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center mt-3 gap-3">
        <div className="flex items-center bg-green-50 px-2 py-1 rounded-md border border-green-100">
           <span className="font-bold text-green-700 mr-1">{ratingStats.average.toFixed(1)}</span>
           <StarIcon size={14} className="fill-green-500 text-green-500" />
        </div>
        <p className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-4">
          {ratingStats.count} Reviews
        </p>
      </div>

      {/* 🔥 Social Proof */}
      <div className="flex items-center gap-2 text-red-500 text-sm font-medium mt-4 bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
         <Eye size={16} />
         <span>มีคนกำลังดูสินค้านี้อยู่ {viewers} คน</span>
      </div>

      {/* Price Section */}
      <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        {isOnSale ? (
          <div className="flex flex-col">
            <div className="flex items-end gap-3 flex-wrap">
              <p className="text-4xl font-black text-slate-900">
                {currency}{currentPrice.toLocaleString()}
              </p>
              <p className="text-lg text-slate-400 line-through mb-1.5 font-medium">
                {currency}{Number(product.price).toLocaleString()}
              </p>
            </div>
            <div className="mt-2 inline-flex self-start px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
              Save {currency}{(product.price - product.sale_price).toLocaleString()}
            </div>
          </div>
        ) : (
          <p className="text-3xl font-bold text-slate-900">
            {currency}{Number(product.price).toLocaleString()}
          </p>
        )}
      </div>

      {/* Stock Status (✅ แก้ไข Logic การแสดงผล) */}
      <div className="mb-6">
        {isAvailable ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
             <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            มีสินค้า: {realStock} ชิ้น
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
            {realStock > 0 ? (
                // กรณีมีของ แต่ปิดสถานะการขาย
                <>
                    <Ban size={16} />
                    สินค้าไม่พร้อมจำหน่าย
                </>
            ) : (
                // กรณีของหมดจริง (Stock = 0)
                <>
                    <AlertCircle size={16} />
                    สินค้าหมดชั่วคราว
                </>
            )}
          </div>
        )}
      </div>

      {/* Add to Cart Button (✅ แก้ไขข้อความปุ่ม) */}
      <div className="flex flex-col gap-4">
        {cart[productId] && isAvailable && (
          <div className="w-full">
             <Counter productId={productId} stock={realStock} />
          </div>
        )}

        <button
          disabled={!isAvailable}
          onClick={() =>
            !cart[productId] ? addToCartHandler() : router.push("/cart")
          }
          className={`
              w-full py-4 text-sm font-bold rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95
              ${
                !isAvailable
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl"
              }
          `}
        >
          {!isAvailable
            ? (realStock > 0 ? "สินค้าไม่พร้อมจำหน่าย" : "สินค้าหมดชั่วคราว") 
            : !cart[productId]
            ? "เพิ่มลงตะกร้า"
            : "ไปที่ตะกร้าสินค้า"}
        </button>
      </div>

      <hr className="border-slate-100 my-6" />

      {/* Trust Signals */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">จัดส่งฟรีทั่วประเทศ</p>
            <p className="text-xs text-slate-500">เมื่อช้อปครบ {currency}999</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-full">
            <CreditCardIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">ชำระเงินปลอดภัย</p>
            <p className="text-xs text-slate-500">รองรับบัตรเครดิตและ PromptPay</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-full">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">รับประกันความพึงพอใจ</p>
            <p className="text-xs text-slate-500">คืนสินค้าได้ภายใน 7 วัน</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;