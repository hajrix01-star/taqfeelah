"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PULL_TO_REFRESH_THRESHOLD = 64;
export const PULL_TO_REFRESH_MAX_DISTANCE = 120;
export const PULL_TO_REFRESH_REFRESH_SLOT = 52;
const PULL_TO_REFRESH_MIN_REFRESH_MS = 480;
const PTR_SPRING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Rubber-band curve similar to native mobile pull gestures.
 * @param {number} delta
 */
export function resolvePullToRefreshDistance(delta) {
  if (delta <= 0) return 0;
  const linear = delta * 0.5;
  const resisted = linear - Math.max(0, linear - 72) * 0.35;
  return Math.min(resisted, PULL_TO_REFRESH_MAX_DISTANCE);
}

/**
 * @param {{
 *   enabled?: boolean;
 *   onRefresh: () => void | Promise<void>;
 * }} options
 */
export function usePullToRefresh({ enabled = true, onRefresh }) {
  const scrollRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  const pullDistanceRef = useRef(0);
  const refreshingRef = useRef(false);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  onRefreshRef.current = onRefresh;
  pullDistanceRef.current = pullDistance;
  refreshingRef.current = refreshing;

  const resetPull = useCallback(() => {
    setPullDistance(0);
  }, []);

  useEffect(() => {
    if (!enabled) {
      resetPull();
      setRefreshing(false);
      setIsDragging(false);
    }
  }, [enabled, resetPull]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) return undefined;

    let touchStartY = 0;
    let tracking = false;

    const finishPull = async () => {
      if (!tracking) return;
      tracking = false;
      setIsDragging(false);

      const distance = pullDistanceRef.current;
      if (distance >= PULL_TO_REFRESH_THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        setPullDistance(PULL_TO_REFRESH_REFRESH_SLOT);
        const startedAt = Date.now();
        try {
          await onRefreshRef.current();
        } catch (error) {
          console.warn("pull to refresh failed", error);
        } finally {
          const elapsed = Date.now() - startedAt;
          if (elapsed < PULL_TO_REFRESH_MIN_REFRESH_MS) {
            await new Promise((resolve) => {
              window.setTimeout(resolve, PULL_TO_REFRESH_MIN_REFRESH_MS - elapsed);
            });
          }
          setRefreshing(false);
          setPullDistance(0);
        }
        return;
      }

      setPullDistance(0);
    };

    const onTouchStart = (event) => {
      if (refreshingRef.current || element.scrollTop > 0) return;
      touchStartY = event.touches[0]?.clientY ?? 0;
      tracking = true;
      setIsDragging(true);
    };

    const onTouchMove = (event) => {
      if (!tracking || refreshingRef.current) return;

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - touchStartY;

      if (delta <= 0 || element.scrollTop > 0) {
        tracking = false;
        setIsDragging(false);
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      setPullDistance(resolvePullToRefreshDistance(delta));
    };

    const onTouchEnd = () => {
      void finishPull();
    };

    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd);
    element.addEventListener("touchcancel", onTouchEnd);

    return () => {
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  const slotHeight = refreshing ? PULL_TO_REFRESH_REFRESH_SLOT : pullDistance;
  const pullProgress = Math.min(1, pullDistance / PULL_TO_REFRESH_THRESHOLD);
  const releaseReady = !refreshing && pullDistance >= PULL_TO_REFRESH_THRESHOLD;
  const isActive = enabled && (refreshing || pullDistance > 0);

  const contentTransition = isDragging
    ? "none"
    : `transform 320ms ${PTR_SPRING_EASE}`;

  return {
    scrollRef,
    pullDistance,
    pullProgress,
    refreshing,
    releaseReady,
    slotHeight,
    isActive,
    isDragging,
    contentTransition,
  };
}
