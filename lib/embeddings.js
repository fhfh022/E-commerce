/**
 * Generates a 768-dimensional vector embedding for the given text using Gemini's gemini-embedding-001 model.
 * 
 * @param {string} text The text content to embed
 * @returns {Promise<number[]>} The vector embedding array
 */
export async function getEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  // Clean up input text
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) {
    throw new Error("Cannot embed empty text");
  }

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text: cleanText }]
      },
      outputDimensionality: 768
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Embedding API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.embedding || !data.embedding.values) {
    throw new Error("Invalid response structure from Gemini Embedding API");
  }

  return data.embedding.values;
}
