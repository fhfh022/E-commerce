"use client";
import { useState, useEffect } from "react";
import { setCookie, getCookie } from "@/lib/cookies";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // เช็คว่าเคยยอมรับไปหรือยัง
    const consent = getCookie("prt_cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie("prt_cookie_consent", "true", 365); // เก็บไว้ 1 ปี
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    // ✅ แก้ตรงนี้: เปลี่ยนจาก md:right-8 เป็น md:left-8 เพื่อย้ายไปชิดซ้าย
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:right-auto md:left-8 md:max-w-sm animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          Cookies & Privacy
        </h3>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          เราใช้คุกกี้เพื่อเพิ่มประสบการณ์การใช้งานของคุณให้ดียิ่งขึ้น
          ศึกษารายละเอียดได้ที่{" "}
          <a href="/privacy-policy" className="text-indigo-600 underline">
            นโยบายความเป็นส่วนตัว
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-200"
          >
            ยอมรับทั้งหมด
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
