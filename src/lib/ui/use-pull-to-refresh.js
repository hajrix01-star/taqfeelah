"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const PULL_TO_REFRESH_THRESHOLD = 64;
export const PULL_TO_REFRESH_MAX_DISTANCE = 96;
const PULL_TO_REFRESH_RESISTANCE = 0.45;
const PULL_TO_REFRESH_LOCKED_OFFSET = 52;

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

      const distance = pullDistanceRef.current;
      if (distance >= PULL_TO_REFRESH_THRESHOLD && !refreshingRef.current) {
        setRefreshing(true);
        setPullDistance(PULL_TO_REFRESH_LOCKED_OFFSET);
        try {
          await onRefreshRef.current();
        } catch (error) {
          console.warn("pull to refresh failed", error);
        } finally {
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
    };

    const onTouchMove = (event) => {
      if (!tracking || refreshingRef.current) return;

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - touchStartY;

      if (delta <= 0 || element.scrollTop > 0) {
        tracking = false;
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      const resisted = Math.min(delta * PULL_TO_REFRESH_RESISTANCE, PULL_TO_REFRESH_MAX_DISTANCE);
      setPullDistance(resisted);
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

  const indicatorOffset = refreshing
    ? PULL_TO_REFRESH_LOCKED_OFFSET
    : pullDistance;
  const indicatorVisible = enabled && (refreshing || pullDistance > 0);
  const releaseReady = !refreshing && pullDistance >= PULL_TO_REFRESH_THRESHOLD;

  return {
    scrollRef,
    pullDistance,
    refreshing,
    indicatorOffset,
    indicatorVisible,
    releaseReady,
  };
}
