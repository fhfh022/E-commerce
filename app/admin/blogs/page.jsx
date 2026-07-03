"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import PageTitle from "@/components/layout/PageTitle";
import Loading from "@/components/layout/Loading";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { 
    Plus, Edit, Trash2, Eye, Save, X, 
    Image as ImageIcon, Loader2, UploadCloud, 
    ExternalLink, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Highlighter, Type, Undo, Redo, Quote, AlertTriangle 
} from "lucide-react";

// Tiptap Imports
import { Editor, EditorContent } from '@tiptap/react'; // ✅ Import Editor Class โดยตรง
import StarterKit from '@tiptap/starter-kit';
import { Underline as TiptapUnderline } from '@tiptap/extension-underline';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

// ✅ 1. ย้าย Custom Extension ออกมาข้างนอก (Performance Best Practice)
const CustomImage = TiptapImage.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: { default: '100%', renderHTML: (attrs) => ({ width: attrs.width }) },
        style: { default: null, renderHTML: (attrs) => ({ style: attrs.style }) },
      };
    },
});

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editor State
  const [editor, setEditor] = useState(null);

  // State Image Modal
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [imgParams, setImgParams] = useState({ url: "", width: "100%", align: "center" });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  const [formData, setFormData] = useState({
    id: null, title: "", excerpt: "", content: "", image_url: "", is_published: true
  });

  const currentUser = useSelector((state) => state.auth.user);

  // ✅ 2. ใช้ useEffect สร้าง Editor แทน useEditor (แก้ปัญหา SSR Error 100%)
  useEffect(() => {
    const _editor = new Editor({
        extensions: [
            StarterKit,
            TiptapUnderline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            CustomImage.configure({ allowBase64: true, HTMLAttributes: { class: 'rounded-2xl shadow-lg my-6' } }),
        ],
        content: '',
        editorProps: {
            attributes: { class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-4 text-slate-700' },
        },
        onUpdate: ({ editor }) => {
            // อัปเดต content ลง State เมื่อมีการพิมพ์
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        }
    });

    setEditor(_editor);

    // Cleanup function (ทำลาย editor เมื่อ component ถูกถอด)
    return () => {
        _editor.destroy();
    };
  }, []);

  // Sync Content เมื่อเปิด Modal หรือเปลี่ยนข้อมูล
  useEffect(() => {
    if (editor && isModalOpen) {
      // เช็คก่อนว่าเนื้อหาต่างกันไหม เพื่อกัน Cursor กระโดด
      if (editor.getHTML() !== formData.content) {
          editor.commands.setContent(formData.content);
      }
    }
  }, [formData.id, isModalOpen, editor]); // ลบ formData.content ออกจาก dependency เพื่อกัน loop

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from("blogs")
        .select(`*, users ( name, email )`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogs(data || []);
    } catch (error) { 
        toast.error("โหลดข้อมูลไม่สำเร็จ"); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleOpenModal = (blog = null) => {
    if (blog) {
        setFormData(blog);
    } else {
        setFormData({
            id: null, title: "", excerpt: "", content: "", image_url: "", is_published: true
        });
        if(editor) editor.commands.clearContent();
    }
    setIsModalOpen(true);
  };

  const uploadImage = async (file) => {
    try {
        setUploading(true);
        const fileName = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('blog-images').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('blog-images').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (e) { toast.error("อัปโหลดไม่สำเร็จ"); return null; } 
    finally { setUploading(false); }
  };

  const handleModalImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) { const url = await uploadImage(file); if(url) setImgParams(prev => ({...prev, url})); }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (file) { const url = await uploadImage(file); if(url) { setFormData(prev => ({...prev, image_url: url})); toast.success("อัปโหลดรูปปกแล้ว"); } }
  };

  const confirmInsertImage = () => {
    if (!imgParams.url || !editor) return;
    let styleString = `display: block; object-fit: cover;`;
    if (imgParams.align === 'center') styleString += ` margin: 20px auto;`;
    if (imgParams.align === 'left') styleString += ` float: left; margin: 10px 20px 10px 0;`;
    if (imgParams.align === 'right') styleString += ` float: right; margin: 10px 0 10px 20px;`;
    editor.chain().focus().setImage({ src: imgParams.url, width: imgParams.width, style: styleString }).run();
    setIsImgModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return toast.error("กรุณาล็อกอินใหม่");
    
    setIsSubmitting(true);
    try {
        const payload = { 
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content, // ใช้ content จาก state ที่ sync กับ editor
            image_url: formData.image_url,
            is_published: formData.is_published,
            updated_at: new Date(),
            user_id: currentUser.id 
        };

        if (formData.id) { 
            await supabase.from("blogs").update(payload).eq("id", formData.id); 
            toast.success("อัปเดตบทความแล้ว");
        } else { 
            await supabase.from("blogs").insert(payload); 
            toast.success("สร้างบทความใหม่แล้ว");
        }
        setIsModalOpen(false); fetchBlogs();
    } catch (e) { 
        console.error(e);
        toast.error("เกิดข้อผิดพลาด"); 
    } finally { 
        setIsSubmitting(false); 
    }
  };

  // Delete Logic
  const confirmDelete = (blog) => {
      setBlogToDelete(blog);
      setIsDeleteModalOpen(true);
  }

  const handleDelete = async () => {
    if (!blogToDelete) return;
    try {
        const { error } = await supabase.from("blogs").delete().eq("id", blogToDelete.id);
        if (error) throw error;
        setBlogs(prev => prev.filter(b => b.id !== blogToDelete.id));
        toast.success("ลบเรียบร้อย");
        setIsDeleteModalOpen(false);
    } catch (e) { toast.error("ลบไม่สำเร็จ"); }
  };

  const ToolbarButton = ({ onClick, isActive, children, title }) => (
    <button type="button" onClick={onClick} title={title} className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>
  );

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-20 animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <PageTitle heading="จัดการบทความ (Blog)" text="สร้างคอนเทนต์เพื่อดึงดูดลูกค้า" />
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition hover:bg-slate-800 shadow-lg shadow-slate-200">
                <Plus size={20} /> เขียนบทความใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="size-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <ExternalLink size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-600">ยังไม่มีบทความ</h3>
            <p className="text-slate-400 mt-1">เริ่มเขียนบทความแรกของคุณได้เลย!</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
                <div key={blog.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group flex flex-col">
                    <div className="relative h-48 bg-slate-100">
                        {blog.image_url ? (
                            <Image src={blog.image_url} alt={blog.title} fill className="object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300"><ImageIcon size={48}/></div>
                        )}
                        <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${blog.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {blog.is_published ? "เผยแพร่" : "แบบร่าง"}
                            </span>
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-2">{blog.title}</h3>
                        <p className="text-xs text-indigo-600 font-bold mb-2">โดย: {blog.users?.name || "ไม่ระบุ"}</p>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{blog.excerpt || "ไม่มีเนื้อหาย่อ..."}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-auto">
                            <span className="text-xs text-slate-400 flex items-center gap-1"><Eye size={14}/> {blog.views} วิว</span>
                            <div className="flex gap-2">
                                <Link href={`/blogs/${blog.id}`} target="_blank" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><ExternalLink size={18} /></Link>
                                <button onClick={() => handleOpenModal(blog)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={18}/></button>
                                <button onClick={() => confirmDelete(blog)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800">{formData.id ? "แก้ไขบทความ" : "เขียนบทความใหม่"}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">หัวข้อบทความ</label>
                                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition font-bold text-slate-800" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">รูปปกบทความ</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-sm" placeholder="URL หรืออัปโหลด" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
                                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 rounded-xl flex items-center justify-center transition border border-slate-200">
                                        {uploading ? <Loader2 size={20} className="animate-spin"/> : <UploadCloud size={20}/>}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">เนื้อหาย่อ (เกริ่นนำ)</label>
                            <textarea rows="2" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none transition text-sm resize-none" value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})}></textarea>
                        </div>

                        <div className="pb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">เนื้อหาหลัก</label>
                            {/* Toolbar (แสดงเฉพาะตอน Editor พร้อม) */}
                            {editor && (
                                <div className="sticky top-0 z-10 bg-white border border-slate-200 rounded-t-xl p-2 flex flex-wrap gap-1 shadow-sm items-center">
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="ตัวหนา"><Bold size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="ตัวเอียง"><Italic size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="ขีดเส้นใต้"><Underline size={18}/></ToolbarButton>
                                    <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="หัวข้อใหญ่"><Type size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="รายการจุด"><List size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="รายการตัวเลข"><ListOrdered size={18}/></ToolbarButton>
                                    <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="ชิดซ้าย"><AlignLeft size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="กึ่งกลาง"><AlignCenter size={18}/></ToolbarButton>
                                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="ชิดขวา"><AlignRight size={18}/></ToolbarButton>
                                    <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                                    <button type="button" onClick={() => setIsImgModalOpen(true)} className="p-2 rounded text-indigo-600 hover:bg-indigo-50 flex items-center gap-1.5 font-bold text-xs border border-indigo-100 transition"><ImageIcon size={16}/> แทรกรูป</button>
                                </div>
                            )}
                            <EditorContent editor={editor} className="border border-t-0 border-slate-200 rounded-b-xl bg-slate-50 min-h-[400px] cursor-text" />
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 w-fit">
                            <input type="checkbox" id="isPub" className="size-5 accent-blue-600 cursor-pointer" checked={formData.is_published} onChange={(e) => setFormData({...formData, is_published: e.target.checked})} />
                            <label htmlFor="isPub" className="cursor-pointer text-sm font-bold text-slate-700 select-none">เผยแพร่ทันที</label>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition">ยกเลิก</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition flex items-center gap-2 disabled:opacity-70">
                                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} บันทึกบทความ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Image Modal (เหมือนเดิม) */}
      {isImgModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={20} className="text-indigo-500"/> แทรกรูปภาพ</h3>
                    <button onClick={() => setIsImgModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ลิงก์รูปภาพ (URL)</label>
                        <div className="flex gap-2">
                            <input type="text" className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="https://..." value={imgParams.url} onChange={(e) => setImgParams({...imgParams, url: e.target.value})} />
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 rounded-lg flex items-center justify-center border border-slate-200 transition">
                                {uploading ? <Loader2 size={18} className="animate-spin text-slate-500"/> : <UploadCloud size={18} className="text-slate-500"/>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleModalImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ขนาดรูปภาพ</label>
                        <div className="flex gap-2 mb-2">
                            {['100%', '75%', '50%', '25%'].map((size) => (
                                <button key={size} onClick={() => setImgParams({...imgParams, width: size})} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${imgParams.width === size ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>{size}</button>
                            ))}
                        </div>
                        <input type="text" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center" value={imgParams.width} onChange={(e) => setImgParams({...imgParams, width: e.target.value})} placeholder="ระบุเอง (เช่น 500px)" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">จัดตำแหน่ง</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {[{ val: 'left', icon: <AlignLeft size={18}/> }, { val: 'center', icon: <AlignCenter size={18}/> }, { val: 'right', icon: <AlignRight size={18}/> }].map((align) => (
                                <button key={align.val} onClick={() => setImgParams({...imgParams, align: align.val})} className={`flex-1 py-1.5 rounded-md flex justify-center transition ${imgParams.align === align.val ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{align.icon}</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={confirmInsertImage} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition active:scale-95">แทรกรูปภาพ</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && blogToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">ยืนยันการลบบทความ?</h3>
              <p className="text-slate-500 mt-2 mb-6 text-sm">
                คุณแน่ใจหรือไม่ว่าต้องการลบบทความ <br/> <span className="font-bold text-slate-800">"{blogToDelete.title}"</span> <br/> การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-100"
                >
                  ลบเลย
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}