"use client";
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

const Counter = ({ productId, stock }) => { // ✅ 1. รับ prop 'stock' เพิ่ม
  const { cartItems } = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const currentQuantity = cartItems[productId] || 0;

  const handleUpdateQuantity = async (type) => {
    try {
      let newQuantity = currentQuantity;

      if (type === "add") {
        // ✅ 2. เช็คสต็อกก่อนบวกเพิ่ม
        if (currentQuantity >= stock) {
            toast.error(`Max stock reached! Only ${stock} items available.`);
            return;
        }
        newQuantity += 1;
        dispatch(addToCart({ productId }));
      } else {
        if (currentQuantity <= 1) return;
        newQuantity -= 1;
        dispatch(removeFromCart({ productId }));
      }

      // Sync Database
      if (user) {
        const { error } = await supabase.from("cart").upsert(
          {
            user_id: user.id,
            product_id: productId,
            quantity: newQuantity,
          },
          { onConflict: "user_id, product_id" }
        );

        if (error) throw error;
      }
    } catch (error) {
      console.error("Cart update error:", error.message);
      toast.error("Failed to sync cart");
    }
  };

  return (
    // ✅ 3. ปรับ UI ให้สวยงามและปิดปุ่มบวกถ้าของหมดสต็อก
    <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600 bg-white shadow-sm h-[50px]">
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
        // ✅ 4. ปิดปุ่มและเปลี่ยนสีถ้าถึงลิมิตสต็อก
        className={`p-1 select-none w-6 transition-colors ${
            currentQuantity >= stock 
            ? "text-slate-300 cursor-not-allowed" 
            : "hover:text-green-600"
        }`}
        disabled={currentQuantity >= stock}
      >
        +
      </button>
    </div>
  );
};

export default Counter;