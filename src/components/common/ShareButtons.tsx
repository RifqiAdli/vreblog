import {
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShareButtonsProps {
  title: string;
  url: string;
  excerpt?: string;
  articleId: string;
}

export function ShareButtons({ title, url, excerpt = "", articleId }: ShareButtonsProps) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);
  const encodedExcerpt = encodeURIComponent(excerpt.slice(0, 100));

  const trackShare = async (platform: string) => {
    await supabase.from("shares").insert({
      article_id: articleId,
      platform,
    });
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`,
  };

  const handleShare = async (platform: keyof typeof shareLinks) => {
    await trackShare(platform);
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      await trackShare("copy_link");
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url,
        });
        await trackShare("native");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("Failed to share");
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-[#1877f2]"
        onClick={() => handleShare("facebook")}
      >
        <Facebook className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-[#1da1f2]"
        onClick={() => handleShare("twitter")}
      >
        <Twitter className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:text-[#0a66c2]"
        onClick={() => handleShare("linkedin")}
      >
        <Linkedin className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
            <MessageCircle className="h-4 w-4 mr-2 text-[#25d366]" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("telegram")}>
            <MessageCircle className="h-4 w-4 mr-2 text-[#0088cc]" />
            Telegram
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare("email")}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link2 className="h-4 w-4 mr-2" />
            Copy Link
          </DropdownMenuItem>
          {typeof navigator.share === "function" && (
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share2 className="h-4 w-4 mr-2" />
              More Options...
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}