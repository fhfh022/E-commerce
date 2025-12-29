import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ รับ image_url เพิ่มเข้ามา
    const { content, image_url, is_admin = false } = await req.json();

    // 1. หา UUID ของ User จากตารางหลัก
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!dbUser) throw new Error("User not found");

    // 2. เช็คว่ามีห้องแชท (Active) อยู่หรือไม่ ถ้าไม่มีให้สร้างใหม่
    let { data: room } = await supabaseAdmin
      .from("chat_rooms")
      .select("id")
      .eq("user_id", dbUser.id)
      .eq("status", "active")
      .single();

    if (!room) {
      const { data: newRoom, error: roomError } = await supabaseAdmin
        .from("chat_rooms")
        .insert({ user_id: dbUser.id })
        .select()
        .single();
      if (roomError) throw roomError;
      room = newRoom;
    }

    // 3. บันทึกข้อความลงในห้องแชท (รองรับรูปภาพ)
    const { data: message, error: msgError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        room_id: room.id,
        sender_id: dbUser.id,
        content: content || "", // ข้อความอาจว่างได้ถ้าส่งแค่รูป
        image_url: image_url || null, // ✅ บันทึก URL รูปภาพ
        is_admin: is_admin
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return NextResponse.json(message);
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}