"use client";

export default function ThemeStyles() {
  return (
    <style jsx global>{`
      :root {
        color-scheme: dark;
        --background: #0f1014;
        --foreground: #e8e4dc;
        --bg: 15 16 20;
        --panel: 24 26 32;
        --panel2: 30 33 40;
        --text: 232 228 220;
        --muted: 178 172 164;
        --accent: 251 191 36;
        --accent-foreground: 15 16 20;
        --purple: 167 139 250;
        --line: 255 255 255;
        --surface: 255 255 255;
        font-size: 16px;
      }

      :root[data-theme="light"] {
        color-scheme: light;
        --background: #f8f6f0;
        --foreground: #26231e;
        --bg: 248 246 240;
        --panel: 255 253 248;
        --panel2: 246 241 231;
        --text: 38 35 30;
        --muted: 113 103 91;
        --accent: 180 119 22;
        --accent-foreground: 255 253 248;
        --purple: 113 91 190;
        --line: 42 35 26;
        --surface: 42 35 26;
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --background: #0f1014;
        --foreground: #e8e4dc;
        --bg: 15 16 20;
        --panel: 24 26 32;
        --panel2: 30 33 40;
        --text: 232 228 220;
        --muted: 178 172 164;
        --accent: 251 191 36;
        --accent-foreground: 15 16 20;
        --purple: 167 139 250;
        --line: 255 255 255;
        --surface: 255 255 255;
      }
    `}</style>
  );
}
