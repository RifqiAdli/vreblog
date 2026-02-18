import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIGenerateSEOProps {
  content: string;
  onGenerated: (data: { seo_title: string; seo_description: string; seo_keywords: string[] }) => void;
}

export function AIGenerateSEO({ content, onGenerated }: AIGenerateSEOProps) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!content || content === '<p></p>') {
      toast.error('Write some content first');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-article', {
        body: { content, action: 'generate_seo' },
      });
      if (error) throw error;
      const parsed = JSON.parse(data.result);
      onGenerated(parsed);
      toast.success('SEO metadata generated!');
    } catch {
      toast.error('Failed to generate SEO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      AI Generate SEO
    </Button>
  );
}
