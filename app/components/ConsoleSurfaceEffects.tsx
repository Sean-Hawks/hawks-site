"use client";

import { useEffect, useSyncExternalStore } from "react";
import { guiSnapshot, subscribeAppearance } from "../lib/appearance";

const surfaces = ".home-profile, .content-index, .home-writing, .home-library, .publication-panel, .reading-inventory, .home-panel, .quiet-panel, .reading-header";
const properties = ["--surface-x", "--surface-y", "--surface-position", "--surface-offset-x", "--surface-offset-y", "--surface-tilt-x", "--surface-tilt-y"];

export default function ConsoleSurfaceEffects() {
  const gui = useSyncExternalStore(subscribeAppearance, guiSnapshot, () => "classic");

  useEffect(() => {
    if (gui !== "console") return;
    const enabled = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let active: HTMLElement | null = null;
    let pending: { element: HTMLElement; x: number; y: number } | null = null;
    let frame = 0;

    const clearSurface = () => {
      if (!active) return;
      delete active.dataset.consoleSurface;
      for (const property of properties) active.style.removeProperty(property);
      active = null;
    };
    const reset = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      pending = null;
      clearSurface();
    };
    const paint = () => {
      frame = 0;
      if (!pending || !enabled.matches || !pending.element.isConnected) {
        reset();
        return;
      }
      const { element, x, y } = pending;
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      if (active !== element) {
        clearSurface();
        active = element;
        active.dataset.consoleSurface = "true";
      }
      const localX = Math.max(0, Math.min(bounds.width, x - bounds.left));
      const localY = Math.max(0, Math.min(bounds.height, y - bounds.top));
      active.style.setProperty("--surface-x", `${localX.toFixed(1)}px`);
      active.style.setProperty("--surface-y", `${localY.toFixed(1)}px`);
      active.style.setProperty("--surface-position", `${(localX / bounds.width * 100).toFixed(1)}%`);
      active.style.setProperty("--surface-offset-x", `${(localX / bounds.width * 2 - 1).toFixed(2)}px`);
      active.style.setProperty("--surface-offset-y", `${(localY / bounds.height * 2 - 1).toFixed(2)}px`);
      active.style.setProperty("--surface-tilt-x", `${((localY / bounds.height * 2 - 1) * -4).toFixed(2)}deg`);
      active.style.setProperty("--surface-tilt-y", `${((localX / bounds.width * 2 - 1) * 4).toFixed(2)}deg`);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !enabled.matches) {
        reset();
        return;
      }
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>(surfaces) : null;
      if (!element || element.classList.contains("panel-error")) {
        reset();
        return;
      }
      pending = { element, x: event.clientX, y: event.clientY };
      if (!frame) frame = window.requestAnimationFrame(paint);
    };
    const leave = (event: PointerEvent) => {
      if (!event.relatedTarget) reset();
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("scroll", reset, { passive: true, capture: true });
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    enabled.addEventListener("change", reset);
    return () => {
      reset();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("scroll", reset, true);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      enabled.removeEventListener("change", reset);
    };
  }, [gui]);

  return null;
}
