import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Reply, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useComments, Comment } from "@/hooks/useComments";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

interface CommentSectionProps {
  articleId: string;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  currentUserId,
  isAdmin,
  depth = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  isAdmin: boolean;
  depth?: number;
}) {
  const canDelete = currentUserId === comment.user_id || isAdmin;

  return (
    <div className={`${depth > 0 ? "ml-8 pl-4 border-l-2 border-muted" : ""}`}>
      <div className="flex gap-3 py-4">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author?.avatar_url || ""} />
          <AvatarFallback>{comment.author?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {comment.author?.full_name || comment.author?.username || "Anonymous"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onReply(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" /> Reply
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const { user, isAdmin } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(articleId);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await addComment(newComment, replyTo || undefined);

    if (error) {
      toast.error("Failed to post comment");
    } else {
      setNewComment("");
      setReplyTo(null);
      toast.success("Comment posted!");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await deleteComment(commentId);
    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
    }
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
    document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="font-display text-xl font-bold">
          Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
      </div>

      {/* Comment Form */}
      {user ? (
        <form id="comment-form" onSubmit={handleSubmit} className="space-y-4">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <Reply className="h-4 w-4" />
              <span>Replying to a comment</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!newComment.trim() || submitting}>
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to leave a comment</p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              currentUserId={user?.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}