import { useEffect, useState } from "react";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Frame-rate independent damping factor */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function useRevealRoot<T extends HTMLElement>() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null as unknown as T;
}

/** Tracks normalized cursor + velocity globally (single listener). */
export const pointerStore = {
  x: 0.5,
  y: 0.3,
  vx: 0,
  vy: 0,
  speed: 0,
  px: 0.5,
  py: 0.3,
};

export function initGlobalPointer() {
  let raf = 0;
  let lx = window.innerWidth / 2;
  let ly = window.innerHeight / 3;
  const onMove = (e: PointerEvent) => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    pointerStore.vx = nx - pointerStore.x;
    pointerStore.vy = ny - pointerStore.y;
    pointerStore.speed = Math.min(
      1,
      Math.hypot(pointerStore.vx, pointerStore.vy) * 40
    );
    pointerStore.px = pointerStore.x;
    pointerStore.py = pointerStore.y;
    pointerStore.x = nx;
    pointerStore.y = ny;
    lx = e.clientX;
    ly = e.clientY;
    document.documentElement.style.setProperty("--mx", `${nx * 100}%`);
    document.documentElement.style.setProperty("--my", `${ny * 100}%`);
    void lx;
    void ly;
  };
  const decay = () => {
    pointerStore.vx *= 0.9;
    pointerStore.vy *= 0.9;
    pointerStore.speed *= 0.92;
    raf = requestAnimationFrame(decay);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  raf = requestAnimationFrame(decay);
  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(raf);
  };
}

/** Shared scroll velocity (0..1), updated via Lenis callback. */
export const scrollStore = { velocity: 0, y: 0 };

/**
 * Subtle magnetic behavior for important controls (2–8px toward cursor, spring back).
 * Delegated single listener, transform/opacity only, disabled on touch + reduced motion.
 */
export function initMagnetic() {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const SELECTOR = ".magnetic, .pill, .proj-cta, .resume-btn, .chip";
  let current: HTMLElement | null = null;
  const onMove = (e: PointerEvent) => {
    const t = (e.target as HTMLElement | null)?.closest?.(SELECTOR) as HTMLElement | null;
    if (current && current !== t) {
      current.style.transform = "";
      current = null;
    }
    if (!t) return;
    const r = t.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    const R = Math.max(90, Math.max(r.width, r.height));
    if (d < R) {
      // clamp travel to 2–8px so buttons never run away from the click
      const mx = Math.max(-8, Math.min(8, dx * 0.16));
      const my = Math.max(-8, Math.min(8, dy * 0.2));
      t.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px)`;
      current = t;
    } else if (current === t) {
      t.style.transform = "";
      current = null;
    }
  };
  const onLeave = () => {
    if (current) {
      current.style.transform = "";
      current = null;
    }
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  return () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
  };
}
