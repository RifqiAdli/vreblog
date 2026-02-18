import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      improve: "You are a professional editor. Improve the given HTML article content by fixing grammar, improving readability, and making it more engaging. Keep the HTML structure intact. Return ONLY the improved HTML content without any explanation or markdown wrapping.",
      shorten: "You are a professional editor. Shorten the given HTML article content while keeping the key points. Keep the HTML structure intact. Return ONLY the shortened HTML content without any explanation or markdown wrapping.",
      expand: "You are a professional editor. Expand the given HTML article content with more details, examples, and context. Keep the HTML structure intact. Return ONLY the expanded HTML content without any explanation or markdown wrapping.",
      fix_grammar: "You are a professional proofreader. Fix all grammar, spelling, and punctuation errors in the given HTML content. Keep the HTML structure intact. Return ONLY the corrected HTML content without any explanation or markdown wrapping.",
      make_professional: "You are a professional editor. Rewrite the given HTML article content in a more professional and formal tone. Keep the HTML structure intact. Return ONLY the rewritten HTML content without any explanation or markdown wrapping.",
      translate_en: "You are a professional translator. Translate the given HTML article content to English. Keep the HTML structure intact. Return ONLY the translated HTML content without any explanation or markdown wrapping.",
      translate_id: "You are a professional translator. Translate the given HTML article content to Indonesian (Bahasa Indonesia). Keep the HTML structure intact. Return ONLY the translated HTML content without any explanation or markdown wrapping.",
      generate_seo: "You are an SEO expert. Based on the given HTML article content, generate SEO metadata. Return a JSON object with: { \"seo_title\": \"max 60 chars\", \"seo_description\": \"max 160 chars\", \"seo_keywords\": [\"keyword1\", \"keyword2\", ...] }. Return ONLY the JSON without any explanation or markdown wrapping.",
    };

    const systemPrompt = systemPrompts[action] || systemPrompts.improve;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("improve-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
