'use server'

import { clerkClient } from "@clerk/nextjs/server";
// import { db } from "@/lib/db"; // ถ้ามีไฟล์เชื่อม DB ให้ import มาด้วย

export async function toggleBlockUser(userId, shouldBlock) {
  try {
    const client = await clerkClient();

    // 1. อัปเดตใน Database ของเรา (ถ้ามี)
    /* await db.user.update({
      where: { clerkId: userId },
      data: { is_block: shouldBlock }
    });
    */

    // 2. อัปเดต Metadata ใน Clerk เพื่อให้แสดงสถานะใน Dashboard ได้
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        is_blocked: shouldBlock
      }
    });

    if (shouldBlock) {
      // 3. สั่ง BAN (ทำให้ Login ใหม่ไม่ได้)
      await client.users.banUser(userId);

      // 4. เตะ Session ที่ค้างอยู่ทิ้งทันที (ทำให้ออฟไลน์เดี๋ยวนี้)
      const { data: sessions } = await client.sessions.getSessionList({ userId });
      
      for (const session of sessions) {
        await client.sessions.revokeSession(session.id);
      }
      
      console.log(`User ${userId} has been blocked and kicked out.`);
    } else {
      // กรณีปลดบล็อก: สั่ง UNBAN
      await client.users.unbanUser(userId);
      console.log(`User ${userId} has been unbanned.`);
    }

    return { success: true };
  } catch (error) {
    console.error("Block Error:", error);
    return { success: false, error: error.message };
  }
}