import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCategories } from "@/hooks/useCategories";
import { useArticles } from "@/hooks/useArticles";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard } from "@/components/common/LoadingSpinner";
import { ArrowRight, FileText } from "lucide-react";

export default function Categories() {
  const { categories, loading } = useCategories();
  const { articles } = useArticles({ status: "published" });

  const getCategoryCount = (categoryId: string) => {
    return articles.filter((a) => a.category_id === categoryId).length;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="font-display text-4xl font-bold mb-4">Categories</h1>
          <p className="text-lg text-muted-foreground">
            Explore articles organized by topic. Find what interests you most.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="block animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h2 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {getCategoryCount(category.id)} articles
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}