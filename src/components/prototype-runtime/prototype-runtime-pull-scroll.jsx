"use client";

import React, { useCallback, useMemo } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { pullToRefreshStatusLabel } from "@/lib/ui/pull-to-refresh-copy";
import {
  resolvePullToRefreshTarget,
  resolvePullToRefreshUsesNotebookSurface,
} from "@/lib/ui/pull-to-refresh-policy";
import { resolvePullToRefreshSurfaceStyle } from "@/lib/ui/pull-to-refresh-surface";
import {
  PULL_TO_REFRESH_REFRESH_SLOT,
  usePullToRefresh,
} from "@/lib/ui/use-pull-to-refresh";

function PullToRefreshSpinner({ progress, spinning, releaseReady }) {
  const strokeDashoffset = 62 - (spinning ? 62 : progress * 62);
  const opacity = spinning ? 1 : Math.min(1, 0.35 + progress * 0.65);
  const scale = spinning ? 1 : 0.72 + progress * 0.28;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${spinning ? "animate-spin" : ""}`}
      style={{
        opacity,
        transform: `scale(${scale})`,
        transition: spinning ? "opacity 150ms ease" : "none",
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="9.8"
        fill="none"
        stroke="#E8E1D4"
        strokeWidth="2.2"
      />
      <circle
        cx="12"
        cy="12"
        r="9.8"
        fill="none"
        stroke={releaseReady || spinning ? "#B44747" : "#806528"}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="62"
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

export function PrototypeRuntimePullScroll({
  lang,
  employee,
  ownerPage,
  employeePage,
  employeeEntryActive,
  ownerEntryActive,
  hasActiveEmployee,
  notebookTheme = "yellow",
  onRefreshOperationalEntries,
  children,
}) {
  const { reloadCloseoutsFromApi } = useDailyCloseouts();

  const refreshTarget = useMemo(
    () => resolvePullToRefreshTarget({
      employee,
      ownerPage,
      employeePage,
      employeeEntryActive,
      ownerEntryActive,
      hasActiveEmployee,
    }),
    [
      employee,
      ownerPage,
      employeePage,
      employeeEntryActive,
      ownerEntryActive,
      hasActiveEmployee,
    ],
  );

  const usesNotebookSurface = useMemo(
    () => resolvePullToRefreshUsesNotebookSurface({
      employee,
      ownerPage,
      employeePage,
    }),
    [employee, ownerPage, employeePage],
  );

  const enabled = refreshTarget !== null;

  const handleRefresh = useCallback(async () => {
    if (!refreshTarget) return;
    if (refreshTarget === "closeouts") {
      await reloadCloseoutsFromApi();
      return;
    }
    await onRefreshOperationalEntries();
  }, [onRefreshOperationalEntries, refreshTarget, reloadCloseoutsFromApi]);

  const {
    scrollRef,
    pullProgress,
    refreshing,
    releaseReady,
    slotHeight,
    isActive,
  } = usePullToRefresh({
    enabled,
    onRefresh: handleRefresh,
  });

  const statusLabel = pullToRefreshStatusLabel(lang, refreshing, releaseReady);
  const surfaceStyle = enabled
    ? resolvePullToRefreshSurfaceStyle(usesNotebookSurface, notebookTheme)
    : undefined;
  const indicatorOffset = refreshing
    ? Math.max(0, PULL_TO_REFRESH_REFRESH_SLOT - 28)
    : Math.max(0, slotHeight - 28);
  const indicatorTransition = enabled && !isActive && slotHeight === 0
    ? "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "none";

  return (
    <div
      ref={scrollRef}
      className={`taq-scroll relative min-h-0 overflow-y-auto ${enabled ? "touch-pan-y" : "overscroll-y-contain"}`}
      style={surfaceStyle}
      aria-busy={refreshing || undefined}
    >
      {enabled && (isActive || refreshing) && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
          style={{
            transform: `translateY(${indicatorOffset}px)`,
            opacity: refreshing ? 1 : Math.min(1, 0.35 + pullProgress * 0.65),
            transition: indicatorTransition,
          }}
        >
          <span className="sr-only">{statusLabel}</span>
          <div className="pt-1">
            <PullToRefreshSpinner
              progress={pullProgress}
              spinning={refreshing}
              releaseReady={releaseReady}
            />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
