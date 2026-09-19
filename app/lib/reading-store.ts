"use client";
import { useSyncExternalStore } from "react";
import { applyReadingAction, parseReadingList, READING_LIMIT, type ReadingAction, type ReadingEntry } from "./reading-list";
const key = "hawks-reading-list-v1";
const eventName = "hawks-reading-list-change";
const initial: { entries: ReadingEntry[]; persistent: boolean; ready: boolean } = { entries: [], persistent: true, ready: false };
let snapshot = initial;
let lastRaw: string | null | undefined;
let memoryOnly = false;
function getSnapshot() {
  if (memoryOnly) return snapshot;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== lastRaw) { lastRaw = raw; snapshot = { entries: parseReadingList(raw), persistent: true, ready: true }; }
  } catch { memoryOnly = true; snapshot = { ...snapshot, persistent: false, ready: true }; }
  return snapshot;
}
function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(eventName, callback); };
}
export function useReadingList() { return useSyncExternalStore(subscribe, getSnapshot, () => initial); }
export function updateReadingList(action: ReadingAction) {
  const before = getSnapshot();
  const entries = applyReadingAction(before.entries, action);
  if (entries === before.entries && before.entries.length >= READING_LIMIT && (action.type === "toggle" || action.type === "restore")) return { applied: false, message: "清單已達 200 篇，請先移除一些內容。" };
  const raw = JSON.stringify({ version: 1, entries });
  try { if (!memoryOnly) localStorage.setItem(key, raw); }
  catch { memoryOnly = true; }
  lastRaw = raw;
  snapshot = { entries, persistent: !memoryOnly, ready: true };
  window.dispatchEvent(new Event(eventName));
  return { applied: true, message: memoryOnly ? "瀏覽器無法儲存，這次變更只會暫存在目前頁面。" : "" };
}
