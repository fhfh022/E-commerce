import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_ONLY_PATHS = [
  "/admin",
  "/store",
  "/store/add-product",
  "/store/manage-product",
  "/store/orders",
];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  const isAdminPath = ADMIN_ONLY_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isAdminPath) {
    // ยังไม่ login
    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // เช็ก role จาก Supabase
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    // ไม่ใช่ admin
    if (error || data?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
