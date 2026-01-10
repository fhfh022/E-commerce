'use client'
import ProductDescription from "@/components/product/ProductDescription";
import ProductDetails from "@/components/product/ProductDetails";
import ProductCard from "@/components/product/ProductCard"; // ✅ Import Card
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function ProductClient() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState(null); // ✅ ย้าย State รูปมาไว้ที่นี่
    const [recentProducts, setRecentProducts] = useState([]); // ✅ State สำหรับ Recently Viewed

    const products = useSelector(state => state.product.list);

    // 1. Fetch Data
    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            let productData = null;

            const foundInRedux = products.find((p) => p.id === productId);
            if (foundInRedux) {
                productData = foundInRedux;
            } else {
                try {
                    const { data, error } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', productId)
                        .single();
                    if (data) productData = data;
                } catch (error) {
                    console.error("Error fetching product:", error);
                }
            }

            if (productData) {
                setProduct(productData);
                if (productData.images && productData.images.length > 0) {
                    setMainImage(productData.images[0]);
                }
                
                // ✅ Update Recently Viewed Logic
                updateRecentlyViewed(productData.id);
            }
            
            setLoading(false);
        };

        if (productId) fetchProductData();
        window.scrollTo(0, 0);
    }, [productId, products]);

    // 2. Logic จัดการ Recently Viewed (เก็บใน LocalStorage)
    const updateRecentlyViewed = (id) => {
        const STORAGE_KEY = 'recently_viewed_products';
        let viewed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        // ลบตัวซ้ำออก แล้วใส่ตัวล่าสุดไปข้างหน้า
        viewed = viewed.filter(item => item !== id);
        viewed.unshift(id);
        
        // เก็บแค่ 5 ตัวล่าสุด
        if (viewed.length > 5) viewed.pop();
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(viewed));
        
        // หาข้อมูลสินค้าจาก Redux มาแสดง
        const recent = products.filter(p => viewed.includes(p.id) && p.id !== id);
        setRecentProducts(recent);
    };

    if (loading) return <div className="min-h-screen flex justify-center items-center text-slate-300 font-bold animate-pulse">Loading...</div>;
    if (!product) return <div className="min-h-screen flex justify-center items-center">Product not found</div>;

    // Logic ส่วนลดสำหรับ Badge บนรูป
    const isOnSale = product.sale_price > 0 && product.sale_price < product.price;

    return (
        <div className="mx-4 sm:mx-6 pb-20 pt-6 bg-slate-50/50">
            <div className="max-w-7xl mx-auto">
                
                {/* Breadcrumbs */}
                <nav className="flex text-sm text-slate-500 mb-6">
                    <ol className="flex items-center space-x-2">
                        <li>Home</li>
                        <li>/</li>
                        <li>Products</li>
                        <li>/</li>
                        <li className="font-medium text-slate-800 capitalize">{product.category}</li>
                    </ol>
                </nav>

                {/* ✅ GRID LAYOUT: Sticky Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* 🟢 LEFT COLUMN (Images + Description) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">
                        
                        {/* --- Image Gallery Section (ย้ายมาจาก ProductDetails) --- */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col-reverse md:flex-row gap-4">
                                {/* Thumbnails */}
                                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[500px] no-scrollbar">
                                    {product.images?.map((image, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setMainImage(image)}
                                            className={`flex-shrink-0 bg-slate-50 size-20 rounded-lg cursor-pointer border-2 transition-all ${
                                                mainImage === image ? "border-slate-900 ring-1 ring-slate-900" : "border-transparent hover:border-slate-300"
                                            }`}
                                        >
                                            <Image src={image} className="object-contain p-2 w-full h-full" alt="" width={80} height={80} />
                                        </div>
                                    ))}
                                </div>

                                {/* Main Image */}
                                <div className="flex-1 bg-slate-50 rounded-xl relative overflow-hidden group min-h-[400px] flex items-center justify-center">
                                    {mainImage && (
                                        <Image
                                            src={mainImage}
                                            alt={product.name}
                                            width={600}
                                            height={600}
                                            className="object-contain w-full h-full max-h-[500px] transition-transform duration-500 group-hover:scale-110"
                                            priority
                                        />
                                    )}
                                    {isOnSale && (
                                        <span className="absolute top-4 right-4 bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-lg z-10 text-sm">
                                            SALE {Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- Description & Reviews --- */}
                        <div id="details">
                            <ProductDescription product={product} />
                        </div>
                    </div>

                    {/* 🟢 RIGHT COLUMN (Sticky Info) */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="sticky top-24 space-y-6">
                            <ProductDetails product={product} />
                        </div>
                    </div>

                </div>

                {/* ✅ Recently Viewed Section */}
                {recentProducts.length > 0 && (
                    <div className="mt-24 border-t border-slate-200 pt-12">
                        <h3 className="text-2xl font-bold text-slate-800 mb-8">สินค้าที่คุณเพิ่งดูไปล่าสุด</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {recentProducts.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}