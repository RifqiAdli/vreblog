import { useState, useEffect } from "react";
import {
  Key, Trash2, Eye, EyeOff, Copy, RefreshCw,
  Search, ToggleLeft, ToggleRight, Users,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key: string;
  requests_today: number;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
  profiles: { username: string | null; full_name: string | null } | null;
}

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editingLimit, setEditingLimit] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchKeys();

    // Realtime subscription
    const channel = supabase
      .channel("admin-api-keys-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "api_keys" }, () => {
        fetchKeys();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchKeys = async () => {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*, profiles:user_id(username, full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load API keys: " + error.message);
    } else {
      setKeys((data ?? []) as unknown as ApiKeyRow[]);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("api_keys").update({ is_active: !current }).eq("id", id);
    if (error) toast.error("Failed to update: " + error.message);
    else toast.success(current ? "Key deactivated" : "Key activated");
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) toast.error("Failed to delete: " + error.message);
    else toast.success("API key deleted");
  };

  const resetUsage = async (id: string) => {
    const { error } = await supabase.from("api_keys").update({ requests_today: 0 }).eq("id", id);
    if (error) toast.error("Failed to reset usage");
    else toast.success("Usage reset to 0");
  };

  const saveLimit = async (id: string) => {
    const raw = editingLimit[id];
    if (!raw) return;
    const val = parseInt(raw);
    if (isNaN(val) || val < 1) return toast.error("Limit must be a positive number");
    const { error } = await supabase.from("api_keys").update({ daily_limit: val }).eq("id", id);
    if (error) toast.error("Failed to update limit");
    else {
      toast.success("Daily limit updated");
      setEditingLimit((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied!");
  };

  const toggleVisible = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = keys.filter((k) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      k.name.toLowerCase().includes(q) ||
      k.key.includes(q) ||
      k.profiles?.username?.toLowerCase().includes(q) ||
      k.profiles?.full_name?.toLowerCase().includes(q)
    );
  });

  const totalRequests = keys.reduce((s, k) => s + k.requests_today, 0);

  return (
    <AdminLayout title="API Keys Management">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Key className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{keys.length}</p>
                <p className="text-sm text-muted-foreground">Total Keys</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{keys.filter((k) => k.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Keys</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <RefreshCw className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Requests Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Refresh */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, user, or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchKeys}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Keys List */}
        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No API keys found.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((k) => {
              const usagePct = Math.min((k.requests_today / k.daily_limit) * 100, 100);
              const owner = k.profiles?.full_name || k.profiles?.username || k.user_id.slice(0, 8) + "...";
              return (
                <Card key={k.id}>
                  <CardContent className="pt-5">
                    <div className="flex flex-col gap-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold">{k.name}</h3>
                            <Badge variant={k.is_active ? "default" : "secondary"}>
                              {k.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            User: <span className="font-medium">{owner}</span>
                            {" · "}Created {format(new Date(k.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title={k.is_active ? "Deactivate" : "Activate"}
                            onClick={() => toggleActive(k.id, k.is_active)}
                          >
                            {k.is_active
                              ? <ToggleRight className="h-4 w-4 text-primary" />
                              : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            title="Reset today's usage"
                            onClick={() => resetUsage(k.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteKey(k.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Key */}
                      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 font-mono text-xs">
                        <span className="flex-1 truncate">
                          {visibleKeys.has(k.id) ? k.key : `vb_${"•".repeat(32)}`}
                        </span>
                        <button onClick={() => toggleVisible(k.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                          {visibleKeys.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => copyKey(k.key)} className="shrink-0 text-muted-foreground hover:text-foreground">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Usage + limit editor */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-48">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{k.requests_today} / {k.daily_limit} requests today</span>
                            <span>{Math.round(usagePct)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePct > 80 ? "bg-destructive" : usagePct > 50 ? "bg-yellow-500" : "bg-primary"
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs shrink-0">
                          <span className="text-muted-foreground">Daily limit:</span>
                          <Input
                            type="number"
                            className="w-20 h-7 text-xs"
                            value={editingLimit[k.id] ?? k.daily_limit}
                            onChange={(e) => setEditingLimit((prev) => ({ ...prev, [k.id]: e.target.value }))}
                            onBlur={() => saveLimit(k.id)}
                            onKeyDown={(e) => e.key === "Enter" && saveLimit(k.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
