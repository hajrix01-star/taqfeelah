import type { DisplayLang } from "@/core/i18n/display-locale";

export type PullToRefreshPhase = "pull" | "release" | "refreshing";

export type PullToRefreshTarget = "closeouts" | "operational-entries";

export type UsePullToRefreshOptions = {
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
};

export type PullToRefreshIndicatorProps = {
  lang: DisplayLang | string;
  slotHeight: number;
  pullProgress: number;
  refreshing: boolean;
  releaseReady: boolean;
  isDragging: boolean;
  visible: boolean;
};

export type ResolvePullToRefreshTargetInput = {
  employee: boolean;
  ownerPage: string;
  employeePage: string;
  employeeEntryActive: boolean;
  ownerEntryActive: boolean;
  hasActiveEmployee: boolean;
};

export type ResolvePullToRefreshNotebookSurfaceInput = {
  employee: boolean;
  ownerPage: string;
  employeePage: string;
};

export type OwnerShellScrollSnapshot = {
  ownerPage?: string;
  employeePage?: string;
};
