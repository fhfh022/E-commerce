"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SyncUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const sync = async () => {
      await supabase.from("users").upsert(
        {
          clerk_user_id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          avatar: user.imageUrl,
        },
        { onConflict: "clerk_user_id" }
      );
    };

    sync();
  }, [isLoaded, user]);

  return null;
}
