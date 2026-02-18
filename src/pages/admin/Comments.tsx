import { useState, useEffect } from "react";
import { Check, X, Trash2, MessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  status: string;
  created_at: string;
  article: { title: string; slug: string } | null;
  author: { username: string | null; avatar_url: string | null } | null;
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchComments();
  }, [statusFilter]);

  const fetchComments = async () => {
    setLoading(true);

    let query = supabase
      .from("comments")
      .select(`
        id, content, status, created_at,
        article:articles!comments_article_id_fkey(title, slug),
        author:profiles!comments_user_id_fkey(username, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (!error) {
      setComments(data as Comment[]);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("comments")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update comment");
    } else {
      toast.success(`Comment ${status}`);
      fetchComments();
    }
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      fetchComments();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success/10 text-success border-success/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "spam":
        return <Badge variant="destructive">Spam</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Comments">
      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No comments found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar_url || ""} />
                        <AvatarFallback>{comment.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{comment.author?.username || "Anonymous"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{comment.content}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {comment.article?.title || "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(comment.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {comment.status !== "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success"
                          onClick={() => updateStatus(comment.id, "approved")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {comment.status !== "spam" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-warning"
                          onClick={() => updateStatus(comment.id, "spam")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}