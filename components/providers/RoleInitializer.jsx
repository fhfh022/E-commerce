"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
// ✅ เปลี่ยน import เป็น setUserData
import { setUserData } from "@/lib/features/user/userSlice"; 
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function RoleInitializer() {
  const { user } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // ✅ 1. เลือก column name และ avatar เพิ่ม
        const { data, error } = await supabase
          .from("users")
          .select("role, name, avatar") 
          .eq("clerk_id", user.id) // ตรวจสอบว่าใช้ clerk_id ตาม DB จริง
          .single();

        if (data) {
          // ✅ 2. ส่งข้อมูลครบชุดเข้า Redux
          dispatch(setUserData({
            role: data.role || "user",
            name: data.name || user.fullName, // ถ้าใน DB ไม่มี ให้ใช้ชื่อจาก Clerk แทน
            avatar: data.avatar || user.imageUrl // ถ้าใน DB ไม่มี ให้ใช้รูปจาก Clerk แทน
          }));
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [user, dispatch]);

  return null;
}