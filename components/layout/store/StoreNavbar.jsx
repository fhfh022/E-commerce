'use client'
import Link from "next/link"
import { ShieldCheck } from "lucide-react" // เพิ่มไอคอนโล่ (Admin)

const StoreNavbar = () => {
    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all bg-white">
            {/* Logo */}
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-green-600">PR</span>T<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Store
                </p>
            </Link>

            {/* ✅ ปุ่มสลับไปหน้า Admin */}
            <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm active:scale-95"
            >
                <ShieldCheck size={18} /> ไปที่ Admin Dashboard
            </Link>
        </div>
    )
}

export default StoreNavbar