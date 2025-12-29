"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Send, Search, User, MessageCircle, Loader2,
  MoreVertical, Phone, Video, Image as ImageIcon, Paperclip, ArrowLeft
} from "lucide-react";
import Image from "next/image";
import ChatSkeleton from "@/components/chat/ChatSkeleton";

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const role = useSelector((state) => state.user?.role);
  const isAdmin = role === "master_admin" || role === "admin";

  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  // ✅ เพิ่ม State สำหรับรูปภาพ
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  

  useEffect(() => {
    if (isLoaded && !user) {
        router.push("/");
    }
  }, [isLoaded, user, router]);

  // ✅ AI Auto-Greeting (เฉพาะ User และยังไม่มีข้อความ)
  useEffect(() => {
    if (!isAdmin && messages.length === 0 && !loading && selectedRoomId) {
      const timer = setTimeout(() => {
        setMessages([{
          id: 'welcome-msg',
          is_admin: true,
          content: `สวัสดีครับคุณ ${user?.firstName || "ลูกค้า"}! 👋 มีสินค้าชิ้นไหนให้ PRT Assistant ช่วยแนะนำ หรือพบปัญหาการใช้งานสอบถามได้เลยนะครับ`,
          created_at: new Date().toISOString()
        }]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [messages.length, loading, selectedRoomId, isAdmin, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchInitData = async () => {
      setLoading(true);
      const { data: dbUser } = await supabase.from("users").select("id").eq("clerk_id", user.id).single();
      if (!dbUser) { setLoading(false); return; }

      if (isAdmin) {
        const { data: rooms } = await supabase.from("chat_rooms").select(`*, user:users(name, email, avatar)`).order("updated_at", { ascending: false });
        const customerRooms = (rooms || []).filter(room => room.user_id !== dbUser.id);
        setChatRooms(customerRooms);
        if (typeof window !== "undefined" && window.innerWidth > 768 && customerRooms.length > 0) {
            setSelectedRoomId(customerRooms[0].id);
        }
      } else {
        const { data: room } = await supabase.from("chat_rooms").select("id").eq("user_id", dbUser.id).single();
        if (room) { setSelectedRoomId(room.id); } 
        else {
          const { data: newRoom } = await supabase.from("chat_rooms").insert({ user_id: dbUser.id }).select().single();
          setSelectedRoomId(newRoom.id);
        }
      }
      setLoading(false);
    };
    fetchInitData();
    const roomChannel = supabase.channel("public:chat_rooms").on("postgres_changes", { event: "*", schema: "public", table: "chat_rooms" }, () => { if (isAdmin) fetchInitData(); }).subscribe();
    return () => supabase.removeChannel(roomChannel);
  }, [user, isLoaded, isAdmin]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("chat_messages").select("*").eq("room_id", selectedRoomId).order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();
    const msgChannel = supabase.channel(`room:${selectedRoomId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedRoomId}` }, (payload) => { setMessages((prev) => [...prev, payload.new]); }).subscribe();
    return () => supabase.removeChannel(msgChannel);
  }, [selectedRoomId]);

 

  // ✅ ฟังก์ชันอัปโหลดรูปภาพ
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedRoomId) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat/${user.id}/${fileName}`;

      // 1. Upload
      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(filePath);

      // 3. Insert Message Direct to DB
      const { data: sender } = await supabase.from("users").select("id").eq("clerk_id", user.id).single();
      
      await supabase.from("chat_messages").insert({
        room_id: selectedRoomId,
        sender_id: sender.id,
        content: "ส่งรูปภาพ",
        image_url: publicUrl, // ✅ บันทึก URL
        is_admin: isAdmin
      });

      await supabase.from("chat_rooms").update({ updated_at: new Date() }).eq("id", selectedRoomId);

    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !isUploading) || !selectedRoomId) return;
    
    const msgContent = input;
    setInput("");
    try {
        const { data: sender } = await supabase.from("users").select("id").eq("clerk_id", user.id).single();
        await supabase.from("chat_messages").insert({ 
            room_id: selectedRoomId, 
            sender_id: sender.id, 
            content: msgContent, 
            image_url: null,
            is_admin: isAdmin 
        });
        await supabase.from("chat_rooms").update({ updated_at: new Date() }).eq("id", selectedRoomId);
    } catch (err) { console.error("Send error:", err); }
  };

  if (!isLoaded || !user || loading) {
    return <ChatSkeleton />
  }
 
  const currentRoom = chatRooms.find(r => r.id === selectedRoomId);

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F1F5F9] flex items-center justify-center px-0 sm:px-4 py-4 md:py-8">
      
      <div className="flex w-full max-w-6xl h-full bg-white sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-200 relative transition-all">
        
        {/* Sidebar (Admin) */}
        {isAdmin && (
          <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-800 tracking-tight">Inbox ({chatRooms.length})</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {chatRooms.map(room => (
                      <div key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`p-3 rounded-xl cursor-pointer transition-all flex gap-3 items-center border border-transparent ${selectedRoomId === room.id ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'}`}>
                          <div className="size-11 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden relative shadow-inner">
                              {room.user?.avatar ? <Image src={room.user.avatar} width={44} height={44} alt="av" className="object-cover h-full w-full"/> : <User size={18} className="m-auto mt-2.5 text-slate-500"/>}
                              <span className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white rounded-full"></span>
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <h3 className={`font-bold text-xs truncate ${selectedRoomId === room.id ? 'text-indigo-900' : 'text-slate-800'}`}>{room.user?.name || "Guest"}</h3>
                                <span className="text-[9px] text-slate-400 font-medium">{new Date(room.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5 opacity-80 font-medium">Click to view chat history</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-white relative ${isAdmin && !selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
            {selectedRoomId ? (
                <>
                    {/* Header */}
                    <div className="h-16 px-4 md:px-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <button onClick={() => setSelectedRoomId(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={20}/></button>
                            )}
                            <div className="size-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border border-indigo-500/20">
                                <MessageCircle size={18}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm md:text-base leading-none">
                                    {isAdmin ? (currentRoom?.user?.name || "Customer") : "PRT Customer Support"}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                             <button className="p-2 hover:bg-slate-50 rounded-full transition-colors"><MoreVertical size={18}/></button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#F8FAFC]">
                        {messages.map((msg) => {
                            const isMe = isAdmin ? msg.is_admin : !msg.is_admin;
                            return (
                                <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start animate-in fade-in slide-in-from-left-2 duration-300"}`}>
                                    {/* Admin Avatar in User View / Customer Avatar in Admin View */}
                                    {!isMe && (
                                        <div className="size-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 self-end mb-4 shadow-sm mr-2">
                                            {isAdmin && currentRoom?.user?.avatar 
                                                ? <Image src={currentRoom.user.avatar} width={32} height={32} alt="av" className="rounded-full"/> 
                                                : <MessageCircle size={16}/>}
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] md:max-w-[70%]`}>
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${isMe ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none" : "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none font-medium"}`}>
                                            {/* ✅ แสดงรูปภาพ */}
                                            {msg.image_url && (
                                                <div className="mb-2 rounded-lg overflow-hidden">
                                                    <img 
                                                        src={msg.image_url} 
                                                        alt="sent image" 
                                                        className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-95 transition"
                                                        onClick={() => window.open(msg.image_url, '_blank')}
                                                    />
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                        <span className={`text-[10px] text-slate-400 mt-1 font-medium ${isMe ? "text-right mr-1" : "ml-1"}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto items-center">
                            {/* ✅ ปุ่มอัปโหลดรูป */}
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
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
                                placeholder={isUploading ? "Uploading..." : "Type a message..."}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                                disabled={isUploading}
                            />
                            <button 
                                disabled={(!input.trim() && !isUploading)} 
                                className="size-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition shadow-md active:scale-90 disabled:opacity-50 disabled:grayscale"
                            >
                                <Send size={18} className={input.trim() ? "translate-x-0.5 transition-transform" : ""} />
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                    <div className="size-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 text-indigo-300 shadow-inner border border-indigo-100"><MessageCircle size={40}/></div>
                    <h3 className="font-bold text-slate-800 text-lg">Your Conversations</h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-[200px] leading-relaxed">Select a chat from the inbox to start messaging with your customers.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}