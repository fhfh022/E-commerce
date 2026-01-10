import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. ตั้งค่า Supabase Admin Client (ใช้ Service Role Key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. กำหนด Path ที่ต้องการป้องกัน (Admin & Store Management)
// ใช้ createRouteMatcher เพื่อประสิทธิภาพที่ดีกว่า
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/store(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 3. ตรวจสอบเฉพาะ Route ที่เป็น Admin
  if (isAdminRoute(req)) {
    const { userId } = await auth();

    // 3.1 ถ้ายังไม่ Login -> ดีดไปหน้า Login
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    try {
      // 3.2 เช็ค Role และสถานะ Block จาก Supabase โดยตรง (Real-time)
      const { data: user, error } = await supabase
        .from("users")
        .select("role, is_blocked")
        .eq("clerk_id", userId)
        .single();

      if (error || !user) {
        console.error("Middleware Auth Error:", error);
        return NextResponse.redirect(new URL("/", req.url)); // ถ้าหาไม่เจอ ดีดออกไปหน้าแรก
      }

      // 3.3 ⛔️ เช็คว่าโดนแบนหรือไม่?
      if (user.is_blocked) {
        // ถ้าโดนแบน ดีดไปหน้าแรกทันที
        return NextResponse.redirect(new URL("/", req.url));
      }

      // 3.4 🛡️ เช็คสิทธิ์ Admin
      const hasPermission = user.role === "admin" || user.role === "master_admin";
      if (!hasPermission) {
        // ถ้าไม่ใช่ Admin ดีดไปหน้าแรก
        return NextResponse.redirect(new URL("/", req.url));
      }

      // ถ้าผ่านทุกด่าน ปล่อยให้เข้าใช้งานได้ตามปกติ ✅

    } catch (err) {
      console.error("Middleware Error:", err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Matcher ตามมาตรฐานของ Clerk เพื่อให้ Middleware ทำงานถูกต้อง
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};