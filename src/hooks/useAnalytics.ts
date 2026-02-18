import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalViews: number;
  totalComments: number;
  totalLikes: number;
  totalUsers: number;
  viewsOverTime: { date: string; views: number }[];
  popularArticles: { title: string; views: number; slug: string }[];
  categoryDistribution: { name: string; count: number }[];
  recentActivity: {
    type: 'comment' | 'like' | 'view';
    description: string;
    time: string;
  }[];
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Fetch articles stats
        const { data: articles } = await supabase
          .from('articles')
          .select('id, title, slug, status, views, category_id');

        const totalArticles = articles?.length || 0;
        const publishedArticles = articles?.filter(a => a.status === 'published').length || 0;
        const draftArticles = articles?.filter(a => a.status === 'draft').length || 0;
        const totalViews = articles?.reduce((sum, a) => sum + (a.views || 0), 0) || 0;

        // Fetch comments count
        const { count: totalComments } = await supabase
          .from('comments')
          .select('id', { count: 'exact' });

        // Fetch likes count
        const { count: totalLikes } = await supabase
          .from('likes')
          .select('id', { count: 'exact' });

        // Fetch users count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' });

        // Popular articles
        const popularArticles = (articles || [])
          .filter(a => a.status === 'published')
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10)
          .map(a => ({ title: a.title, views: a.views || 0, slug: a.slug }));

        // Category distribution
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name');

        const categoryDistribution = (categories || []).map(cat => ({
          name: cat.name,
          count: articles?.filter(a => a.category_id === cat.id).length || 0,
        }));

        // Recent activity (mock views over time for now)
        const viewsOverTime = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return {
            date: date.toISOString().split('T')[0],
            views: Math.floor(Math.random() * 100) + 10,
          };
        });

        // Recent comments as activity
        const { data: recentComments } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            author:profiles!comments_user_id_fkey(username)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        const recentActivity = (recentComments || []).map(c => ({
          type: 'comment' as const,
          description: `${c.author?.username || 'User'} commented: "${c.content.slice(0, 50)}..."`,
          time: c.created_at,
        }));

        setData({
          totalArticles,
          publishedArticles,
          draftArticles,
          totalViews,
          totalComments: totalComments || 0,
          totalLikes: totalLikes || 0,
          totalUsers: totalUsers || 0,
          viewsOverTime,
          popularArticles,
          categoryDistribution,
          recentActivity,
        });
      } catch (err) {
        setError(err as Error);
      }

      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  return { data, loading, error };
}