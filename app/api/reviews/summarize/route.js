import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

export async function POST(req) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    // 1. Fetch reviews from Supabase
    const { data: reviews, error: fetchError } = await supabaseAdmin
      .from("reviews")
      .select("rating, comment")
      .eq("product_id", productId);

    if (fetchError) throw fetchError;

    if (!reviews || reviews.length < 2) {
      return NextResponse.json({ 
        summary: null, 
        message: "ต้องการรีวิวอย่างน้อย 2 รายการเพื่อสรุปด้วย AI" 
      });
    }

    // 2. Format reviews text
    const reviewsText = reviews
      .map((r, i) => `รีวิวที่ ${i + 1} (คะแนน: ${r.rating}/5): ${r.comment}`)
      .join("\n---\n");

    const systemPrompt = `คุณคือผู้ช่วย AI วิเคราะห์ข้อมูลความคิดเห็นของลูกค้าประจำร้าน PRT Store
หน้าที่ของคุณคือสรุปรีวิวสินค้าจากรายการรีวิวของลูกค้าที่ซื้อสินค้าจริง
ให้อ่านและวิเคราะห์รีวิวทั้งหมด แล้วสรุปออกมาเป็นข้อมูล JSON ที่ประกอบด้วย จุดเด่น (pros), จุดด้อย (cons) และ สรุปภาพรวม (overall) ในรูปแบบของ Bullet points ภาษาไทยที่กระชับและสุภาพ

นี่คือรายการรีวิวของลูกค้า:
${reviewsText}

ส่งกลับมาเป็นโครงสร้าง JSON นี้เท่านั้น ห้ามตอบคุยนอกเหนือจาก JSON:
{
  "pros": ["จุดเด่นข้อที่ 1", "จุดเด่นข้อที่ 2", ...],
  "cons": ["จุดด้อยข้อที่ 1", "จุดด้อยข้อที่ 2", ...],
  "overall": "สรุปผลตอบรับโดยรวมจากลูกค้า"
}`;

    const availableModels = await getAvailableModels(process.env.GEMINI_API_KEY);
    const preferredModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp",
      "gemini-pro",
    ];

    const modelToUse = preferredModels.find((m) => availableModels.includes(m)) || availableModels[0] || "gemini-pro"; 
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
        ],
        generationConfig: {
          temperature: 0.2
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error in Review Summarizer:", response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from AI");
    }

    let aiResponse = data.candidates[0].content?.parts?.[0]?.text;
    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    const jsonStartIndex = aiResponse.indexOf('{');
    const jsonEndIndex = aiResponse.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      aiResponse = aiResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    const parsedSummary = JSON.parse(aiResponse);
    return NextResponse.json({ summary: parsedSummary });

  } catch (error) {
    console.error("Review Summarizer Error:", error);
    return NextResponse.json(
      { error: "Failed to summarize reviews", details: error.message },
      { status: 500 }
    );
  }
}
