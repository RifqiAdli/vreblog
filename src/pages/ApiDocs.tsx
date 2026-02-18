import { Link } from "react-router-dom";
import { Copy, ArrowLeft, BookOpen, Key, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_BASE = `${window.location.origin}/functions/v1/public-api`;

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const copy = () => { navigator.clipboard.writeText(code); toast.success("Copied!"); };
  return (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded p-1.5 text-muted-foreground hover:text-foreground"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function EndpointCard({
  method, path, description, params, example, response,
}: {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  example: string;
  response: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono">{method}</Badge>
          <code className="text-sm font-mono font-semibold">{path}</code>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {params && params.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Parameters</h4>
            <div className="space-y-2">
              {params.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">{p.name}</code>
                  <span className="text-muted-foreground text-xs">{p.type}</span>
                  {!p.required && <Badge variant="outline" className="text-xs py-0">optional</Badge>}
                  <span className="text-sm">{p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold mb-2">Example Request</h4>
          <CodeBlock code={example} />
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Example Response</h4>
          <CodeBlock code={response} lang="json" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <span className="font-display text-xl font-bold">VreBlog</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> API Docs
            </span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/api"><Key className="h-4 w-4 mr-1" /> My API Keys</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Intro */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-3">VreBlog Public API</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Read-only REST API for accessing VreBlog articles and categories. 
            Perfect for integrating blog content into your own applications.
          </p>
        </div>

        {/* Base URL */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Base URL</h2>
          <CodeBlock code={API_BASE} />
        </section>

        {/* Authentication */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Authentication</h2>
          <p className="text-muted-foreground">
            All requests require an API key passed in the <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">x-api-key</code> header.
            Get your API key from the <Link to="/api" className="text-primary hover:underline">API Dashboard</Link>.
          </p>
          <CodeBlock code={`curl -X GET "${API_BASE}/articles" \\
  -H "x-api-key: YOUR_API_KEY"`} />

          {/* Rate Limiting */}
          <Card className="border-border bg-muted/50">
            <CardContent className="pt-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Rate Limiting</p>
                <p className="text-sm text-muted-foreground">
                  Each API key is limited to <strong>1,000 requests per day</strong>. 
                  The counter resets at midnight UTC. Exceeding this limit returns HTTP 429.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
          <h2 className="font-display text-xl font-semibold">Endpoints</h2>

          <EndpointCard
            method="GET"
            path="/articles"
            description="Returns a paginated list of published articles."
            params={[
              { name: "page", type: "integer", required: false, description: "Page number (default: 1)" },
              { name: "limit", type: "integer", required: false, description: "Items per page, max 50 (default: 10)" },
              { name: "category", type: "string", required: false, description: "Filter by category ID (UUID)" },
              { name: "search", type: "string", required: false, description: "Search in article titles" },
              { name: "tag", type: "string", required: false, description: "Filter by exact tag name" },
            ]}
            example={`curl "${API_BASE}/articles?page=1&limit=10" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{
  "data": [
    {
      "id": "uuid",
      "title": "Article Title",
      "slug": "article-slug",
      "excerpt": "Short description...",
      "featured_image": "https://...",
      "tags": ["tech", "programming"],
      "reading_time": 5,
      "views": 1240,
      "published_at": "2026-01-15T10:00:00Z",
      "category": { "id": "uuid", "name": "Technology", "slug": "technology" },
      "author": { "id": "uuid", "username": "john", "full_name": "John Doe" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}`}
          />

          <EndpointCard
            method="GET"
            path="/articles/:id"
            description="Returns a single published article by its ID, including full content."
            example={`curl "${API_BASE}/articles/ARTICLE_UUID" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{
  "data": {
    "id": "uuid",
    "title": "Article Title",
    "slug": "article-slug",
    "excerpt": "Short description...",
    "content": "<p>Full HTML content...</p>",
    "featured_image": "https://...",
    "tags": ["tech"],
    "reading_time": 5,
    "views": 1240,
    "published_at": "2026-01-15T10:00:00Z",
    "created_at": "2026-01-10T08:00:00Z",
    "category": { "id": "uuid", "name": "Technology", "slug": "technology" },
    "author": { "id": "uuid", "username": "john", "full_name": "John Doe", "avatar_url": "https://..." }
  }
}`}
          />

          <EndpointCard
            method="GET"
            path="/categories"
            description="Returns all available categories."
            example={`curl "${API_BASE}/categories" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{
  "data": [
    {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology",
      "description": "Articles about tech",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}`}
          />
        </section>

        {/* Error Codes */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Error Codes</h2>
          <div className="space-y-2">
            {[
              { code: "200", label: "OK", desc: "Request successful" },
              { code: "401", label: "Unauthorized", desc: "Missing or invalid API key" },
              { code: "403", label: "Forbidden", desc: "API key is inactive" },
              { code: "404", label: "Not Found", desc: "Article not found" },
              { code: "405", label: "Method Not Allowed", desc: "Only GET requests are allowed" },
              { code: "429", label: "Too Many Requests", desc: "Daily rate limit exceeded (1,000 req/day)" },
              { code: "500", label: "Server Error", desc: "Internal server error" },
            ].map((e) => (
              <div key={e.code} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <code className="font-mono font-semibold w-12 shrink-0">{e.code}</code>
                <span className="font-medium w-32 shrink-0">{e.label}</span>
                <span className="text-muted-foreground">{e.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Code examples */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Code Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">JavaScript / Fetch</h3>
              <CodeBlock code={`const API_KEY = "your_api_key_here";
const BASE_URL = "${API_BASE}";

async function getArticles(page = 1) {
  const res = await fetch(\`\${BASE_URL}/articles?page=\${page}\`, {
    headers: { "x-api-key": API_KEY }
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}

const { data, pagination } = await getArticles(1);
console.log(\`Loaded \${data.length} of \${pagination.total} articles\`);`} lang="javascript" />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Python</h3>
              <CodeBlock code={`import requests

API_KEY = "your_api_key_here"
BASE_URL = "${API_BASE}"

headers = {"x-api-key": API_KEY}

# List articles
response = requests.get(f"{BASE_URL}/articles?limit=10", headers=headers)
data = response.json()

for article in data["data"]:
    print(f"{article['title']} - {article['published_at']}")`} lang="python" />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">PHP</h3>
              <CodeBlock code={`<?php
$api_key = "your_api_key_here";
$base_url = "${API_BASE}";

$ch = curl_init("$base_url/articles?limit=10");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["x-api-key: $api_key"]);

$response = curl_exec($ch);
$data = json_decode($response, true);

foreach ($data['data'] as $article) {
    echo $article['title'] . "\\n";
}
?>`} lang="php" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Ready to start?</p>
              <p className="text-sm text-muted-foreground">Get your API key from the dashboard and start building.</p>
            </div>
            <Button asChild>
              <Link to="/api"><Key className="h-4 w-4 mr-2" /> Get API Key</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
