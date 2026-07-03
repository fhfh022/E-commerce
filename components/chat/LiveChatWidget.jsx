"use client";
import { useState, useEffect, useRef } from "react";
// ✅ เพิ่ม Image as ImageIcon สำหรับปุ่มอัปโหลด
import { MessageCircle, X, Send, Loader2, User, Image as ImageIcon } from "lucide-react"; 
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function LiveChatWidget() {
  const { user } = useUser();
  const pathname = usePathname();
  
  const role = useSelector((state) => state.user?.role);
  const isAdmin = role === "master_admin" || role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  
  // ✅ State และ Ref สำหรับการอัปโหลดรูป
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isOpenRef = useRef(isOpen);
  const scrollRef = useRef(null);

  // ✅ AI Auto-Greeting: ทักทายอัตโนมัติเมื่อเปิดแชทครั้งแรก (เฉพาะ User)
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isAdmin && user) {
      const timer = setTimeout(() => {
        // สร้างข้อความจำลอง (Mock Message) ขึ้นมาแสดงทันที
        setMessages([{
          id: 'welcome-msg',
          is_admin: true, // ให้เหมือน Admin เป็นคนส่ง
          content: `สวัสดีครับคุณ ${user.firstName || "ลูกค้า"}! 👋 มีสินค้าชิ้นไหนให้ PRT Assistant ช่วยแนะนำ หรือพบปัญหาการใช้งานสอบถามได้เลยนะครับ`,
          created_at: new Date().toISOString()
        }]);
      }, 800); // ดีเลย์นิดนึงให้ดูเป็นธรรมชาติ
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length, isAdmin, user]);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
        setHasUnread(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user && !isAdmin) {
      const initializeChat = async () => {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", user.id)
          .single();

        if (!dbUser) return;

        let { data: room } = await supabase
          .from("chat_rooms")
          .select("id")
          .eq("user_id", dbUser.id)
          .eq("status", "active")
          .single();

        if (room) {
          setRoomId(room.id);
          const { data: msgs } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("room_id", room.id)
            .order("created_at", { ascending: true });
          setMessages(msgs || []);
        }
      };
      initializeChat();
    }
  }, [isOpen, user, isAdmin]);

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase
      .channel(`widget_room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            if (!isOpenRef.current && payload.new.is_admin) {
                setHasUnread(true);
            }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ ฟังก์ชันอัปโหลดรูปภาพ
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat/${user.id}/${fileName}`;

      // 1. อัปโหลดไป Supabase Storage Bucket 'chat_images'
      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. ดึง Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      // 3. ส่ง URL เข้า API แชท
      await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ 
            image_url: publicUrl, 
            content: "ส่งรูปภาพ" // ใส่ข้อความกำกับไว้หน่อย
        }),
      });

    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      // เคลียร์ input file เพื่อให้เลือกรูปเดิมซ้ำได้ถ้าต้องการ
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !isUploading) return; // ถ้าไม่มีข้อความและไม่ได้โหลดรูป ให้หยุด
    
    const msgContent = input;
    setInput("");
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            body: JSON.stringify({ content: msgContent }),
        });
        const data = await response.json();
        if (!roomId && data.room_id) {
            setRoomId(data.room_id);
            setMessages([data]);
        }
    } catch (err) { console.error("Send error:", err); }
  };

  if (!user || isAdmin || pathname === "/chat") return null;

  const formatChatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatChatTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const today = new Date().toLocaleDateString("th-TH");
    const messageDate = date.toLocaleDateString("th-TH");
    const time = date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return today === messageDate ? time : `${time} · ${formatChatDate(dateString)}`;
  };

  const messagesWithDateMarkers = [];
  let lastMessageDate = "";
  messages.forEach((msg) => {
    const msgDate = formatChatDate(msg.created_at);
    if (msgDate && msgDate !== lastMessageDate) {
      messagesWithDateMarkers.push({
        id: `date-${msgDate}-${messagesWithDateMarkers.length}`,
        type: "date",
        label: msgDate,
      });
      lastMessageDate = msgDate;
    }
    messagesWithDateMarkers.push({ ...msg, type: "message" });
  });

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <div className="bg-white w-80 h-[480px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="size-8 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle size={18}/>
                    </div>
                    <span className="absolute bottom-0 right-0 size-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">ฝ่ายบริการลูกค้า</h3>
                    <p className="text-[10px] text-indigo-100 opacity-90">พร้อมให้ความช่วยเหลือเสมอ</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={18} /></button>
          </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
            {messages.length === 0 && (
              <div className="text-center text-xs text-slate-400 mt-10">
                <p>👋 สวัสดี! วันนี้เราจะช่วยคุณได้อย่างไรบ้าง?</p>
              </div>
            )}

            {messagesWithDateMarkers.map((m, i) => {
              if (m.type === "date") {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-[11px] font-bold shadow-sm">
                      {m.label}
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id || i} className={`flex w-full gap-2 ${m.is_admin ? "justify-start" : "justify-end"}`}>
                  {/* Avatar Admin */}
                  {m.is_admin && (
                    <div className="size-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 self-end mb-4 shadow-sm">
                      <MessageCircle size={12} className="text-indigo-600"/>
                    </div>
                  )}

                  <div className={`flex flex-col ${m.is_admin ? "items-start" : "items-end"} max-w-[80%]`}>
                    <div className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${
                      m.is_admin
                      ? "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                      : "bg-indigo-600 text-white rounded-tr-none"
                    }`}>
                      {/* ✅ แสดงรูปภาพถ้ามี */}
                      {m.image_url && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                          <img 
                            src={m.image_url} 
                            alt="attached" 
                            className="w-full h-auto max-h-40 object-cover cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(m.image_url, '_blank')}
                          />
                        </div>
                      )}
                      {m.content}
                    </div>
                            
                    <span className={`text-[10px] text-slate-400 mt-1 ${m.is_admin ? "ml-1" : "mr-1"}`}>
                      {formatChatTime(m.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
            </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            {/* ✅ ปุ่มเลือกรูปภาพ */}
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-indigo-600 transition p-1"
                disabled={isUploading}
            >
                {isUploading ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <ImageIcon size={20} />}
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
            />

            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isUploading ? "Uploading image..." : "Type a message..."}
                className="flex-1 text-xs outline-none bg-slate-100 px-4 py-2.5 rounded-full focus:ring-2 focus:ring-indigo-100 transition disabled:opacity-50"
                disabled={isUploading}
            />
            <button 
                disabled={(!input.trim() && !isUploading)} 
                className="size-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                <Send size={16} className={input.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>
      ) : (
        <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2 bg-indigo-600 text-white pl-4 pr-2 py-2 rounded-full shadow-xl hover:scale-105 hover:bg-indigo-700 transition-all active:scale-95"
        >
            <span className="text-sm font-bold pr-2 border-r border-indigo-500">แชทกับเรา</span>
            <div className="size-10 bg-indigo-500 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition">
                <MessageCircle size={24} />
            </div>
            {hasUnread && (
                <span className="absolute -top-1 -right-1 size-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                    <span className="size-1.5 bg-white rounded-full animate-ping"></span>
                </span>
            )}
        </button>
      )}
    </div>
  );
}