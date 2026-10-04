import { useEffect, useRef } from "react";
import FieldInstrument from "./FieldInstrument";

/** Subtle cursor-reactive hero: rows drift at different depths, "experiment." reacts most. */
function useHeroParallax(titleRef: React.RefObject<HTMLHeadingElement | null>) {
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const rows = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      // normalize cursor relative to hero title (-0.5 .. 0.5), extend a bit beyond
      const nx = (e.clientX - (r.left + r.width / 2)) / Math.max(1, r.width);
      const ny = (e.clientY - (r.top + r.height / 2)) / Math.max(1, window.innerHeight * 0.7);
      tx = Math.max(-0.6, Math.min(0.6, nx));
      ty = Math.max(-0.6, Math.min(0.6, ny));
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      if (Math.abs(cx) < 0.0005 && Math.abs(cy) < 0.0005 && !tx && !ty) {
        rows.forEach((row) => (row.style.transform = ""));
        return;
      }
      rows.forEach((row) => {
        const d = parseFloat(row.dataset.depth || "1");
        // physical, tiny: 2–10px max; "experiment." depth is highest by markup
        row.style.transform = `translate3d(${(cx * 14 * d).toFixed(2)}px, ${(cy * 10 * d).toFixed(2)}px, 0)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [titleRef]);
}

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useHeroParallax(titleRef);
  return (
    <header className="hero wrap" id="top">
      <div className="micro reveal" style={{ marginBottom: 14 }}>
        PORTFOLIO AS SYSTEM — V.2026 / CS UNDERGRAD / VIT-AP
      </div>
      <div className="hero-grid">
        <div className="hero-copy">
          <h1 ref={titleRef} className="hero-title" aria-label="I design. I build. I experiment.">
            <span className="row" aria-hidden="true">
              <span data-depth="0.45">I&nbsp;DESIGN<span className="x">.</span></span>
            </span>
            <span className="row" aria-hidden="true">
              <span data-depth="0.7">
                I&nbsp;BUILD<span className="x">.</span>
              </span>
            </span>
            <span className="row row-final" aria-hidden="true">
              <span className="hero-final-line" data-depth="1.25">
                <span className="i">I</span>
                <span className="it">&nbsp;experiment.</span>
              </span>
            </span>
          </h1>
          <div className="hero-sub reveal">
            <p className="lede" style={{ maxWidth: "38ch" }}>
              I work where <strong>design meets intelligence</strong> — frontend,
              machine learning and data, treated as one material. This site is
              the proof: every pixel here runs on code I wrote.
            </p>
            <div className="hero-meta">
              <span>
                NAME <b>SWARNIM MANE</b>
              </span>
              <span>
                BASE <b>IN / AP</b>
              </span>
              <span>
                MODE <b style={{ color: "#FF3D00" }}>● LIVE</b>
              </span>
            </div>
          </div>
        </div>
        <figure
          className="field-card reveal"
          style={{ margin: 0 }}
          data-cursor="explore"
          aria-label="Interactive signature visual — move your cursor over it"
        >
          <span className="field-tag">FIG.01 — FIELD INSTRUMENT</span>
          <FieldInstrument />
          <figcaption className="field-legend">
            <span>
              OBSERVATIONS <b>●</b> MODEL <b style={{ color: "#1F3BFF" }}>—</b> PREDICTION <b>●</b>
            </span>
            <span>MOVE CURSOR → PERTURB · SCROLL → ENERGIZE</span>
          </figcaption>
        </figure>
      </div>
      <div className="scroll-hint" aria-hidden="true">
        <i /> SCROLL — THE SITE IS ONE CONTINUOUS INSTRUMENT
      </div>
    </header>
  );
}
