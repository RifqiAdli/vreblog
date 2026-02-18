import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye, Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Article } from "@/hooks/useArticles";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "featured" | "compact";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const isBookmarked = bookmarks.includes(article.id);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(article.id);
  };

  if (variant === "featured") {
    return (
      <Card className="group overflow-hidden border-0 bg-gradient-to-br from-primary/5 to-accent/5 hover:shadow-xl transition-all duration-500">
        <Link to={`/article/${article.slug}`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative aspect-[16/10] md:aspect-auto overflow-hidden">
              {article.featured_image ? (
                <img
                  src={article.featured_image}
                  alt={article.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                  Featured
                </Badge>
              </div>
            </div>
            <CardContent className="flex flex-col justify-center p-6 md:p-8">
              {article.category && (
                <Badge variant="outline" className="w-fit mb-3">
                  {article.category.name}
                </Badge>
              )}
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
              )}
              <div className="flex items-center gap-4 mt-auto">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={article.author?.avatar_url || ""} />
                    <AvatarFallback>{article.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{article.author?.full_name || article.author?.username}</span>
                </div>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.reading_time} min read
                </span>
              </div>
            </CardContent>
          </div>
        </Link>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        {article.featured_image && (
          <img
            src={article.featured_image}
            alt={article.title}
            loading="lazy"
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views}</span>
            <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {article.likes_count || 0}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
      <Link to={`/article/${article.slug}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          {article.featured_image ? (
            <img
              src={article.featured_image}
              alt={article.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <span className="text-4xl opacity-50">📝</span>
            </div>
          )}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleBookmark}
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <Badge variant="secondary" className="text-xs">
                {article.category.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.reading_time} min
            </span>
          </div>
          <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.excerpt}</p>
          )}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={article.author?.avatar_url || ""} />
                <AvatarFallback className="text-xs">{article.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{article.author?.username}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views}</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {article.likes_count || 0}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {article.comments_count || 0}</span>
            </div>
          </div>
          {article.published_at && (
            <p className="text-xs text-muted-foreground mt-3">
              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}