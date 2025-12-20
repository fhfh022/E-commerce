"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabase";
import { setProduct } from "@/lib/features/product/productSlice";

export default function AppInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) dispatch(setProduct(data)); // เก็บเข้า Redux ทันที
      } catch (error) {
        console.error("Global Fetch Error:", error.message);
      }
    };

    fetchAllProducts();
  }, [dispatch]);

  return <>{children}</>;
}
