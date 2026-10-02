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
