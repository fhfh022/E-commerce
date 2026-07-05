-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products table (768 dimensions for Gemini text-embedding-004)
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create a similarity search matching function
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  brand text,
  model text,
  price numeric,
  sale_price numeric,
  category text,
  images text[],
  specs jsonb,
  stock numeric,
  in_stock boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.brand,
    products.model,
    products.price::numeric,
    products.sale_price::numeric,
    products.category,
    products.images::text[],
    products.specs::jsonb,
    products.stock::numeric,
    products.in_stock,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.in_stock = true
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
