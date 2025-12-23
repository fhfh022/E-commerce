"use client";

import { addToCart } from "@/lib/features/cart/cartSlice";
import {
  addFavorite,
  removeFavorite,
} from "@/lib/features/favorite/favoriteSlice"; // เพิ่ม Action Favorite
import { supabase } from "@/lib/supabase"; // นำเข้า supabase client
// เพิ่ม Heart เข้ามาในกลุ่ม lucide-react
import {
  StarIcon,
  EarthIcon,
  CreditCardIcon,
  UserIcon,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast"; // แนะนำให้ใช้ toast เพื่อแจ้งเตือนผู้ใช้



const ProductDetails = ({ product }) => {
  const productId = product.id;
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const cart = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const router = useRouter();

  // --- ส่วนเพิ่ม: Favorite Logic ---
  const user = useSelector((state) => state.auth.user); // ดึงข้อมูล user จาก auth slice
  const favorites = useSelector((state) => state.favorite.items); // ดึงรายการ ID ที่ชอบ
  const isFavorite = favorites.includes(productId);

  const toggleFavoriteHandler = async () => {
    if (!user) {
      return toast.error("Please login to favorite products");
    }

    try {
      if (isFavorite) {
        // ลบออกจาก Database
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id);

        if (error) throw error;
        dispatch(removeFavorite(productId));
        toast.success("Removed from favorites");
      } else {
        // เพิ่มลง Database
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
  // ----------------------------

  const imageList = product.images || [];
  const [mainImage, setMainImage] = useState(imageList[0] || null);

  const averageRating = 4;
  const reviewCount = 0;

  const addToCartHandler = async () => {
    // 1. ส่งข้อมูลไปที่ Redux Store เพื่อให้ UI อัปเดตทันที (Optimistic UI)
    dispatch(addToCart({ productId: product.id, quantity: 1 }));

    // 2. ถ้า User ล็อกอินอยู่ ให้ส่งข้อมูลไปเก็บที่ Supabase ในตาราง 'cart'
    if (user) {
      const { data,error } = await supabase.from("cart").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity: 1,
        },
        { onConflict: "user_id, product_id" }
      ); // ป้องกันข้อมูลซ้ำ

      if (error) toast.error("Failed to sync cart to server");
    }

    toast.success("Added to cart!");
  };

  const price = Number(product.price);

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* --- Image Section --- */}
      <div className="flex max-sm:flex-col-reverse gap-3">
        <div className="flex sm:flex-col gap-3">
          {imageList.length > 0
            ? imageList.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className={`bg-slate-100 flex items-center justify-center size-26 rounded-lg cursor-pointer border ${
                    mainImage === image
                      ? "border-blue-500"
                      : "border-transparent"
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
              ))
            : null}
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
        </div>
      </div>

      {/* --- Details Section --- */}
      <div className="flex-1">
        {/* แก้ไขส่วนหัวข้อ: เพิ่ม Flex เพื่อจัดปุ่มหัวใจ */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-semibold text-slate-800">
            {product.name}
            {product.model && (
              <span className="text-xl text-slate-400 font-normal ml-2">
                {product.model}
              </span>
            )}
          </h1>

          {/* ปุ่มหัวใจในหน้ารายละเอียด */}
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

        <div className="flex items-center mt-2">
          {Array(5)
            .fill("")
            .map((_, index) => (
              <StarIcon
                key={index}
                size={14}
                className="mt-0.5"
                fill={averageRating >= index + 1 ? "#00C950" : "#E5E7EB"}
                color={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"}
              />
            ))}
          <p className="text-sm ml-3 text-slate-500">({reviewCount} Reviews)</p>
        </div>

        <div className="flex items-center my-6 gap-3 font-semibold text-slate-800">
          <p className="text-3xl">
            {" "}
            {currency}
            {price.toLocaleString()}{" "}
          </p>
        </div>

        <div className="flex items-center gap-5">
          {cart[productId] && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-800 font-semibold">Quantity</p>
              <Counter productId={productId} />
            </div>
          )}
          <button
            onClick={() =>
              !cart[productId] ? addToCartHandler() : router.push("/cart")
            }
            className="bg-slate-900 text-white px-10 py-3.5 text-sm font-bold rounded shadow-lg hover:bg-slate-800 active:scale-95 transition flex-1 sm:flex-none"
          >
            {!cart[productId] ? "Add to Cart" : "View Cart"}
          </button>
        </div>

        <hr className="border-gray-200 my-8" />

        <div className="flex flex-col gap-4 text-slate-500 text-sm">
          <p className="flex items-center gap-3">
            {" "}
            <EarthIcon size={18} className="text-slate-400" /> Free shipping
            worldwide{" "}
          </p>
          <p className="flex items-center gap-3">
            {" "}
            <CreditCardIcon size={18} className="text-slate-400" /> 100% Secured
            Payment{" "}
          </p>
          <p className="flex items-center gap-3">
            {" "}
            <UserIcon size={18} className="text-slate-400" /> Trusted by top
            brands{" "}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
