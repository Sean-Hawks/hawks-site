"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Img = { src: string; alt?: string; title?: string };

function sizeToClass(title?: string) {
  const size = /(?:^|\s)size=(small|medium|wide)(?:\s|$)/.exec(title ?? "")?.[1];
  return size === "small"
    ? "max-w-[560px]"
    : size === "wide"
      ? "max-w-none"
      : "max-w-[760px]";
}

function captionOf(img: Img) {
  const alt = img.alt?.trim();
  if (!alt) return "";
  // 過濾純尺寸標記（如 300、300x200）當作說明文字
  if (/^\d+(x\d+)?$/.test(alt)) return "";
  return alt;
}

export default function ArticleImages({ images }: { images: Img[] }) {
  const [active, setActive] = useState<number | null>(null);
  const close = useCallback(() => setActive(null), []);
  const isGrid = images.length > 1;

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight")
        setActive((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft")
        setActive((i) =>
          i === null ? i : (i - 1 + images.length) % images.length,
        );
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, images.length, close]);

  return (
    <>
      {isGrid ? (
        <div className="my-10 grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-2">
          {images.map((img, i) => (
            <figure key={`${img.src}-${i}`} className="m-0 min-w-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label="放大圖片"
                className="group block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel2)/0.5)] p-1 shadow-lg transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.32)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.5)]"
              >
                <img
                  src={img.src}
                  alt={img.alt ?? ""}
                  loading="lazy"
                  className="h-full w-full rounded-[0.7rem] object-contain transition-transform duration-300 group-hover:scale-[1.015]"
                />
              </button>
              {captionOf(img) && (
                <figcaption className="mt-2.5 px-2 text-center text-sm leading-6 text-[rgb(var(--muted))] opacity-75">
                  {captionOf(img)}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <figure className={["my-10 mx-auto", sizeToClass(images[0].title)].join(" ")}>
          <button
            type="button"
            onClick={() => setActive(0)}
            aria-label="放大圖片"
            className="group block w-full cursor-zoom-in focus:outline-none"
          >
            <img
              src={images[0].src}
              alt={images[0].alt ?? ""}
              loading="lazy"
              className="h-auto w-full rounded-xl border border-[rgb(var(--line)/0.12)] object-contain shadow-lg transition-opacity group-hover:opacity-95"
            />
          </button>
          {captionOf(images[0]) && (
            <figcaption className="mt-3 text-center text-sm text-[rgb(var(--muted))] opacity-70">
              {captionOf(images[0])}
            </figcaption>
          )}
        </figure>
      )}

      {active !== null && (
        <div
          onClick={close}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="關閉"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一張"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) =>
                    i === null ? i : (i - 1 + images.length) % images.length,
                  );
                }}
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="下一張"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i === null ? i : (i + 1) % images.length));
                }}
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure className="m-0 flex max-h-[92vh] max-w-[94vw] flex-col items-center">
            <img
              src={images[active].src}
              alt={images[active].alt ?? ""}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[86vh] max-w-[94vw] rounded-lg object-contain shadow-2xl"
            />
            {(captionOf(images[active]) || images.length > 1) && (
              <figcaption className="mt-3 flex items-center gap-3 text-sm text-white/80">
                {captionOf(images[active]) && (
                  <span>{captionOf(images[active])}</span>
                )}
                {images.length > 1 && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5">
                    {active + 1} / {images.length}
                  </span>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
