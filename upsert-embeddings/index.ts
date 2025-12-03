import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { rows } = await req.json();

    if (!rows || !Array.isArray(rows)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body. Expected { rows: [...] }" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[upsert-embeddings] Processing ${rows.length} rows...`);

    // Generate embeddings for each row
    const updates = rows.map((row: { id: string; text: string }) => {
      // For now, create a simple embedding from text length and hash
      // In production, use a real embedding API (OpenAI, Cohere, etc.)
      const embedding = generateSimpleEmbedding(row.text);

      return {
        id: row.id,
        embedding: embedding,
        updated_at: new Date().toISOString(),
      };
    });

    // Batch upsert into database
    const { error, data } = await supabase
      .from("music_knowledge")
      .upsert(updates, { onConflict: "id" });

    if (error) {
      console.error("[upsert-embeddings] Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[upsert-embeddings] Successfully updated ${updates.length} rows`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: rows.length,
        updated: updates.length,
        rows: data,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("[upsert-embeddings] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

/**
 * Generate a simple embedding from text (for demonstration)
 * In production, use a real embedding API like OpenAI embeddings
 */
function generateSimpleEmbedding(text: string): number[] {
  // Create a simple deterministic embedding based on text
  const embedding = new Array(384).fill(0); // 384-dim embedding (common size)

  // Simple hash-based approach
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Fill embedding with pseudo-random values based on hash
  for (let i = 0; i < embedding.length; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5 + 0.5; // Normalize to ~[0, 1]
  }

  // Normalize to unit vector (common practice)
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  return embedding.map((val) => val / (magnitude || 1));
}
