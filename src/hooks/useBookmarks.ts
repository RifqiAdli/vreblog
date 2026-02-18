import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useBookmarks(articleId?: string) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('bookmarks')
      .select('article_id')
      .eq('user_id', user.id);

    const bookmarkedIds = (data || []).map(b => b.article_id);
    setBookmarks(bookmarkedIds);

    if (articleId) {
      setBookmarked(bookmarkedIds.includes(articleId));
    }
  }, [user, articleId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (id?: string) => {
    const targetId = id || articleId;
    if (!user || !targetId) return { error: new Error('Must be logged in to bookmark') };

    setLoading(true);

    const isBookmarked = bookmarks.includes(targetId);

    if (isBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('article_id', targetId)
        .eq('user_id', user.id);

      if (!error) {
        setBookmarks(prev => prev.filter(b => b !== targetId));
        if (targetId === articleId) setBookmarked(false);
      }

      setLoading(false);
      return { error };
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({ article_id: targetId, user_id: user.id });

      if (!error) {
        setBookmarks(prev => [...prev, targetId]);
        if (targetId === articleId) setBookmarked(true);
      }

      setLoading(false);
      return { error };
    }
  };

  return { bookmarked, bookmarks, toggleBookmark, loading, refetch: fetchBookmarks };
}