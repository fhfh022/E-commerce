import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request) {
  try {
    const { clerkId, role } = await request.json();

    if (!clerkId || !role) {
      return NextResponse.json(
        { error: "Missing clerkId or role" },
        { status: 400 }
      );
    }

    // ✅ สำหรับ Next.js 15+ ต้องใช้ await กับ clerkClient()
    const client = await clerkClient();
    
    // ✅ อัพเดท publicMetadata ของ User ใน Clerk
    await client.users.updateUser(clerkId, {
      publicMetadata: {
        role: role,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Role synced with Clerk successfully" 
    });
  } catch (error) {
    console.error("Update User Role API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update role" },
      { status: 500 }
    );
  }
}