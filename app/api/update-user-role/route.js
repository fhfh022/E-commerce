import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { clerkId, role, isBlocked } = await req.json();
    const client = await clerkClient();

    // 1. กรณีมีการส่ง Role มา (Update Role ปกติ)
    if (role) {
      await client.users.updateUserMetadata(clerkId, {
        publicMetadata: { role: role },
      });
    }

    // 2. กรณีมีการส่ง isBlocked มา (จัดการเรื่องแบนและเตะออก)
    if (typeof isBlocked !== "undefined") {
      // อัปเดต Metadata ไว้เช็คสถานะ
      await client.users.updateUserMetadata(clerkId, {
        publicMetadata: { is_blocked: isBlocked },
      });

      if (isBlocked) {
        // --- หัวใจสำคัญ: สั่งแบนและเตะออก ---
        await client.users.banUser(clerkId);
        
        // ดึง session ทั้งหมดและสั่งยกเลิก (Revoke)
        const { data: sessions } = await client.sessions.getSessionList({ userId: clerkId });
        for (const session of sessions) {
          await client.sessions.revokeSession(session.id);
        }
      } else {
        // ปลดแบน
        await client.users.unbanUser(clerkId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clerk Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}