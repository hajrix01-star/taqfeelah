"use client";

import { closeoutOwnerEditLabel, resolveCloseoutOwnerEditMeta } from "./closeout-owner-edit-display";
import { Badge } from "@/components/taqfeelah-app/taqfeelah-app-shell-ui";

export default function CloseoutOwnerEditBadge({
  lang = "ar",
  source,
  className = "",
}: {
  lang?: "ar" | "en";
  source?: Record<string, unknown> | null;
  className?: string;
}) {
  const meta = resolveCloseoutOwnerEditMeta(source);
  if (!meta) return null;
  return (
    <span className={className}>
      <Badge tone="navy">
        {closeoutOwnerEditLabel(source, lang)}
      </Badge>
    </span>
  );
}
