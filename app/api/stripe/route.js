import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe"; // เดี๋ยวเราไปสร้างไฟล์นี้กันต่อ

export async function POST(request) {
  try {
    // 1. รับข้อมูลจากหน้าบ้าน (สินค้า, User, Order ID)
    const { products, orderId, userEmail } = await request.json();

    // 2. แปลงรายการสินค้าให้อยู่ในรูปแบบที่ Stripe เข้าใจ (Line Items)
    const line_items = products.map((item) => ({
      price_data: {
        currency: "thb", // สกุลเงินบาท
        product_data: {
          name: item.product.name, // ชื่อสินค้า
          images: [item.product.images[0]], // รูปภาพ (ถ้ามี)
        },
        unit_amount: Math.round(item.price * 100), // Stripe รับหน่วยสตางค์ (คูณ 100) และต้องเป็นจำนวนเต็ม
      },
      quantity: item.quantity,
    }));

    // 3. สร้าง Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"], // รองรับบัตร และ PromptPay (ถ้าเปิดใน Dashboard)
      line_items,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?success=true&orderId=${orderId}`, // จ่ายเสร็จไปหน้านี้
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?canceled=true`, // กดยกเลิกกลับมาหน้านี้
      customer_email: userEmail, // อีเมลลูกค้า (Stripe จะส่งใบเสร็จให้)
      metadata: {
        orderId: orderId, // 🔥 สำคัญมาก! แปะ Order ID ไว้เพื่อใช้ยืนยันตอน Webhook
      },
    });

    // 4. ส่ง URL กลับไปให้หน้าบ้านทำการ Redirect
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
