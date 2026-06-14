import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "@/core/errors/app-error";
import {
  attachmentExtensionForMimeType,
  assertAllowedAttachmentMimeType,
  normalizeAttachmentMimeType,
} from "@/core/attachments/attachment-mime";
import { readAttachmentStorageRoot } from "@/core/attachments/attachment-storage-mode";

export const LOCAL_STORAGE_PREFIX = "local:v1:";

export type LocalVpsAttachmentScope = {
  organizationId: string;
  storeId: string;
};

export type LocalVpsRegisterInput = LocalVpsAttachmentScope & {
  name?: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
};

export type RegisteredLocalVpsAttachment = {
  kind: "image";
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksum: string;
};

function parseDataUrl(dataUrl: string): { mimeType: string; base64Payload: string } {
  if (!dataUrl.startsWith("data:")) {
    throw new ValidationError("Inline attachment must use a data URL.");
  }
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new ValidationError("Inline attachment must use a data URL.");
  }
  const header = dataUrl.slice(5, commaIndex);
  const base64Payload = dataUrl.slice(commaIndex + 1);
  const mimeType = normalizeAttachmentMimeType(header.replace(/;base64$/i, ""));
  return { mimeType, base64Payload };
}

function relativePathForKey(scope: LocalVpsAttachmentScope, checksum: string, extension: string) {
  return `${scope.organizationId}/${scope.storeId}/${checksum}.${extension}`;
}

function storageKeyForRelativePath(relativePath: string) {
  return `${LOCAL_STORAGE_PREFIX}${relativePath}`;
}

function resolveAbsolutePath(relativePath: string): string {
  const root = path.resolve(readAttachmentStorageRoot());
  const absolutePath = path.resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Attachment path is outside storage root.");
  }
  return absolutePath;
}

function relativePathFromStorageKey(storageKey: string): string | null {
  if (!storageKey.startsWith(LOCAL_STORAGE_PREFIX)) return null;
  const relativePath = storageKey.slice(LOCAL_STORAGE_PREFIX.length);
  if (!relativePath || relativePath.includes("..")) return null;
  return relativePath;
}

export function isLocalVpsStorageKey(storageKey: string | null | undefined): boolean {
  return Boolean(storageKey?.startsWith(LOCAL_STORAGE_PREFIX));
}

export async function registerLocalVpsAttachment(
  input: LocalVpsRegisterInput,
): Promise<RegisteredLocalVpsAttachment> {
  const { mimeType, base64Payload } = parseDataUrl(input.dataUrl);
  assertAllowedAttachmentMimeType(mimeType);

  const declaredMimeType = normalizeAttachmentMimeType(input.mimeType);
  if (declaredMimeType !== mimeType) {
    throw new ValidationError("Attachment data URL does not match mime type.");
  }

  const checksum = createHash("sha256").update(input.dataUrl).digest("hex").slice(0, 24);
  const extension = attachmentExtensionForMimeType(mimeType);
  const relativePath = relativePathForKey(input, checksum, extension);
  const absolutePath = resolveAbsolutePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });

  const binary = Buffer.from(base64Payload, "base64");
  if (!binary.length) {
    throw new ValidationError("Attachment payload is empty.");
  }

  try {
    await writeFile(absolutePath, binary, { flag: "wx" });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "EEXIST") {
      throw error;
    }
  }

  return {
    kind: "image",
    name: input.name || `attachment.${extension}`,
    mimeType,
    sizeBytes: input.sizeBytes,
    storageKey: storageKeyForRelativePath(relativePath),
    checksum,
  };
}

export async function resolveLocalVpsAttachmentDataUrl(
  storageKey: string,
): Promise<string> {
  const relativePath = relativePathFromStorageKey(storageKey);
  if (!relativePath) return "";

  const absolutePath = resolveAbsolutePath(relativePath);
  let binary: Buffer;
  try {
    binary = await readFile(absolutePath);
  } catch {
    return "";
  }

  const extension = path.extname(relativePath).slice(1).toLowerCase();
  const mimeType = extension === "png"
    ? "image/png"
    : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  return `data:${mimeType};base64,${binary.toString("base64")}`;
}
