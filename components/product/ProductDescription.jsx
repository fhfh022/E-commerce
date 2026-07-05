"use client";
import { useState, useEffect } from "react";
import { Star, UserCircle, FileText, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ProductDescription = ({ product }) => {
  const [selectedTab, setSelectedTab] = useState("Specifications");
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const tabs = [
    { name: "Specifications", icon: <FileText size={18} /> },
    { name: "Reviews", icon: <MessageSquare size={18} /> },
  ];

  const specs = product.specs || {};

  const getDisplayString = () => {
    const size = specs.display_size || "";
    const detail = specs.display_specs || specs.display || "";
    return [size, detail].filter(Boolean).join(" ");
  };

  const formatPorts = (value) => {
    if (!value) return "-";
    const parts = value.split(/(?:,?\s+)(?=\d+x)/g);
    if (parts.length <= 1) return value;
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        {parts.map((part, index) => (
          <span key={index} className="flex items-center gap-2 text-slate-600">
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
            {part.trim()}
          </span>
        ))}
      </div>
    );
  };

  // ✅ เพิ่ม Wireless, Bluetooth, Network ตามที่ขอ
  const specList = [
    { label: "Brand", value: product.brand },
    { label: "Model", value: product.model },
    { label: "Processor", value: specs.processor },
    { label: "Graphics", value: specs.graphics },
    { label: "Memory (RAM)", value: specs.ram },
    { label: "Storage", value: specs.storage },
    { label: "Display", value: getDisplayString() },
    { label: "Ports", value: formatPorts(specs.ports) },
    { label: "Battery", value: specs.battery },
    { label: "Wireless", value: specs.wireless },   // ✅ เพิ่ม
    { label: "Bluetooth", value: specs.bluetooth }, // ✅ เพิ่ม
    { label: "Network (LAN)", value: specs.network }, // ✅ เพิ่ม
    { label: "OS", value: specs.os },
    { label: "Weight", value: specs.weight },
  ];

  // Logic เดิมของพี่ (ไม่แตะต้อง)
  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("reviews")
        .select(`*, user:users(name, avatar)`)
        .eq("product_id", product.id)
        .order("created_at", { ascending: false });
      if (data) setReviews(data);
    };
    fetchReviews();
  }, [product.id]);

  useEffect(() => {
    if (reviews.length >= 2) {
      const fetchSummary = async () => {
        setIsSummarizing(true);
        try {
          const res = await fetch("/api/reviews/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id })
          });
          const data = await res.json();
          if (data.summary) {
            setSummary(data.summary);
          }
        } catch (e) {
          console.error("Failed to fetch summary", e);
        } finally {
          setIsSummarizing(false);
        }
      };
      fetchSummary();
    } else {
      setSummary(null);
    }
  }, [reviews, product.id]);

  return (
    <div className="mx-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto my-10 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-100/50 overflow-hidden">
        
        {/* --- Top Tabs Header (UI ใหม่) --- */}
        <div className="flex items-center gap-8 border-b border-slate-100 px-6 md:px-10 pt-8 overflow-x-auto no-scrollbar bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setSelectedTab(tab.name)}
              className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap ${
                selectedTab === tab.name
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* --- Content Area --- */}
        <div className="p-4 md:p-8 min-h-[240px]">
          
          {/* 1. Specifications Content */}
          {selectedTab === "Specifications" ? (
            <div className="grid grid-cols-1 gap-y-0">
              {specList.map((item, index) => (
                item.value && (
                    <div
                    key={index}
                    className="group flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-50 last:border-0 transition-colors px-0"
                    >
                    <span className="w-36 text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0 mb-1 sm:mb-0 pt-1 pr-4">
                        {item.label}
                    </span>
                    <div className="font-medium text-slate-700 leading-tight break-words flex-1 text-sm">
                        {item.value}
                    </div>
                    </div>
                )
              ))}
            </div>
          ) : (
            /* 2. Reviews Content */
            <div className="space-y-8">
              {/* Rating Summary (UI ใหม่) */}
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-black text-slate-900">
                    {reviews.length > 0
                      ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="flex text-orange-400 text-sm justify-center sm:justify-start my-2 gap-1">
                    {Array(5).fill("").map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < Math.round(reviews.reduce((a, b) => a + b.rating, 0) / (reviews.length || 1)) ? "#fb923c" : "transparent"}
                          className={i < Math.round(reviews.reduce((a, b) => a + b.rating, 0) / (reviews.length || 1)) ? "text-orange-400" : "text-slate-300"}
                        />
                      ))}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    จากทั้งหมด {reviews.length} รีวิว
                  </p>
                </div>
                <div className="hidden sm:block h-16 w-px bg-slate-200 mx-4"></div>
                <p className="text-sm text-slate-500 max-w-sm text-center sm:text-left leading-relaxed">
                  ความคิดเห็นจากลูกค้าที่ซื้อสินค้าจริง การรีวิวช่วยให้ผู้ซื้อคนอื่นตัดสินใจได้ง่ายขึ้น
                </p>
              </div>

              {/* AI Summary Box */}
              {isSummarizing && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-3xl animate-pulse flex items-center justify-center gap-3">
                  <Loader2 className="text-indigo-500 animate-spin" size={20} />
                  <span className="text-sm font-semibold text-indigo-600">AI กำลังประมวลผลสรุปรีวิว...</span>
                </div>
              )}

              {!isSummarizing && summary && (
                <div className="bg-gradient-to-tr from-indigo-50/80 to-purple-50/80 border border-indigo-100/60 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-indigo-600 animate-pulse" size={20} />
                    <h4 className="font-bold text-slate-800 text-base">สรุปรีวิวด้วย AI (AI Summary)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h5 className="font-bold text-green-600 text-sm mb-2">🟢 จุดเด่น</h5>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {summary.pros?.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                        {(!summary.pros || summary.pros.length === 0) && <li>ไม่มีข้อมูลจุดเด่นที่เด่นชัด</li>}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-bold text-red-600 text-sm mb-2">🔴 จุดด้อย / ข้อสังเกต</h5>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {summary.cons?.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                        {(!summary.cons || summary.cons.length === 0) && <li>ไม่มีข้อกังวลที่เด่นชัด</li>}
                      </ul>
                    </div>
                  </div>
                  
                  {summary.overall && (
                    <div className="border-t border-slate-200/60 pt-3">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">ภาพรวม</p>
                      <p className="text-sm text-slate-700 leading-relaxed italic">"{summary.overall}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews List (UI ใหม่) */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {reviews.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl">
                    <MessageSquare size={48} className="mx-auto text-slate-200 mb-3"/>
                    <p className="text-slate-400 font-medium">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                    <p className="text-slate-300 text-xs mt-1">เป็นคนแรกที่รีวิวสินค้านี้เลย!</p>
                  </div>
                ) : (
                  reviews.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex gap-5 p-6 rounded-3xl border border-slate-100 bg-white hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 group"
                    >
                      <div className="shrink-0">
                        {/* Logic แสดงรูปเดิมของพี่ */}
                        {item.user?.avatar ? (
                          <img
                            src={item.user.avatar}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all"
                            alt="User"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 ring-2 ring-slate-100">
                            <UserCircle size={28} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                                {item.user?.name || "Anonymous User"}
                            </p>
                            <div className="flex gap-0.5 mt-1">
                            {Array(5).fill("").map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    fill={i < item.rating ? "#fb923c" : "transparent"}
                                    className={i < item.rating ? "text-orange-400" : "text-slate-200"}
                                />
                            ))}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                            {new Date(item.created_at).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl">
                          {item.comment}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDescription;