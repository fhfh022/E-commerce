"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "@/lib/features/auth/authSlice";
import { setFavorites } from "@/lib/features/favorite/favoriteSlice";

export default function SyncUser() {
  const { user, isLoaded } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoaded && !user) {
      dispatch(clearUser());
      dispatch(setFavorites([]));
      return;
    }

    const sync = async () => {
      try {
        // 1. แก้ไขชื่อคอลัมน์ให้ตรงกับ Database (clerk_id)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .upsert(
            {
              clerk_id: user.id, // ✅ แก้จาก clerk_user_id เป็น clerk_id
              email: user.primaryEmailAddress?.emailAddress,
              name: user.fullName,
              avatar: user.imageUrl,
            },
            { onConflict: "clerk_id" } // ✅ แก้ตรงนี้ด้วยครับ
          )
          .select()
          .single();

        if (userError) {
          console.error("Supabase Upsert Error:", userError);
          return;
        }

        if (userData) {
          dispatch(setUser(userData));

          // 2. ดึง Favorites
          const { data: favData } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("user_id", userData.id);

          if (favData) {
            const idArray = favData.map((item) => item.product_id);
            dispatch(setFavorites(idArray));
          }
        }
      } catch (error) {
        console.error("Sync Error:", error);
      }
    };

    if (user) sync();
  }, [isLoaded, user, dispatch]);

  return null;
}
