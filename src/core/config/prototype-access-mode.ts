/**
 * Prototype access mode was removed before public launch.
 * Real auth (owner password / employee PIN) is the only entry path on `/app`.
 */
export function isPrototypeAccessMode(): boolean {
  return false;
}
