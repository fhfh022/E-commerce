'use client'
import StoreLayout from "@/components/layout/store/StoreLayout";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootAdminLayout({ children }) {
    const { isLoaded, isSignedIn, user } = useUser();
    const role = user?.publicMetadata?.role;
    const router = useRouter();

    // [✨ Logic การ Redirect ✨]
    useEffect(() => {
        if (isLoaded) {
            // ถ้าโหลดเสร็จแล้ว แต่ไม่ได้ Login หรือไม่ใช่ Admin ให้ส่งกลับหน้า Home
            if (!isSignedIn || role !== "admin") {
                router.push("/");
            }
        }
    }, [isLoaded, isSignedIn, role, router]);

    // [🛡️ หน้าจอสีขาวป้องกันการเห็นเนื้อหา 🛡️]
    // หากยังโหลดไม่เสร็จ หรือตรวจสอบแล้วว่าไม่มีสิทธิ์ ให้แสดงหน้าขาวทับไว้ก่อน
    if (!isLoaded || !isSignedIn || role !== "admin") {
        return (
            <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-green-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Checking permissions...</p>
            </div>
        );
    }

    return (
        <StoreLayout>
            {children}
        </StoreLayout>
    );
}