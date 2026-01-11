import { supabase } from "@/lib/supabase";
import PageTitle from "@/components/layout/PageTitle";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowRight, BookOpen } from "lucide-react";

// ✅ 1. กำหนด Metadata สำหรับ SEO
export const metadata = {
  title: "บทความและข่าวสารไอที | PRT Store",
  description: "อัปเดตเทรนด์สินค้าไอที แล็ปท็อป Gaming Gear และทริคการใช้งานคอมพิวเตอร์ที่คุณไม่ควรพลาด",
  openGraph: {
    title: "บทความและข่าวสารไอที | PRT Store",
    description: "รวมบทความรีวิว แนะนำสินค้า และทริคไอที",
    type: "website",
    // images: ["/og-image.jpg"], // ถ้ามีรูป Cover เว็บใส่ตรงนี้
  },
};

// ✅ 2. เปลี่ยนเป็น Async Function (Server Component)
export default async function BlogPage() {
  
  // Fetch Data ฝั่ง Server
  const { data: blogs } = await supabase
    .from("blogs")
    .select(`*, users ( name )`)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  // ไม่ต้องมี Loading State แล้ว เพราะ Server จะรอข้อมูลเสร็จค่อยส่ง HTML มาทีเดียว

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10 pb-20 animate-in fade-in duration-500">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Latest <span className="text-indigo-600">Updates</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            ข่าวสาร อัปเดตเทคโนโลยี และทริคดีๆ เกี่ยวกับอุปกรณ์ไอทีที่คุณไม่ควรพลาด
        </p>
      </div>

      {(!blogs || blogs.length === 0) ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 text-lg">ยังไม่มีบทความในขณะนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link href={`/blogs/${blog.id}`} key={blog.id} className="group flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                {blog.image_url ? (
                    <Image 
                        src={blog.image_url} 
                        alt={blog.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-300"><BookOpen size={40}/></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(blog.created_at).toLocaleDateString('th-TH')}</span>
                    <span className="flex items-center gap-1">
                        <User size={12}/> {blog.users?.name || blog.author || "Admin"}
                    </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition">
                    {blog.title}
                </h3>
                
                <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                    {blog.excerpt || (blog.content ? blog.content.substring(0, 100).replace(/<[^>]+>/g, '') : "") + "..."}
                </p>

                <div className="flex items-center text-indigo-600 font-bold text-sm gap-1 group-hover:gap-2 transition-all">
                    อ่านต่อ <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}