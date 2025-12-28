'use client'
import ProductDescription from "@/components/product/ProductDescription";
import ProductDetails from "@/components/product/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";

export default function ProductClient() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const products = useSelector(state => state.product.list);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            
            // 1. ลองหาจาก Redux ก่อน
            const foundInRedux = products.find((p) => p.id === productId);

            if (foundInRedux) {
                setProduct(foundInRedux);
                setLoading(false);
                return;
            }

            // 2. ถ้าไม่เจอ ดึงจาก DB (Supabase จะดึง sale_price มาให้อัตโนมัติเพราะใช้ select *)
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                
                if (error) throw error;
                if (data) setProduct(data);
                
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProductData();
        }

        window.scrollTo(0, 0);
    }, [productId, products]);

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center text-4xl opacity-80 font-bold text-slate-300">Loading...</div>;
    }

    if (!product) {
        return <div className="min-h-screen flex justify-center items-center text-xl font-bold text-slate-500">Product not found</div>;
    }

    return (
        <div className="mx-6 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs */}
                <div className="text-gray-500 text-sm mt-8 mb-5 flex items-center gap-1">
                    Home <span className="text-slate-300">/</span> Products <span className="text-slate-300">/</span> <span className="font-medium text-slate-800 capitalize">{product.category}</span>
                </div>

                {/* Product Details (ส่ง product ที่มี sale_price ไป) */}
                <ProductDetails product={product} />

                {/* Description & Reviews */}
                <div className="mt-20">
                    <ProductDescription product={product} />
                </div>
            </div>
        </div>
    );
}