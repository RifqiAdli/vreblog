import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ArticleForm, ArticleFormData } from "@/components/admin/ArticleForm";
import { useUpdateArticle } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateArticle, loading: updating } = useUpdateArticle();
  const [article, setArticle] = useState<ArticleFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      if (!id) return;

      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Article not found");
        navigate("/admin/articles");
        return;
      }

      setArticle({
        title: data.title,
        content: data.content || "",
        excerpt: data.excerpt || "",
        featured_image: data.featured_image || "",
        category_id: data.category_id || "",
        tags: data.tags || [],
        status: data.status as ArticleFormData["status"],
        seo_title: data.seo_title || "",
        seo_description: data.seo_description || "",
        seo_keywords: data.seo_keywords || [],
      });
      setLoading(false);
    }

    fetchArticle();
  }, [id, navigate]);

  const handleSubmit = async (data: ArticleFormData) => {
    if (!id) return;

    const { error } = await updateArticle(id, data);

    if (error) {
      toast.error("Failed to update article");
    } else {
      toast.success("Article updated successfully!");
      navigate("/admin/articles");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Edit Article">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Edit Article">
      {article && (
        <ArticleForm
          initialData={article}
          onSubmit={handleSubmit}
          loading={updating}
        />
      )}
    </AdminLayout>
  );
}