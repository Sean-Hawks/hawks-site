"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

import { optimizedSrc, optimizedSrcSet } from "../lib/image-loader";

type Img = { src: string; alt?: string; title?: string };
type PhotoPreview = { index: number; src: string; width: number; height: number };

// 相簿格子：文章欄最寬約 760px，兩欄各佔一半
const GRID_SIZES = "(min-width: 640px) 380px, 50vw";
const SINGLE_SIZES = "(min-width: 800px) 760px, 100vw";
const LIGHTBOX_SIZES = "94vw";
const enlargedPhoto = { transform: "none", clipPath: "inset(0px 0px round 8px)" };

function thumbnailPose(thumbnail: HTMLImageElement | undefined, photo: HTMLElement): Keyframe | null {
  if (!thumbnail?.naturalWidth) return null;
  const from = thumbnail.getBoundingClientRect();
  const to = photo.getBoundingClientRect();
  if (!from.width || !from.height || !to.width || !to.height || from.bottom <= 0 || from.top >= window.innerHeight) return null;

  const scale = Math.max(from.width / to.width, from.height / to.height);
  const x = from.left + from.width / 2 - to.left - to.width / 2;
  const y = from.top + from.height / 2 - to.top - to.height / 2;
  // Keep the photo's aspect ratio and match the thumbnail crop at the end of the move.
  const clipX = Math.max(0, (to.width - from.width / scale) / 2);
  const clipY = Math.max(0, (to.height - from.height / scale) / 2);
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    clipPath: `inset(${clipY}px ${clipX}px round ${12 / scale}px)`,
  };
}

// 先把上一張／下一張抓進快取，翻頁時就不用等
function preload(img: Img) {
  const el = new Image();
  const srcSet = optimizedSrcSet(img.src);
  if (srcSet) {
    el.sizes = LIGHTBOX_SIZES;
    el.srcset = srcSet;
  }
  el.src = optimizedSrc(img.src, 1600);
}

function LightboxImage({ img, index, total, preview }: { img: Img; index: number; total: number; preview?: PhotoPreview }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // 已在快取內的圖片可能在 onLoad 綁上前就完成，掛載時補檢查 complete
  const attach = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  const caption = captionOf(img);
  const fullSrc = optimizedSrc(img.src, 1600);
  const previewSize = preview ? {
    aspectRatio: `${preview.width} / ${preview.height}`,
    width: `min(${fullSrc === img.src ? `${preview.width}px, ` : ""}94vw, ${86 * preview.width / preview.height}vh)`,
  } : undefined;
  if (failed) return (
    <div role="status" className="max-w-sm rounded-xl bg-black/80 p-6 text-center text-white" onClick={event => event.stopPropagation()}>
      <p>圖片暫時無法載入。</p>
      <a href={img.src} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block underline">開啟原圖</a>
    </div>
  );

  return (
    <figure onClick={event => event.stopPropagation()} className="m-0 flex max-h-[92vh] max-w-[94vw] flex-col items-center">
      <div data-photo-index={index} style={previewSize} className="relative flex max-h-[86vh] max-w-[94vw] items-center justify-center">
        {!loaded && (
          <>
            {/* 先用相簿已載好的小圖當模糊底圖，避免整片黑等待 */}
            <img
              src={preview?.src ?? optimizedSrc(img.src, 480)}
              alt=""
              aria-hidden="true"
              className={`max-h-[86vh] max-w-[94vw] rounded-lg object-contain opacity-60 blur-md ${preview ? "absolute inset-0 h-full w-full" : ""}`}
            />
            <span
              role="status"
              aria-label="圖片載入中"
              className="absolute grid h-12 w-12 place-items-center rounded-full bg-black/55"
            >
              <span className="h-6 w-6 rounded-full border-2 border-white/25 border-t-white motion-safe:animate-spin" />
            </span>
          </>
        )}
        <img
          ref={attach}
          src={fullSrc}
          srcSet={optimizedSrcSet(img.src)}
          sizes={LIGHTBOX_SIZES}
          alt={img.alt ?? ""}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          onClick={(e) => e.stopPropagation()}
          className={[
            "max-h-[86vh] max-w-[94vw] rounded-lg object-contain shadow-2xl motion-safe:transition-opacity motion-safe:duration-200",
            (preview || !loaded) && "absolute inset-0 h-full w-full",
            loaded ? "opacity-100" : "opacity-0",
          ].filter(Boolean).join(" ")}
        />
      </div>
      <figcaption className="mt-3 flex items-center gap-3 text-sm text-white/80">
          {caption && <span>{caption}</span>}
          {total > 1 && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5">
              {index + 1} / {total}
            </span>
          )}
          <a href={img.src} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} className="shrink-0 underline">原圖 ↗</a>
        </figcaption>
    </figure>
  );
}

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
  // Obsidian 沒有填說明時會以檔名作為 alt；檔名不適合作為畫面上的圖說。
  if (/^(?:.*\/)?[^/]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(alt)) return "";
  return alt;
}

