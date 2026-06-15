/**
 * @typedef {object} AppDialogQueueItem
 * @property {Record<string, unknown>} options
 * @property {(value: boolean) => void} resolve
 */

/**
 * @param {AppDialogQueueItem[]} queue
 * @param {Record<string, unknown> | null} current
 * @param {AppDialogQueueItem} item
 */
export function enqueueAppDialogItem(queue, current, item) {
  if (!current) {
    return { queue, current: item.options, pendingResolve: item.resolve };
  }
  return { queue: [...queue, item], current, pendingResolve: null };
}

/**
 * @param {AppDialogQueueItem[]} queue
 */
export function dequeueNextAppDialogItem(queue) {
  if (!queue.length) {
    return { queue: [], next: null };
  }
  const [next, ...rest] = queue;
  return { queue: rest, next };
}
