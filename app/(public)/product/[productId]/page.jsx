import ProductClient from "./ProductClient"; 
import { supabase } from "@/lib/supabase";

// ✅ 1. แก้ไขฟังก์ชัน generateMetadata
export async function generateMetadata({ params }) {
   // เพิ่ม await ตรงนี้
   const { productId } = await params;

   // ดึงข้อมูลสินค้าเพื่อมาทำชื่อ Tab
   const { data: product } = await supabase
     .from('products')
     .select('name')
     .eq('id', productId)
     .single();

   return {
     title: product ? `${product.name} | PRT. plus` : 'Product Detail',
   }
}

// ✅ 2. แก้ไขตัวฟังก์ชันหลักของหน้า Page
export default async function ProductPage({ params }) {
    // ต้อง await params ตรงนี้ด้วยเช่นกันครับ
    const { productId } = await params;

    return (
        <ProductClient productId={productId} />
    )
}