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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "฿";
  const { cartItems, isLoaded } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);
  const user = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();
  const [cartArray, setCartArray] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isComputing, setIsComputing] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    if (isLoaded && products.length > 0) {
      let currentTotal = 0;
      const newArray = [];
      for (const [key, value] of Object.entries(cartItems)) {
        const product = products.find((p) => p.id === key);
        if (product) {
          newArray.push({ ...product, quantity: value });
          currentTotal += product.price * value;
        }
      }
      setTotalPrice(currentTotal);
      setCartArray(newArray);
      setIsComputing(false);
    } else if (isLoaded) {
      setIsComputing(false);
    }
  }, [cartItems, products, isLoaded]);

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
      toast.success("ลบสินค้าเรียบร้อย");
    } catch (error) {
      toast.error("ไม่สามารถลบสินค้าได้");
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  if (!isLoaded || isComputing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // ✅ Layout ตอนไม่มีสินค้าในตะกร้า (Improved Empty State)
  if (cartArray.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="size-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Your Cart is Empty
        </h1>
        <p className="text-slate-500 max-w-sm mb-8">
            Looks like you haven't added any items to your cart yet. 
            Start shopping to add some items to your cart.
        </p>
        <Link
          href="/shop"
          className="group flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Go to Shop{" "}
          <ArrowRight
            size={20}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ✅ ปรับ Padding ซ้าย-ขวาให้เล็กลงในมือถือ (px-4) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <PageTitle
          heading="My Cart"
          text={`${cartArray.length} items`}
          linkText="Add more"
        />

        <div className="mt-6 sm:mt-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* รายการสินค้า */}
          <div className="w-full lg:flex-[2.5]">
            {/* Desktop Header (ซ่อนในมือถือ) */}
            <div className="hidden sm:grid grid-cols-12 gap-4 pb-6 border-b border-slate-100 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <div className="col-span-6">Product Information</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total Price</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-100">
              {cartArray.map((item) => (
                <div
                  key={item.id}
                  className="py-6 sm:py-8 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start sm:items-center relative"
                >
                  {/* ส่วนข้อมูลสินค้า (รูป + ชื่อ + ปุ่มลบ) */}
                  <div className="col-span-1 sm:col-span-6">
                    <div className="flex gap-4 sm:gap-5 items-start sm:items-center">
                      {/* ✅ ปรับขนาดรูปให้เล็กลงในมือถือ (size-24) และคงที่ใน Desktop */}
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
                        <p className="text-blue-600 font-bold mt-1.5 text-sm sm:text-base">
                          ฿{Number(item.price).toLocaleString()}
                        </p>

                        {/* ✅ ปุ่ม Remove Item ตามตัวอย่าง */}
                        <button
                          onClick={() => {
                            setProductToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="sm:hidden mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition"
                        >
                          <Trash2Icon size={12} /> Remove Item
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ✅ ตัวนับจำนวน - จัดวางชิดซ้ายในมือถือตามตัวอย่าง */}
                  <div className="col-span-1 sm:col-span-3 flex flex-col items-start sm:items-center mt-2 sm:mt-0">
                    <p className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                      Quantity
                    </p>
                    <Counter productId={item.id} />
                  </div>

                  {/* ✅ ราคารวม - จัดวางชิดขวาในมือถือ */}
                  <div className="col-span-1 sm:col-span-2 text-right mt-[-40px] sm:mt-0">
                    <p className="sm:hidden text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                      Total Price
                    </p>
                    <span className="font-black text-slate-900 text-base sm:text-lg">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* ปุ่มลบ (Desktop เท่านั้น) */}
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

          {/* Order Summary */}
          <div className="w-full lg:flex-1 mt-4 lg:mt-0">
            <OrderSummary totalPrice={totalPrice} items={cartArray} />
          </div>
        </div>
      </div>

      {/* Modal ยืนยันการลบ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Remove Item?
              </h3>
              <p className="text-slate-500 mt-2 leading-relaxed">
                Are you sure you want to remove this item from your cart? This
                action cannot be undone.
              </p>
              <div className="grid grid-cols-1 gap-3 w-full mt-10">
                <button
                  onClick={handleDeleteItem}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-100 active:scale-95"
                >
                    Yes, Remove
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 bg-white text-slate-400 font-bold rounded-2xl hover:text-slate-600 transition-all active:scale-95"
                >
                 Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
