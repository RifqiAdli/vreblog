import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  status: 'approved' | 'pending' | 'spam';
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

export function useComments(articleId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('article_id', articleId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError);
    } else {
      // Organize comments into threads
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      (data || []).forEach(comment => {
        commentsMap.set(comment.id, { ...comment, replies: [] } as Comment);
      });

      commentsMap.forEach(comment => {
        if (comment.parent_id && commentsMap.has(comment.parent_id)) {
          commentsMap.get(comment.parent_id)!.replies!.push(comment);
        } else if (!comment.parent_id) {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
    }

    setLoading(false);
  }, [articleId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`comments-${articleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [articleId, fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) return { error: new Error('Must be logged in to comment') };

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
        status: 'approved', // Auto-approve for now
      })
      .select(`
        *,
        author:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
      `)
      .single();

    if (!insertError && data) {
      fetchComments();
    }

    return { data, error: insertError };
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      fetchComments();
    }

    return { error };
  };

  return { comments, loading, error, addComment, deleteComment, refetch: fetchComments };
}