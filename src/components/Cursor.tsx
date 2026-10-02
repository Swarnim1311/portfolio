import { useEffect, useRef } from "react";
import { damp } from "../lib/core";

const LABELS: Record<string, string> = {
  explore: "EXPLORE →",
  view: "VIEW",
  drag: "DRAG",
  play: "PLAY",
  trace: "TRACE",
  inspect: "INSPECT",
  open: "OPEN →",
  hover: "",
};

/** Sophisticated interpolated cursor with contextual labels + magnetic feel. */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let last = performance.now();

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement | null;
      const labelled =
        t?.closest?.("[data-cursor]") as HTMLElement | null;
      const interactive = t?.closest?.(
        "a, button, .skill-node, .scene, .s-n, .s-chipbtn, .s-row, .s-alayer"
      );
      if (labelled?.dataset.cursor) {
        document.body.dataset.cursor = labelled.dataset.cursor;
        const ring = ringRef.current?.querySelector("i");
        if (ring)
          ring.textContent =
            LABELS[labelled.dataset.cursor] ?? labelled.dataset.cursor;
      } else if (interactive) {
        const anchor = (interactive as HTMLElement).closest?.("a") as HTMLAnchorElement | null;
        const href = anchor?.getAttribute("href") ?? "";
        if (href.startsWith("http") || href.startsWith("mailto:")) {
          document.body.dataset.cursor = "open";
          const ring = ringRef.current?.querySelector("i");
          if (ring) ring.textContent = LABELS.open;
        } else {
          document.body.dataset.cursor = "hover";
        }
      } else {
        document.body.dataset.cursor = "";
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      rx += (x - rx) * damp(14, dt);
      ry += (y - ry) * damp(14, dt);
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="cursor" aria-hidden="true">
        <div ref={dotRef} className="cursor-dot" />
      </div>
      <div className="cursor-ring" aria-hidden="true">
        <div ref={ringRef}>
          <i />
        </div>
      </div>
    </>
  );
}
