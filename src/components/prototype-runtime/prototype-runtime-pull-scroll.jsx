"use client";

import React, { useCallback, useMemo } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { pullToRefreshLabel } from "@/lib/ui/pull-to-refresh-copy";
import { resolvePullToRefreshTarget } from "@/lib/ui/pull-to-refresh-policy";
import { usePullToRefresh } from "@/lib/ui/use-pull-to-refresh";

function PullToRefreshIndicator({ lang, offset, visible, refreshing, releaseReady }) {
  const phase = refreshing ? "refreshing" : releaseReady ? "release" : "pull";
  const opacity = visible ? Math.min(1, offset / 40) : 0;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
      style={{
        transform: `translateY(${Math.max(0, offset - 36)}px)`,
        opacity,
        transition: refreshing ? "opacity 150ms ease" : "none",
      }}
    >
      <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-taq-meta font-bold text-[#827762] shadow-sm ring-1 ring-black/[0.06]">
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full border-2 border-[#D8CCA8] border-t-[#112A46] ${refreshing ? "animate-spin" : ""}`}
          style={!refreshing ? { transform: `rotate(${Math.min(320, offset * 4)}deg)` } : undefined}
        />
        <span>{pullToRefreshLabel(lang, phase)}</span>
      </div>
    </div>
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
    indicatorOffset,
    indicatorVisible,
    refreshing,
    releaseReady,
  } = usePullToRefresh({
    enabled,
    onRefresh: handleRefresh,
  });

  return (
    <div
      ref={scrollRef}
      className={`taq-scroll relative min-h-0 overflow-y-auto ${enabled ? "touch-pan-y" : "overscroll-y-contain"}`}
    >
      {enabled && (
        <PullToRefreshIndicator
          lang={lang}
          offset={indicatorOffset}
          visible={indicatorVisible}
          refreshing={refreshing}
          releaseReady={releaseReady}
        />
      )}
      {children}
    </div>
  );
}
