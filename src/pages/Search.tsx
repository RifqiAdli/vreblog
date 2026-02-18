import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/article/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import { SkeletonCard } from "@/components/common/LoadingSpinner";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const { articles, loading } = useArticles({
    status: "published",
    search: debouncedQuery,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      } else {
        setSearchParams({});
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="font-display text-4xl font-bold mb-6 text-center">Search Articles</h1>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, content, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
              autoFocus
            />
          </div>
        </div>

        {debouncedQuery && (
          <p className="text-muted-foreground mb-6">
            {loading ? "Searching..." : `Found ${articles.length} articles for "${debouncedQuery}"`}
          </p>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : articles.length === 0 && debouncedQuery ? (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              No articles found for "{debouncedQuery}"
            </p>
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">
              Start typing to search for articles
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}