import { useEffect, useRef } from "react";
import { clamp, damp, pointerStore, scrollStore } from "../lib/core";

/* ---------------- HOUSE: procedural housing field ---------------- */
function HouseScene() {
  const ref = useRef<HTMLCanvasElement>(null);
  const capRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, t = 0, visible = true, last = performance.now();
    let mx = 0.6, my = 0.4, hov = -1;
    const COLS = mobile ? 7 : 10;
    const ROWS = mobile ? 4 : 5;
    type Lot = { v: number; ph: number; hot: number };
    let lots: Lot[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lots = Array.from({ length: COLS * ROWS }, (_, i) => ({
        v: 0.25 + 0.65 * Math.abs(Math.sin(i * 1.7) * 0.6 + Math.cos(i * 0.6) * 0.4),
        ph: Math.random() * Math.PI * 2,
        hot: 0,
      }));
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        hov = -1; return;
      }
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
      // nearest lot
      const c = clamp(Math.floor(mx * COLS), 0, COLS - 1);
      const rr = clamp(Math.floor(my * ROWS), 0, ROWS - 1);
      hov = rr * COLS + c;
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    io.observe(canvas);
    resize();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt * (0.6 + clamp(Math.abs(scrollStore.velocity) * 5, 0, 1) * 1.8 + pointerStore.speed * 0.8);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#FBFAF5"; ctx.fillRect(0, 0, W, H);

      const cw = W / COLS;
      const surfY = (nx: number) =>
        H * 0.62 - nx * H * 0.28 + Math.sin(nx * 5 + t * 1.2) * 10 - (my - 0.5) * 30 * Math.exp(-Math.pow((nx - mx) * 3, 2));

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = r * COLS + c;
          const lot = lots[i];
          const x = c * cw + cw * 0.22;
          const w = cw * 0.56;
          const ground = H - 26 - r * 8;
          const breathe = Math.sin(t * 1.6 + lot.ph) * 4;
          const h = lot.v * H * 0.52 + breathe + (hov === i ? 14 : 0);
          lot.hot += ((hov === i ? 1 : 0) - lot.hot) * damp(8, dt);
          const y = ground - h;
          // lot pad
          ctx.fillStyle = "rgba(20,19,16,0.07)";
          ctx.fillRect(c * cw + 6, ground + 4, cw - 12, 5);
          // building
          const nearSurf = Math.abs(y - surfY((x + w / 2) / W));
          const onModel = nearSurf < 26;
          ctx.fillStyle = hov === i ? "#FF3D00" : onModel ? "#1F3BFF" : `rgba(20,19,16,${0.72 + lot.v * 0.2})`;
          ctx.fillRect(x, y, w, h);
          // roof notch
          ctx.fillStyle = hov === i ? "#141310" : "rgba(251,250,245,0.85)";
          ctx.fillRect(x + w * 0.2, y + 5, w * 0.6, 3);
          // windows
          ctx.fillStyle = "rgba(251,250,245,0.5)";
          const wins = Math.max(1, Math.floor(h / 22));
          for (let k = 0; k < wins; k++) ctx.fillRect(x + 4, y + 10 + k * 20, w - 8, 5);
          if (lot.hot > 0.03) {
            ctx.strokeStyle = `rgba(255,61,0,${lot.hot})`;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
          }
        }
      }
      // regression surface sweeping through
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const nx = i / 80;
        const x = nx * W;
        const y = surfY(nx);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#1F3BFF"; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = "rgba(31,59,255,0.07)"; ctx.fill();
      // data points drifting above surface
      ctx.fillStyle = "#141310";
      for (let i = 0; i < 26; i++) {
        const nx = (i / 26 + t * 0.02) % 1;
        const y = surfY(nx) - 8 - ((i * 37) % 40);
        ctx.globalAlpha = 0.75;
        ctx.fillRect(nx * W, y, 3.4, 3.4);
      }
      ctx.globalAlpha = 1;
      if (capRef.current && hov >= 0) {
        const lot = lots[hov];
        capRef.current.innerHTML = `<b>LOT ${String(hov + 1).padStart(2, "0")}</b><span>FEATURE MIX ${(lot.v).toFixed(2)} → SURFACE FIT · ${Math.abs(0.5 - lot.v) < 0.12 ? "ON MODEL" : "RESIDUAL"}</span>`;
      } else if (capRef.current) {
        capRef.current.innerHTML = `<b>DATA → MODEL → PREDICTION</b><span>HOVER A DWELLING · SURFACE = FITTED FUNCTION</span>`;
      }
      if (reduced) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-label="Procedural housing field: dwellings with a live regression surface. Hover to inspect lots." />
      <div ref={capRef} className="scene-cap" aria-live="polite">
        <b>DATA → MODEL → PREDICTION</b>
      </div>
    </>
  );
}

