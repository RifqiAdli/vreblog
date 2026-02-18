import { useParams, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/article/ArticleCard";
import { useArticles } from "@/hooks/useArticles";
import { useCategories } from "@/hooks/useCategories";
import { SkeletonCard } from "@/components/common/LoadingSpinner";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading: categoriesLoading } = useCategories();
  const category = categories.find((c) => c.slug === slug);
  
  // Only fetch articles once we have the category ID to avoid showing all articles
  const { articles, loading: articlesLoading } = useArticles({
    status: "published",
    category: category?.id,
  });

  const loading = categoriesLoading || articlesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8 md:py-12">
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> All Categories
        </Link>

        <div className="max-w-3xl mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">
            {category?.name || "Category"}
          </h1>
          {category?.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
        </div>

        {loading || !category ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No articles in this category yet.</p>
            <Link to="/" className="text-primary hover:underline">
              Browse all articles
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}