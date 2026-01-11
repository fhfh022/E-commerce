"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ViewCounter({ blogId }) {
  useEffect(() => {
    if (!blogId) return;

    const incrementView = async () => {
      // ✅ วิธีที่ถูก: รับค่า error มาเช็คตรงๆ ไม่ต้องใช้ .catch()
      const { error } = await supabase.rpc('increment_blog_view', { blog_id: blogId });

      // ถ้ามี Error (เช่น ลืมสร้าง Function หรือเน็ตหลุด) ให้ใช้ Fallback แบบบ้านๆ
      if (error) {
         console.warn("RPC Error (View Count):", error.message);
         
         // Fallback: ดึงค่าเก่า +1 แล้วอัปเดต (กันเหนียว)
         const { data } = await supabase.from("blogs").select("views").eq("id", blogId).single();
         if (data) {
             await supabase.from("blogs").update({ views: (data.views || 0) + 1 }).eq("id", blogId);
         }
      }
    };

    incrementView();
  }, [blogId]);

  return null;
}