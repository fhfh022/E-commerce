"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/product/ProductCard";
import Loading from "@/components/layout/Loading";
import { useParams } from "next/navigation";
import { 
    Briefcase, 
    Zap, 
    Gamepad2, 
    Crosshair, 
    Cpu, 
    Feather, 
    ArrowRight,
    Trophy,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CollectionPage() {
    const { collectionName } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ เพิ่ม State สำหรับ Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; 

    // Config ธีม
    const themes = {
        "productivity": {
            title: "Unleash Your Productivity",
            subtitle: "บางเบาแต่ทรงพลัง คู่หูที่สมบูรณ์แบบสำหรับคนทำงานยุคใหม่",
            gradient: "from-slate-50 to-slate-200",
            accentColor: "text-blue-600",
            buttonColor: "bg-blue-600 hover:bg-blue-700",
            icon: <Briefcase size={40} className="text-blue-600" />,
            subIcon: <Feather size={20} />,
            badge: "Work Anywhere",
            darkMode: false
        },
        "gaming-pro": {
            title: "Master the Game",
            subtitle: "สเปกสุดโหด กราฟิกจัดเต็ม เพื่อชัยชนะในทุกสมรภูมิ",
            gradient: "from-slate-900 via-purple-900 to-slate-900",
            accentColor: "text-red-500",
            buttonColor: "bg-red-600 hover:bg-red-700",
            icon: <Gamepad2 size={40} className="text-red-500" />,
            subIcon: <Crosshair size={20} />,
            badge: "Pro Gamer Choice",
            darkMode: true
        }
    };

    const currentTheme = themes[collectionName] || themes["productivity"];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('products').select('*');
                
                let filtered = [];
                if (collectionName === 'productivity') {
                    filtered = data.filter(p => 
                        (p.specs?.weight && parseFloat(p.specs.weight) < 1.7) || 
                        p.category?.toLowerCase() === 'ultrabook'
                    );
                } else if (collectionName === 'gaming-pro') {
                    filtered = data.filter(p => 
                        p.category?.toLowerCase() === 'gaming' || 
                        p.specs?.graphics?.includes('RTX')
                    );
                }

                setProducts(filtered);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [collectionName]);

    useEffect(() => {
        setCurrentPage(1);
    }, [collectionName]);

    if (loading) return <Loading />;

    const highlightProduct = products.length > 0 
        ? products.reduce((prev, current) => (prev.price > current.price) ? prev : current) 
        : null;
        
    const otherProducts = products.filter(p => p.id !== highlightProduct?.id);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = otherProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(otherProducts.length / itemsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className={`min-h-screen pb-20 ${currentTheme.darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-800'}`}>
            
            {/* --- Hero Header --- */}
            <div className={`relative py-20 px-6 overflow-hidden bg-gradient-to-br ${currentTheme.gradient}`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-current opacity-5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-current opacity-5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-full mb-6 shadow-xl border border-white/20">
                        {currentTheme.icon}
                    </div>
                    <h1 className={`text-4xl md:text-6xl font-black mb-4 tracking-tight ${currentTheme.darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {currentTheme.title}
                    </h1>
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium ${currentTheme.darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                        {currentTheme.subtitle}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                
                {/* --- Spotlight Product --- */}
                {highlightProduct && (
                    <div className={`rounded-3xl p-8 md:p-12 mb-16 shadow-2xl flex flex-col md:flex-row items-center gap-10 border ${
                        currentTheme.darkMode 
                        ? 'bg-slate-900/80 border-slate-800 backdrop-blur-sm' 
                        : 'bg-white border-slate-100'
                    }`}>
                        <div className="flex-1 space-y-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentTheme.buttonColor} text-white`}>
                                <Trophy size={14} /> The Ultimate Choice
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                                {highlightProduct.name}
                            </h2>

                            <div className="flex gap-4 flex-wrap">
                                {highlightProduct.specs?.processor && (
                                    <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${currentTheme.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <Cpu size={16} className="inline mr-2 opacity-70"/> 
                                        {highlightProduct.specs.processor}
                                    </div>
                                )}
                                {highlightProduct.specs?.graphics && (
                                    <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${currentTheme.darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                        <Zap size={16} className="inline mr-2 opacity-70"/> 
                                        {highlightProduct.specs.graphics}
                                    </div>
                                )}
                            </div>
                            
                            {/* ✅ แก้ไขตรงนี้: ใช้ display_size และ display_specs แทน description */}
                            <p className={`text-sm md:text-base leading-relaxed ${currentTheme.darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {highlightProduct.specs?.display_size} {highlightProduct.specs?.display_specs ? `- ${highlightProduct.specs.display_specs}` : ''}
                            </p>

                            <div className="pt-4 flex items-center gap-4">
                                <span className={`text-3xl font-black ${currentTheme.accentColor}`}>
                                    ${(highlightProduct.sale_price || highlightProduct.price).toLocaleString()}
                                </span>
                                <Link 
                                    href={`/product/${highlightProduct.id}`}
                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex items-center gap-2 ${currentTheme.buttonColor}`}
                                >
                                    Shop Now <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 w-full flex justify-center">
                            <div className="relative w-full max-w-md aspect-square">
                                <div className={`absolute inset-0 rounded-full blur-[80px] opacity-40 ${currentTheme.darkMode ? 'bg-purple-600' : 'bg-blue-300'}`}></div>
                                <Image 
                                    src={highlightProduct.images?.[0] || '/placeholder.png'} 
                                    alt={highlightProduct.name}
                                    fill
                                    className="object-contain relative z-10 hover:scale-105 transition duration-500 drop-shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Grid Layout for Other Products --- */}
                <div id="product-grid" className="flex items-center gap-3 mb-8">
                    {currentTheme.subIcon}
                    <h3 className="text-2xl font-bold">More {currentTheme.badge}</h3>
                    <div className={`h-px flex-1 ${currentTheme.darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {currentItems.map(product => (
                        <div key={product.id} className={currentTheme.darkMode ? "dark-theme-card" : ""}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <p>No products found in this collection.</p>
                    </div>
                )}

                {/* Pagination UI */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-16">
                        <button 
                            onClick={() => paginate(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className={`p-3 rounded-xl border transition ${
                                currentTheme.darkMode 
                                ? "border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white" 
                                : "border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600"
                            }`}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <span className={`text-sm font-bold px-6 py-3 rounded-xl shadow-sm border ${
                            currentTheme.darkMode 
                            ? "bg-slate-900 border-slate-800 text-white" 
                            : "bg-white border-slate-100 text-slate-600"
                        }`}>
                            หน้า {currentPage} จาก {totalPages}
                        </span>

                        <button 
                            onClick={() => paginate(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className={`p-3 rounded-xl border transition ${
                                currentTheme.darkMode 
                                ? "border-slate-800 hover:bg-slate-800 disabled:opacity-30 text-white" 
                                : "border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-slate-600"
                            }`}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}