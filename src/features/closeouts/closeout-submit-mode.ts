export type CloseoutSubmitMode = "submit" | "ownerEdit";

/** API / client input — `resubmit` is a legacy alias for `ownerEdit`. */
export type CloseoutSubmitModeInput = CloseoutSubmitMode | "resubmit";

export function normalizeCloseoutSubmitMode(mode: unknown): CloseoutSubmitMode {
  if (mode === "ownerEdit" || mode === "resubmit") return "ownerEdit";
  return "submit";
}

export function isOwnerEditCloseoutMode(mode: CloseoutSubmitMode): boolean {
  return mode === "ownerEdit";
}
