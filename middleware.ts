import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);

const ADMIN_ONLY_PATHS = [
  "/admin",
  "/admin/coupons",
  "/admin/users",
  "/store",
  "/store/add-product",
  "/store/manage-product",
  "/store/orders",
];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // ตรวจสอบว่าเป็น Path ที่ต้องเป็น Admin หรือไม่
  const isAdminPath = ADMIN_ONLY_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isAdminPath) {
    // 1. ถ้ายังไม่ Login ให้ดีดไปหน้าหลัก
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    try {
      // 2. ✅ เช็คสิทธิ์จาก Supabase โดยตรง (ไม่ผ่าน Clerk)
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("role, is_blocked")
        .eq("clerk_id", userId)
        .single();

      if (error) {
        console.error("Middleware DB Error:", error.message);
        return NextResponse.redirect(new URL("/", req.url));
      }

      const userRole = data?.role;
      const isBlocked = data?.is_blocked;

      // 3. ✅ เช็คว่า User ถูก Block หรือไม่
      if (isBlocked) {
        console.log(`⛔ Blocked user tried to access: ${pathname}`);
        return NextResponse.redirect(new URL("/", req.url));
      }

      // 4. ✅ เช็คสิทธิ์การเข้าถึง
      const hasPermission = userRole === "admin" || userRole === "master_admin";

      // console.log(`--- Middleware Check ---`);
      // console.log(`Path: ${pathname}`);
      // console.log(`User ID: ${userId}`);
      // console.log(`Role: ${userRole}`);
      // console.log(`Has Permission: ${hasPermission}`);
      // console.log(`Is Blocked: ${isBlocked}`);
      // console.log(`------------------------`);

      // 5. ถ้าไม่มีสิทธิ์ ให้ดีดออก
      if (!hasPermission) {
        return NextResponse.redirect(new URL("/", req.url));
      }

    } catch (err) {
      console.error("Middleware Auth Catch:", err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // ป้องกัน Middleware รันในไฟล์ Static ต่างๆ
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};