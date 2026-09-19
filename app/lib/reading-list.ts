export type ReadingEntry = {
  id: string;
  savedAt: number;
  readAt: number | null;
};
export type ReadingAction =
  | { type: "toggle" | "remove" | "read" | "unread"; id: string }
  | { type: "restore"; entry: ReadingEntry };
export const READING_LIMIT = 200;
const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^(post|talk|library):[a-zA-Z0-9:_-]{1,200}$/.test(id);
const validTime = (time: unknown): time is number =>
  typeof time === "number" && Number.isSafeInteger(time) && time > 0;
export function parseReadingList(raw: string | null): ReadingEntry[] {
  if (!raw || raw.length > 100_000) return [];
  try {
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.entries)) return [];
    const seen = new Set<string>();
    return data.entries
      .filter((entry: ReadingEntry | null) => {
        if (
          !entry ||
          !validId(entry.id) ||
          !validTime(entry.savedAt) ||
          !(entry.readAt === null || validTime(entry.readAt)) ||
          seen.has(entry.id)
        )
          return false;
        seen.add(entry.id);
        return true;
      })
      .slice(0, READING_LIMIT)
      .map((entry: ReadingEntry) => ({
        id: entry.id,
        savedAt: entry.savedAt,
        readAt: entry.readAt,
      }));
  } catch {
    return [];
  }
}
export function applyReadingAction(
  entries: ReadingEntry[],
  action: ReadingAction,
  now = Date.now(),
): ReadingEntry[] {
  const id = action.type === "restore" ? action.entry.id : action.id;
  if (!validId(id)) return entries;
  const existing = entries.find((entry) => entry.id === id);
  if (action.type === "remove" || (action.type === "toggle" && existing))
    return entries.filter((entry) => entry.id !== id);
  if (action.type === "toggle" || action.type === "restore") {
    if (existing || entries.length >= READING_LIMIT) return entries;
    const entry =
      action.type === "restore"
        ? action.entry
        : { id, savedAt: now, readAt: null };
    return parseReadingList(
      JSON.stringify({ version: 1, entries: [...entries, entry] }),
    );
  }
  return entries.map((entry) =>
    entry.id === id
      ? { ...entry, readAt: action.type === "read" ? now : null }
      : entry,
  );
}
