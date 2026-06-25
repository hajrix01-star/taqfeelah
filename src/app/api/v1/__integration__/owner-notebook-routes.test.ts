import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_OWNER_USER_ID,
  TEST_ORGANIZATION_ID,
} from "./helpers";

const listOwnerNotebookNotes = vi.fn();
const createOwnerNotebookNote = vi.fn();
const updateOwnerNotebookNote = vi.fn();
const deleteOwnerNotebookNote = vi.fn();

vi.mock("@/features/owner-notebook/server/owner-notebook-notes-service", () => ({
  listOwnerNotebookNotes,
  createOwnerNotebookNote,
  updateOwnerNotebookNote,
  deleteOwnerNotebookNote,
}));

const TEST_NOTE_ID = "f1e2d3c4-b5a6-4789-a012-3456789abcde";

describe("owner notebook routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listOwnerNotebookNotes.mockReset();
    createOwnerNotebookNote.mockReset();
    updateOwnerNotebookNote.mockReset();
    deleteOwnerNotebookNote.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET lists owner notebook notes for the authenticated owner", async () => {
    listOwnerNotebookNotes.mockResolvedValueOnce({
      notes: [{ id: TEST_NOTE_ID, text: "تذكير", kind: "note", done: false, color: "yellow" }],
      nextCursor: "cursor-2",
    });

    const { GET } = await import("../owner-notebook/notes/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/owner-notebook/notes?limit=25&cursor=cursor-1"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ notes: Array<{ id: string; text: string }>; nextCursor: string }>(response);
    expect(body.notes).toHaveLength(1);
    expect(body.nextCursor).toBe("cursor-2");
    expect(listOwnerNotebookNotes).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_OWNER_USER_ID,
      actorRole: "owner",
      limit: 25,
      cursor: "cursor-1",
    }));
  });

  it("POST creates an owner notebook note", async () => {
    createOwnerNotebookNote.mockResolvedValueOnce({
      note: { id: TEST_NOTE_ID, text: "مهمة", kind: "task", done: false, color: "ivory" },
    });

    const { POST } = await import("../owner-notebook/notes/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/owner-notebook/notes", {
        method: "POST",
        body: JSON.stringify({ text: "مهمة", kind: "task", color: "ivory" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ note: { kind: string } }>(response);
    expect(body.note.kind).toBe("task");
    expect(createOwnerNotebookNote).toHaveBeenCalledWith(expect.objectContaining({
      text: "مهمة",
      kind: "task",
      color: "ivory",
    }));
  });

  it("PATCH updates an owner notebook note", async () => {
    updateOwnerNotebookNote.mockResolvedValueOnce({
      note: { id: TEST_NOTE_ID, text: "محدثة", kind: "note", done: false, color: "yellow" },
    });

    const { PATCH } = await import("../owner-notebook/notes/[noteId]/route");
    const response = await PATCH(
      ownerRequest(`http://localhost/api/v1/owner-notebook/notes/${TEST_NOTE_ID}`, {
        method: "PATCH",
        body: JSON.stringify({ text: "محدثة" }),
      }),
      { params: Promise.resolve({ noteId: TEST_NOTE_ID }) },
    );

    expect(response.status).toBe(200);
    expect(updateOwnerNotebookNote).toHaveBeenCalledWith(expect.objectContaining({
      noteId: TEST_NOTE_ID,
      text: "محدثة",
    }));
  });

  it("DELETE removes an owner notebook note", async () => {
    deleteOwnerNotebookNote.mockResolvedValueOnce({ deleted: true, noteId: TEST_NOTE_ID });

    const { DELETE } = await import("../owner-notebook/notes/[noteId]/route");
    const response = await DELETE(
      ownerRequest(`http://localhost/api/v1/owner-notebook/notes/${TEST_NOTE_ID}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ noteId: TEST_NOTE_ID }) },
    );

    expect(response.status).toBe(200);
    expect(deleteOwnerNotebookNote).toHaveBeenCalledWith(expect.objectContaining({
      noteId: TEST_NOTE_ID,
      actorRole: "owner",
    }));
  });
});
