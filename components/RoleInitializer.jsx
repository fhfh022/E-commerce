"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setRole } from "@/lib/features/user/userSlice";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function RoleInitializer() {
  const { user } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("clerk_user_id", user.id)
        .single();

      if (data?.role) {
        dispatch(setRole(data.role));
      } else {
        dispatch(setRole("user"));
      }
    };

    fetchRole();
  }, [user]);

  return null;
}
