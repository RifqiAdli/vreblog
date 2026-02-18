import { Link } from "react-router-dom";
import { useArticles, Article } from "@/hooks/useArticles";
import { ArticleCard } from "@/components/article/ArticleCard";

interface RelatedArticlesProps {
  currentArticle: Article;
}

export function RelatedArticles({ currentArticle }: RelatedArticlesProps) {
  const { articles, loading } = useArticles({ status: "published", limit: 20 });

  if (loading) return null;

  // Score articles by relevance: same category = 3pts, each shared tag = 2pts
  const scored = articles
    .filter((a) => a.id !== currentArticle.id)
    .map((a) => {
      let score = 0;
      if (a.category_id && a.category_id === currentArticle.category_id) score += 3;
      const currentTags = currentArticle.tags || [];
      const articleTags = a.tags || [];
      currentTags.forEach((tag) => {
        if (articleTags.includes(tag)) score += 2;
      });
      return { article: a, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="font-display text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scored.map(({ article }) => (
          <ArticleCard key={article.id} article={article} variant="compact" />
        ))}
      </div>
    </section>
  );
}
