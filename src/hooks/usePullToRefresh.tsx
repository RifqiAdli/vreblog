import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PullToRefreshOptions {
  threshold?: number;
  onRefresh?: () => Promise<void>;
}

export function usePullToRefresh({ threshold = 80, onRefresh }: PullToRefreshOptions = {}) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await queryClient.invalidateQueries();
      }
      toast.success('Refreshed!');
    } catch {
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
      setPulling(false);
      setPullDistance(0);
    }
  }, [onRefresh, queryClient]);

  useEffect(() => {
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        active = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || refreshing) return;
      const deltaY = e.touches[0].clientY - startY.current;
      if (deltaY > 0 && window.scrollY === 0) {
        setPulling(true);
        setPullDistance(Math.min(deltaY * 0.5, threshold * 1.5));
      }
    };

    const onTouchEnd = () => {
      if (!active) return;
      active = false;
      if (pullDistance >= threshold && !refreshing) {
        handleRefresh();
      } else {
        setPulling(false);
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullDistance, threshold, refreshing, handleRefresh]);

  const PullIndicator = () => {
    if (!pulling && !refreshing) return null;
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center transition-transform duration-200 pointer-events-none"
        style={{ transform: `translateY(${refreshing ? 40 : pullDistance - 40}px)` }}
      >
        <div className={`w-8 h-8 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}>
          <svg
            className={`w-4 h-4 text-primary transition-transform duration-200 ${pullDistance >= threshold ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            {refreshing ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            )}
          </svg>
        </div>
      </div>
    );
  };

  return { PullIndicator, refreshing };
}
