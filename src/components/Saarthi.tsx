import { useEffect, useRef, useState } from "react";
import { clamp } from "../lib/core";

/* ============================================================
   SAARTHI — featured project chapter (compact, not a microsite)
   ONE living system map + slideable depth (overview/features/
   pipeline/data/stack). Surface: visual + short copy. Depth: tabs.
   ============================================================ */

type SysNode = {
  id: string;
  label: string;
  cap: string;
  detail: string;
  color: string;
  x: number;
  y: number;
  r: number;
  kind: "climate" | "core" | "flow" | "out";
};

const NODES: SysNode[] = [
  { id: "enso", label: "ENSO", cap: "Climate signal", detail: "Large-scale Pacific oscillation, tracked as season-scale monsoon context.", color: "#4DA3FF", x: 140, y: 108, r: 11, kind: "climate" },
  { id: "iod", label: "IOD", cap: "Indian Ocean Dipole", detail: "Indian Ocean gradient, tracked for monsoon-season influence.", color: "#3DDC84", x: 78, y: 240, r: 11, kind: "climate" },
  { id: "mjo", label: "MJO", cap: "Intraseasonal atmospheric pulse", detail: "Fast-moving tropical pulse, tracked for active / break phase timing.", color: "#FFB300", x: 140, y: 372, r: 11, kind: "climate" },
  { id: "core", label: "SAARTHI", cap: "Integration core", detail: "Where signals, forecasts and context resolve into one local picture.", color: "#EDE9DC", x: 320, y: 240, r: 24, kind: "core" },
  { id: "forecast", label: "FORECAST", cap: "Operational forecast layer", detail: "ECMWF IFS via Open-Meteo — the 16-day operational outlook.", color: "#4DA3FF", x: 472, y: 108, r: 13, kind: "flow" },
  { id: "rainfall", label: "RAINFALL", cap: "Historical + forecast rainfall", detail: "CHIRPS history joined to CHIRPS-GEFS forecast context.", color: "#4DA3FF", x: 566, y: 190, r: 13, kind: "flow" },
  { id: "soil", label: "SOIL", cap: "Environmental context", detail: "SoilGrids layers — the ground truth beneath the forecast.", color: "#3DDC84", x: 566, y: 296, r: 13, kind: "flow" },
  { id: "ml", label: "ML", cap: "ML / analytics layer", detail: "Predictive and probabilistic modeling over aligned features.", color: "#FFB300", x: 472, y: 378, r: 13, kind: "flow" },
  { id: "risk", label: "RISK", cap: "Agricultural impact layer", detail: "Information priced into agricultural risk — crop, timing, exposure.", color: "#FF5A3C", x: 672, y: 168, r: 13, kind: "out" },
  { id: "advisory", label: "ADVISORY", cap: "Actionable insight", detail: "One plain-language next action for the field.", color: "#EDE9DC", x: 672, y: 322, r: 13, kind: "out" },
];

const LINKS: [string, string][] = [
  ["enso", "core"],
  ["iod", "core"],
  ["mjo", "core"],
  ["core", "forecast"],
  ["forecast", "rainfall"],
  ["rainfall", "soil"],
  ["soil", "ml"],
  ["ml", "risk"],
  ["risk", "advisory"],
];

const nodeById = (id: string) => NODES.find((n) => n.id === id)!;

function linkPath(a: SysNode, b: SysNode) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const bend = Math.min(46, len * 0.22);
  return `M ${a.x} ${a.y} Q ${mx - (dy / len) * bend} ${my + (dx / len) * bend} ${b.x} ${b.y}`;
}

