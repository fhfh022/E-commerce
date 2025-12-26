// app/api/checkout/route.js
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { items, orderId, userEmail, discountAmount } = await request.json();

    // ✅ ดึง URL ปัจจุบัน (http://localhost:3000 หรือ domain จริง)
    const origin = request.headers.get('origin'); 

    const line_items = items.map((item) => ({
      price_data: {
        currency: "thb",
        product_data: {
          name: item.product?.name || item.name || "Product Name",
          images: item.product?.images ? [item.product.images[0]] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"],
      line_items,
      mode: "payment",
      metadata: { orderId },
      customer_email: userEmail,
      // ✅ ใช้ origin แทนตัวแปร env และเปลี่ยนชื่อให้ตรงกับหน้า orders
      success_url: `${origin}/orders?success=true&orderId=${orderId}`, 
      cancel_url: `${origin}/orders?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}