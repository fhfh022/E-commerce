'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, TicketPercentIcon, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { assets } from "@/assets/assets"
import { useSelector } from "react-redux"

const AdminSidebar = () => {
    
    const pathname = usePathname()
    // ✅ 1. ดึง name และ avatar จาก Redux
    const { role, name, avatar } = useSelector((state) => state.user)
   
    const sidebarLinks = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon },
        { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon  },
    ]

    if (role === 'master_admin') {
        sidebarLinks.push({ name: 'Users', href: '/admin/users', icon: Users })
    }

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                {/* ✅ 2. แสดงรูป Avatar (ถ้าไม่มีให้ใช้ logo หรือ placeholder) */}
                <Image 
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm" 
                    src={avatar || assets.gs_logo || '/placeholder.png'} 
                    alt="Admin Profile" 
                    width={80} 
                    height={80} 
                />
                
                <div className="text-center">
                    {/* ✅ 3. แสดงชื่อจริงจาก DB */}
                    <p className="text-slate-800 font-bold text-sm px-2">
                        {name || 'Admin User'}
                    </p>
                    {/* แสดง Role */}
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                        {role === 'master_admin' ? 'Master Admin' : 'Admin Staff'}
                    </p>
                </div>
            </div>

            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link key={index} href={link.href} className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}>
                            <link.icon size={18} className="sm:ml-5" />
                            <p className="max-sm:hidden">{link.name}</p>
                            {pathname === link.href && <span className="absolute bg-green-500 right-0 top-1.5 bottom-1.5 w-1 sm:w-1.5 rounded-l"></span>}
                        </Link>
                    ))
                }
            </div>
        </div>
    )
}

export default AdminSidebar