import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getEmbedding } from "@/lib/embeddings";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get available models
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

// GET - Fetch chat history
export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ history: [] });

    const { data: dbUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ history: [] });

    const { data: history } = await supabaseAdmin
      .from("ai_chat_messages")
      .select("role, content")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error("Fetch History Error:", error);
    return NextResponse.json({ history: [] });
  }
}

// POST - Chat with AI and fetch dynamic semantic recommendations
export async function POST(req) {
  try {
    const user = await currentUser();
    const body = await req.json();
    const prompt = body.prompt;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    let recommendedProducts = [];
    let queryEmbedding = null;

    // 1. Generate embedding of the user's prompt
    try {
      queryEmbedding = await getEmbedding(prompt);
    } catch (embErr) {
      console.error("Error generating query embedding:", embErr);
    }

    // 2. Query products using similarity search via RPC
    if (queryEmbedding) {
      const { data: matches, error: rpcError } = await supabaseAdmin.rpc("match_products", {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // retrieve anything loosely relevant to discuss
        match_count: 5
      });

      if (rpcError) {
        console.error("Supabase match_products RPC failed:", rpcError);
      } else {
        recommendedProducts = matches || [];
      }
    }

    // If RPC failed or returned nothing, fallback to basic retrieval to avoid empty context
    if (recommendedProducts.length === 0) {
      const { data: fallbackProducts } = await supabaseAdmin
        .from("products")
        .select("id, name, brand, model, price, sale_price, specs, stock, in_stock, images")
        .eq("in_stock", true)
        .limit(5);
      
      recommendedProducts = (fallbackProducts || []).map(p => ({
        ...p,
        similarity: 0.0
      }));
    }

    // 3. Format recommendations for frontend display
    // Only recommend products with a reasonable similarity score (e.g. >= 0.35)
    // or if the user asks a query that matched fallback context
    const RECOMMENDATION_THRESHOLD = 0.35;
    const formattedRecommendations = recommendedProducts
      .filter((item) => item.similarity >= RECOMMENDATION_THRESHOLD || item.similarity === 0)
      .slice(0, 3)
      .map((item) => {
        const price = item.sale_price && item.sale_price > 0 ? item.sale_price : item.price;
        
        let specsSummary = "";
        if (item.specs && typeof item.specs === "object") {
          const { display_size, processor, ram, storage, graphics } = item.specs;
          specsSummary = [
            display_size ? `${display_size} inch` : null, 
            processor, 
            ram, 
            storage, 
            graphics
          ].filter(Boolean).join(" / ");
        } else {
          specsSummary = item.specs || "";
        }

        return {
          id: item.id,
          title: `${item.name}${item.model ? ` ${item.model}` : ""}`.trim(),
          description: specsSummary,
          price: `฿${Number(price || 0).toLocaleString()}`,
          image: item.images?.[0] || null,
          link: `/product/${item.id}`,
          category: item.brand || item.specs?.graphics || "โน้ตบุ๊ก",
          available: item.in_stock,
        };
      });

    // 4. Build system context for Gemini model
    const productContext = recommendedProducts
      .map((p) => {
        const currentPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
        let specsText = "";
        if (p.specs && typeof p.specs === "object") {
          specsText = Object.entries(p.specs)
            .filter(([_, val]) => val)
            .map(([key, val]) => `${key}: ${val}`)
            .join(", ");
        } else if (p.specs) {
          specsText = String(p.specs);
        }

        return `ชื่อ: ${p.name}, แบรนด์: ${p.brand || ""}, รุ่น: ${p.model || ""}, ราคา: ${Number(currentPrice || 0).toLocaleString()} บาท, สเปก: ${specsText}, สถานะ: ${
          p.in_stock ? "มีของ" : "ของหมด"
        } (ความคล้ายคลึง: ${(p.similarity * 100).toFixed(1)}%)`;
      })
      .join("\n---\n");

    const systemPrompt = `คุณคือ "PRT Assistant" พนักงานขายโน้ตบุ๊ก AI ประจำร้าน PRT Store

นี่คือรายการสินค้าที่คล้ายคลึงกับความต้องการของลูกค้ามากที่สุด (ข้อมูลจากระบบค้นหา Vector Search แบบ Real-time):
${productContext}

คำแนะนำในการตอบคำถาม:
1. **บุคลิก:** ตอบเป็นภาษาไทย สุภาพ เป็นกันเอง เหมือนกูรูไอทีแนะนำเพื่อน
2. **กรณีสินค้ามีในรายการด้านบน:** ให้ข้อมูล ราคา และสเปก โดยอ้างอิงจากรายการด้านบนเท่านั้น
3. **กรณีสินค้า "ไม่มี" ในรายการ หรือเป็นคำถามทั่วไป:**
   - อนุญาตให้ใช้ความรู้ทั่วไปของคุณ (General Knowledge) ตอบได้เลย 
   - แต่ถ้าลูกค้าถามหารุ่นเฉพาะที่ไม่มีในรายการ ให้แจ้งว่า "สินค้ารุ่นนี้ไม่ได้จำหน่ายที่ร้านเราในขณะนี้" และพยายามแนะนำรุ่นที่ใกล้เคียงที่สุดจากรายการด้านบนแทน
4. **ห้าม:** ห้ามแต่งเรื่อง "ราคา" หรือ "สถานะสต็อก" ของสินค้าที่ไม่อยู่ในรายการเด็ดขาด
5. **รูปแบบการตอบ:** สั้น กระชับ ตรงประเด็น ถ้ามีการเปรียบเทียบหรือลิสต์รายการให้ใช้ Bullet points`;

    // 5. Select Model
    const availableModels = await getAvailableModels(process.env.GEMINI_API_KEY);
    const preferredModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp",
      "gemini-pro",
    ];

    const modelToUse = preferredModels.find((m) => availableModels.includes(m)) || availableModels[0];

    if (!modelToUse) {
      return NextResponse.json({
        text: "ขออภัยครับ ตอนนี้ AI ไม่สามารถใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ",
      });
    }

    // 6. Request Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent`;

    const response = await fetch(`${apiUrl}?key=${process.env.GEMINI_API_KEY}`, {
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
            parts: [{ text: "รับทราบครับ ผมพร้อมนำข้อมูลสินค้าจาก Vector Search มาช่วยเหลือแนะนำลูกค้าอย่างสุภาพและแม่นยำแล้วครับ" }],
          },
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    const responsePayload = {
      text: aiResponse,
      recommendations: formattedRecommendations,
    };

    // 7. Save to DB history if user is logged in
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

    return NextResponse.json(responsePayload);
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