export function closeoutSequenceLetter(sequence) {
  const value = Number(sequence);
  if (!Number.isInteger(value) || value < 1) return "";
  let remaining = value;
  let letters = "";
  while (remaining > 0) {
    const remainder = (remaining - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return letters;
}

/**
 * @param {{ formattedDate?: string, daySequence?: number | null, sameDayCloseoutCount?: number }} input
 */
export function formatCloseoutDayLabel({
  formattedDate = "",
  daySequence = null,
  sameDayCloseoutCount = 1,
}) {
  if (!formattedDate) return "";
  const count = Number(sameDayCloseoutCount) || 1;
  const sequence = Number(daySequence);
  if (count <= 1 || !Number.isInteger(sequence) || sequence < 1) {
    return formattedDate;
  }
  const letter = closeoutSequenceLetter(sequence);
  return letter ? `${formattedDate} · ${letter}` : formattedDate;
}

/** Counts sent closeouts per date (any non-draft status). */
export function countSentCloseoutsByDate(closeouts = []) {
  const counts = new Map();
  (Array.isArray(closeouts) ? closeouts : []).forEach((item) => {
    if (!item?.date || item?.status === "draft") return;
    counts.set(item.date, (counts.get(item.date) || 0) + 1);
  });
  return counts;
}

/** @deprecated Use countSentCloseoutsByDate — legacy name kept for import stability. */
export const countSubmittedCloseoutsByDate = countSentCloseoutsByDate;
