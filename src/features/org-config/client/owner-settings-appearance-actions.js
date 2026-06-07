/**
 * @param {string} draftTheme
 * @param {string} currentTheme
 */
export function isNotebookThemeDirty(draftTheme, currentTheme) {
  return draftTheme !== currentTheme;
}
