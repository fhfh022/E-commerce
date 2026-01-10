"use client";
import AdminLayout from "@/components/layout/admin/AdminLayout";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootAdminLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;
  const router = useRouter();

  // 1. ตรวจสอบสิทธิ์และ Redirect
  useEffect(() => {
    if (isLoaded) {
      // ถ้าโหลดเสร็จแล้ว แต่ไม่ได้ Login หรือไม่ใช่ Admin ให้ส่งกลับหน้า Home ทันที
      if (!isSignedIn || role !== "admin") {
        router.push("/");
      }
    }
  }, [isLoaded, isSignedIn, role, router]);

  // 2. หน้าจอสีขาวป้องกันการเห็นเนื้อหา (Full Screen Overlay)
  // ใช้ z-[9999] เพื่อทับ AdminLayout ทั้งหมดไว้จนกว่าจะยืนยันสิทธิ์เสร็จ
  if (!isLoaded || !isSignedIn || (role !== "admin" && role !== "master_admin")) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">
          กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...
        </p>
      </div>
    );
  }

  // 3. เมื่อเป็น Admin แล้วจึงแสดง AdminLayout และเนื้อหาข้างใน
  return <AdminLayout>{children}</AdminLayout>;
}