/* ---------------- living system map (SVG, cursor-reactive) ---------------- */
function SystemMap({
  emph,
  flowBoost,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  emph: string[];
  flowBoost: boolean;
  hovered: string | null;
  selected: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRefs = useRef<(SVGGElement | null)[]>([]);
  const cursor = useRef({ x: 0.5, y: 0.5, active: false });
  const off = useRef(NODES.map(() => ({ x: 0, y: 0 })));
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) return;
    const svg = svgRef.current!;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    io.observe(svg);
    const toLocal = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / Math.max(1, r.width)) * 760,
        y: ((e.clientY - r.top) / Math.max(1, r.height)) * 480,
        inside:
          e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom,
      };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      cursor.current = { x: p.x, y: p.y, active: p.inside };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const c = cursor.current;
      let settling = true;
      NODES.forEach((n, i) => {
        const o = off.current[i];
        const dx = n.x - c.x;
        const dy = n.y - c.y;
        const d = Math.max(30, Math.hypot(dx, dy));
        const pull = c.active ? clamp(1 - d / 260, 0, 1) : 0;
        const tx = (dx / d) * pull * 7 + ((n.x - c.x) / 760) * pull * 4;
        const ty = (dy / d) * pull * 7;
        // drift gently toward cursor attention, never far
        const k = 1 - Math.exp(-6 * 0.016);
        o.x += (clamp(tx, -7, 7) - o.x) * k;
        o.y += (clamp(ty, -7, 7) - o.y) * k;
        if (Math.abs(o.x) > 0.05 || Math.abs(o.y) > 0.05 || pull > 0) settling = false;
        const g = gRefs.current[i];
        if (g) g.setAttribute("transform", `translate(${(n.x + o.x).toFixed(2)},${(n.y + o.y).toFixed(2)})`);
      });
      void settling;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, [reduced]);

  const dimmed = (id: string) => emph.length > 0 && !emph.includes(id);
  const activeId = hovered ?? selected;

  return (
    <svg
      ref={svgRef}
      className="s-map"
      viewBox="0 0 760 480"
      role="group"
      aria-label="Interactive Saarthi system map. Hover or focus a node, click to inspect it."
      data-flow={flowBoost ? "fast" : "calm"}
    >
      {/* atmosphere: orbit rings + contours */}
      <g className="s-atmos" aria-hidden="true">
        <ellipse cx={320} cy={240} rx={210} ry={150} className="s-orbit o1" />
        <ellipse cx={320} cy={240} rx={290} ry={205} className="s-orbit o2" />
        <path d="M 40 420 Q 200 380 330 410 T 720 390" className="s-contour" />
        <path d="M 30 90 Q 220 120 420 80 T 730 110" className="s-contour" />
      </g>
      {/* links */}
      <g aria-hidden="true">
        {LINKS.map(([a, b]) => {
          const hot = activeId === a || activeId === b;
          const dim = emph.length > 0 && !(emph.includes(a) && emph.includes(b)) && !hot;
          return (
            <path
              key={`${a}-${b}`}
              d={linkPath(nodeById(a), nodeById(b))}
              className={`s-link ${hot ? "hot" : ""} ${dim ? "dim" : ""}`}
              stroke={nodeById(b).color}
            />
          );
        })}
      </g>
      {/* flow particles */}
      {!reduced && (
        <g aria-hidden="true" className="s-particles">
          {LINKS.map(([a, b], i) => (
            <circle key={`${a}-${b}`} r={2.4} fill={nodeById(b).color} className="s-dot">
              <animateMotion dur={`${(4.5 + (i % 4)).toFixed(1)}s`} repeatCount="indefinite" path={linkPath(nodeById(a), nodeById(b))} />
            </circle>
          ))}
        </g>
      )}
      {/* nodes */}
      {NODES.map((n, i) => (
        <g
          key={n.id}
          ref={(el) => {
            gRefs.current[i] = el;
          }}
          transform={`translate(${n.x},${n.y})`}
          className={`s-n ${n.kind} ${dimmed(n.id) ? "dim" : ""} ${activeId === n.id ? "hot" : ""} ${selected === n.id ? "sel" : ""}`}
          tabIndex={0}
          role="button"
          aria-pressed={selected === n.id}
          aria-label={`${n.label}: ${n.cap}. ${n.detail}`}
          data-cursor={n.kind === "climate" ? "trace" : "inspect"}
          onMouseEnter={() => onHover(n.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(n.id)}
          onBlur={() => onHover(null)}
          onClick={() => onSelect(n.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(n.id);
            }
          }}
        >
          <circle r={n.r + 7} className="s-nhalo" style={{ ["--nc" as string]: n.color }} />
          <circle r={n.r} className="s-ncore" style={{ ["--nc" as string]: n.color }} />
          <text y={n.r + 18} textAnchor="middle" className="s-nlabel">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------- slide data ---------------- */
type SlideId = "overview" | "features" | "pipeline" | "data" | "stack";
const SLIDES: { id: SlideId; label: string }[] = [
  { id: "overview", label: "OVERVIEW" },
  { id: "features", label: "FEATURES" },
  { id: "pipeline", label: "PIPELINE" },
  { id: "data", label: "DATA" },
  { id: "stack", label: "STACK" },
];

const HIGHLIGHTS = ["16-DAY WEATHER FORECAST", "CLIMATE INTELLIGENCE", "RISK ANALYSIS", "CROP INTELLIGENCE", "FARMER-FOCUSED INSIGHTS"];

const FEATURES = [
  { id: "f16", label: "16-Day Forecasting", line: "ECMWF IFS via Open-Meteo, downscaled into a rolling 16-day outlook.", nodes: ["forecast", "rainfall"] },
  { id: "portal", label: "Farmer Portal", line: "Low-jargon home for weather, risk and advisories — action first.", nodes: ["advisory"] },
  { id: "riskmap", label: "Risk Map", line: "Localized risk view where exposure, timing and crop meet.", nodes: ["risk", "ml"] },
  { id: "crop", label: "CropAtlas", line: "Crop suitability read against soil and climate context.", nodes: ["soil", "risk"] },
  { id: "clim", label: "Climate Intelligence", line: "ENSO / IOD / MJO watched as season-scale context.", nodes: ["enso", "iod", "mjo"] },
  { id: "soil", label: "Soil Analysis", line: "SoilGrids layers joined to the local picture.", nodes: ["soil", "rainfall"] },
  { id: "policy", label: "Policy Alerts", line: "Scheme and advisory alerts where farmers already look.", nodes: ["advisory"] },
  { id: "ai", label: "AI Advisories", line: "Layers collapse into one plain-language next action.", nodes: ["ml", "advisory"] },
];

const STAGES = [
  { id: "data", label: "DATA", line: "Rainfall, forecast, soil and climate feeds land in one place.", nodes: ["rainfall", "forecast", "soil", "enso"] },
  { id: "proc", label: "PROCESSING", line: "Cleaning, alignment and feature preparation across sources.", nodes: ["rainfall", "soil"] },
  { id: "anal", label: "ANALYSIS", line: "Forecast plus historical context — what is normal, what is not.", nodes: ["forecast", "rainfall"] },
  { id: "ml", label: "ML", line: "Predictive and probabilistic modeling over aligned features.", nodes: ["ml"] },
  { id: "out", label: "OUTPUT", line: "Risk, crop and advisory intelligence.", nodes: ["risk", "advisory"] },
  { id: "ui", label: "INTERFACE", line: "Farmer-facing visualization of everything above.", nodes: ["advisory", "core"] },
];

const DATASETS = [
  { id: "chirps", label: "CHIRPS", line: "Historical rainfall observations.", nodes: ["rainfall"] },
  { id: "gefs", label: "CHIRPS-GEFS", line: "Forecast rainfall and historical forecast context.", nodes: ["rainfall", "forecast"] },
  { id: "soil", label: "SoilGrids", line: "Soil and environmental context.", nodes: ["soil"] },
  { id: "enso", label: "ENSO", line: "Large-scale climate signal.", nodes: ["enso"] },
  { id: "iod", label: "IOD", line: "Indian Ocean climate signal.", nodes: ["iod"] },
  { id: "mjo", label: "MJO", line: "Intraseasonal atmospheric variability.", nodes: ["mjo"] },
  { id: "ecmwf", label: "ECMWF IFS / Open-Meteo", line: "Operational weather forecast layer.", nodes: ["forecast"] },
];

const ARCH = [
  { id: "sources", label: "DATA SOURCES", nodes: ["rainfall", "forecast", "soil", "enso"] },
  { id: "feat", label: "DATA / FEATURE LAYER", nodes: ["rainfall", "soil"] },
  { id: "anal", label: "FORECAST + ANALYTICS", nodes: ["forecast", "ml"] },
  { id: "back", label: "SPRING BOOT BACKEND", nodes: ["core"] },
  { id: "api", label: "REST API", nodes: ["core", "advisory"] },
  { id: "front", label: "FRONTEND", nodes: ["advisory"] },
  { id: "user", label: "FARMER / USER", nodes: ["advisory", "risk"] },
];

/* ---------------- section ---------------- */
export default function Saarthi() {
  const [slide, setSlide] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [emph, setEmph] = useState<string[]>([]);
  const [feat, setFeat] = useState(FEATURES[0]);
  const [stage, setStage] = useState(STAGES[0]);
  const [arch, setArch] = useState<string | null>(null);
  const [ds, setDs] = useState<string | null>(null);
  const drag = useRef<{ start: number; x: number; id: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const go = (i: number) => {
    const n = SLIDES.length;
    setSlide(((i % n) + n) % n);
    setEmph([]);
    setDragX(0);
  };

  const vizEmph = (() => {
    if (emph.length) return emph;
    const id = SLIDES[slide].id;
    if (id === "features") return feat.nodes;
    if (id === "pipeline") return stage.nodes;
    if (id === "data") {
      const d = DATASETS.find((x) => x.id === ds);
      return d ? d.nodes : ["rainfall", "forecast", "soil", "enso", "iod", "mjo"];
    }
    if (id === "stack") {
      const a = ARCH.find((x) => x.id === arch);
      return a ? a.nodes : ["core"];
    }
    return [];
  })();

  const flowBoost = SLIDES[slide].id === "pipeline";
  const activeNode = hovered ? nodeById(hovered) : selected ? nodeById(selected) : null;

  const selectNode = (id: string) => {
    setSelected(id);
    setEmph([id]);
  };

  /* drag / swipe */
  const onDown = (e: React.PointerEvent) => {
    drag.current = { start: e.clientX, x: dragX, id: e.pointerId };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.start;
    setDragX(clamp(dx, -140, 140));
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    const dx = e.clientX - d.start;
    if (dx < -60) go(slide + 1);
    else if (dx > 60) go(slide - 1);
    else setDragX(0);
  };
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(slide + 1);
    if (e.key === "ArrowLeft") go(slide - 1);
  };

  return (
    <section className="saarthi" id="saarthi" aria-labelledby="saarthi-h">
      <div className="wrap">
        <div className="kicker reveal">
          <b>04</b> FEATURED PROJECT / 01
        </div>
        <h2 className="s-title reveal" id="saarthi-h">
          SAARTHI
        </h2>
        <p className="s-tag reveal">Hyperlocal agricultural intelligence.</p>
        <div className="s-intro reveal">
          <p className="s-desc">
            Saarthi combines weather forecasting, rainfall analysis, soil and environmental
            context, climate signals and agricultural intelligence into a localized
            decision-support system — turning environmental signals into agricultural
            intelligence.
          </p>
          <div className="s-meta" aria-label="Saarthi at a glance">
            <span className="hot">16-DAY FORECAST</span>
            <span>JAVA · SPRING BOOT</span>
            <span>REST APIS</span>
            <span>ML / DATA ANALYTICS</span>
          </div>
        </div>

        <div className="s-grid">
          {/* visualization */}
          <div className="s-viz reveal">
            <div className="s-viz-head">
              <span>SYSTEM MAP — HOVER · CLICK TO INSPECT</span>
              <b>{activeNode ? activeNode.label : "LIVE"}</b>
            </div>
            <SystemMap
              emph={vizEmph}
              flowBoost={flowBoost}
              hovered={hovered}
              selected={selected}
              onHover={setHovered}
              onSelect={selectNode}
            />
            <p className="s-vizline" aria-live="polite">
              {activeNode ? (
                <>
                  <strong>{activeNode.label} — {activeNode.cap.toUpperCase()}</strong>
                  <br />
                  {activeNode.detail}
                </>
              ) : (
                <>
                  <strong>CLIMATE → FORECAST → RISK → ADVISORY</strong>
                  <br />
                  Signals feed the core; the core feeds forecast, context and models; models
                  resolve into risk and one clear advisory.
                </>
              )}
            </p>
            <div className="s-vizfoot">
              <span>SCHEMATIC — NOT TO SCALE</span>
              <span>VALUES ILLUSTRATIVE</span>
            </div>
          </div>

          {/* slideable depth */}
          <div className="s-panel reveal">
            <div className="s-tabs" role="tablist" aria-label="Saarthi case study slides" onKeyDown={onTabKey}>
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={slide === i}
                  className={`s-tab ${slide === i ? "active" : ""}`}
                  data-cursor="hover"
                  onClick={() => go(i)}
                  tabIndex={slide === i ? 0 : -1}
                >
                  0{i + 1} {s.label}
                </button>
              ))}
            </div>
            <div
              className="s-view"
              ref={viewportRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div className={`s-panes ${dragging ? "dragging" : ""}`}>
                {/* 01 overview */}
                <div className={`s-pane ${slide === 0 ? "active" : ""}`} role="tabpanel" aria-label="Overview" style={slide === 0 && dragging ? { transform: `translateX(${dragX}px)` } : undefined}>
                  <h3>
                    The system, <em>in one breath.</em>
                  </h3>
                  <p>
                    An integrated system for translating weather, rainfall, soil,
                    environmental and climate information into localized agricultural
                    insights.
                  </p>
                  <div style={{ marginTop: 14 }}>
                    {HIGHLIGHTS.map((h) => (
                      <div className="s-hl" key={h}>
                        <i /> {h}
                      </div>
                    ))}
                  </div>
                </div>
                {/* 02 features */}
                <div className={`s-pane ${slide === 1 ? "active" : ""}`} role="tabpanel" aria-label="Features" style={slide === 1 && dragging ? { transform: `translateX(${dragX}px)` } : undefined}>
                  <h3>
                    Eight capabilities, <em>one surface.</em>
                  </h3>
                  <p>Select a capability — the system map retunes around it.</p>
                  <div className="s-rail">
                    {FEATURES.map((f, i) => (
                      <button
                        key={f.id}
                        className={`s-chipbtn ${feat.id === f.id ? "active" : ""}`}
                        data-cursor="explore"
                        onMouseEnter={() => { setFeat(f); setEmph(f.nodes); }}
                        onFocus={() => { setFeat(f); setEmph(f.nodes); }}
                        onClick={() => { setFeat(f); setEmph(f.nodes); }}
                      >
                        <span className="idx">0{i + 1}</span>
                        {f.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <p className="s-lineout" aria-live="polite">
                    <strong>{feat.label.toUpperCase()}</strong>
                    <br />
                    {feat.line}
                  </p>
                </div>
                {/* 03 pipeline */}
                <div className={`s-pane ${slide === 2 ? "active" : ""}`} role="tabpanel" aria-label="Pipeline" style={slide === 2 && dragging ? { transform: `translateX(${dragX}px)` } : undefined}>
                  <h3>
                    From feeds <em>to fields.</em>
                  </h3>
                  <p>Each stage is clickable — watch the flow respond.</p>
                  <div className="s-rows">
                    {STAGES.map((s, i) => (
                      <button
                        key={s.id}
                        className={`s-row ${stage.id === s.id ? "active" : ""}`}
                        data-cursor="explore"
                        onMouseEnter={() => { setStage(s); setEmph(s.nodes); }}
                        onFocus={() => { setStage(s); setEmph(s.nodes); }}
                        onClick={() => { setStage(s); setEmph(s.nodes); }}
                      >
                        <b>0{i + 1} — {s.label}</b>
                        <span>{s.id === stage.id ? s.line : ""}</span>
                      </button>
                    ))}
                  </div>
                  <p className="s-lineout" aria-live="polite">
                    <strong>{stage.label}</strong>
                    <br />
                    {stage.line}
                  </p>
                </div>
                {/* 04 data */}
                <div className={`s-pane ${slide === 3 ? "active" : ""}`} role="tabpanel" aria-label="Data" style={slide === 3 && dragging ? { transform: `translateX(${dragX}px)` } : undefined}>
                  <h3>
                    Real datasets, <em>no mystique.</em>
                  </h3>
                  <p>Hover a source to see where it enters the system.</p>
                  <div className="s-rows">
                    {DATASETS.map((d) => (
                      <button
                        key={d.id}
                        className={`s-row ${ds === d.id ? "active" : ""}`}
                        data-cursor="explore"
                        onMouseEnter={() => { setDs(d.id); setEmph(d.nodes); }}
                        onFocus={() => { setDs(d.id); setEmph(d.nodes); }}
                        onClick={() => { setDs(d.id); setEmph(d.nodes); }}
                      >
                        <b>{d.label}</b>
                        <span>{d.line}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* 05 stack */}
                <div className={`s-pane ${slide === 4 ? "active" : ""}`} role="tabpanel" aria-label="Stack" style={slide === 4 && dragging ? { transform: `translateX(${dragX}px)` } : undefined}>
                  <h3>
                    The machine <em>room.</em>
                  </h3>
                  <p>Hover a layer — the corresponding system nodes light up.</p>
                  <div className="s-arch">
                    {ARCH.map((a) => (
                      <button
                        key={a.id}
                        className={`s-alayer ${arch === a.id ? "active" : ""}`}
                        data-cursor="explore"
                        onMouseEnter={() => { setArch(a.id); setEmph(a.nodes); }}
                        onFocus={() => { setArch(a.id); setEmph(a.nodes); }}
                        onClick={() => { setArch(a.id); setEmph(a.nodes); }}
                      >
                        {a.label}
                        <small>HOVER → MAP</small>
                      </button>
                    ))}
                  </div>
                  <div className="s-stackchips" aria-label="Core technologies">
                    {["JAVA", "SPRING BOOT", "JAVASCRIPT", "HTML", "CSS", "REST"].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className="s-stackchips warm" aria-label="Data and ML tooling">
                    {["PYTHON", "SCIKIT-LEARN", "LIGHTGBM*", "DATA ANALYTICS", "GIT / GITHUB"].map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <p className="s-lineout">* LightGBM within modeling experiments.</p>
                </div>
              </div>
            </div>
            <div className="s-ctrl">
              <button className="s-arrow" onClick={() => go(slide - 1)} aria-label="Previous slide" data-cursor="hover">
                ←
              </button>
              <span className="s-count" aria-live="polite">
                <b>0{slide + 1}</b> / 05 — {SLIDES[slide].label}
              </span>
              <span className="s-bar" aria-hidden="true">
                <i style={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }} />
              </span>
              <button className="s-arrow" onClick={() => go(slide + 1)} aria-label="Next slide" data-cursor="hover">
                →
              </button>
            </div>
          </div>
        </div>

        {/* outcome */}
        <div className="s-outcome reveal">
          <div>
            <h3>
              What I <em>built.</em>
            </h3>
            <p>
              A unified agricultural intelligence interface combining forecasting,
              environmental context, climate intelligence, risk analysis, crop intelligence
              and farmer-facing insights — one system, from atmosphere to action.
            </p>
          </div>
          <a className="s-cta magnetic" href="#contact" data-cursor="open">
            ASK ABOUT SAARTHI <span className="arr">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}