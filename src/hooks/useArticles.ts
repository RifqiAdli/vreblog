import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendDiscordNotification } from '@/lib/discord';

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  tags: string[];
  author_id: string;
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at: string | null;
  views: number;
  unique_views: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  reading_time: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  likes_count?: number;
  comments_count?: number;
}

interface UseArticlesOptions {
  status?: 'published' | 'draft' | 'scheduled' | 'all';
  category?: string;
  tag?: string;
  search?: string;
  limit?: number;
  authorId?: string;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('articles')
      .select(`
        *,
        author:profiles!articles_author_id_fkey(id, username, full_name, avatar_url),
        category:categories!articles_category_id_fkey(id, name, slug)
      `)
      .order('created_at', { ascending: false });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.category) {
      query = query.eq('category_id', options.category);
    }

    if (options.tag) {
      query = query.contains('tags', [options.tag]);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    if (options.authorId) {
      query = query.eq('author_id', options.authorId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError);
    } else {
      // Fetch likes and comments counts
      const articlesWithCounts = await Promise.all(
        (data || []).map(async (article) => {
          const [likesResult, commentsResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('article_id', article.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('article_id', article.id).eq('status', 'approved'),
          ]);

          return {
            ...article,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
          } as Article;
        })
      );
      setArticles(articlesWithCounts);
    }

    setLoading(false);
  }, [options.status, options.category, options.tag, options.search, options.limit, options.authorId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles };
}

export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          author:profiles!articles_author_id_fkey(id, username, full_name, avatar_url),
          category:categories!articles_category_id_fkey(id, name, slug)
        `)
        .eq('slug', slug)
        .single();

      if (fetchError) {
        setError(fetchError);
      } else if (data) {
        // Increment views
        supabase.rpc('increment_views', { article_id: data.id });

        // Fetch counts
        const [likesResult, commentsResult] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact' }).eq('article_id', data.id),
          supabase.from('comments').select('id', { count: 'exact' }).eq('article_id', data.id).eq('status', 'approved'),
        ]);

        setArticle({
          ...data,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
        } as Article);
      }

      setLoading(false);
    }

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  return { article, loading, error };
}

export function useCreateArticle() {
  const [loading, setLoading] = useState(false);

  const createArticle = async (articleData: {
    title: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    category_id?: string;
    tags?: string[];
    author_id: string;
    status?: 'draft' | 'published' | 'scheduled';
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
  }) => {
    setLoading(true);

    // Generate slug from title
    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: articleData.title,
        slug,
        content: articleData.content || null,
        excerpt: articleData.excerpt || null,
        featured_image: articleData.featured_image || null,
        category_id: articleData.category_id || null,
        tags: articleData.tags || [],
        author_id: articleData.author_id,
        status: articleData.status || 'draft',
        seo_title: articleData.seo_title || null,
        seo_description: articleData.seo_description || null,
        seo_keywords: articleData.seo_keywords || [],
        published_at: articleData.status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    setLoading(false);

    // Send Discord notification if published
    if (!error && data && articleData.status === 'published') {
      sendDiscordNotification({
        title: data.title,
        slug: data.slug,
        excerpt: articleData.excerpt,
        featured_image: articleData.featured_image,
        event: 'article_published',
      });
    }

    return { data, error };
  };

  return { createArticle, loading };
}

export function useUpdateArticle() {
  const [loading, setLoading] = useState(false);

  const updateArticle = async (id: string, updates: {
    title?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    category_id?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'scheduled';
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    scheduled_at?: string;
  }) => {
    setLoading(true);

    // Clean empty strings to null for nullable fields
    const cleanedUpdates = { ...updates };
    if (cleanedUpdates.category_id === '') cleanedUpdates.category_id = undefined;
    if (cleanedUpdates.excerpt === '') cleanedUpdates.excerpt = undefined;
    if (cleanedUpdates.featured_image === '') cleanedUpdates.featured_image = undefined;
    if (cleanedUpdates.seo_title === '') cleanedUpdates.seo_title = undefined;
    if (cleanedUpdates.seo_description === '') cleanedUpdates.seo_description = undefined;

    const updateData: Record<string, unknown> = {
      ...cleanedUpdates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'published') {
      const { data: existing } = await supabase
        .from('articles')
        .select('published_at')
        .eq('id', id)
        .single();
      
      if (!existing?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    setLoading(false);

    // Send Discord notification
    if (!error && data) {
      const event = updates.status === 'published' ? 'article_published' : 'article_updated';
      sendDiscordNotification({
        title: data.title,
        slug: data.slug,
        excerpt: updates.excerpt,
        featured_image: updates.featured_image,
        event,
      });
    }

    return { data, error };
  };

  return { updateArticle, loading };
}

export function useDeleteArticle() {
  const [loading, setLoading] = useState(false);

  const deleteArticle = async (id: string) => {
    setLoading(true);

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    setLoading(false);

    return { error };
  };

  return { deleteArticle, loading };
}