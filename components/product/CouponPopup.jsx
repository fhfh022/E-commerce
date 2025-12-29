"use client";
import React, { useState, useEffect } from "react";
import { TicketPercent, X, Copy, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

export default function CouponPopup() {
  const { user } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        // Fetch เฉพาะคูปองที่ Active, ยังไม่หมดอายุ
        // และต้องมา Filter used_count < quantity ด้วย
        const { data } = await supabase
          .from("coupons")
          .select(
            "code, discount_value, discount_type, description, expiry_date, quantity, used_count"
          )
          .eq("is_active", true)
          .gte("expiry_date", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          // Filter เอาเฉพาะที่ยังไม่หมดสิทธิ์
          const availableCoupons = data.filter(
            (c) => c.used_count < c.quantity
          );
          if (availableCoupons.length > 0) {
            setCoupons(availableCoupons);
          } else {
            setIsVisible(false);
          }
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error("Coupon popup error:", error);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied code: ${code}`);
  };

  if (!isVisible || coupons.length === 0 || !user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
                    fixed right-0 top-1/2 -translate-y-1/2 z-[60]
                    bg-slate-900 text-white 
                    p-3 pl-4 rounded-l-2xl shadow-2xl 
                    hover:bg-slate-800 hover:pr-5 transition-all duration-300
                    flex flex-col items-center gap-1 group border-l border-y border-slate-700
                    ${
                      isOpen
                        ? "translate-x-full opacity-0"
                        : "translate-x-0 opacity-100"
                    }
                `}
      >
        <div className="relative">
          <TicketPercent
            size={28}
            className="text-yellow-400 group-hover:-rotate-12 transition-transform"
          />
          <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full border-2 border-slate-900">
            {coupons.length}
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
                    fixed top-0 right-0 z-[100] h-full w-full max-w-xs bg-white shadow-[0_0_50px_rgba(0,0,0,0.2)] 
                    transition-transform duration-300 ease-in-out border-l border-slate-100
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
      >
        <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg text-slate-900">
              <TicketPercent size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Available Coupons</h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-120px)] bg-slate-50/50">
          {coupons.map((coupon, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%`
                      : `฿${coupon.discount_value}`}
                  </span>
                  <span className="text-xs font-bold text-slate-500">OFF</span>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  {coupon.description}
                </p>
                {/* แสดงจำนวนคงเหลือ */}
                <p className="text-xs text-slate-400 mt-1">
                  Left: {coupon.quantity - coupon.used_count} /{" "}
                  {coupon.quantity}
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 font-mono text-sm font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded border border-dashed border-slate-300 text-center">
                    {coupon.code}
                  </div>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="bg-slate-900 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 w-full p-4 bg-white border-t border-slate-100">
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs text-slate-400 hover:text-red-500 w-full flex items-center justify-center gap-1 py-1"
          >
            <X size={12} /> Don't show again this session
          </button>
        </div>
      </div>
    </>
  );
}
