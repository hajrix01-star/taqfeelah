"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { shouldResetOwnerShellScroll } from "@/lib/ui/owner-shell-scroll-reset";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { PullToRefreshIndicator } from "@/lib/ui/pull-to-refresh-indicator";
import {
  resolvePullToRefreshTarget,
  resolvePullToRefreshUsesNotebookSurface,
} from "@/lib/ui/pull-to-refresh-policy";
import { resolvePullToRefreshSurfaceStyle } from "@/lib/ui/pull-to-refresh-surface";
import { usePullToRefresh } from "@/lib/ui/use-pull-to-refresh";
import type {
  NotebookThemeId,
  AppChildrenProps,
  AppEmployeePage,
  AppLang,
  AppOwnerPage,
  AppReloadOperationalEntriesFn,
} from "./taqfeelah-app-types";

type TaqfeelahAppPullScrollProps = AppChildrenProps & {
  lang: AppLang;
  employee: boolean;
  ownerPage: AppOwnerPage;
  employeePage: AppEmployeePage;
  employeeEntryActive: boolean;
  ownerEntryActive: boolean;
  ownerEditActive: boolean;
  hasActiveEmployee: boolean;
  notebookTheme?: NotebookThemeId | string;
  onRefreshOperationalEntries: AppReloadOperationalEntriesFn;
};

export function TaqfeelahAppPullScroll({
  lang,
  employee,
  ownerPage,
  employeePage,
  employeeEntryActive,
  ownerEntryActive,
  ownerEditActive,
  hasActiveEmployee,
  notebookTheme = "yellow",
  onRefreshOperationalEntries,
  children,
}: TaqfeelahAppPullScrollProps) {
  const { reloadCloseoutsFromApi } = useDailyCloseouts();

  const refreshTarget = useMemo(
    () => resolvePullToRefreshTarget({
      employee,
      ownerPage,
      employeePage,
      employeeEntryActive,
      ownerEntryActive,
      ownerEditActive,
      hasActiveEmployee,
    }),
    [
      employee,
      ownerPage,
      employeePage,
      employeeEntryActive,
      ownerEntryActive,
      ownerEditActive,
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
    isDragging,
    contentTransition,
  } = usePullToRefresh({
    enabled,
    onRefresh: handleRefresh,
  });

  const surfaceStyle = enabled
    ? resolvePullToRefreshSurfaceStyle(usesNotebookSurface, notebookTheme)
    : undefined;
  const indicatorVisible = isActive || refreshing;
  const contentOffset = slotHeight > 0 ? slotHeight : 0;
  const pageRef = useRef({ ownerPage, employeePage });

  useEffect(() => {
    const previous = pageRef.current;
    if (!shouldResetOwnerShellScroll(previous, { ownerPage, employeePage })) {
      pageRef.current = { ownerPage, employeePage };
      return;
    }
    pageRef.current = { ownerPage, employeePage };
    const scrollElement = scrollRef.current as HTMLDivElement | null;
    if (!scrollElement) return;
    scrollElement.scrollTop = 0;
  }, [employeePage, ownerPage, scrollRef]);

  return (
    <div
      ref={scrollRef}
      className={`taq-scroll relative min-h-0 overflow-y-auto ${enabled ? "touch-pan-y overscroll-y-contain" : "overscroll-y-contain"}`}
      style={surfaceStyle}
      aria-busy={refreshing || undefined}
    >
      {enabled && (
        <PullToRefreshIndicator
          lang={lang}
          slotHeight={slotHeight}
          pullProgress={pullProgress}
          visible={indicatorVisible}
          refreshing={refreshing}
          releaseReady={releaseReady}
          isDragging={isDragging}
        />
      )}
      <div
        className="relative"
        style={{
          transform: contentOffset > 0 ? `translate3d(0, ${contentOffset}px, 0)` : undefined,
          transition: contentTransition,
          willChange: isDragging ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
