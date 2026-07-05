import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

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
    const user = await currentUser();
    // In a real app, you might check if user is admin/store manager
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, brand, model } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Product name is required to generate specs." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a helpful IT hardware expert AI.
The user wants to auto-fill a product specification form for an e-commerce website.
Based on the following product name, brand, and model, please provide the standard specifications for this device.
If you are unsure of an exact detail, provide a reasonable guess for this tier of laptop, or leave it blank "".

Product Name: ${name}
Brand: ${brand || "Unknown"}
Model: ${model || "Unknown"}

Return ONLY a valid JSON object with the following keys. Do not use markdown blocks like \`\`\`json, just return the raw JSON object.
{
  "processor": "e.g., Intel Core i7-13700H",
  "processor_detail": "e.g., 14 Cores, up to 5.0GHz",
  "graphics": "e.g., NVIDIA GeForce RTX 4060 8GB GDDR6",
  "display": "e.g., IPS 165Hz sRGB 100%",
  "display_size": "e.g., 15.6\\"",
  "ram": "e.g., 16GB DDR5 4800MHz",
  "storage": "e.g., 512GB PCIe 4.0 NVMe M.2 SSD",
  "ports": "e.g., 2x USB 3.2 Gen 2, 1x Thunderbolt 4, 1x HDMI 2.1",
  "battery": "e.g., 4-Cell, 90Wh",
  "os": "e.g., Windows 11 Home",
  "weight": "e.g., 2.30 KG",
  "wireless": "e.g., Wi-Fi 6E (802.11ax)",
  "bluetooth": "e.g., Bluetooth 5.2",
  "network": "e.g., 10/100/1000/2500 LAN"
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
      console.error("Gemini API HTTP Error:", response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini returned no candidates:", JSON.stringify(data));
      throw new Error("No response from AI. Possible safety block.");
    }

    let aiResponse = data.candidates[0].content?.parts?.[0]?.text;
    if (!aiResponse) {
      throw new Error("Empty text returned from AI");
    }
    
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    // Extract JSON block in case AI added conversational text
    const jsonStartIndex = aiResponse.indexOf('{');
    const jsonEndIndex = aiResponse.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      aiResponse = aiResponse.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    try {
      const parsedSpecs = JSON.parse(aiResponse);
      return NextResponse.json({ specs: parsedSpecs });
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", aiResponse);
      throw new Error("AI returned malformed JSON");
    }

  } catch (error) {
    console.error("Generate Specs Error:", error);
    return NextResponse.json(
      { error: "Failed to generate specifications", details: error.message },
      { status: 500 }
    );
  }
}
