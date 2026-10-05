export type GuiMode = "classic" | "console";
export type ThemeMode = "light" | "dark";

export const GUI_KEY = "gui-v1";
export const THEME_KEY = "theme-v2";
export const CONSOLE_THEME_KEY = "console-theme-v1";

// Run before paint; old theme-v2 preferences remain valid for the original GUI.
export const appearanceBootstrap = `(() => {
  const root = document.documentElement;
  let gui = "classic";
  let theme = "light";
  try {
    gui = localStorage.getItem("${GUI_KEY}") === "console" ? "console" : "classic";
    const saved = localStorage.getItem(gui === "console" ? "${CONSOLE_THEME_KEY}" : "${THEME_KEY}");
    theme = saved === "light" || saved === "dark" ? saved : gui === "console" ? "dark" : "light";
  } catch {}
  root.dataset.gui = gui;
  root.dataset.theme = theme;
})();`;

export function guiSnapshot(): GuiMode {
  return document.documentElement.dataset.gui === "console" ? "console" : "classic";
}

export function themeSnapshot(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function storedTheme(gui: GuiMode): ThemeMode {
  const fallback = gui === "console" ? "dark" : "light";
  try {
    const saved = localStorage.getItem(gui === "console" ? CONSOLE_THEME_KEY : THEME_KEY);
    return saved === "dark" || saved === "light" ? saved : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The controls still work when storage is unavailable.
  }
}

export function toggleTheme() {
  const next = themeSnapshot() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  save(guiSnapshot() === "console" ? CONSOLE_THEME_KEY : THEME_KEY, next);
}

export function toggleGui() {
  const next = guiSnapshot() === "console" ? "classic" : "console";
  document.documentElement.dataset.theme = storedTheme(next);
  document.documentElement.dataset.gui = next;
  save(GUI_KEY, next);
}

export function subscribeAppearance(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-gui"],
  });
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && ![GUI_KEY, THEME_KEY, CONSOLE_THEME_KEY].includes(event.key)) return;
    try {
      const gui = localStorage.getItem(GUI_KEY) === "console" ? "console" : "classic";
      document.documentElement.dataset.theme = storedTheme(gui);
      document.documentElement.dataset.gui = gui;
    } catch {
      // Leave the current selection intact if storage becomes inaccessible.
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onStorage);
  };
}

// Single clicks respond immediately. The first two clicks in a rapid triple
// cancel each other's theme changes; the third switches GUI instead.
export function createAppearanceClickHandler(
  onSingle: () => void,
  onTriple: () => void,
  now: () => number = () => performance.now(),
) {
  let count = 0;
  let lastClick = -Infinity;
  return {
    click() {
      const time = now();
      count = time - lastClick <= 350 ? count + 1 : 1;
      lastClick = time;
      if (count === 3) {
        count = 0;
        onTriple();
      } else {
        onSingle();
      }
    },
    reset() {
      count = 0;
      lastClick = -Infinity;
    },
  };
}
