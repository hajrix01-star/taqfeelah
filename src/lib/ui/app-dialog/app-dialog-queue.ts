import type { AppDialogOptions, AppDialogQueueItem } from "@/lib/ui/app-dialog/app-dialog-types";

export function enqueueAppDialogItem(
  queue: AppDialogQueueItem[],
  current: AppDialogOptions | null,
  item: AppDialogQueueItem,
): {
  queue: AppDialogQueueItem[];
  current: AppDialogOptions | null;
  pendingResolve: ((value: boolean) => void) | null;
} {
  if (!current) {
    return { queue, current: item.options, pendingResolve: item.resolve };
  }
  return { queue: [...queue, item], current, pendingResolve: null };
}

export function dequeueNextAppDialogItem(queue: AppDialogQueueItem[]): {
  queue: AppDialogQueueItem[];
  next: AppDialogQueueItem | null;
} {
  if (!queue.length) {
    return { queue: [], next: null };
  }
  const [next, ...rest] = queue;
  return { queue: rest, next };
}
