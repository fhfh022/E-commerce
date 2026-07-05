import { NextResponse } from "next/server";

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
    const { items } = await req.json(); // array of cart items: { name, category, brand }

    if (!items || items.length === 0) {
      return NextResponse.json({ keywords: [] });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    const availableModels = await getAvailableModels(process.env.GEMINI_API_KEY);
    const preferredModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp",
    ];
    
    let modelToUse = preferredModels.find((m) => availableModels.includes(m)) || availableModels[0] || "gemini-1.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent`;

    const systemPrompt = `You are an AI shopping assistant for an IT hardware e-commerce store.
The user has the following items in their cart:
${items.map(item => `- ${item.name} (Category: ${item.category})`).join("\n")}

Your task is to suggest 3 complementary product categories or search keywords that they might want to buy with these items.
For example, if they have a Gaming Laptop, suggest "Mouse", "Keyboard", "Cooling Pad". 
If they have a CPU, suggest "Motherboard", "Cooler", "RAM".

CRITICAL RULES:
1. Return ONLY a valid JSON array of 3 strings.
2. DO NOT include markdown formatting like \`\`\`json.
3. DO NOT output any conversational text.
Example output:
["Mouse", "Keyboard", "Bag"]`;

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
          temperature: 0.3,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
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

    // Clean up response if it contains markdown
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const keywords = JSON.parse(aiResponse);
      if (Array.isArray(keywords)) {
        return NextResponse.json({ keywords: keywords.slice(0, 3) });
      } else {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      return NextResponse.json({ keywords: ["Mouse", "Keyboard", "Bag"] }); // Fallback
    }

  } catch (error) {
    console.error("AI Cart Recommendation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations", details: error.message },
      { status: 500 }
    );
  }
}
