"use client";

export default function ThemeStyles() {
  return (
    <style jsx global>{`
      :root {
        --bg: 15 16 20;        /* pure dark, no gradient */
        --panel: 24 26 32;     /* Discord-ish panel */
        --panel2: 30 33 40;    /* slightly brighter */
        --text: 232 228 220;   /* warm off-white */
        --muted: 178 172 164;  /* warm gray */
        --accent: 251 191 36;  /* amber */
        --purple: 167 139 250; /* soft purple */
        /* fluid sizing so文字/排版會跟著視窗比例縮放 */
        font-size: clamp(12px, 1vw + 9px, 18px);
      }

      @media (max-width: 768px) {
        :root {
          font-size: clamp(11px, 2vw + 7px, 17px);
        }
      }
    `}</style>
  );
}
