"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function AISearchPage() {
  const { user, isLoaded } = useUser(); // ✅ เพิ่ม isLoaded เพื่อเช็คว่า Clerk โหลดเสร็จยัง
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "สวัสดีครับ! ผมคือ PRT Assistant มีอะไรให้ผมช่วยเลือกโน้ตบุ๊กวันนี้ไหมครับ? เช่น 'แนะนำงบ 30,000' หรือ 'หาคอมเล่นเกมแรงๆ' ได้เลยครับ",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false); // สถานะ AI กำลังตอบ
  const [isHistoryLoading, setIsHistoryLoading] = useState(true); // ✅ สถานะโหลดประวัติแชท

  // ✅ ดึงประวัติแชทเมื่อหน้าโหลด และ User Login แล้ว
  useEffect(() => {
    if (!isLoaded) return; // ถ้า Clerk ยังไม่พร้อม ให้รอไปก่อน

    if (user) {
      const fetchHistory = async () => {
        setIsHistoryLoading(true); // เริ่มโหลด
        try {
          const res = await fetch("/api/ai-assistant");
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            const formattedHistory = data.history.map((msg) => ({
              role: msg.role,
              content: msg.content,
            }));
            setMessages(formattedHistory);
          }
        } catch (error) {
          console.error("Failed to load chat history", error);
        } finally {
          setIsHistoryLoading(false); // โหลดเสร็จแล้ว (ไม่ว่าจะสำเร็จหรือล้มเหลว)
        }
      };
      fetchHistory();
    } else {
      setIsHistoryLoading(false); // ถ้าไม่ได้ Login ก็ไม่ต้องโหลด ปิดไปเลย
    }
  }, [user, isLoaded]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();
      if (data.text) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text },
        ]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "ขออภัยครับ ระบบขัดข้องเล็กน้อย ลองใหม่อีกครั้งนะครับ",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20">
      <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="size-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 leading-none">
                  PRT Assistant
                </h1>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">
                  Online • AI Powered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F8F9FA]">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* ✅ ส่วนเช็ค Skeleton Loading */}
            {isHistoryLoading ? (
              // แสดง Skeleton 3 อันจำลองการโหลด
              [1, 2, 3].map((_, i) => (
                <div key={i} className="flex justify-start animate-pulse">
                  <div className="flex gap-3 max-w-[85%] w-full">
                    {/* Avatar Skeleton */}
                    <div className="size-8 bg-slate-200 rounded-lg flex-shrink-0" />
                    {/* Message Skeleton */}
                    <div className="p-4 bg-slate-200 rounded-2xl rounded-tl-none w-full space-y-2">
                       <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                       <div className="h-4 bg-slate-300 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // แสดงข้อความจริงเมื่อโหลดเสร็จ
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white"
                          : "bg-white border text-indigo-600 shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white rounded-tr-none"
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                      }`}
                    >
                      {msg.content.split("\n").map((line, i) => (
                        <p
                          key={i}
                          className={line ? "mb-1" : "mb-3 min-h-[10px]"}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading ตอน AI กำลังพิมพ์ตอบ */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <Loader2 size={16} className="text-indigo-500 animate-spin" />
                  <span className="text-xs font-medium text-slate-400">
                    PRT Assistant กำลังพิมพ์...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t p-4 sm:p-6">
          <form onSubmit={handleSend} className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                user
                  ? "พิมพ์คำถามของคุณที่นี่..."
                  : "กรุณาเข้าสู่ระบบเพื่อเริ่มใช้งาน AI Chat"
              }
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || !user || isHistoryLoading} // ✅ ปิดช่องพิมพ์ตอนโหลดประวัติด้วย
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || !user || isHistoryLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-50 active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
          {!user && (
            <p className="text-xs text-center text-red-400 mt-2">
              *ต้องเข้าสู่ระบบก่อนจึงจะสามารถใช้งานและบันทึกประวัติการแชทได้
            </p>
          )}
          <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
            AI อาจให้ข้อมูลที่คลาดเคลื่อน
            โปรดตรวจสอบรายละเอียดสินค้าอีกครั้งก่อนสั่งซื้อ
          </p>
        </div>
      </div>
    </div>
  );
}