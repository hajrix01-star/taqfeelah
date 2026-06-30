import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "@/core/errors/app-error";

export const EXPORT_JOB_MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function exportStorageRoot() {
  return path.resolve(process.env.EXPORT_STORAGE_ROOT || path.join(process.cwd(), "data", "exports"));
}

function assertSafeRelativePath(relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new ValidationError("Invalid export file path.");
  }
}

export function buildExportJobRelativePath(organizationId: string, jobId: string, extension = "xlsx") {
  return `${organizationId}/${jobId}.${extension}`;
}

export async function writeExportJobFile(relativePath: string, content: Buffer) {
  assertSafeRelativePath(relativePath);
  const root = exportStorageRoot();
  const absolutePath = path.resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Export file path is outside storage root.");
  }
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
}

export async function readExportJobFile(relativePath: string) {
  assertSafeRelativePath(relativePath);
  const root = exportStorageRoot();
  const absolutePath = path.resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Export file path is outside storage root.");
  }
  const fileStat = await stat(absolutePath);
  return {
    content: await readFile(absolutePath),
    sizeBytes: fileStat.size,
  };
}