/* ---------------- SONAR: signal classification field ---------------- */
function SonarScene() {
  const ref = useRef<HTMLCanvasElement>(null);
  const capRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, t = 0, visible = true, last = performance.now();
    let mx = 0.7, my = 0.5, ping = 0;
    const N = mobile ? 60 : 110;
    type Blip = { a: number; r: number; cls: 0 | 1; tw: number };
    let blips: Blip[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      blips = Array.from({ length: N }, (_, i) => ({
        a: Math.random() * Math.PI * 2,
        r: 40 + Math.random() * (Math.min(W, H) * 0.48),
        cls: (Math.sin(i * 3.3) > 0.1 ? 1 : 0) as 0 | 1,
        tw: Math.random() * Math.PI * 2,
      }));
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) ping = 1;
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    io.observe(canvas);
    resize();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const energy = clamp(Math.abs(scrollStore.velocity) * 5 + pointerStore.speed * 0.8, 0, 1.4);
      t += dt * (0.9 + energy * 2.2);
      ping = Math.max(0, ping - dt * 1.4);

      ctx.fillStyle = "#0B0E11"; ctx.fillRect(0, 0, W, H);
      const ex = W * 0.22, ey = H * 0.5;

      // range rings
      ctx.strokeStyle = "rgba(236,233,223,0.12)";
      for (let i = 1; i <= 5; i++) {
        ctx.beginPath(); ctx.arc(ex, ey, i * 52, 0, Math.PI * 2); ctx.stroke();
      }
      // sweeping beam
      const sweep = t * 1.4;
      ctx.save();
      ctx.translate(ex, ey); ctx.rotate(sweep);
      const beam = ctx.createLinearGradient(0, 0, Math.min(W, 420), 0);
      beam.addColorStop(0, "rgba(255,61,0,0.5)");
      beam.addColorStop(1, "rgba(255,61,0,0)");
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Math.min(W, 430), -0.16, 0.16); ctx.closePath(); ctx.fill();
      ctx.restore();

      // expanding ping wavefronts
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.5 + k / 3) % 1);
        ctx.strokeStyle = `rgba(236,233,223,${0.28 * (1 - ph)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(ex, ey, 20 + ph * 320, 0, Math.PI * 2); ctx.stroke();
      }
      if (ping > 0) {
        ctx.strokeStyle = `rgba(255,61,0,${ping})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(mx * W, my * H, (1 - ping) * 160 + 12, 0, Math.PI * 2); ctx.stroke();
      }

      // decision boundary — breathing curve
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const yy = (i / 90) * H;
        const xx = W * 0.58 + Math.sin(yy * 0.02 + t * 0.9) * (16 + energy * 26) + Math.sin(t * 0.5) * 8;
        i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.strokeStyle = "rgba(31,90,255,0.85)"; ctx.lineWidth = 1.6; ctx.setLineDash([7, 6]); ctx.stroke(); ctx.setLineDash([]);

      // blips: rock (ivory) vs mine (vermillion), jittered by noise near cursor
      let mines = 0;
      for (const b of blips) {
        b.a += dt * (0.12 + energy * 0.35) * (b.cls ? 1 : -0.7);
        const jitter = Math.sin(t * 3 + b.tw) * (3 + energy * 9);
        const x = ex + Math.cos(b.a) * (b.r + jitter);
        const y = ey + Math.sin(b.a) * (b.r * 0.72 + jitter);
        const dx = x - mx * W, dy = y - my * H;
        const excite = clamp(1 - Math.hypot(dx, dy) / 170, 0, 1);
        const s = 2.4 + excite * 3.4 + Math.sin(t * 4 + b.tw) * 0.8;
        if (b.cls === 1) mines++;
        ctx.fillStyle = b.cls === 1 ? "#FF3D00" : "rgba(236,233,223,0.9)";
        ctx.globalAlpha = b.cls === 1 ? 0.95 : 0.55 + excite * 0.4;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
        if (excite > 0.55) {
          ctx.strokeStyle = b.cls === 1 ? "rgba(255,61,0,0.7)" : "rgba(236,233,223,0.5)";
          ctx.beginPath(); ctx.arc(x, y, s + 6, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // emitter
      ctx.fillStyle = "#ECE9DF";
      ctx.beginPath(); ctx.arc(ex, ey, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FF3D00";
      ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();

      // waveform strip at bottom — raw signal
      ctx.strokeStyle = "rgba(236,233,223,0.65)"; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const x = (i / 120) * W;
        const y = H - 26 + Math.sin(i * 0.32 + t * 5) * 7 * Math.sin(i * 0.05 + t) + Math.sin(i * 1.1 - t * 7) * 2.5 * (0.4 + energy);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (capRef.current)
        capRef.current.innerHTML = `<b>SIGNAL → FEATURES → CLASS</b><span>CONTACTS ${N} · MINES ${mines} · CLICK TO PING · NOISE ${(energy).toFixed(2)}</span>`;
      if (reduced) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={ref} aria-label="Sonar classification field: sweeping beam with rock and mine contacts. Click to ping." />
      <div ref={capRef} className="scene-cap" aria-live="polite">
        <b>SIGNAL → FEATURES → CLASS</b>
      </div>
    </>
  );
}

/* tilt hook for scenes + ghost title parallax */
function useSceneTilt() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const handlers = refs.current.map((el) => {
      if (!el) return null;
      const proj = el.closest(".proj") as HTMLElement | null;
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1100px) rotateX(${(-ny * 5).toFixed(2)}deg) rotateY(${(nx * 7).toFixed(2)}deg) translateZ(0)`;
        proj?.style.setProperty("--px", nx.toFixed(3));
        proj?.style.setProperty("--py", ny.toFixed(3));
      };
      const onLeave = () => {
        el.style.transform = "perspective(1100px)";
        proj?.style.setProperty("--px", "0");
        proj?.style.setProperty("--py", "0");
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => handlers.forEach((h) => h?.());
  }, []);
  return refs;
}

export default function Projects() {
  const tiltRefs = useSceneTilt();
  return (
    <section className="wrap" id="work" aria-labelledby="work-h" style={{ paddingTop: "clamp(4.5rem,9vw,8.5rem)" }}>
      <div className="kicker reveal">
        <b>03</b> WORK — IMMERSIVE SCENES, NOT CARDS
      </div>
      <h2 className="h2 reveal" id="work-h">
        Two models, <em>two worlds.</em>
      </h2>
      <p className="lede reveal" style={{ marginTop: 14 }}>
        Each project is a living diagram of what it actually does. No invented
        metrics, no fake clients — just data, model, and the interaction
        between them.
      </p>

      {/* PROJECT 01 */}
      <article className="proj reveal" aria-labelledby="p1">
        <div className="proj-head">
          <span className="proj-index">P.01 / REGRESSION</span>
          <h3 className="proj-title" id="p1">
            <span className="layer">HOUSE PRICE</span>
            <span className="layer">PREDICTION</span>
            <span className="ghost" aria-hidden="true">HOUSE PRICE PREDICTION</span>
          </h3>
          <div className="proj-tags">
            <span>PYTHON</span><span>EDA</span><span>FEATURE ENG.</span><span>RANDOM FOREST</span><span>XGBOOST</span>
          </div>
        </div>
        <div className="proj-body">
          <div
            className="scene"
            ref={(el) => { tiltRefs.current[0] = el; }}
            data-cursor="view"
          >
            <HouseScene />
          </div>
          <div className="proj-copy">
            <div className="pipeline" aria-label="Pipeline: data to model to prediction">
              <b>DATA</b><i />→<b>MODEL</b><i />→<b>PREDICTION</b>
            </div>
            <p>
              Tabular housing data, explored and cleaned, then engineered into
              features a regressor can reason about. Linear Regression for the
              baseline, Random Forest and XGBoost for the non-linear structure.
            </p>
            <p style={{ color: "#6F6A5E", fontSize: ".92rem" }}>
              The scene: each dwelling is an observation. The cobalt surface is
              the fitted function moving through the data. Hover — residuals
              turn vermillion.
            </p>
            <p className="micro">STACK — PANDAS · NUMPY · SCIKIT-LEARN · XGBOOST · MATPLOTLIB</p>
            <a className="proj-cta magnetic" href="#contact" data-cursor="hover">
              DISCUSS THE APPROACH <span className="arr">→</span>
            </a>
          </div>
        </div>
      </article>

      {/* PROJECT 02 */}
      <article className="proj sonar reveal" id="sonar" aria-labelledby="p2">
        <div className="proj-head">
          <span className="proj-index">P.02 / CLASSIFICATION</span>
          <h3 className="proj-title" id="p2">
            <span className="layer">ROCK vs MINE</span>
            <span className="layer">SONAR SIGNAL</span>
            <span className="ghost" aria-hidden="true">ROCK vs MINE SONAR SIGNAL</span>
          </h3>
          <div className="proj-tags">
            <span>SONAR DATA</span><span>PREPROCESSING</span><span>SUPERVISED</span><span>SCIKIT-LEARN</span>
          </div>
        </div>
        <div className="proj-body">
          <div className="proj-copy">
            <div className="pipeline" aria-label="Pipeline: signal to features to classification">
              <b>SIGNAL</b><i />→<b>FEATURES</b><i />→<b>CLASS</b>
            </div>
            <p>
              Frequency-domain sonar returns, classified as rock or mine.
              Preprocessing and supervised learning on a classic binary dataset —
              the kind of problem where listening carefully beats guessing.
            </p>
            <p style={{ color: "#9AA3AB", fontSize: ".92rem" }}>
              The scene: a live sweep. Ivory contacts read as rock, vermillion
              as mine, split by a breathing decision boundary. Move to inject
              noise. Click to ping.
            </p>
            <p className="micro" style={{ color: "#9AA3AB" }}>BINARY CLASSIFICATION · EVALUATED, NOT EXAGGERATED</p>
            <a className="proj-cta magnetic" href="#contact" data-cursor="hover">
              ASK ABOUT THE PIPELINE <span className="arr">→</span>
            </a>
          </div>
          <div
            className="scene"
            ref={(el) => { tiltRefs.current[1] = el; }}
            data-cursor="view"
          >
            <SonarScene />
          </div>
        </div>
      </article>
    </section>
  );
}
