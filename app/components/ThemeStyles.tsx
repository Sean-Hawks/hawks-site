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
        --accent: 34 211 238;
        --accent-foreground: 15 16 20;
        --purple: 167 139 250;
        --line: 255 255 255;
        --surface: 255 255 255;
        font-size: 16px;
      }

      :root[data-theme="light"] {
        color-scheme: light;
        --background: #dfe1df;
        --foreground: #202629;
        --bg: 223 225 223;
        --panel: 236 237 233;
        --panel2: 210 215 212;
        --text: 32 38 41;
        --muted: 94 103 106;
        --accent: 14 116 144;
        --accent-foreground: 245 247 246;
        --purple: 102 99 148;
        --line: 42 50 53;
        --surface: 42 50 53;
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
        --accent: 34 211 238;
        --accent-foreground: 15 16 20;
        --purple: 167 139 250;
        --line: 255 255 255;
        --surface: 255 255 255;
      }
    `}</style>
  );
}
