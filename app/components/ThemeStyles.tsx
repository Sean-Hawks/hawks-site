"use client";

export default function ThemeStyles() {
  return (
    <style jsx global>{`
      :root {
        color-scheme: dark;
        --background: #17120f;
        --foreground: #f0e5d8;
        --bg: 23 18 15;
        --panel: 34 27 22;
        --panel2: 45 36 29;
        --text: 240 229 216;
        --muted: 186 167 148;
        --accent: 251 191 36;
        --accent-foreground: 31 23 12;
        --purple: 244 114 92;
        --line: 255 241 224;
        --surface: 255 241 224;
        font-size: 16px;
      }

      :root[data-theme="light"] {
        color-scheme: light;
        --background: #efe7dc;
        --foreground: #362b24;
        --bg: 239 231 220;
        --panel: 249 243 234;
        --panel2: 226 213 196;
        --text: 54 43 36;
        --muted: 112 91 75;
        --accent: 180 83 9;
        --accent-foreground: 255 248 238;
        --purple: 168 74 55;
        --line: 75 56 42;
        --surface: 75 56 42;
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --background: #17120f;
        --foreground: #f0e5d8;
        --bg: 23 18 15;
        --panel: 34 27 22;
        --panel2: 45 36 29;
        --text: 240 229 216;
        --muted: 186 167 148;
        --accent: 251 191 36;
        --accent-foreground: 31 23 12;
        --purple: 244 114 92;
        --line: 255 241 224;
        --surface: 255 241 224;
      }
    `}</style>
  );
}
