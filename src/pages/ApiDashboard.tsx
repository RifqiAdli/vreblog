import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Copy, Plus, Trash2, Key, Activity, Code, Eye, EyeOff, RefreshCw, Shield, Edit2, Check, X, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { format } from "date-fns";


interface ApiKey {
  id: string;
  name: string;
  key: string;
  requests_today: number;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
  user_id: string;
  owner?: { username: string | null; full_name: string | null };
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  created_at: string;
}

export default function ApiDashboard() {
  const { user, isAdmin } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLimit, setEditLimit] = useState("");

  useSEO({ title: "API Dashboard | VreBlog", description: "Manage your VreBlog API keys and monitor usage." });

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Admin sees all keys with owner info, user sees own keys
    const keysQuery = isAdmin
      ? supabase.from("api_keys").select("*, owner:profiles!api_keys_user_id_fkey(username, full_name)").order("created_at", { ascending: false })
      : supabase.from("api_keys").select("*").order("created_at", { ascending: false });

    const [keysRes, logsRes] = await Promise.all([
      keysQuery,
      supabase.from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (keysRes.data) setApiKeys(keysRes.data as ApiKey[]);
    if (logsRes.data) setLogs(logsRes.data as ApiLog[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  // Realtime subscription for api_keys
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("api-keys-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_keys" }, () => {
        fetchData();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "api_request_logs" }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const createKey = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from("api_keys").insert({ user_id: user.id, name: newKeyName || "Default" });
    if (error) toast.error("Failed to create API key");
    else { toast.success("API key created!"); setNewKeyName(""); }
    setCreating(false);
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else toast.success("Key deleted");
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("api_keys").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Failed to update");
  };

  const startEdit = (k: ApiKey) => {
    setEditingKey(k.id);
    setEditName(k.name);
    setEditLimit(String(k.daily_limit));
  };

  const saveEdit = async (id: string) => {
    const updates: Record<string, unknown> = { name: editName };
    const limit = parseInt(editLimit);
    if (!isNaN(limit) && limit > 0) updates.daily_limit = limit;
    const { error } = await supabase.from("api_keys").update(updates).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success("Key updated"); setEditingKey(null); }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied!");
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalRequestsToday = apiKeys.reduce((sum, k) => sum + k.requests_today, 0);
  const apiBaseUrl = `${window.location.origin}/functions/v1/public-api`;

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <Key className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle>API Access</CardTitle>
              <CardDescription>Sign in to manage your API keys</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild><a href="/auth">Sign In</a></Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="font-display text-3xl font-bold">API Dashboard</h1>
            {isAdmin && <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>}
          </div>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage all API keys and monitor usage. Rate limit: 1,000 requests/day per key." : "Manage your API keys and monitor usage. Rate limit: 1,000 requests/day per key."}
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{apiKeys.length}</p>
                  <p className="text-sm text-muted-foreground">API Keys</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalRequestsToday}</p>
                  <p className="text-sm text-muted-foreground">Requests Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{logs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="logs">Request Logs</TabsTrigger>
            <TabsTrigger value="docs">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Create New Key</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Key name (e.g. My App)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
                  <Button onClick={createKey} disabled={creating}>
                    {creating ? <LoadingSpinner size="sm" /> : <><Plus className="h-4 w-4 mr-1" /> Create</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
            ) : apiKeys.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No API keys yet. Create one above.</CardContent></Card>
            ) : (
              apiKeys.map((k) => (
                <Card key={k.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {editingKey === k.id ? (
                          <div className="space-y-2 mb-2">
                            <div className="flex gap-2">
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Key name" className="h-8" />
                              <Input value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="Daily limit" type="number" className="h-8 w-28" />
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => saveEdit(k.id)}><Check className="h-4 w-4 text-primary" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingKey(null)}><X className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{k.name}</h3>
                            <Badge variant={k.is_active ? "default" : "secondary"}>{k.is_active ? "Active" : "Inactive"}</Badge>
                            {isAdmin && k.owner && (
                              <Badge variant="outline" className="text-xs">
                                {k.owner.full_name || k.owner.username || "Unknown"}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 font-mono text-sm bg-muted rounded-lg px-3 py-2">
                          <span className="truncate">{visibleKeys.has(k.id) ? k.key : "vb_••••••••••••••••"}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => toggleKeyVisibility(k.id)}>
                            {visibleKeys.has(k.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyKey(k.key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {k.requests_today}/{k.daily_limit} requests today · Created {format(new Date(k.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(isAdmin || k.user_id === user.id) && (
                          <>
                            <Switch checked={k.is_active} onCheckedChange={() => toggleActive(k.id, k.is_active)} />
                            <Button variant="ghost" size="icon" onClick={() => startEdit(k)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" onClick={() => deleteKey(k.id)}><Trash2 className="h-4 w-4" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Requests</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No requests logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Time</th>
                          <th className="text-left py-2 pr-4">Method</th>
                          <th className="text-left py-2 pr-4">Endpoint</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{format(new Date(log.created_at), "HH:mm:ss")}</td>
                            <td className="py-2 pr-4"><Badge variant="outline" className="text-xs">{log.method}</Badge></td>
                            <td className="py-2 pr-4 font-mono text-xs">{log.endpoint}</td>
                            <td className="py-2">
                              <Badge variant={log.status_code < 400 ? "default" : "destructive"} className="text-xs">{log.status_code}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">API Documentation</CardTitle>
                    <CardDescription>Read-only API to access VreBlog articles and categories.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/api/docs"><BookOpen className="h-4 w-4 mr-1.5" /> Full Docs Page</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Base URL</h3>
                  <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto font-mono">{apiBaseUrl}</pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">Include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">x-api-key</code> header:</p>
                  <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto font-mono">
{`curl -H "x-api-key: YOUR_API_KEY" \\
  ${apiBaseUrl}/articles`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Endpoints (Read-Only)</h3>
                  <div className="space-y-3">
                    {[
                      { method: "GET", path: "/articles", desc: "List published articles", params: "page, limit (max 50), category, search, tag" },
                      { method: "GET", path: "/articles/:id", desc: "Get single article with full content" },
                      { method: "GET", path: "/categories", desc: "List all categories" },
                    ].map((ep, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Badge variant="default" className="text-xs mt-0.5">{ep.method}</Badge>
                        <div>
                          <code className="text-sm font-mono">{ep.path}</code>
                          <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
                          {ep.params && <p className="text-xs text-muted-foreground">Params: {ep.params}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Rate Limits</h3>
                  <p className="text-sm text-muted-foreground">1,000 requests per day per API key. Resets at midnight UTC. HTTP 429 is returned when exceeded.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <div className="hidden md:block"><Footer /></div>
    </div>
  );
}

