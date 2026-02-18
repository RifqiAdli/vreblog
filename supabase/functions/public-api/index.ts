import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed. Only GET requests are supported." }, 405);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return jsonResponse({
      error: "Missing x-api-key header",
      hint: "Include your API key in the request header: x-api-key: YOUR_KEY",
    }, 401);
  }

  const { data: keyData, error: keyError } = await supabaseAdmin
    .from("api_keys")
    .select("id, user_id, daily_limit, requests_today, last_reset_at, is_active")
    .eq("key", apiKey)
    .single();

  if (keyError || !keyData) {
    return jsonResponse({ error: "Invalid API key" }, 401);
  }

  if (!keyData.is_active) {
    return jsonResponse({ error: "API key is inactive. Please contact support." }, 403);
  }

  // Reset daily counter if needed
  const today = new Date().toISOString().split("T")[0];
  if (keyData.last_reset_at !== today) {
    await supabaseAdmin
      .from("api_keys")
      .update({ requests_today: 0, last_reset_at: today })
      .eq("id", keyData.id);
    keyData.requests_today = 0;
  }

  // Check rate limit
  if (keyData.requests_today >= keyData.daily_limit) {
    return jsonResponse({
      error: "Daily rate limit exceeded",
      limit: keyData.daily_limit,
      used: keyData.requests_today,
      reset: "midnight UTC",
    }, 429);
  }

  // Increment counter
  await supabaseAdmin
    .from("api_keys")
    .update({ requests_today: keyData.requests_today + 1 })
    .eq("id", keyData.id);

  // Parse URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // pathParts[0] = "public-api", pathParts[1] = resource, pathParts[2] = id
  const resource = pathParts[1] || "";
  const resourceId = pathParts[2] || "";

  let statusCode = 200;
  let responseData: unknown;

  try {
    if (resource === "articles") {
      if (resourceId) {
        // GET /articles/:id
        const { data, error } = await supabaseAdmin
          .from("articles")
          .select(`
            id, title, slug, excerpt, content,
            featured_image, tags, reading_time, views,
            published_at, created_at,
            category:categories(id, name, slug),
            author:profiles!articles_author_id_fkey(id, username, full_name, avatar_url)
          `)
          .eq("id", resourceId)
          .eq("status", "published")
          .single();
        if (error) throw error;
        if (!data) return jsonResponse({ error: "Article not found" }, 404);
        responseData = { data };
      } else {
        // GET /articles with pagination & filters
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "10")), 50);
        const offset = (page - 1) * limit;
        const category = url.searchParams.get("category");
        const search = url.searchParams.get("search");
        const tag = url.searchParams.get("tag");

        let query = supabaseAdmin
          .from("articles")
          .select(`
            id, title, slug, excerpt, featured_image,
            tags, reading_time, views, published_at,
            category:categories(id, name, slug),
            author:profiles!articles_author_id_fkey(id, username, full_name)
          `, { count: "exact" })
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (category) query = query.eq("category_id", category);
        if (search) query = query.ilike("title", `%${search}%`);
        if (tag) query = query.contains("tags", [tag]);

        const { data, error, count } = await query;
        if (error) throw error;

        responseData = {
          data,
          pagination: {
            page,
            limit,
            total: count ?? 0,
            total_pages: Math.ceil((count ?? 0) / limit),
            has_next: offset + limit < (count ?? 0),
            has_prev: page > 1,
          },
        };
      }
    } else if (resource === "categories") {
      const { data, error } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug, description, created_at")
        .order("name");
      if (error) throw error;
      responseData = { data };
    } else {
      // Root: API info
      responseData = {
        name: "VreBlog Public API",
        version: "1.0.0",
        description: "Read-only API for accessing VreBlog articles and categories.",
        endpoints: {
          "GET /articles": {
            description: "List published articles",
            params: {
              page: "Page number (default: 1)",
              limit: "Items per page (default: 10, max: 50)",
              category: "Filter by category ID",
              search: "Search in article titles",
              tag: "Filter by tag",
            },
          },
          "GET /articles/:id": { description: "Get single article by ID" },
          "GET /categories": { description: "List all categories" },
        },
        rate_limit: {
          limit: keyData.daily_limit,
          used: keyData.requests_today + 1,
          remaining: keyData.daily_limit - keyData.requests_today - 1,
          reset: "midnight UTC",
        },
        docs: "See the API documentation page for examples.",
      };
    }
  } catch (err) {
    statusCode = 500;
    responseData = { error: err instanceof Error ? err.message : "Internal server error" };
  }

  // Log request
  try {
    await supabaseAdmin.from("api_request_logs").insert({
      api_key_id: keyData.id,
      endpoint: `/${resource}${resourceId ? "/" + resourceId : ""}${url.search}`,
      method: req.method,
      status_code: statusCode,
    });
  } catch (_) { /* ignore log errors */ }

  return jsonResponse(responseData, statusCode);
});
