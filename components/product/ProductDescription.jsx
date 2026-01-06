'use client'
import { useState, useEffect } from "react"
import { Star, UserCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Specifications')
    const [reviews, setReviews] = useState([]);
    const tabs = ['Specifications', 'Reviews']; 

    const specs = product.specs || {};

    // ฟังก์ชันช่วยรวมข้อความ Display
    const getDisplayString = () => {
        const size = specs.display_size || "";
        const detail = specs.display_specs || specs.display || "";
        return [size, detail].filter(Boolean).join(" ");
    };

    // ✅ NEW: ฟังก์ชันจัด Format Ports ให้ขึ้นบรรทัดใหม่เมื่อเจอ 1x, 2x
    const formatPorts = (value) => {
        if (!value) return "-";
        // Regex: หาช่องว่าง (หรือ comma) ที่ตามด้วย "ตัวเลข+x" (เช่น " 1x", ", 2x")
        // (?=\d+x) คือ Lookahead เช็คว่าข้างหน้าเป็น 1x, 2x ไหม แต่ไม่ตัดคำนั้นทิ้ง
        const parts = value.split(/(?:,?\s+)(?=\d+x)/g);

        if (parts.length <= 1) return value; // ถ้ามีบรรทัดเดียวก็คืนค่าเดิม

        return (
            <div className="flex flex-col gap-1">
                {parts.map((part, index) => (
                    <span key={index} className="block">
                        {part.trim()}
                    </span>
                ))}
            </div>
        );
    };

    // ✅ ปรับ specList ให้ใช้ formatPorts ตรงช่อง Ports
    const specList = [
        { label: "Brand", value: product.brand },
        { label: "Model", value: product.model },
        { label: "Processor", value: specs.processor },
        { label: "Processor Detail", value: specs.processor_detail },
        { label: "Graphics", value: specs.graphics },
        { label: "Display Screen", value: getDisplayString() },
        { label: "Main Memory", value: specs.ram },
        { label: "Storage", value: specs.storage },
        { label: "Network", value: specs.network },
        { label: "Wireless", value: specs.wireless },
        { label: "Bluetooth", value: specs.bluetooth },
        { label: "Ports", value: formatPorts(specs.ports) }, // 👈 เรียกใช้ฟังก์ชันตรงนี้
        { label: "Battery", value: specs.battery },
        { label: "OS", value: specs.os },
        { label: "Weight", value: specs.weight },
    ];

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:users(name, avatar) 
                `)
                .eq('product_id', product.id)
                .order('created_at', { ascending: false });
            
            if (data) setReviews(data);
        }
        fetchReviews();
    }, [product.id]);

    return (
        <div className="my-16 text-sm text-slate-600">

            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 mb-8">
                {tabs.map((tab, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedTab(tab)}
                        className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                            tab === selectedTab 
                            ? 'border-slate-800 text-slate-800 font-semibold' 
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content: Specifications */}
            {selectedTab === "Specifications" && (
                <div className="animate-fade-in">
                    <div className="border rounded-lg overflow-hidden max-w-3xl">
                        {specList.map((item, index) => (
                            // เช็คว่ามี value ไหม ถ้าไม่มีไม่แสดง (Clean UI)
                            item.value ? (
                                <div key={index} className={`flex flex-col sm:flex-row border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="sm:w-1/3 p-4 font-medium text-slate-700 sm:border-r">
                                        {item.label}
                                    </div>
                                    <div className="sm:w-2/3 p-4 text-slate-600 break-words">
                                        {item.value}
                                    </div>
                                </div>
                            ) : null
                        ))}
                        
                        {specList.every(s => !s.value) && (
                             <div className="p-6 text-center text-slate-400">No specifications available for this product.</div>
                        )}
                    </div>
                </div>
            )}

           {/* Reviews Content */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-6 mt-8 animate-in fade-in">
                    {reviews.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-400">
                            No reviews yet. Be the first to rate this product!
                        </div>
                    ) : (
                        reviews.map((item, index) => (
                            <div key={index} className="flex gap-4 p-6 border border-slate-100 rounded-xl bg-white shadow-sm">
                                {/* Avatar */}
                              <div className="flex-shrink-0">
                                    {item.user?.avatar ? (
                                        <img 
                                            src={item.user.avatar} 
                                            alt={item.user.name} 
                                            className="size-12 rounded-full object-cover border border-slate-100"
                                        />
                                    ) : (
                                        <div className="size-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                            <UserCircle size={32} />
                                        </div>
                                    )}
                                </div>
                                                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800">{item.user?.name || "Customer"}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {Array(5).fill('').map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={14} 
                                                        className={i < item.rating ? "fill-green-500 text-green-500" : "fill-slate-200 text-slate-200"} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {item.comment && (
                                        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                            {item.comment}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default ProductDescription