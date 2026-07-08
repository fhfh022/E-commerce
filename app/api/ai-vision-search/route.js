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
    const { image, mimeType } = await req.json(); // image is base64 string

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    // Since we are analyzing images, we prefer gemini-1.5-flash or gemini-1.5-pro which have vision capabilities
    const availableModels = await getAvailableModels(process.env.GEMINI_API_KEY);
    const preferredModels = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro",
      "gemini-2.0-flash-exp",
    ];
    
    // Fallback to gemini-pro-vision if older, otherwise just use whatever we found
    let modelToUse = preferredModels.find((m) => availableModels.includes(m));
    if (!modelToUse) {
      modelToUse = availableModels.includes("gemini-pro-vision") ? "gemini-pro-vision" : (availableModels[0] || "gemini-1.5-flash");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent`;

    const systemPrompt = `You are a visual search assistant for an IT hardware e-commerce store. 
Analyze the provided image and extract a concise search query (maximum 2-3 words) that best describes the main product in the image.
CRITICAL RULES:
1. Extract ONLY the core Brand and Series (e.g., "Acer Predator", "Asus ROG", "Lenovo Legion", "MacBook Pro").
2. DO NOT include any marketing buzzwords, features, or specs (e.g., ignore words like "OLED", "AI", "144Hz", "Gaming", "Laptop", "Intel").
3. DO NOT output any conversational text. Return ONLY the search query string.`;

    // Clean up base64 string if it contains the data URL prefix
    let base64Data = image;
    if (image.includes("base64,")) {
      base64Data = image.split("base64,")[1];
    }

    const response = await fetch(`${apiUrl}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data
                }
              }
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Keep it highly deterministic
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({ query: "acer" }); // Fallback to a safe search query on rate limit
      }
      const errorText = await response.text();
      console.error("Gemini Vision API Error:", response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from AI");
    }

    let aiQuery = data.candidates[0].content?.parts?.[0]?.text;
    if (!aiQuery) {
      throw new Error("Empty response from AI");
    }

    aiQuery = aiQuery.trim().replace(/['"]/g, ''); // Remove quotes if any

    return NextResponse.json({ query: aiQuery });

  } catch (error) {
    console.error("AI Vision Search Error:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: error.message },
      { status: 500 }
    );
  }
}
