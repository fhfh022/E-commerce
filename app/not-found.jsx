import Link from 'next/link'
import { Home, MoveLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Big 404 Text (Background Style) */}
      <h1 className="text-[10rem] sm:text-[12rem] font-black text-slate-50 leading-none select-none">
        404
      </h1>

      {/* 2. Message Content */}
      <div className="-mt-12 sm:-mt-16 relative z-10">
         <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">
            Oops! Page not found
         </h2>
         <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            ขออภัยครับ หน้าที่คุณกำลังค้นหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ในระบบ
         </p>

         {/* 3. Action Button */}
         <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
         >
            <Home size={20} />
            Back to Home
         </Link>
      </div>

    </div>
  )
}