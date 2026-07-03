import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
  "/store(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isAdminRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // ❌ ยังไม่ login
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("role, is_blocked")
      .eq("clerk_id", userId)
      .single();

    if (error || !user) {
      console.error("Middleware Auth Error:", error);

      const url = new URL("/sign-in", req.url);
      url.searchParams.set("error", "user_not_found");
      return NextResponse.redirect(url);
    }

    // ⛔️ โดนแบน
    if (user.is_blocked) {
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("error", "blocked");
      return NextResponse.redirect(url);
    }

    // 🛡️ ตรวจสิทธิ์
    const hasPermission =
      user.role === "admin" || user.role === "master_admin";

    if (!hasPermission) {
      const url = new URL("/sign-in", req.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();

  } catch (err) {
    console.error("Middleware Error:", err);

    const url = new URL("/sign-in", req.url);
    url.searchParams.set("error", "server_error");
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};