"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabase";
import { setProduct } from "@/lib/features/product/productSlice";
import { setCartItems } from "@/lib/features/cart/cartSlice";
import { useUser } from "@clerk/nextjs";

export default function AppInitializer({ children }) {
  const dispatch = useDispatch();
  const { user, isLoaded } = useUser();

  // 1. Fetch สินค้าทั้งหมด (ทำงานปกติ)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) dispatch(setProduct(data));
      } catch (error) {
        console.error("Global Fetch Error:", error.message);
      }
    };
    fetchAllProducts();
  }, [dispatch]);

  // 2. ✅ [แก้ไขใหม่] ดึงข้อมูลตะกร้าแบบรอจนกว่า User จะพร้อม
  useEffect(() => {
    const fetchUserCart = async () => {
        if (!isLoaded || !user) {
            // กรณีไม่มี User หรือยังไม่ Login ให้เซ็ตโหลดเสร็จเลยเพื่อให้หน้า UI ไม่ค้าง
            dispatch(setCartItems({})); 
            return;
        }

        try {
            const { data: userData } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_id", user.id)
                .single();

            if (userData) {
                const { data: cartData } = await supabase
                    .from("cart")
                    .select("product_id, quantity")
                    .eq("user_id", userData.id);

                const cartObj = {};
                if (cartData) {
                    cartData.forEach((item) => {
                        cartObj[item.product_id] = item.quantity;
                    });
                }
                dispatch(setCartItems(cartObj)); // ตัวนี้จะไปเซ็ต isLoaded = true ใน Redux
            } else {
                dispatch(setCartItems({})); // ถ้าไม่เจอ User ใน DB ให้เซ็ตเป็นตะกร้าว่าง
            }
        } catch (error) {
            console.error(error);
            dispatch(setCartItems({})); 
        }
    };
    fetchUserCart();
}, [isLoaded, user]);
  return <>{children}</>;
}
