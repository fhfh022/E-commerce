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
      // ✅ ดึงข้อมูล Order ก่อน เพื่อเก็บข้อมูล discount
      const { data: orderBeforeUpdate, error: orderFetchError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderFetchError) {
        console.warn(`⚠️ Failed to fetch order ${orderId}: ${orderFetchError.message}`);
      } else {
        console.log(`✅ Order Data:`, {
          id: orderBeforeUpdate.id,
          discount_amount: orderBeforeUpdate.discount_amount,
          total_amount: orderBeforeUpdate.total_amount,
          payment_status: orderBeforeUpdate.payment_status,
        });
      }

      // --- STEP A: อัปเดตสถานะออเดอร์ (พร้อมเก็บข้อมูล discount ไว้) ---
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "processing", // หรือ 'paid' ตาม flow ของพี่
        })
        .eq("id", orderId);

      if (updateError) throw new Error(`Order Update Failed: ${updateError.message}`);

      // --- STEP B: ตัดสต็อกสินค้า ---
      // 1. ดึงรายการสินค้าในออเดอร์นี้
      const { data: orderItems, error: itemsFetchError } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (itemsFetchError) throw new Error(`Fetch Order Items Failed: ${itemsFetchError.message}`);

      // 2. ตัดสต็อกสำหรับสินค้าแต่ละรายการ
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // ดึงสต็อกปัจจุบัน
          const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("stock, in_stock")
            .eq("id", item.product_id)
            .single();

          if (productError) {
            console.warn(`⚠️ Product ${item.product_id} not found`);
            continue;
          }

          // คำนวณสต็อกใหม่
          const newStock = Math.max(0, (product.stock || 0) - item.quantity);
          const newInStock = newStock > 0 ? product.in_stock : false;

          // อัปเดตสต็อก
          const { error: updateStockError } = await supabaseAdmin
            .from("products")
            .update({ stock: newStock, in_stock: newInStock })
            .eq("id", item.product_id);

          if (updateStockError) {
            console.warn(`⚠️ Failed to update stock for product ${item.product_id}: ${updateStockError.message}`);
          } else {
            console.log(`✅ Stock updated: Product ${item.product_id} - New Stock: ${newStock}`);
          }
        }
      }

    } catch (err) {
      console.error("❌ Error processing webhook:", err);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}