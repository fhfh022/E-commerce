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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
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

  // ✅ Logic คำนวณส่วนลด
  const isOnSale = product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = isOnSale ? product.sale_price : product.price;

  const [ratingStats, setRatingStats] = useState({
    average: 0,
    count: 0,
  });

  // 1. ดึงคะแนนรีวิว
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

  // 2. Favorite Toggle
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
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ product_id: productId, user_id: user.id });

        if (error) throw error;
        dispatch(addFavorite(productId));
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const imageList = product.images || [];
  const [mainImage, setMainImage] = useState(imageList[0] || null);

  const currentQtyInCart = cart[productId] || 0;

  // 3. Stock Logic
  const realStock = product.stock || 0;
  const isAvailable = product.in_stock && realStock > 0;

  const addToCartHandler = async () => {
    if (!product.in_stock)
      return toast.error("This product is currently unavailable.");
    if (currentQtyInCart + 1 > realStock)
      return toast.error(`Sorry! Only ${realStock} items left in stock.`);

    // ✅ Dispatch ข้อมูลลง Redux (CartSlice ของพี่น่าจะจัดการเรื่องราคาเอง หรือถ้าต้องการส่งราคาไปด้วย ให้เพิ่ม price: currentPrice ใน payload)
    // ปกติ cartSlice จะเก็บแค่ productId, qty แต่ถ้าต้องการเซฟราคา ณ ตอนกดซื้อด้วยอาจต้องแก้ slice
    // เบื้องต้นส่งไปแบบเดิมตามไฟล์ที่อัปโหลด
    dispatch(addToCart({ productId: product.id, quantity: 1 }));

    if (user) {
      const { error } = await supabase
        .from("cart")
        .upsert(
          { user_id: user.id, product_id: product.id, quantity: 1 },
          { onConflict: "user_id, product_id" }
        );
      if (error) toast.error("Failed to sync cart to server");
    }
    toast.success("Added to cart!");
  };

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* --- Image Section --- */}
      <div className="flex max-sm:flex-col-reverse gap-3">
        <div className="flex sm:flex-col gap-3">
          {imageList.length > 0 &&
            imageList.map((image, index) => (
              <div
                key={index}
                onClick={() => setMainImage(image)}
                className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg cursor-pointer border ${
                  mainImage === image ? "border-blue-500" : "border-transparent"
                }`}
              >
                <Image
                  src={image}
                  className="hover:scale-105 transition object-contain p-2"
                  alt=""
                  width={45}
                  height={45}
                />
              </div>
            ))}
        </div>

        <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg overflow-hidden relative">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.name}
              width={400}
              height={400}
              className="object-contain max-h-[80%] w-auto"
              priority
            />
          ) : (
            <div className="text-slate-400">No Image Available</div>
          )}
          {/* ✅ ป้าย SALE ใหญ่บนรูปหลัก */}
          {isOnSale && (
            <span className="absolute top-4 right-4 bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-lg z-10">
              SALE{" "}
              {Math.round(
                ((product.price - product.sale_price) / product.price) * 100
              )}
              %
            </span>
          )}
        </div>
      </div>

      {/* --- Details Section --- */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold text-slate-800">
            {product.name}
            {product.model && (
              <span className="text-xl text-slate-400 font-normal ml-2">
                {product.model}
              </span>
            )}
          </h1>

          <button
            onClick={toggleFavoriteHandler}
            className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition shadow-sm border border-slate-100 active:scale-90"
          >
            <Heart
              size={24}
              className={
                isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"
              }
            />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center mt-2">
          <div className="flex gap-1">
            {Array(5)
              .fill("")
              .map((_, index) => (
                <StarIcon
                  key={index}
                  size={14}
                  className="mt-0.5"
                  fill={ratingStats.average > index ? "#00C950" : "#E5E7EB"}
                  color={ratingStats.average > index ? "#00C950" : "#D1D5DB"}
                />
              ))}
          </div>
          <p className="text-sm ml-3 text-slate-500">
            ({ratingStats.count} Reviews)
          </p>
        </div>

        {/* Status */}
        <div className="mt-4 mb-2">
          {isAvailable ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
              <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
              In Stock: {realStock} items left
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
              <AlertCircle size={12} />
              {!product.in_stock ? "Unavailable" : "Out of Stock"}
            </span>
          )}
        </div>

        {/* ✅ Price Section (อัปเดตใหม่) */}
        <div className="my-6">
          {isOnSale ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-red-600">
                  {currency}
                  {currentPrice.toLocaleString()}
                </p>
                <p className="text-xl text-slate-400 line-through mb-1">
                  {currency}
                  {Number(product.price).toLocaleString()}
                </p>
              </div>
              <p className="text-sm font-semibold text-green-600">
                You save {currency}
                {(product.price - product.sale_price).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-3xl font-semibold text-slate-800">
              {currency}
              {Number(product.price).toLocaleString()}
            </p>
          )}
        </div>

        {/* Add to Cart */}
        <div className="flex items-center gap-4 mt-8">
          {cart[productId] && (
            <Counter productId={productId} stock={realStock} />
          )}

          <button
            disabled={!isAvailable}
            onClick={() =>
              !cart[productId] ? addToCartHandler() : router.push("/cart")
            }
            className={`
                h-[46px] px-8 text-sm font-bold rounded-lg shadow-md transition-all
                w-auto min-w-[160px] sm:min-w-[200px] flex items-center justify-center
                ${
                  !isAvailable
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                }
            `}
          >
            {!isAvailable
              ? !product.in_stock
                ? "Unavailable"
                : "Out of Stock"
              : !cart[productId]
              ? "Add to Cart"
              : "View Cart"}
          </button>
        </div>

        <hr className="border-gray-200 my-8" />

        <div className="flex flex-col gap-4 text-slate-500 text-sm">
          <p className="flex items-center gap-3">
            <EarthIcon size={18} className="text-slate-400" />
            บริการจัดส่งฟรีรวดเร็วทั่วประเทศ
          </p>
          <p className="flex items-center gap-3">
            <CreditCardIcon size={18} className="text-slate-400" />
            ระบบชำระเงินปลอดภัย มั่นใจ 100%
          </p>
          <p className="flex items-center gap-3">
            <UserIcon size={18} className="text-slate-400" />
            ทีมงานผู้เชี่ยวชาญพร้อมดูแลตลอด 24 ชม.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
