/**
 * Reset shell scroll when owner/employee primary page changes so notebook headings
 * do not appear at a stale scroll offset and then jump.
 */
export function shouldResetOwnerShellScroll(previous, next) {
  if (!previous || !next) return false;
  if (previous.ownerPage !== next.ownerPage) return true;
  if (previous.employeePage !== next.employeePage) return true;
  return false;
}
