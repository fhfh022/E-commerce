import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { query, limit = 5, threshold = 0.3 } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    // 1. Generate query embedding
    const queryEmbedding = await getEmbedding(query);

    // 2. Query Supabase RPC match_products
    const { data: matchedProducts, error } = await supabaseAdmin.rpc("match_products", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return NextResponse.json({ error: "Database matching error", details: error.message }, { status: 500 });
    }

    // 3. Format recommendations in the exact structure expected by frontend
    const recommendations = (matchedProducts || []).map((item) => {
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
        similarity: item.similarity
      };
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    if (error.message?.includes("RATE_LIMIT") || error.message?.includes("429")) {
      return NextResponse.json({ error: "ระบบ AI กำลังประมวลผลให้ผู้ใช้จำนวนมาก กรุณาลองใหม่ในอีกสักครู่" }, { status: 429 });
    }
    console.error("Semantic Search API Error:", error);
    return NextResponse.json({ error: "Search failed", details: error.message }, { status: 500 });
  }
}
