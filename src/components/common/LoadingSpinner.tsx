import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 skeleton-shimmer">
      <div className="space-y-4">
        <div className="h-48 rounded-lg bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-muted" />
          <div className="h-6 w-16 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonArticle() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="h-12 w-3/4 rounded bg-muted skeleton-shimmer" />
      <div className="flex gap-4">
        <div className="h-10 w-10 rounded-full bg-muted skeleton-shimmer" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
          <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
        </div>
      </div>
      <div className="h-80 rounded-xl bg-muted skeleton-shimmer" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-muted skeleton-shimmer" style={{ width: `${80 + Math.random() * 20}%` }} />
        ))}
      </div>
    </div>
  );
}