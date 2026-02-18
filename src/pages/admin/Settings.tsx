import { useState, useEffect } from "react";
import { Save, TestTube, Check } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState({
    title: "VreBlog",
    description: "A professional blog platform",
    logo: "",
  });

  const [seoSettings, setSeoSettings] = useState({
    defaultTitle: "VreBlog",
    defaultDescription: "Discover amazing articles on our blog",
  });

  const [socialSettings, setSocialSettings] = useState({
    twitter: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  const [webhookSettings, setWebhookSettings] = useState({
    discordUrl: "",
    enabled: true,
    notifyOnPublish: true,
    notifyOnUpdate: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*");

    if (data) {
      data.forEach((setting) => {
        switch (setting.key) {
          case "site":
            setSiteSettings(setting.value as typeof siteSettings);
            break;
          case "seo":
            setSeoSettings(setting.value as typeof seoSettings);
            break;
          case "social":
            setSocialSettings(setting.value as typeof socialSettings);
            break;
        }
      });
    }

    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("*")
      .eq("type", "discord")
      .single();

    if (webhooks) {
      setWebhookSettings({
        discordUrl: webhooks.url,
        enabled: webhooks.enabled,
        notifyOnPublish: webhooks.events?.includes("article_published") || false,
        notifyOnUpdate: webhooks.events?.includes("article_updated") || false,
      });
    }

    setLoading(false);
  };

  const saveSetting = async (key: string, value: Record<string, string>) => {
    setSaving(true);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("key", key)
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from("settings")
        .update({ value: value as unknown as null, updated_at: new Date().toISOString() })
        .eq("key", key);
      error = result.error;
    } else {
      const result = await supabase
        .from("settings")
        .insert([{ key, value: value as unknown as null, updated_at: new Date().toISOString() }]);
      error = result.error;
    }

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }

    setSaving(false);
  };

  const saveWebhook = async () => {
    setSaving(true);

    const events = [];
    if (webhookSettings.notifyOnPublish) events.push("article_published");
    if (webhookSettings.notifyOnUpdate) events.push("article_updated");

    const { error } = await supabase.from("webhooks").upsert(
      {
        name: "Discord Notifications",
        url: webhookSettings.discordUrl,
        type: "discord",
        enabled: webhookSettings.enabled,
        events,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "name" }
    );

    if (error) {
      toast.error("Failed to save webhook settings");
    } else {
      toast.success("Webhook settings saved");
    }

    setSaving(false);
  };

  const testWebhook = async () => {
    if (!webhookSettings.discordUrl) {
      toast.error("Please enter a Discord webhook URL");
      return;
    }

    setTestingWebhook(true);

    try {
      const response = await fetch(webhookSettings.discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "🎉 Webhook Test Successful!",
              description: "Your Discord webhook is working correctly.",
              color: 5814783,
              timestamp: new Date().toISOString(),
              footer: { text: "Blog Notification System" },
            },
          ],
        }),
      });

      if (response.ok) {
        toast.success("Test message sent to Discord!");
      } else {
        toast.error("Failed to send test message. Check your webhook URL.");
      }
    } catch (err) {
      toast.error("Failed to connect to Discord");
    }

    setTestingWebhook(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <Tabs defaultValue="site" className="space-y-6">
        <TabsList>
          <TabsTrigger value="site">Site</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="webhook">Discord Webhook</TabsTrigger>
        </TabsList>

        {/* Site Settings */}
        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
              <CardDescription>General site configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-title">Site Title</Label>
                <Input
                  id="site-title"
                  value={siteSettings.title}
                  onChange={(e) => setSiteSettings({ ...siteSettings, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={siteSettings.description}
                  onChange={(e) => setSiteSettings({ ...siteSettings, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <ImageUpload
                  value={siteSettings.logo}
                  onChange={(url) => setSiteSettings({ ...siteSettings, logo: url })}
                  label="Site Logo"
                />
              </div>
              <Button onClick={() => saveSetting("site", siteSettings)} disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Default SEO configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Default Title</Label>
                <Input
                  id="seo-title"
                  value={seoSettings.defaultTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, defaultTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Default Description</Label>
                <Textarea
                  id="seo-description"
                  value={seoSettings.defaultDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, defaultDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={() => saveSetting("seo", seoSettings)} disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Settings */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Your social media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={socialSettings.twitter}
                    onChange={(e) => setSocialSettings({ ...socialSettings, twitter: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={socialSettings.facebook}
                    onChange={(e) => setSocialSettings({ ...socialSettings, facebook: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={socialSettings.instagram}
                    onChange={(e) => setSocialSettings({ ...socialSettings, instagram: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={socialSettings.linkedin}
                    onChange={(e) => setSocialSettings({ ...socialSettings, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
              </div>
              <Button onClick={() => saveSetting("social", socialSettings)} disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discord Webhook */}
        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Discord Webhook</CardTitle>
              <CardDescription>
                Get notified in Discord when articles are published
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={webhookSettings.discordUrl}
                  onChange={(e) => setWebhookSettings({ ...webhookSettings, discordUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  type="password"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Webhook</Label>
                    <p className="text-sm text-muted-foreground">Turn notifications on or off</p>
                  </div>
                  <Switch
                    checked={webhookSettings.enabled}
                    onCheckedChange={(checked) => setWebhookSettings({ ...webhookSettings, enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify on Publish</Label>
                    <p className="text-sm text-muted-foreground">Send notification when article is published</p>
                  </div>
                  <Switch
                    checked={webhookSettings.notifyOnPublish}
                    onCheckedChange={(checked) =>
                      setWebhookSettings({ ...webhookSettings, notifyOnPublish: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notify on Update</Label>
                    <p className="text-sm text-muted-foreground">Send notification when article is updated</p>
                  </div>
                  <Switch
                    checked={webhookSettings.notifyOnUpdate}
                    onCheckedChange={(checked) =>
                      setWebhookSettings({ ...webhookSettings, notifyOnUpdate: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveWebhook} disabled={saving}>
                  {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                </Button>
                <Button variant="outline" onClick={testWebhook} disabled={testingWebhook}>
                  {testingWebhook ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" /> Test Webhook
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}