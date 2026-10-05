"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Search, X } from "lucide-react";
import { guiSnapshot, subscribeAppearance } from "../lib/appearance";
import { consoleCommands, CONSOLE_COMMAND_EVENT, isConsoleCommandShortcut } from "../lib/console-commands";

export default function ConsoleCommandMenu() {
  const gui = useSyncExternalStore(subscribeAppearance, guiSnapshot, () => "classic");
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const commands = consoleCommands(query);
  const activeId = commands[selected]?.id;

  useEffect(() => {
    if (gui !== "console") return;
    const show = () => {
      if (dialog.current?.open) return;
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isConsoleCommandShortcut(event)) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener(CONSOLE_COMMAND_EVENT, show);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(CONSOLE_COMMAND_EVENT, show);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gui]);

  useEffect(() => {
    if (open && gui === "console") {
      dialog.current?.showModal();
      input.current?.focus();
    } else {
      dialog.current?.close();
    }
  }, [open, gui]);

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  useEffect(() => {
    if (open && activeId) {
      document.getElementById(`console-command-${activeId}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeId]);

  const go = (href: string) => {
    dialog.current?.close();
    router.push(href);
  };

  return (
    <dialog
      ref={dialog}
      className="console-command-dialog"
      aria-labelledby="console-command-title"
      onClose={() => {
        setOpen(false);
        setQuery("");
        setSelected(0);
        if (opener.current?.isConnected) opener.current.focus();
      }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
        }
      }}
    >
      <div className="console-command-heading">
        <h2 id="console-command-title">快速前往</h2>
        <button type="button" aria-label="關閉快速前往" onClick={() => dialog.current?.close()}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="console-command-input">
        <Search size={18} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-label="找頁面或搜尋文章"
          aria-controls="console-command-results"
          aria-expanded={open && gui === "console"}
          aria-autocomplete="list"
          aria-activedescendant={commands[selected] ? `console-command-${commands[selected].id}` : undefined}
          autoComplete="off"
          placeholder="找頁面，或搜尋文章…"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setSelected(0); }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              setSelected((index) => (index + step + commands.length) % commands.length);
            } else if (event.key === "Enter" && commands[selected]) {
              event.preventDefault();
              go(commands[selected].href);
            }
          }}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="console-command-results" id="console-command-results" role="listbox" aria-label="可前往的頁面">
        {commands.map((command, index) => (
          <button
            key={command.id}
            id={`console-command-${command.id}`}
            type="button"
            role="option"
            aria-selected={index === selected}
            tabIndex={-1}
            onPointerMove={() => setSelected(index)}
            onClick={() => go(command.href)}
          >
            <span><strong>{command.label}</strong><small>{command.description}</small></span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="console-command-footer">
        <span><kbd>↑ ↓</kbd> 選擇</span>
        <span><kbd>Enter</kbd> 開啟</span>
        <span>文章 · 近況 · 收藏</span>
      </div>
    </dialog>
  );
}
