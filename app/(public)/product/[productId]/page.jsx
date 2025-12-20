'use client'
import ProductDescription from "@/components/product/ProductDescription";
import ProductDetails from "@/components/product/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase"; // อย่าลืม import supabase

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true); // เพิ่ม Loading State
    const products = useSelector(state => state.product.list);

    useEffect(() => {
        const fetchProductData = async () => {
            setLoading(true);
            
            // 1. ลองหาจาก Redux ก่อน (กรณี User กดเข้ามาจากหน้า Shop)
            const foundInRedux = products.find((p) => p.id === productId);

            if (foundInRedux) {
                setProduct(foundInRedux);
                setLoading(false);
                return; // เจอแล้ว จบการทำงาน
            }

            // 2. ถ้าไม่เจอใน Redux (กรณี Refresh หน้าจอ) ให้ดึงจาก DB โดยตรง
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single(); // เอามาแค่ชิ้นเดียว
                
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
    }, [productId, products]); // dependency array

    // แสดง Loading ระหว่างรอข้อมูล (กันหน้าจอขาวหรือ Error)
    if (loading) {
        return <div className="min-h-screen flex justify-center items-center text-4xl opacity-80">Loading...</div>;
    }

    // กรณีหาไม่เจอจริงๆ
    if (!product) {
        return <div className="min-h-screen flex justify-center items-center">Product not found</div>;
    }

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrumbs */}
                <div className="text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / <span className="font-medium text-slate-800">{product.category}</span>
                </div>

                {/* Product Details */}
                <ProductDetails product={product} />

                {/* Description & Reviews */}
                <ProductDescription product={product} />
            </div>
        </div>
    );
}