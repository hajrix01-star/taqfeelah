export function isNotebookThemeDirty(draftTheme: string, currentTheme: string) {
  return draftTheme !== currentTheme;
}
