import { supabase } from "@/integrations/supabase/client";

interface DiscordNotificationOptions {
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  author_name?: string | null;
  event: "article_published" | "article_updated";
}

export async function sendDiscordNotification(options: DiscordNotificationOptions) {
  try {
    // Fetch webhook settings
    const { data: webhook } = await supabase
      .from("webhooks")
      .select("*")
      .eq("type", "discord")
      .eq("enabled", true)
      .single();

    if (!webhook || !webhook.url) return;

    const events = webhook.events || [];
    if (!events.includes(options.event)) return;

    const articleUrl = `${window.location.origin}/article/${options.slug}`;
    const isPublish = options.event === "article_published";

    const embed: Record<string, unknown> = {
      title: isPublish ? `📝 New Article Published` : `✏️ Article Updated`,
      description: `**${options.title}**\n\n${options.excerpt || "No excerpt available."}`,
      url: articleUrl,
      color: isPublish ? 5814783 : 16753920,
      timestamp: new Date().toISOString(),
      footer: { text: `By ${options.author_name || "Unknown"} • BlogApp` },
    };

    if (options.featured_image) {
      embed.image = { url: options.featured_image };
    }

    await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.error("Discord notification failed:", err);
  }
}
