import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/article/ArticleCard";
import { useArticles } from "@/hooks/useArticles";
import { useCategories } from "@/hooks/useCategories";
import { SkeletonCard } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { InstallPrompt } from "@/components/common/InstallPrompt";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

export default function Home() {
  const { articles, loading } = useArticles({ status: "published", limit: 12 });
  const { categories } = useCategories();
  
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1, 7);
  const popularArticles = [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  useSEO({
    title: 'VreBlog - Discover Stories That Inspire',
    description: 'Explore insightful articles on technology, lifestyle, business, and more. Join our community of readers and writers.',
    url: window.location.origin,
  });

  useSwipeNavigation();
  const { PullIndicator } = usePullToRefresh();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PullIndicator />
      <Header />
      
      <main className="flex-1 pb-16 md:pb-0">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center animate-fade-in">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 rounded-full text-xs font-medium">
                <Sparkles className="h-3 w-3 mr-1.5" />
                Welcome to VreBlog
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                Discover Stories
                <br />
                That{" "}
                <span className="gradient-text">Inspire</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                Explore insightful articles on technology, lifestyle, business, and more.
                Join our community of readers and writers.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.slice(0, 5).map((category) => (
                  <Link key={category.id} to={`/category/${category.slug}`}>
                    <Badge
                      variant="outline"
                      className="px-4 py-2 text-sm rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 cursor-pointer"
                    >
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="container pb-12">
            <ArticleCard article={featuredArticle} variant="featured" />
          </section>
        )}

        {/* Recent Articles Grid */}
        <section className="container py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold">Recent Articles</h2>
            <Button variant="ghost" asChild className="rounded-xl">
              <Link to="/categories">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentArticles.map((article, index) => (
                <div key={article.id} className="animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Popular Articles */}
        <section className="container py-12 border-t">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Now
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {popularArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="compact" />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-display text-xl font-bold mb-6">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-all duration-200 group"
                  >
                    <span className="font-medium text-sm">{category.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <InstallPrompt />
    </div>
  );
}
