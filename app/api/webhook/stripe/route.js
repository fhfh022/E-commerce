import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ ใช้ Service Role Key เพื่อให้ Webhook มีสิทธิ์เข้าถึงและแก้ไขข้อมูลได้ทุกตาราง (ข้าม RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  
  // รองรับ Next.js เวอร์ชั่นใหม่
  const headerList = await headers();
  const signature = headerList.get("Stripe-Signature");

  let event;

  try {
    // 1. ตรวจสอบความถูกต้องของ Request ว่ามาจาก Stripe จริง
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // 2. ดึงข้อมูล Session
  const session = event.data.object;

  // 🟢 ทำงานเมื่อการจ่ายเงินสำเร็จ
  if (event.type === "checkout.session.completed") {
    const orderId = session.metadata.orderId; // รับ orderId ที่ส่งมาจาก route.js

    console.log(`🔔 Payment success for Order ID: ${orderId}`);

    try {
      // --- STEP A: อัปเดตสถานะออเดอร์ ---
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing", // หรือ 'paid' ตาม flow ของพี่
        })
        .eq("id", orderId);

      if (updateError) throw new Error(`Order Update Failed: ${updateError.message}`);

      // --- STEP B: ตัดสต็อกสินค้า (Optional) ---
      // (ใส่โค้ดตัดสต็อกตรงนี้ได้เลยตามที่เคยคุยกัน)

    } catch (err) {
      console.error("❌ Error processing webhook:", err);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}