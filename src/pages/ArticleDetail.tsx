import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Clock, Eye, Heart, ChevronLeft, Calendar, Tag, ArrowUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useArticle } from "@/hooks/useArticles";
import { useLikes } from "@/hooks/useLikes";
import { useAuth } from "@/context/AuthContext";
import { CommentSection } from "@/components/article/CommentSection";
import { ShareButtons } from "@/components/common/ShareButtons";
import { RelatedArticles } from "@/components/article/RelatedArticles";
import { SkeletonArticle } from "@/components/common/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { article, loading, error } = useArticle(slug || "");
  const { user } = useAuth();
  const { liked, likesCount, toggleLike, loading: likeLoading } = useLikes(article?.id || "");
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useSwipeNavigation();

  const articleUrl = `${window.location.origin}/article/${article?.slug || slug}`;

  useSEO({
    title: article ? `${article.seo_title || article.title} | VreBlog` : 'VreBlog',
    description: article?.seo_description || article?.excerpt || '',
    image: article?.featured_image || '',
    url: articleUrl,
    type: 'article',
    author: article?.author?.full_name || article?.author?.username || '',
    publishedAt: article?.published_at || '',
    tags: article?.tags || [],
    jsonLd: article ? {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.seo_description || article.excerpt || '',
      image: article.featured_image || '',
      datePublished: article.published_at,
      dateModified: article.updated_at,
      author: {
        "@type": "Person",
        name: article.author?.full_name || article.author?.username || '',
      },
      publisher: {
        "@type": "Organization",
        name: "VreBlog",
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
      wordCount: article.content?.split(/\s+/).length || 0,
    } : undefined,
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
      setShowBackToTop(scrollTop > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like articles");
      return;
    }
    await toggleLike();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SkeletonArticle />
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // articleUrl already defined above

  return (
    <div className="min-h-screen flex flex-col">
      {/* Reading Progress Bar */}
      <div className="reading-progress" style={{ width: `${readingProgress}%` }} />
      
      <Header />

      <main className="flex-1">
        <article className="container max-w-4xl py-8 md:py-12">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Articles
          </Link>

          {/* Article Header */}
          <header className="mb-8 animate-fade-in">
            {article.category && (
              <Link to={`/category/${article.category.slug}`}>
                <Badge variant="secondary" className="mb-4 hover:bg-primary hover:text-primary-foreground transition-colors">
                  {article.category.name}
                </Badge>
              </Link>
            )}
            
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>
            )}

            {/* Author & Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Link to={`/author/${article.author?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={article.author?.avatar_url || ""} />
                  <AvatarFallback>{article.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{article.author?.full_name || article.author?.username}</p>
                  <p className="text-sm text-muted-foreground">@{article.author?.username}</p>
                </div>
              </Link>

              <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {article.published_at && format(new Date(article.published_at), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {article.reading_time} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {article.views}
                </span>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag) => (
                  <Link key={tag} to={`/search?tag=${tag}`}>
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" /> {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="relative aspect-[16/9] mb-8 rounded-xl overflow-hidden animate-fade-in">
              <img
                src={article.featured_image}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div
            className="prose-content mb-12 animate-fade-in"
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />

          {/* Like & Share */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b mb-12">
            <Button
              variant={liked ? "default" : "outline"}
              onClick={handleLike}
              disabled={likeLoading}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likesCount} {likesCount === 1 ? "Like" : "Likes"}
            </Button>

            <ShareButtons
              title={article.title}
              url={articleUrl}
              excerpt={article.excerpt || ""}
              articleId={article.id}
            />
          </div>

          {/* Comments */}
          <CommentSection articleId={article.id} />

          {/* Related Articles */}
          <RelatedArticles currentArticle={article} />
        </article>
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 rounded-full shadow-lg animate-fade-in z-40"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      <Footer />
    </div>
  );
}