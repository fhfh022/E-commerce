"use client";
import Counter from "@/components/product/Counter";
import OrderSummary from "@/components/product/OrderSummary";
import PageTitle from "@/components/layout/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import {
  Trash2Icon,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  
  // ✅ ดึง cartItems และ isLoaded จาก Redux
  const { cartItems, isLoaded } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);
  const user = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // --------------------------------------------------------------------------
  // ✅ Logic คำนวณราคาสินค้า (แก้ไขให้รองรับ Sale Price)
  // --------------------------------------------------------------------------
  const { cartArray, totalPrice } = React.useMemo(() => {
    if (!products || products.length === 0) {
      return { cartArray: [], totalPrice: 0 };
    }

    let currentTotal = 0;
    const newArray = [];

    if (cartItems && typeof cartItems === "object") {
      for (const [key, value] of Object.entries(cartItems)) {
        const product = products.find((p) => p.id === key);
        
        if (product) {
          // 🟢 เช็คว่ามีโปรโมชั่นหรือไม่
          const isOnSale = product.sale_price && product.sale_price > 0 && product.sale_price < product.price;
          // 🟢 ถ้าระบุราคา Sale ให้ใช้ราคา Sale, ถ้าไม่ ให้ใช้ราคาปกติ
          const priceToUse = isOnSale ? product.sale_price : product.price;

          // Push ข้อมูลที่คำนวณแล้วลง Array เพื่อเอาไปวนลูปแสดงผล
          newArray.push({ 
              ...product, 
              quantity: value,
              effectivePrice: priceToUse, // ราคาจริงที่ใช้คำนวณ (ลดแล้ว)
              isOnSale: isOnSale 
          });

          // บวกยอดรวมโดยใช้ราคาที่ถูกต้อง
          currentTotal += priceToUse * value;
        }
      }
    }

    return { cartArray: newArray, totalPrice: currentTotal };
  }, [cartItems, products]); 
  // --------------------------------------------------------------------------

  const handleDeleteItem = async () => {
    if (!productToDelete) return;
    try {
      dispatch(deleteItemFromCart({ productId: productToDelete }));
      if (user) {
        await supabase
          .from("cart")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productToDelete);
      }
      toast.success("สินค้าถูกลบแล้ว");
    } catch (error) {
      toast.error("ไม่สามารถลบสินค้าได้: " + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const isEmpty = !cartItems || Object.keys(cartItems).length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          ตะกร้าของคุณยังว่างเปล่า
        </h1>
        <p className="text-slate-500 max-w-sm mb-8">
          ดูเหมือนว่าคุณยังไม่ได้เพิ่มสินค้าลงในตะกร้า เริ่มช็อปปิ้งเพื่อค้นหาสินค้าที่คุณชื่นชอบกันเถอะ!
        </p>
        <Link
          href="/shop"
          className="group flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          ไปหน้าสินค้า{" "}
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    );
  }

  if (!isLoaded || products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <PageTitle
          heading="ตะกร้าสินค้า"
          text={`${cartArray.length} รายการ`}
          linkText="ไปหน้าสินค้า"
        />

        <div className="mt-6 sm:mt-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="w-full lg:flex-[2.5]">
            {/* Desktop Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 pb-6 border-b border-slate-100 text-[16px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-6">ข้อมูลสินค้า</div>
              <div className="col-span-3 text-center">จํานวน</div>
              <div className="col-span-2 text-right">ราคารวม</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-100">
              {cartArray.map((item) => (
                <div
                  key={item.id}
                  className="py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start sm:items-center relative"
                >
                  <div className="col-span-1 sm:col-span-6">
                    <div className="flex gap-4 sm:gap-5 items-start sm:items-center">
                      <Link
                        href={`/product/${item.id}`}
                        className="relative flex-shrink-0 bg-[#F5F5F5] size-24 sm:size-28 rounded-2xl flex items-center justify-center p-3 hover:opacity-90 transition"
                      >
                        <Image
                          src={item.images[0]}
                          fill
                          className="object-contain p-2"
                          alt={item.name}
                        />
                        {/* 🟢 แสดงป้าย Sale เล็กๆ บนรูปในตะกร้า */}
                        {item.isOnSale && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                                SALE
                            </span>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 pt-1 sm:pt-0">
                        <Link
                          href={`/product/${item.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition text-sm sm:text-lg block truncate"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 uppercase font-medium">
                          {item.brand} | {item.model}
                        </p>
                        
                        {/* 🟢 ส่วนแสดงราคาต่อชิ้น (อัปเดตใหม่) */}
                        <div className="mt-1.5">
                            {item.isOnSale ? (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                    <span className="text-red-600 font-bold text-sm sm:text-base">
                                        {currency}{Number(item.effectivePrice).toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-400 line-through decoration-slate-400">
                                        {currency}{Number(item.price).toLocaleString()}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-blue-600 font-bold text-sm sm:text-base">
                                    {currency}{Number(item.price).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <button
                          onClick={() => {
                            setProductToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="sm:hidden mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition"
                        >
                          <Trash2Icon size={12} /> ลบสินค้า
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-3 flex flex-col items-start sm:items-center mt-2 sm:mt-0">
                    <p className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                      จำนวน
                    </p>
                    <Counter productId={item.id} />
                  </div>

                  <div className="col-span-1 sm:col-span-2 text-right mt-[-40px] sm:mt-0">
                    <p className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                      ราคารวม
                    </p>
                    {/* 🟢 ราคารวมต่อรายการ (ใช้ effectivePrice คูณจำนวน) */}
                    <span className={`font-black text-base sm:text-lg ${item.isOnSale ? 'text-red-600' : 'text-slate-900'}`}>
                      {currency}{(item.effectivePrice * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  <div className="hidden sm:flex col-span-1 justify-end">
                    <button
                      onClick={() => {
                        setProductToDelete(item.id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    >
                      <Trash2Icon size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:flex-1 mt-4 lg:mt-0">
            {/* ส่ง totalPrice ที่คำนวณใหม่ไปให้ OrderSummary */}
            <OrderSummary totalPrice={totalPrice} items={cartArray} />
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                ยืนยันการลบสินค้า?
              </h3>
              <p className="text-slate-500 mt-2 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากตะกร้า? การดำเนินการนี้ไม่สามารถย้อนกลับได้.
              </p>
              <div className="grid grid-cols-1 gap-3 w-full mt-10">
                <button
                  onClick={handleDeleteItem}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                  ลบสินค้า
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}