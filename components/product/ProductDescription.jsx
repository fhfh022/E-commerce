'use client'
import { useState, useEffect } from "react"
import { Star, UserCircle, FileText, MessageSquare } from "lucide-react" // ✅ Import Icon
import { supabase } from "@/lib/supabase"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Specifications')
    const [reviews, setReviews] = useState([]);
    
    // ✅ เพิ่ม Icon ใน Tabs
    const tabs = [
        { name: 'Specifications', icon: <FileText size={18} /> },
        { name: 'Reviews', icon: <MessageSquare size={18} /> }
    ]; 

    const specs = product.specs || {};

    const getDisplayString = () => {
        const size = specs.display_size || "";
        const detail = specs.display_specs || specs.display || "";
        return [size, detail].filter(Boolean).join(" ");
    };

    const formatPorts = (value) => {
        if (!value) return "-";
        const parts = value.split(/(?:,?\s+)(?=\d+x)/g);
        if (parts.length <= 1) return value;
        return (
            <div className="flex flex-col gap-1">
                {parts.map((part, index) => (
                    <span key={index} className="block">{part.trim()}</span>
                ))}
            </div>
        );
    };

    const specList = [
        { label: "Brand", value: product.brand },
        { label: "Model", value: product.model },
        { label: "Processor", value: specs.processor },
        { label: "Graphics", value: specs.graphics },
        { label: "Display", value: getDisplayString() },
        { label: "Memory (RAM)", value: specs.ram },
        { label: "Storage", value: specs.storage },
        { label: "Ports", value: formatPorts(specs.ports) },
        { label: "Battery", value: specs.battery },
        { label: "OS", value: specs.os },
        { label: "Weight", value: specs.weight },
    ];

    useEffect(() => {
        const fetchReviews = async () => {
            const { data } = await supabase
                .from('reviews')
                .select(`*, user:users(name, avatar)`)
                .eq('product_id', product.id)
                .order('created_at', { ascending: false });
            if (data) setReviews(data);
        }
        fetchReviews();
    }, [product.id]);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                {tabs.map((tab, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedTab(tab.name)}
                        className={`
                            flex items-center gap-2 px-8 py-5 font-bold transition-all border-b-2 text-sm sm:text-base
                            ${tab.name === selectedTab 
                            ? 'border-slate-900 text-slate-900 bg-white' 
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                        `}
                    >
                        {tab.icon}
                        {tab.name}
                        {tab.name === 'Reviews' && (
                            <span className="ml-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                                {reviews.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-10">
                {selectedTab === "Specifications" && (
                    <div className="animate-in fade-in duration-300">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Technical Specifications</h3>
                        <div className="border rounded-xl overflow-hidden text-sm">
                            {specList.map((item, index) => (
                                item.value ? (
                                    <div key={index} className={`flex flex-col sm:flex-row border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                        <div className="sm:w-1/3 p-4 font-semibold text-slate-600 sm:border-r">
                                            {item.label}
                                        </div>
                                        <div className="sm:w-2/3 p-4 text-slate-700">
                                            {item.value}
                                        </div>
                                    </div>
                                ) : null
                            ))}
                             {specList.every(s => !s.value) && (
                                <div className="p-8 text-center text-slate-400">No data available</div>
                            )}
                        </div>
                    </div>
                )}

                {selectedTab === "Reviews" && (
                    <div className="animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Customer Reviews</h3>
                            {reviews.length > 0 && (
                                <span className="text-green-600 font-bold flex items-center gap-1">
                                    {(reviews.reduce((a,b) => a+b.rating, 0) / reviews.length).toFixed(1)} / 5.0
                                    <Star size={16} className="fill-green-600" />
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            {reviews.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                                </div>
                            ) : (
                                reviews.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-5 border border-slate-100 rounded-xl bg-white hover:shadow-sm transition-shadow">
                                        <div className="flex-shrink-0">
                                            {item.user?.avatar ? (
                                                <img src={item.user.avatar} alt={item.user.name} className="size-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                    <UserCircle size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <p className="font-bold text-slate-800 text-sm">{item.user?.name || "Anonymous"}</p>
                                                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-0.5 my-1">
                                                {Array(5).fill('').map((_, i) => (
                                                    <Star key={i} size={12} className={i < item.rating ? "fill-orange-400 text-orange-400" : "fill-slate-200 text-slate-200"} />
                                                ))}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.comment}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProductDescription