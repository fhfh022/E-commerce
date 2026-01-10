"use client";
import { assets } from "@/assets/assets";
import {
  ArrowRightIcon,
  ChevronRightIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import CategoriesMarquee from "../product/CategoriesMarquee";
import Link from "next/link";

// ✅ 1. ย้าย words ออกมาไว้นอก Component เพื่อแก้ Error useEffect
const words = ["Carry.", "Trust.", "Unleash.", "Master."];

const Hero = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  // State สำหรับ Typing Animation
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Logic การพิมพ์ตัวอักษรทีละตัว
  useEffect(() => {
    const typingSpeed = isDeleting ? 50 : 150; // พิมพ์ช้า, ลบเร็ว
    const pauseTime = 2000; // หยุดรอ 2 วินาทีก่อนลบ

    const handleTyping = () => {
      const fullText = words[currentWordIndex];

      if (isDeleting) {
        setDisplayedText((prev) => fullText.substring(0, prev.length - 1));
      } else {
        setDisplayedText((prev) => fullText.substring(0, prev.length + 1));
      }

      if (!isDeleting && displayedText === fullText) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && displayedText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentWordIndex]); 

  return (
    <div className="mx-6">
      <div className="flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10">
        
        {/* 🟢 Left Side: Hero Banner */}
        <div className="relative flex-1 flex flex-col bg-green-50 rounded-3xl xl:min-h-100 group overflow-hidden border border-green-100 shadow-sm">
          {/* Background Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-200/50 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2"></div>

          <div className="p-5 sm:p-16 z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white border border-green-100 shadow-sm text-green-700 pr-4 p-1.5 rounded-full text-xs sm:text-sm mb-6 hover:scale-105 transition-transform cursor-default">
              <span className="bg-green-600 px-3 py-1 rounded-full text-white text-[10px] font-bold tracking-wider">
                NEW
              </span>
              <span className="font-medium">
                จัดส่งฟรีสำหรับคำสั่งซื้อมากกว่า ฿2,500!
              </span>
              <ChevronRightIcon className="text-green-400" size={16} />
            </div>

            {/* 🚀 Dynamic Typing Title */}
            <h2 className="text-4xl sm:text-6xl leading-[1.1] font-bold text-slate-800 max-w-md min-h-[140px] sm:min-h-[160px]">
              Power you can <br />
              <span
                className={`
            transition-all duration-300
            ${
              displayedText === "Master."
                ? "text-red-600 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] [text-shadow:_0_0_20px_#f87171,_0_0_30px_#ef4444]"
                : "bg-gradient-to-r from-green-600 to-emerald-400 bg-clip-text text-transparent"
            }
        `}
              >
                {displayedText}
              </span>
              <span className="ml-1 w-1 h-10 bg-slate-800 inline-block animate-pulse align-middle"></span>
            </h2>

            {/* 🔥 Enhanced CTA Button */}
            <Link href="/shop">
              <button className="group relative mt-8 sm:mt-10 overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-white shadow-xl shadow-green-200 transition-all hover:bg-slate-800 hover:scale-105 active:scale-95">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center gap-2 font-semibold text-sm tracking-wide">
                  ช้อปเลย{" "}
                  <ArrowRightIcon
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </button>
            </Link>
          </div>

          <Image
            className="w-[70%] mx-auto mt-auto sm:absolute sm:bottom-0 sm:right-2 sm:mt-0 sm:w-[45%] lg:w-[42%] xl:w-[45%] xl:max-w-[500px] xl:right-0 drop-shadow-xl transition-transform duration-700 group-hover:scale-105 z-0 pointer-events-none"
            src={assets.hero_model_img}
            alt="Hero Model"
          />
        </div>

        {/* 🟠 Right Side: Promo Cards (Updated Logic) */}
        <div className="flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm text-slate-600">
          
          {/* ✅ Card 1: Unleash Your Productivity (แทน Best Performers) */}
          <Link href="/collections/productivity" className="flex-1 flex items-center justify-between w-full bg-orange-50 border border-orange-100 rounded-3xl p-6 px-8 group hover:shadow-lg hover:shadow-orange-100 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/40 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-slate-800 max-w-40 leading-tight">
                Unleash <br />
                <span className="text-orange-500">Productivity</span>
              </p>
              <p className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-wide text-orange-600 group-hover:underline decoration-2 underline-offset-4">
                Work Anywhere{" "}
                <ArrowRightIcon
                  className="group-hover:translate-x-1 transition-all"
                  size={16}
                />
              </p>
            </div>
            <Image
              className="w-32 drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
              src={assets.hero_product_img1}
              alt="Productivity"
            />
          </Link>

          {/* ✅ Card 2: Master The Game (แทน 20% Discounts) */}
          <Link href="/collections/gaming-pro" className="flex-1 flex items-center justify-between w-full bg-blue-50 border border-blue-100 rounded-3xl p-6 px-8 group hover:shadow-lg hover:shadow-blue-100 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/40 rounded-full blur-2xl -ml-10 -mb-10"></div>
            <div className="relative z-10">
              <p className="text-2xl font-bold text-slate-800 max-w-40 leading-tight">
                Master <br />
                <span className="text-blue-500">The Game</span>
              </p>
              <p className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-wide text-blue-600 group-hover:underline decoration-2 underline-offset-4">
                Pro Choice{" "}
                <ArrowRightIcon
                  className="group-hover:translate-x-1 transition-all"
                  size={16}
                />
              </p>
            </div>
            <Image
              className="w-32 drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
              src={assets.hero_product_img2}
              alt="Gaming"
            />
          </Link>
        </div>
      </div>
      <CategoriesMarquee />
    </div>
  );
};

export default Hero;