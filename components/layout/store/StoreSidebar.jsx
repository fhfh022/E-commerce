'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSelector } from "react-redux" // ✅ 1. เพิ่ม import

const StoreSidebar = () => { // นำ storeInfo ออกหากต้องการเน้นข้อมูลแอดมินคนนั้นๆ

    const pathname = usePathname()
    
    // ✅ 2. ดึงข้อมูล Profile และ Role จาก Redux (ที่โหลดจาก Supabase ใน RoleInitializer)
    const { role, name, avatar } = useSelector((state) => state.user)

    const sidebarLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Promotions', href: '/store/manage-promotions', icon: LayoutListIcon },
    ]

    return (
        <div className="inline-flex h-full flex-col gap-5 border-r border-slate-200 sm:min-w-60">
            {/* ✅ 3. ส่วนหัว Profile ดึงจาก DB */}
            <div className="flex flex-col gap-3 justify-center items-center pt-8 max-sm:hidden">
                <Image 
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm" 
                    src={avatar || "/placeholder.png"} // ใช้รูปจาก DB ถ้าไม่มีใช้ placeholder
                    alt="Admin Profile" 
                    width={80} 
                    height={80} 
                />
                
                <div className="text-center px-4">
                    <p className="text-slate-800 font-bold text-sm truncate max-w-[180px]">
                        {name || 'Admin'}
                    </p>
                    {/* แสดงสถานะสิทธิ์การใช้งาน */}
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                        {role === 'master_admin' ? 'Master Admin' : 'Store Staff'}
                    </p>
                </div>
            </div>

            <div className="max-sm:mt-6">
                {
                    sidebarLinks.map((link, index) => (
                        <Link 
                            key={index} 
                            href={link.href} 
                            className={`relative flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-2.5 transition ${pathname === link.href && 'bg-slate-100 sm:text-slate-600'}`}
                        >
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

export default StoreSidebar