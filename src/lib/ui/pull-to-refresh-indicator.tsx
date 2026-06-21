"use client";

import React from "react";
import { pullToRefreshStatusLabel } from "@/lib/ui/pull-to-refresh-copy";
import type { PullToRefreshIndicatorProps } from "@/lib/ui/pull-to-refresh-types";

export const PTR_INDICATOR_SIZE = 28;
export const PTR_INDICATOR_STROKE = 2.5;
const PTR_INDICATOR_RADIUS =
  (PTR_INDICATOR_SIZE - PTR_INDICATOR_STROKE) / 2 - 0.5;
export const PTR_INDICATOR_CIRCUMFERENCE = 2 * Math.PI * PTR_INDICATOR_RADIUS;

const PTR_SPRING_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function resolvePullToRefreshIndicatorScale(pullProgress: number, refreshing: boolean): number {
  if (refreshing) return 1;
  return 0.35 + Math.min(1, pullProgress) * 0.65;
}

export function resolvePullToRefreshArcOffset(pullProgress: number, refreshing: boolean): number {
  if (refreshing) return PTR_INDICATOR_CIRCUMFERENCE * 0.72;
  const arc = Math.max(0.12, Math.min(1, pullProgress) * 0.88);
  return PTR_INDICATOR_CIRCUMFERENCE * (1 - arc);
}

export function PullToRefreshIndicator({
  lang,
  slotHeight,
  pullProgress,
  refreshing,
  releaseReady,
  isDragging,
  visible,
}: PullToRefreshIndicatorProps) {
  const scale = resolvePullToRefreshIndicatorScale(pullProgress, refreshing);
  const arcOffset = resolvePullToRefreshArcOffset(pullProgress, refreshing);
  const opacity = visible
    ? refreshing
      ? 1
      : Math.min(1, pullProgress * 1.35)
    : 0;
  const indicatorTop = Math.max(10, slotHeight * 0.5 - PTR_INDICATOR_SIZE / 2);
  const motionTransition = isDragging
    ? "none"
    : `opacity 220ms ${PTR_SPRING_EASE}, transform 300ms ${PTR_SPRING_EASE}`;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none absolute inset-x-0 top-0 z-20"
      style={{
        height: Math.max(slotHeight, refreshing ? slotHeight : 0),
        opacity,
        transition: isDragging ? "none" : `opacity 220ms ${PTR_SPRING_EASE}`,
      }}
    >
      <div
        className="absolute left-1/2"
        style={{
          top: indicatorTop,
          transform: `translateX(-50%) scale(${scale})`,
          transition: motionTransition,
        }}
      >
        <svg
          width={PTR_INDICATOR_SIZE}
          height={PTR_INDICATOR_SIZE}
          viewBox={`0 0 ${PTR_INDICATOR_SIZE} ${PTR_INDICATOR_SIZE}`}
          className={refreshing ? "animate-spin" : ""}
          style={{ transformOrigin: "center" }}
        >
          <circle
            cx={PTR_INDICATOR_SIZE / 2}
            cy={PTR_INDICATOR_SIZE / 2}
            r={PTR_INDICATOR_RADIUS}
            fill="none"
            stroke="#E8E1D4"
            strokeWidth={PTR_INDICATOR_STROKE}
          />
          <circle
            cx={PTR_INDICATOR_SIZE / 2}
            cy={PTR_INDICATOR_SIZE / 2}
            r={PTR_INDICATOR_RADIUS}
            fill="none"
            stroke={releaseReady && !refreshing ? "#0F766E" : "#112A46"}
            strokeWidth={PTR_INDICATOR_STROKE}
            strokeLinecap="round"
            strokeDasharray={PTR_INDICATOR_CIRCUMFERENCE}
            strokeDashoffset={arcOffset}
            transform={`rotate(-90 ${PTR_INDICATOR_SIZE / 2} ${PTR_INDICATOR_SIZE / 2})`}
          />
        </svg>
      </div>
      <span className="sr-only" aria-live="polite">
        {pullToRefreshStatusLabel(lang, refreshing, releaseReady)}
      </span>
    </div>
  );
}
