import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/article/ArticleCard";
import { useArticles } from "@/hooks/useArticles";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/context/AuthContext";
import { SkeletonCard, LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function Bookmarks() {
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, loading: bookmarksLoading } = useBookmarks();
  const { articles, loading: articlesLoading } = useArticles({ status: "published" });
  const navigate = useNavigate();

  const bookmarkedArticles = articles.filter((a) => bookmarks.includes(a.id));
  const loading = authLoading || bookmarksLoading || articlesLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

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

        <div className="max-w-3xl mb-12">
          <h1 className="font-display text-4xl font-bold mb-4 flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-primary" /> My Bookmarks
          </h1>
          <p className="text-lg text-muted-foreground">
            Articles you've saved for later reading.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : bookmarkedArticles.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              You haven't bookmarked any articles yet.
            </p>
            <Button asChild>
              <Link to="/">Explore Articles</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarkedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}