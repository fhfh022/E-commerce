import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, Eye, ChevronLeft, Clock } from "lucide-react";
import ViewCounter from "@/components/blog/ViewCounter";
import CopyLinkButton from "@/components/blog/CopyLinkButton";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { id } = params;
  
  const { data: blog } = await supabase.from("blogs").select("*").eq("id", id).single();

  if (!blog) return { title: "ไม่พบบทความ" };

  return {
    title: `${blog.title} | PRT Blog`,
    description: blog.excerpt || blog.content.substring(0, 150),
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.image_url ? [blog.image_url] : [],
      type: "article",
      publishedTime: blog.created_at,
      authors: [blog.author || "Admin"],
    },
  };
}

export default async function BlogDetail({ params }) {
  const { id } = params;

  const { data: blog } = await supabase
    .from("blogs")
    .select(`*, users ( name )`)
    .eq("id", id)
    .single();

  if (!blog) {
    notFound();
  }

  const readTime = Math.ceil((blog.content?.length || 0) / 1000); 

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "image": blog.image_url ? [blog.image_url] : [],
    "datePublished": blog.created_at,
    "dateModified": blog.updated_at,
    "author": [{
        "@type": "Person",
        "name": blog.users?.name || blog.author || "Admin"
    }]
  };

  return (
    <div className="bg-white min-h-screen pb-10 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ViewCounter blogId={id} />
      
      {/* --- Hero Header --- */}
      {/* ✅ ปรับลดความสูงลง (h-[300px] sm:h-[400px] lg:h-[500px]) จากเดิมที่สูงกว่านี้ */}
      <div className="relative h-[260px] sm:h-[340px] lg:h-[420px] w-full bg-slate-900">
        {blog.image_url ? (
            <Image 
                src={blog.image_url} 
                alt={blog.title} 
                fill 
                className="object-cover opacity-75" 
                priority
            />
        ) : (
            <div className="w-full h-full bg-slate-800" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 md:p-10 text-white max-w-6xl mx-auto inset-x-0">
            <Link 
                href="/blogs" 
                className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white mb-4 sm:mb-6 transition w-fit"
            >
                <div className="bg-white/10 p-1.5 rounded-full group-hover:bg-white/20 transition">
                    <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]"/> 
                </div>
                บทความทั้งหมด
            </Link>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-indigo-200 mb-3 sm:mb-5 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <Calendar size={12} className="sm:w-[14px] sm:h-[14px]"/> {new Date(blog.created_at).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <User size={12} className="sm:w-[14px] sm:h-[14px]"/> {blog.users?.name || blog.author || "Admin"}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <Eye size={12} className="sm:w-[14px] sm:h-[14px]"/> {blog.views}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    <Clock size={12} className="sm:w-[14px] sm:h-[14px]"/> {readTime} นาที
                </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-2 sm:mb-4 drop-shadow-xl text-balance max-w-4xl">
                {blog.title}
            </h1>
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-10">
        <div className="bg-white p-6 sm:p-10 md:p-16 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100">
            
            {blog.excerpt && (
                <div className="mb-6 sm:mb-10 pl-4 sm:pl-6 border-l-4 border-indigo-500">
                    <p className="text-sm sm:text-base md:text-xl font-medium text-slate-700 leading-relaxed font-serif italic">
                        "{blog.excerpt}"
                    </p>
                </div>
            )}

            <hr className="border-slate-100 mb-6 sm:mb-10" />

            {/* Main Content */}
            <article 
                className="prose prose-sm sm:prose-base md:prose-lg prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-slate-900 prose-headings:mt-8 sm:prose-headings:mt-10 prose-headings:mb-4 sm:prose-headings:mb-5
                prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-5 sm:prose-p:mb-6
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl sm:prose-img:rounded-3xl prose-img:shadow-lg prose-img:my-6 sm:prose-img:my-8 prose-img:w-full
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-50 prose-blockquote:py-4 prose-blockquote:px-6 sm:prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-slate-700
                prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5
                "
                dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Share Section */}
            <div className="mt-12 sm:mt-20 pt-8 sm:pt-10 border-t border-slate-100 flex flex-col items-center">
                <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">ชอบบทความนี้ไหม? แชร์เลย</p>
                <CopyLinkButton />
            </div>

        </div>
      </div>
    </div>
  );
}