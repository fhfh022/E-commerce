import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const user = await currentUser();
    const { items, userEmail, discountAmount, orderId, addressId, onlyCreateOrder, couponCode } = await request.json();
    const origin = request.headers.get('origin');

    if (!user || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { data: dbUser } = await supabaseAdmin.from("users").select("id").eq("clerk_id", user.id).single();
    if (!dbUser) throw new Error("User not found in database");
    const supabaseUserId = dbUser.id;

    let targetOrderId = orderId;

    // ==========================================
    // 🟢 CASE 1: สร้างออเดอร์ใหม่ (New Checkout)
    // ==========================================
    if (!targetOrderId) {
        // เตรียมตัวแปรสำหรับเก็บรายการสินค้าที่ตรวจสอบราคาแล้ว
        let validatedItems = [];
        let calculatedTotal = 0;

        // 1.1 วนลูปตรวจสอบสต็อกและราคาจริงจาก DB (เพื่อความปลอดภัย)
        for (const item of items) {
            const productId = item.product?.id || item.id;
            
            // ดึงข้อมูล price, sale_price, stock จาก DB
            const { data: pd } = await supabaseAdmin
                .from("products")
                .select("price, sale_price, stock")
                .eq("id", productId)
                .single();

            if (!pd || pd.stock < item.quantity) {
                return NextResponse.json({ error: `Product out of stock` }, { status: 400 });
            }

            // ✅ Logic เลือกราคา: ถ้ามี sale_price และ > 0 ให้ใช้ sale_price
            const isOnSale = pd.sale_price && pd.sale_price > 0 && pd.sale_price < pd.price;
            const finalUnitPrice = isOnSale ? pd.sale_price : pd.price;

            calculatedTotal += finalUnitPrice * item.quantity;
            
            validatedItems.push({
                productId: productId,
                quantity: item.quantity,
                price: finalUnitPrice, // ราคานี้คือราคาที่ลดแล้ว (ถ้ามี)
            });
        }

        // 1.2 คำนวณราคาสุทธิ (หักลบส่วนลดคูปองถ้ามี)
        const finalAmount = Math.max(0, calculatedTotal - (discountAmount || 0));

        // 1.3 สร้าง Order ลง Database
        const { data: newOrder, error: orderError } = await supabaseAdmin.from("orders").insert({
            user_id: supabaseUserId,
            address_id: addressId || null,
            total_amount: finalAmount,
            discount_amount: discountAmount || 0,
            payment_status: "pending",
            status: "order_placed",
            payment_method: "stripe", 
        }).select().single();

        if (orderError) throw orderError;
        targetOrderId = newOrder.id;

        // 1.4 บันทึก Order Items และตัดสต็อกสินค้า
        for (const item of validatedItems) {
            // Insert Item
            await supabaseAdmin.from("order_items").insert({
                order_id: targetOrderId, 
                product_id: item.productId, 
                quantity: item.quantity, 
                price_at_time: item.price // ✅ บันทึกราคาที่ถูกต้อง (ลดแล้ว)
            });

            // Update Stock
            const { data: pd } = await supabaseAdmin.from("products").select("stock").eq("id", item.productId).single();
            await supabaseAdmin.from("products").update({ 
                stock: Math.max(0, pd.stock - item.quantity) 
            }).eq("id", item.productId);
        }

        // 1.5 ตัดจำนวนคูปอง
        if (couponCode) {
            const { error: couponError } = await supabaseAdmin.rpc('increment_coupon_usage', { 
                code_input: couponCode 
            });
            if (couponError) console.error("Failed to update coupon usage:", couponError);
        }

        // 1.6 ลบตะกร้าสินค้า
        await supabaseAdmin.from("cart").delete().eq("user_id", user.id);
    }

    if (onlyCreateOrder) {
        return NextResponse.json({ success: true, orderId: targetOrderId });
    }

    // ==========================================
    // 💳 STEP 2: ส่งไป Stripe
    // ==========================================
    // ต้องดึงข้อมูลล่าสุดจาก DB อีกรอบเพื่อให้แน่ใจ หรือใช้ validatedItems ถ้าอยู่ใน scope
    // แต่เพื่อให้ง่าย ใช้ items จาก frontend แต่ mapping ราคาให้ถูกก็พอในขั้นตอนนี้ (เพราะ validate ไปแล้วข้างบน)
    
    // หมายเหตุ: Stripe session สร้างจาก items frontend, ควรระวังเรื่องราคาไม่ตรง
    // เพื่อความชัวร์ เราควร query ราคาใหม่อีกรอบ หรือใช้ logic เดียวกัน
    // แต่ในที่นี้ขออนุญาตใช้ logic ง่ายๆ คือเชื่อว่า DB update แล้ว และส่ง session ตามยอดที่คำนวณได้
    
    const line_items = await Promise.all(items.map(async (item) => {
        const productId = item.product?.id || item.id;
        // ดึงราคาอีกครั้งเพื่อส่งให้ Stripe (ป้องกัน Frontend แก้ราคาเอง)
        const { data: pd } = await supabaseAdmin.from("products").select("price, sale_price, name").eq("id", productId).single();
        
        const isOnSale = pd.sale_price && pd.sale_price > 0 && pd.sale_price < pd.price;
        const unitPrice = isOnSale ? pd.sale_price : pd.price;

        return {
            price_data: {
                currency: "thb",
                product_data: {
                    name: pd.name,
                    images: item.product?.images ? [item.product.images[0]] : [],
                },
                unit_amount: Math.round(unitPrice * 100), // ส่งราคาจริงให้ Stripe
            },
            quantity: item.quantity,
        };
    }));

    let discounts = [];
    if (discountAmount && discountAmount > 0) {
        const coupon = await stripe.coupons.create({
            amount_off: Math.round(discountAmount * 100),
            currency: 'thb',
            duration: 'once',
            name: 'Discount Coupon',
        });
        discounts = [{ coupon: coupon.id }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"],
      line_items,
      mode: "payment",
      discounts: discounts,
      metadata: { orderId: targetOrderId },
      customer_email: userEmail,
      success_url: `${origin}/orders?success=true&orderId=${targetOrderId}`, 
      cancel_url: `${origin}/orders?canceled=true`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Checkout API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}