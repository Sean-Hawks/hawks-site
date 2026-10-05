"use client";

import { Search } from "lucide-react";
import { CONSOLE_COMMAND_EVENT } from "../lib/console-commands";

export default function ConsoleCommandButton() {
  return (
    <button
      type="button"
      className="console-command-trigger"
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new Event(CONSOLE_COMMAND_EVENT))}
    >
      <Search size={16} aria-hidden="true" />
      <span>搜尋與前往</span>
      <kbd>⌘ / Ctrl K</kbd>
    </button>
  );
}
