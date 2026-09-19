"use client";

import { useCallback, useSyncExternalStore } from 'react';

const changeEvent = 'hawks:query-change';
function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}
function snapshot() { return window.location.search; }

// The server renders the unfiltered archive; hydration reads the current URL.
export function useQueryParams() {
  const search = useSyncExternalStore(subscribe, snapshot, () => '');
  const update = useCallback((values: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    // Typing does not add one Back-button entry per keystroke.
    window.history.replaceState(window.history.state, '', url);
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  return [new URLSearchParams(search), update] as const;
}