export default function ArticleImages({ images }: { images: Img[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [preview, setPreview] = useState<PhotoPreview>();
  const galleryRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const animations = useRef<Animation[]>([]);
  const closing = useRef(false);
  const isOpen = active !== null;
  const isGrid = images.length > 1;
  const previewImages = images.slice(0, 4);

  function open(index: number, button: HTMLButtonElement) {
    const thumbnail = button.querySelector("img");
    opener.current = button;
    setPreview(thumbnail?.naturalWidth && thumbnail.naturalHeight ? {
      index, src: thumbnail.currentSrc, width: thumbnail.naturalWidth, height: thumbnail.naturalHeight,
    } : undefined);
    setActive(index);
  }

  const close = useCallback(() => {
    if (closing.current) return;
    const dialog = dialogRef.current;
    if (!dialog?.animate || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      setActive(null);
      return;
    }

    closing.current = true;
    const opacity = getComputedStyle(dialog).opacity;
    const photo = dialog.querySelector<HTMLElement>("[data-photo-index]");
    const photoStyle = photo ? getComputedStyle(photo) : null;
    const currentPose = photoStyle ? {
      transform: photoStyle.transform,
      clipPath: photoStyle.clipPath === "none" ? enlargedPhoto.clipPath : photoStyle.clipPath,
    } : enlargedPhoto;
    for (const animation of animations.current) animation.cancel();

    const thumbnail = photo && galleryRef.current?.querySelectorAll<HTMLImageElement>("button img")[Number(photo.dataset.photoIndex)];
    const destination = photo ? thumbnailPose(thumbnail ?? undefined, photo) : null;
    const timing: KeyframeAnimationOptions = { duration: destination ? 240 : 150, easing: "ease-out", fill: "forwards" };
    const fade = dialog.animate([{ opacity }, { opacity: 0 }], timing);
    animations.current = [fade];
    if (photo && destination) animations.current.push(photo.animate([currentPose, destination], timing));
    fade.onfinish = () => setActive(null);
  }, []);

  const step = useCallback((direction: number) => {
    if (closing.current) return;
    setActive((index) => index === null ? null : (index + direction + images.length) % images.length);
  }, [images.length]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = opener.current;
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog);
    const previousInert = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    dialog?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const buttons = dialog?.querySelectorAll<HTMLElement>("button, a[href]");
        const first = buttons?.[0];
        const last = buttons?.[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.setProperty("overflow", "hidden");
    if (dialog?.animate && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      animations.current = [dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" })];
      const photo = dialog.querySelector<HTMLElement>("[data-photo-index]");
      const origin = photo ? thumbnailPose(previousFocus?.querySelector("img") ?? undefined, photo) : null;
      if (photo && origin) {
        animations.current.push(photo.animate([origin, enlargedPhoto], { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }));
      }
    }
    return () => {
      for (const animation of animations.current) animation.cancel();
      animations.current = [];
      closing.current = false;
      document.removeEventListener("keydown", onKey);
      document.body.style.setProperty("overflow", prevOverflow);
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen, close, step]);

  useEffect(() => {
    if (active === null || images.length < 2) return;
    const adjacent = [images[(active + 1) % images.length], images[(active - 1 + images.length) % images.length]];
    for (const image of new Map(adjacent.map(image => [image.src, image])).values()) preload(image);
  }, [active, images]);

  if (!images.length) return null;

  return (
    <>
      {isGrid ? (
        <section
          ref={galleryRef}
          className="my-10"
          aria-label={`${images.length} 張文章照片`}
        >
          <div className="mb-3 flex items-center justify-between px-1 text-sm text-[rgb(var(--muted))]">
            <span className="font-medium">{images.length} 張照片</span>
            <span className="opacity-65">點擊查看完整圖片</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {previewImages.map((img, i) => {
              const hiddenCount = images.length - previewImages.length;
              const hasMore = hiddenCount > 0 && i === previewImages.length - 1;
              const remainingCount = images.length - i;

              return (
                <figure key={`${img.src}-${i}`} className="m-0 min-w-0">
                  <button
                    type="button"
                    onClick={(event) => open(i, event.currentTarget)}
                    aria-label={hasMore ? `查看全部 ${images.length} 張照片` : `放大第 ${i + 1} 張照片`}
                    className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel2)/0.5)] shadow-md transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--accent)/0.32)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent)/0.5)] sm:rounded-2xl"
                  >
                    <img
                      src={optimizedSrc(img.src, 480)}
                      srcSet={optimizedSrcSet(img.src)}
                      sizes={GRID_SIZES}
                      decoding="async"
                      alt={img.alt ?? ""}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    />
                    {hasMore && (
                      <span className="absolute inset-0 grid place-items-center bg-black/55 text-center text-base font-semibold text-white backdrop-blur-[1px] sm:text-lg">
                        查看其餘 {remainingCount} 張
                      </span>
                    )}
                  </button>
                  {captionOf(img) && (
                    <figcaption className="mt-2 px-2 text-center text-xs leading-5 text-[rgb(var(--muted))] opacity-75 sm:text-sm sm:leading-6">
                      {captionOf(img)}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </section>
      ) : (
        <figure
          ref={galleryRef}
          className={["my-10 mx-auto", sizeToClass(images[0].title)].join(" ")}
        >
          <button
            type="button"
            onClick={(event) => open(0, event.currentTarget)}
            aria-label="放大圖片"
            className="group flex w-full cursor-zoom-in justify-center focus:outline-none"
          >
            <img
              src={optimizedSrc(images[0].src, 960)}
              srcSet={optimizedSrcSet(images[0].src)}
              sizes={SINGLE_SIZES}
              decoding="async"
              alt={images[0].alt ?? ""}
              loading="lazy"
              className="h-auto max-h-[70vh] w-auto max-w-full rounded-xl border border-[rgb(var(--line)/0.12)] object-contain shadow-lg transition-opacity group-hover:opacity-95"
            />
          </button>
          {captionOf(images[0]) && (
            <figcaption className="mt-3 text-center text-sm text-[rgb(var(--muted))] opacity-70">
              {captionOf(images[0])}
            </figcaption>
          )}
        </figure>
      )}

      {active !== null && createPortal(
        <div
          ref={dialogRef}
          onClick={close}
          role="dialog"
          aria-label="文章照片檢視器"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="關閉"
            className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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
                  step(-1);
                }}
                className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="下一張"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <LightboxImage key={active} img={images[active]} index={active} total={images.length} preview={preview?.index === active ? preview : undefined} />
        </div>,
        document.body,
      )}
    </>
  );
}
