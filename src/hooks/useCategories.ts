import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (fetchError) {
      setError(fetchError);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, loading, error, refetch: fetchCategories };
}

export function useCategoryCRUD() {
  const [loading, setLoading] = useState(false);

  const createCategory = async (data: { name: string; slug: string; description?: string }) => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();
    setLoading(false);
    return { data: result, error };
  };

  const updateCategory = async (id: string, data: { name?: string; slug?: string; description?: string }) => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    setLoading(false);
    return { data: result, error };
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    setLoading(false);
    return { error };
  };

  return { createCategory, updateCategory, deleteCategory, loading };
}
