import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ArticleForm, ArticleFormData } from "@/components/admin/ArticleForm";
import { useCreateArticle } from "@/hooks/useArticles";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function CreateArticle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createArticle, loading } = useCreateArticle();

  const handleSubmit = async (data: ArticleFormData) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { data: article, error } = await createArticle({
      ...data,
      author_id: user.id,
    });

    if (error) {
      toast.error("Failed to create article");
    } else {
      toast.success("Article created successfully!");
      navigate("/admin/articles");
    }
  };

  return (
    <AdminLayout title="Create Article">
      <ArticleForm onSubmit={handleSubmit} loading={loading} />
    </AdminLayout>
  );
}