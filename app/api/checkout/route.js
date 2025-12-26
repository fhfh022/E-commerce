import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { items, orderId, userEmail, discountAmount } = await request.json();

    // เตรียมข้อมูลสินค้าให้ Stripe
    const line_items = items.map((item) => ({
      price_data: {
        currency: "thb",
        product_data: {
          // เช็คว่ามี item.product ไหม ถ้าไม่มีให้ใช้ชื่อจาก item ตรงๆ
          name: item.product?.name || item.name || "Product Name",
          images: item.product?.images ? [item.product.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // สร้าง Session สำหรับจ่ายเงิน
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"],
      line_items,
      mode: "payment",
      // ใส่ส่วนลด (ถ้ามี) ในระดับ Metadata หรือใช้ Stripe Coupons ก็ได้
      // ในที่นี้เราจะหักลบจากราคาฝั่งเราก่อนส่งมา หรือใช้ metadata อ้างอิง
      metadata: { orderId },
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders?success=true&order_id=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
