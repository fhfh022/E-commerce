'use client'
import Link from "next/link"
import { Store } from "lucide-react" // เพิ่มไอคอนร้านค้า

const AdminNavbar = () => {
    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all bg-white">
            {/* Logo */}
            <Link href="/admin" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-green-600">PR</span>T<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Admin
                </p>
            </Link>

            {/* ✅ ปุ่มสลับไปหน้า Store */}
            <Link 
                href="/store" 
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm active:scale-95"
            >
                <Store size={18} /> Switch to Store
            </Link>
        </div>
    )
}

export default AdminNavbar