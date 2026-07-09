export function isNotebookThemeDirty(draftTheme: string, currentTheme: string) {
  return draftTheme !== currentTheme;
}

export function isNotebookAppearanceDirty({
  draftTheme,
  currentTheme,
  draftPattern,
  currentPattern,
}: {
  draftTheme: string;
  currentTheme: string;
  draftPattern: string;
  currentPattern: string;
}) {
  return draftTheme !== currentTheme || draftPattern !== currentPattern;
}
