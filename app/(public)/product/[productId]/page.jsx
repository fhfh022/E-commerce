import { supabase } from "@/lib/supabase";
import ProductClient from "./ProductClient";

// ✅ 1. ฟังก์ชันสร้าง Metadata (ทำงานฝั่ง Server)
export async function generateMetadata({ params }) {
  const { productId } = params;

  // ดึงข้อมูลสินค้าเพื่อมาทำชื่อ Tab
  const { data: product } = await supabase
    .from("products")
    .select("name, model")
    .eq("id", productId)
    .single();

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.name} - ${product.model}`, // ชื่อ Tab ที่ต้องการ
    description: `View details for ${product.name} ${product.model}`,
  };
}

// ✅ 2. Page หลักทำหน้าที่ส่งต่อให้ Client Component
export default function Page() {
  return <ProductClient />;
}