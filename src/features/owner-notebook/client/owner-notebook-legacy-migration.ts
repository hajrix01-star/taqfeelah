import { safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import {
  OWNER_NOTEBOOK_STORAGE_KEY,
  buildOwnerNotebookStorageKey,
  readOwnerNotebookNotes,
  readOwnerNotebookNotesFromStorageKey,
  sortOwnerNotebookNotes,
  writeOwnerNotebookNotes,
} from "../owner-notebook-storage";
import {
  createOwnerNotebookNoteViaApi,
  updateOwnerNotebookNoteViaApi,
} from "./owner-notebook-api-client";
import type { OwnerNotebookNote } from "@/features/owner-notebook/owner-notebook-types";
import type { OwnerNotebookStorageScope } from "@/features/owner-notebook/owner-notebook-types";

export const OWNER_NOTEBOOK_MIGRATION_MARKER_PREFIX = "taqfeelah_owner_notebook_migrated_v1";

export function buildOwnerNotebookMigrationMarkerKey(organizationId = "", userId = "") {
  return `${OWNER_NOTEBOOK_MIGRATION_MARKER_PREFIX}:${organizationId || "default-org"}:${userId || "default-user"}`;
}

export function buildOwnerNotebookNoteFingerprint(note: OwnerNotebookNote | Record<string, unknown> | null | undefined) {
  if (!note || typeof note !== "object") return "";
  const text = typeof note.text === "string" ? note.text.trim() : "";
  const kind = note.kind === "task" ? "task" : "note";
  const createdAt = typeof note.createdAt === "string" ? note.createdAt : "";
  return `${text}|${kind}|${createdAt}`;
}

export function filterOwnerNotebookNotesMissingFromApi(
  apiNotes: OwnerNotebookNote[] = [],
  localNotes: OwnerNotebookNote[] = [],
) {
  const apiFingerprints = new Set(
    (Array.isArray(apiNotes) ? apiNotes : []).map(buildOwnerNotebookNoteFingerprint).filter(Boolean),
  );
  const seenLocal = new Set<string>();

  return (Array.isArray(localNotes) ? localNotes : []).filter((note) => {
    const fingerprint = buildOwnerNotebookNoteFingerprint(note);
    if (!fingerprint || apiFingerprints.has(fingerprint) || seenLocal.has(fingerprint)) return false;
    seenLocal.add(fingerprint);
    return true;
  });
}

function storageAllowed() {
  return isBrowserPersistentStorageAllowed({ scope: "ui-preferences" });
}

function collectOwnerNotebookStorageKeys({ organizationId = "", userId = "" }: OwnerNotebookStorageScope = {}) {
  const keys = new Set([
    OWNER_NOTEBOOK_STORAGE_KEY,
    buildOwnerNotebookStorageKey(organizationId, userId),
    buildOwnerNotebookStorageKey("default-org", "default-user"),
  ]);

  if (storageAllowed() && typeof window !== "undefined" && organizationId) {
    const orgPrefix = `${OWNER_NOTEBOOK_STORAGE_KEY}:${organizationId}:`;
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith(orgPrefix)) keys.add(key);
    }
  }

  return [...keys];
}

export function readLegacyOwnerNotebookNotes({ organizationId = "", userId = "" }: OwnerNotebookStorageScope = {}) {
  const merged = new Map<string, OwnerNotebookNote>();

  for (const storageKey of collectOwnerNotebookStorageKeys({ organizationId, userId })) {
    for (const note of readOwnerNotebookNotesFromStorageKey(storageKey)) {
      const fingerprint = buildOwnerNotebookNoteFingerprint(note);
      if (!fingerprint || merged.has(fingerprint)) continue;
      merged.set(fingerprint, note);
    }
  }

  return sortOwnerNotebookNotes([...merged.values()]);
}

export function isOwnerNotebookMigrationComplete({ organizationId = "", userId = "" }: OwnerNotebookStorageScope = {}) {
  if (!storageAllowed() || typeof window === "undefined") return true;
  const marker = window.localStorage.getItem(
    buildOwnerNotebookMigrationMarkerKey(organizationId, userId),
  );
  return marker === "1";
}

export function markOwnerNotebookMigrationComplete({ organizationId = "", userId = "" }: OwnerNotebookStorageScope = {}) {
  if (!storageAllowed() || typeof window === "undefined") return;
  safeSetLocalStorageItem(
    buildOwnerNotebookMigrationMarkerKey(organizationId, userId),
    "1",
    { scope: "ui-preferences" },
  );
}

export function mergeLegacyOwnerNotebookNotesIntoLocal({ organizationId = "", userId = "" }: OwnerNotebookStorageScope = {}) {
  const legacyNotes = readLegacyOwnerNotebookNotes({ organizationId, userId });
  const currentNotes = readOwnerNotebookNotes({ organizationId, userId });
  const merged = sortOwnerNotebookNotes([
    ...currentNotes,
    ...filterOwnerNotebookNotesMissingFromApi(currentNotes, legacyNotes),
  ]);

  if (merged.length > currentNotes.length) {
    writeOwnerNotebookNotes(merged, { organizationId, userId });
  }

  return merged;
}

export async function migrateOwnerNotebookNotesToApi({
  organizationId = "",
  actorUserId = "",
  apiNotes = [],
}: {
  organizationId?: string;
  actorUserId?: string;
  apiNotes?: OwnerNotebookNote[];
} = {}) {
  if (isOwnerNotebookMigrationComplete({ organizationId, userId: actorUserId })) {
    return { migratedCount: 0, notes: apiNotes };
  }

  const localNotes = readLegacyOwnerNotebookNotes({ organizationId, userId: actorUserId });
  const pending = filterOwnerNotebookNotesMissingFromApi(apiNotes, localNotes);

  if (pending.length === 0) {
    markOwnerNotebookMigrationComplete({ organizationId, userId: actorUserId });
    return { migratedCount: 0, notes: apiNotes };
  }

  const imported: OwnerNotebookNote[] = [...apiNotes];
  let migratedCount = 0;

  for (const note of pending) {
    try {
      const created = await createOwnerNotebookNoteViaApi({
        organizationId,
        actorUserId,
        text: note.text,
        kind: note.kind,
        color: note.color,
      });
      if (!created) continue;

      let saved = created;
      if (note.kind === "task" && note.done) {
        saved = await updateOwnerNotebookNoteViaApi({
          organizationId,
          actorUserId,
          noteId: created.id,
          patch: { done: true },
        }) || created;
      }

      imported.push(saved);
      migratedCount += 1;
    } catch (error) {
      console.warn("owner notebook legacy migration failed for note", note.id, error);
    }
  }

  if (migratedCount === pending.length) {
    markOwnerNotebookMigrationComplete({ organizationId, userId: actorUserId });
  }

  return {
    migratedCount,
    notes: sortOwnerNotebookNotes(imported),
  };
}
