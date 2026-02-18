import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useLikes(articleId: string) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLikes = useCallback(async () => {
    const { count } = await supabase
      .from('likes')
      .select('id', { count: 'exact' })
      .eq('article_id', articleId);

    setLikesCount(count || 0);

    if (user) {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .single();

      setLiked(!!data);
    }
  }, [articleId, user]);

  useEffect(() => {
    fetchLikes();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`likes-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          fetchLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, fetchLikes]);

  const toggleLike = async () => {
    if (!user) return { error: new Error('Must be logged in to like') };

    setLoading(true);

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', user.id);

      if (!error) {
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }

      setLoading(false);
      return { error };
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ article_id: articleId, user_id: user.id });

      if (!error) {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }

      setLoading(false);
      return { error };
    }
  };

  return { liked, likesCount, toggleLike, loading };
}