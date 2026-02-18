import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  moved: boolean;
}

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const swipeRef = useRef<SwipeState | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const createOverlay = useCallback((direction: 'left' | 'right') => {
    if (overlayRef.current) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed; top: 0; ${direction === 'right' ? 'left' : 'right'}: 0;
      width: 4px; height: 100vh; z-index: 9999;
      background: linear-gradient(${direction === 'right' ? 'to right' : 'to left'}, 
        hsl(var(--primary) / 0.5), transparent);
      transition: width 0.15s ease, opacity 0.15s ease;
      pointer-events: none; opacity: 0;
    `;
    document.body.appendChild(el);
    overlayRef.current = el;
    return el;
  }, []);

  const removeOverlay = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
  }, []);

  useEffect(() => {
    const THRESHOLD = 80;
    const EDGE_ZONE = 30;
    const MAX_TIME = 400;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const x = touch.clientX;
      // Only trigger from edge zones
      if (x > EDGE_ZONE && x < window.innerWidth - EDGE_ZONE) return;

      swipeRef.current = {
        startX: x,
        startY: touch.clientY,
        startTime: Date.now(),
        moved: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!swipeRef.current) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - swipeRef.current.startX;
      const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);

      // If vertical scroll is dominant, cancel swipe
      if (deltaY > Math.abs(deltaX)) {
        removeOverlay();
        swipeRef.current = null;
        return;
      }

      swipeRef.current.moved = true;
      const absDelta = Math.abs(deltaX);
      const direction = deltaX > 0 ? 'right' : 'left';

      // Show edge indicator
      const overlay = overlayRef.current || createOverlay(direction);
      if (overlay) {
        const progress = Math.min(absDelta / THRESHOLD, 1);
        overlay.style.width = `${4 + progress * 40}px`;
        overlay.style.opacity = `${progress * 0.8}`;
        overlay.style.background = `linear-gradient(${direction === 'right' ? 'to right' : 'to left'}, 
          hsl(var(--primary) / ${progress * 0.6}), transparent)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current || !swipeRef.current.moved) {
        removeOverlay();
        swipeRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeRef.current.startX;
      const elapsed = Date.now() - swipeRef.current.startTime;

      removeOverlay();

      if (Math.abs(deltaX) >= THRESHOLD && elapsed <= MAX_TIME) {
        if (deltaX > 0) {
          // Swipe right = go back
          navigate(-1);
        } else {
          // Swipe left = go forward
          navigate(1);
        }
      }

      swipeRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      removeOverlay();
    };
  }, [navigate, createOverlay, removeOverlay]);
}
