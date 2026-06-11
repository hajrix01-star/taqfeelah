"use client";

import { closeoutOwnerEditLabel, resolveCloseoutOwnerEditMeta } from "./closeout-owner-edit-display";
import { Badge } from "@/components/prototype-runtime/prototype-runtime-shell-ui";

export default function CloseoutOwnerEditBadge({ lang = "ar", source, className = "" }) {
  const meta = resolveCloseoutOwnerEditMeta(source);
  if (!meta) return null;
  return (
    <Badge tone="navy" className={className}>
      {closeoutOwnerEditLabel(source, lang)}
    </Badge>
  );
}
