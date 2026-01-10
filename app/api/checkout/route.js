import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { currentUser } from "@clerk/nextjs/server";

// ✅ 1. ใช้ Service Role เพื่อให้มีสิทธิ์เข้าถึงข้อมูลทั้งหมด (เช่น คูปอง, สต็อก)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // รับข้อมูลจากหน้าบ้าน
    // กรณี Pay Now: จะส่งมาแค่ { orderId, userEmail } หรือ { items, orderId, ... }
    const { items, userEmail, couponCode, addressId, orderId } = await req.json();
    const origin = req.headers.get("origin");

    // --- ส่วนเตรียมข้อมูลสำหรับ Stripe ---
    let line_items_for_stripe = [];
    let stripe_discount_id = undefined;
    let final_order_id = orderId;
    let dbUser = null;

    // หา User ID ใน DB ของเรา
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }
    dbUser = userData;

    // ==========================================
    // 🟢 CASE 1: จ่ายเงินออเดอร์เดิม (Pay Now)
    // ==========================================
    if (orderId) {
      // 1. ดึงข้อมูลออเดอร์และรายการสินค้าจาก DB
      const { data: orderData, error: orderFetchError } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price_at_time,
            product:products (name, images)
          )
        `)
        .eq("id", orderId)
        .eq("user_id", dbUser.id) // ต้องเป็นของ User คนนี้เท่านั้น
        .single();

      if (orderFetchError || !orderData) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // 2. สร้าง Line Items จากข้อมูลใน DB (ใช้ราคาตอนที่สั่งซื้อ price_at_time)
      line_items_for_stripe = orderData.order_items.map((item) => ({
        price_data: {
          currency: "thb",
          product_data: {
            name: item.product.name,
            images: item.product.images ? [item.product.images[0]] : [],
          },
          unit_amount: Math.round(item.price_at_time * 100), // ใช้ราคาที่บันทึกไว้ตอนสั่ง
        },
        quantity: item.quantity,
      }));

      // 3. ✅ ดึงส่วนลดเดิมมาใช้ (ถ้ามี)
      if (orderData.discount_amount > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(orderData.discount_amount * 100),
          currency: "thb",
          duration: "once",
          name: "Discount from Order", // ชื่อที่จะโชว์ใน Stripe
        });
        stripe_discount_id = coupon.id;
      }

      final_order_id = orderData.id;
    } 
    
    // ==========================================
    // 🔵 CASE 2: สั่งซื้อใหม่ (New Checkout)
    // ==========================================
    else {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: "No items provided" }, { status: 400 });
      }

      // 1. ดึงข้อมูลสินค้าล่าสุดจาก DB เพื่อความปลอดภัย (กันแก้ราคาหน้าบ้าน)
      const productIds = items.map((item) => item.id);
      const { data: dbProducts } = await supabaseAdmin
        .from("products")
        .select("*")
        .in("id", productIds);

      // 2. คำนวณยอดและสร้าง Line Items
      let subTotal = 0;
      line_items_for_stripe = items.map((item) => {
        const dbProduct = dbProducts.find((p) => p.id === item.id);
        if (!dbProduct) throw new Error(`Product ID ${item.id} not found`);

        const priceToUse = (dbProduct.sale_price > 0 && dbProduct.sale_price < dbProduct.price)
          ? dbProduct.sale_price
          : dbProduct.price;

        subTotal += priceToUse * item.quantity;

        return {
          price_data: {
            currency: "thb",
            product_data: {
              name: dbProduct.name,
              images: dbProduct.images ? [dbProduct.images[0]] : [],
              metadata: { productId: dbProduct.id }
            },
            unit_amount: Math.round(priceToUse * 100),
          },
          quantity: item.quantity,
        };
      });

      // 3. คำนวณส่วนลดคูปอง (ถ้ามี)
      let discountAmount = 0;
      let validCouponId = null;

      if (couponCode) {
        const { data: couponData } = await supabaseAdmin
          .from("coupons")
          .select("*")
          .eq("code", couponCode)
          .eq("is_active", true)
          .single();

        if (couponData) {
          const isExpired = new Date(couponData.expiry_date) < new Date();
          const isSoldOut = couponData.used_count >= couponData.quantity;

          if (!isExpired && !isSoldOut) {
            validCouponId = couponData.id;
            if (couponData.discount_type === "percentage") {
              discountAmount = Math.round((subTotal * couponData.discount_percent) / 100);
            } else {
              discountAmount = couponData.discount_value;
            }

            // สร้าง Stripe Coupon
            if (discountAmount > 0) {
              const stripeCoupon = await stripe.coupons.create({
                amount_off: Math.round(discountAmount * 100),
                currency: "thb",
                duration: "once",
                name: `CODE: ${couponCode}`,
              });
              stripe_discount_id = stripeCoupon.id;
            }
          }
        }
      }

      // 4. บันทึก Order ลง DB (Status: Pending)
      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: dbUser.id,
          address_id: addressId,
          coupon_id: validCouponId,
          total_amount: Math.max(0, subTotal - discountAmount), // ยอดสุทธิ
          discount_amount: discountAmount,
          payment_method: "stripe",
          payment_status: "pending",
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error("Failed to create order record");
      
      // บันทึก Order Items
      const orderItemsData = items.map(item => {
          const dbProduct = dbProducts.find((p) => p.id === item.id);
          const priceToUse = (dbProduct.sale_price > 0 && dbProduct.sale_price < dbProduct.price) 
              ? dbProduct.sale_price : dbProduct.price;
          return {
              order_id: newOrder.id,
              product_id: item.id,
              quantity: item.quantity,
              price_at_time: priceToUse
          };
      });
      await supabaseAdmin.from('order_items').insert(orderItemsData);

      final_order_id = newOrder.id;
    }

    // ==========================================
    // 🚀 สร้าง Stripe Session (ใช้ร่วมกัน)
    // ==========================================
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "promptpay"],
      line_items: line_items_for_stripe,
      mode: "payment",
      discounts: stripe_discount_id ? [{ coupon: stripe_discount_id }] : [], // ✅ ใส่ส่วนลดตรงนี้
      success_url: `${origin}/orders?success=true&orderId=${final_order_id}`,
      cancel_url: `${origin}/orders?canceled=true`, // เปลี่ยนกลับมาหน้า Orders ดีกว่า
      customer_email: userEmail,
      metadata: {
        orderId: final_order_id,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}