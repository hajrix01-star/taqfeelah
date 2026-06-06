import { describe, expect, it } from "vitest";
import {
  closeoutSequenceLetter,
  countSubmittedCloseoutsByDate,
  formatCloseoutDayLabel,
} from "./closeout-day-label";

describe("closeoutSequenceLetter", () => {
  it("maps server sequences to English letters", () => {
    expect(closeoutSequenceLetter(1)).toBe("A");
    expect(closeoutSequenceLetter(2)).toBe("B");
    expect(closeoutSequenceLetter(26)).toBe("Z");
    expect(closeoutSequenceLetter(27)).toBe("AA");
  });
});

describe("formatCloseoutDayLabel", () => {
  it("hides the letter when only one closeout exists on the day", () => {
    expect(formatCloseoutDayLabel({
      formattedDate: "Jun 6",
      daySequence: 1,
      sameDayCloseoutCount: 1,
    })).toBe("Jun 6");
  });

  it("appends the English letter when multiple closeouts exist", () => {
    expect(formatCloseoutDayLabel({
      formattedDate: "Jun 6",
      daySequence: 2,
      sameDayCloseoutCount: 2,
    })).toBe("Jun 6 · B");
  });
});

describe("countSubmittedCloseoutsByDate", () => {
  it("counts only submitted closeouts per date", () => {
    const counts = countSubmittedCloseoutsByDate([
      { date: "2026-06-06", status: "reviewed" },
      { date: "2026-06-06", status: "submitted" },
      { date: "2026-06-06", status: "draft" },
      { date: "2026-06-05", status: "reviewed" },
    ]);

    expect(counts.get("2026-06-06")).toBe(2);
    expect(counts.get("2026-06-05")).toBe(1);
  });
});
