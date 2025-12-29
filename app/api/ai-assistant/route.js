import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server"; // ✅ เพิ่ม import

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ฟังก์ชันดึงรายชื่อ models ที่ใช้ได้
async function getAvailableModels(apiKey) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
}

// ✅ เพิ่ม API GET สำหรับดึงประวัติแชท
export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ history: [] });

    // หา ID ใน Supabase
    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ history: [] });

    // ดึงประวัติแชท
    const { data: history } = await supabaseAdmin
      .from("ai_chat_messages")
      .select("role, content")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: true }); // เรียงจากเก่าไปใหม่

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(req) {
  try {
    const user = await currentUser(); // ✅ ดึง User ปัจจุบัน
    const body = await req.json();
    const prompt = body.prompt;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    // 2. ดึงข้อมูลสินค้า
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("name, model, price, sale_price, specs, stock, in_stock");

    if (error) {
      console.error("Supabase Fetch Error:", error);
      return NextResponse.json({
        text: "ขออภัยครับ ระบบฐานข้อมูลมีปัญหาชั่วคราว ไม่สามารถดึงข้อมูลสินค้าได้ในขณะนี้",
      });
    }

    const safeProducts = products || [];

    // 3. เตรียมข้อมูลสินค้า
    const productContext = safeProducts
      .map((p) => {
        const currentPrice =
          p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;

        let specsText = "ไม่มีข้อมูลสเปก";
        if (p.specs && typeof p.specs === "object") {
          specsText = Object.entries(p.specs)
            .filter(([_, val]) => val)
            .map(([key, val]) => `${key}: ${val}`)
            .join(", ");
        } else if (typeof p.specs === "string") {
          specsText = p.specs;
        }

        return `ชื่อ: ${p.name}, รุ่น: ${p.model}, ราคา: ${currentPrice.toLocaleString()} บาท, สเปก: ${specsText}, สถานะ: ${
          p.in_stock ? "มีของ" : "ของหมด"
        }`;
      })
      .join("\n---\n");

    // 4. สร้าง Prompt
    const systemPrompt = `คุณคือ "PRT Assistant" พนักงานขายโน้ตบุ๊ก AI ประจำร้าน PRT Store

    นี่คือรายการสินค้าทั้งหมดที่มีขายในร้านตอนนี้ (ข้อมูล Real-time):
    ${productContext}

    คำแนะนำในการตอบคำถาม:
    1. **บุคลิก:** ตอบเป็นภาษาไทย สุภาพ เป็นกันเอง เหมือนกูรูไอทีแนะนำเพื่อน
    2. **กรณีสินค้ามีในร้าน:** ให้ข้อมูล ราคา และสเปก โดยอ้างอิงจากรายการข้างบนเท่านั้น
    3. **กรณีสินค้า "ไม่มี" ในร้าน หรือเป็นคำถามทั่วไป:** - อนุญาตให้ใช้ความรู้ทั่วไปของคุณ (General Knowledge) ตอบได้เลย 
      - แต่ต้องแจ้งลูกค้าเสมอว่า "สินค้ารุ่นนี้ไม่ได้จำหน่ายที่ร้านเรา" 
      - และพยายามแนะนำรุ่นใกล้เคียงที่มีในร้านแทน (ถ้ามี)
    4. **ห้าม:** ห้ามแต่งเรื่อง "ราคา" หรือ "สถานะสต็อก" ของสินค้าที่ไม่อยู่ในรายการเด็ดขาด
    5. **รูปแบบการตอบ:** สั้น กระชับ ตรงประเด็น ถ้ามีการเปรียบเทียบให้ใช้ Bullet points`;

    // 5. เลือก Model
    const availableModels = await getAvailableModels(
      process.env.GEMINI_API_KEY
    );

    const preferredModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp",
      "gemini-pro",
    ];

    const modelToUse =
      preferredModels.find((m) => availableModels.includes(m)) ||
      availableModels[0];

    if (!modelToUse) {
      return NextResponse.json({
        text: "ขออภัยครับ ตอนนี้ AI ไม่สามารถใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ",
      });
    }

    // 6. เรียก AI
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent`;

    const response = await fetch(
      `${apiUrl}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "model",
              parts: [
                {
                  text: "รับทราบครับ ผมพร้อมให้คำแนะนำทั้งสินค้าในร้านและความรู้ไอทีทั่วไปแล้วครับ",
                },
              ],
            },
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API Error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // ✅ 7. บันทึกแชทลง Database (ถ้า User Login อยู่)
    if (user) {
      const { data: dbUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (dbUser) {
        await supabaseAdmin.from("ai_chat_messages").insert([
          { user_id: dbUser.id, role: "user", content: prompt },
          { user_id: dbUser.id, role: "assistant", content: aiResponse },
        ]);
      }
    }

    return NextResponse.json({ text: aiResponse });
  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json(
      {
        error: "AI กำลังงอแงครับ ลองถามใหม่อีกครั้งนะครับ",
        details: error.message,
      },
      { status: 500 }
    );
  }
}