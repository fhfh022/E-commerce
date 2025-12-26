import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
    // 1. รับค่า Body ในรูปแบบ Text สำหรับใช้ตรวจสอบ Webhook Signature
    const body = await req.text(); 
    
    // 2. ดึง Signature จาก Headers (Next.js 15+ ต้องใช้ await)
    const headerList = await headers();
    const signature = headerList.get("Stripe-Signature");

    let event;

    try {
        // 3. ตรวจสอบว่า Event นี้ส่งมาจาก Stripe จริงๆ (Security Check)
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Webhook Signature Error:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // 4. จัดการข้อมูลเมื่อการจ่ายเงินสำเร็จ
    const session = event.data.object;

    if (event.type === "checkout.session.completed") {
        const orderId = session.metadata.orderId;

        console.log(`🔔 Payment successful for Order: ${orderId}`);

        // 5. อัปเดตสถานะในตาราง orders เป็น paid และ status เป็น processing
        const { error } = await supabase
            .from("orders")
            .update({ 
                payment_status: "paid",
                status: "processing" 
            })
            .eq("id", orderId);

        if (error) {
            console.error("❌ Supabase Update Error:", error);
            return NextResponse.json({ error: "Database Update Failed" }, { status: 500 });
        }
        
        console.log(`✅ Order ${orderId} status updated to PAID & PROCESSING`);
    }

    // ตอบกลับ Stripe ว่าได้รับข้อมูลเรียบร้อยแล้ว
    return NextResponse.json({ received: true }, { status: 200 });
}