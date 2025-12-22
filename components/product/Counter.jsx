"use client";
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase"; // [เพิ่ม] นำเข้า supabase client
import { toast } from "react-hot-toast";

const Counter = ({ productId }) => {
  const { cartItems } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user); // [เพิ่ม] ดึงข้อมูล user เพื่อใช้ระบุเจ้าของตะกร้า
  const dispatch = useDispatch();

  const currentQuantity = cartItems[productId] || 0;

  // ✅ ฟังก์ชันจัดการการเปลี่ยนแปลงจำนวนสินค้า
  const handleUpdateQuantity = async (type) => {
    try {
      let newQuantity = currentQuantity;

      if (type === "add") {
        newQuantity += 1;
        dispatch(addToCart({ productId }));
      } else {
        if (currentQuantity <= 1) return; // ป้องกันไม่ให้ลดจนต่ำกว่า 1 ในหน้านี้ (ใช้ปุ่มลบทิ้งแทน)
        newQuantity -= 1;
        dispatch(removeFromCart({ productId }));
      }

      // ถ้าผู้ใช้ Login อยู่ ให้ซิงค์ข้อมูลไปที่ Database
      if (user) {
        const { error } = await supabase.from("cart").upsert(
          {
            user_id: user.id,
            product_id: productId,
            quantity: newQuantity,
          },
          { onConflict: "user_id, product_id" }
        ); // อัปเดตแถวเดิมถ้ามีอยู่แล้ว

        if (error) throw error;
      }
    } catch (error) {
      console.error("Cart update error:", error.message);
      toast.error("Failed to sync cart");
    }
  };

  return (
    <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600 bg-white shadow-sm">
      <button
        onClick={() => handleUpdateQuantity("remove")}
        className="p-1 select-none hover:text-red-500 transition-colors w-6"
        disabled={currentQuantity <= 1}
      >
        -
      </button>

      <p className="p-1 min-w-[20px] text-center font-medium text-slate-800">
        {currentQuantity}
      </p>

      <button
        onClick={() => handleUpdateQuantity("add")}
        className="p-1 select-none hover:text-green-600 transition-colors w-6"
      >
        +
      </button>
    </div>
  );
};

export default Counter;
