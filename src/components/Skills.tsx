import { useRef, useState } from "react";

type Discipline = {
  id: string;
  label: string;
  short: string;
  x: number;
  y: number;
  color: string;
  tech: string[];
  note: string;
};

const NODES: Discipline[] = [
  {
    id: "ml",
    label: "MACHINE LEARNING",
    short: "ML",
    x: 400,
    y: 62,
    color: "#1F3BFF",
    tech: ["Scikit-learn", "XGBoost", "Random Forest", "Regression", "Classification", "Model Evaluation"],
    note: "Supervised learning end-to-end: preprocessing → training → evaluation.",
  },
  {
    id: "frontend",
    label: "FRONTEND",
    short: "FE",
    x: 640,
    y: 160,
    color: "#FF3D00",
    tech: ["HTML", "CSS", "JavaScript", "React"],
    note: "Interfaces with physicality — layout, motion and interaction systems.",
  },
  {
    id: "data",
    label: "DATA SCIENCE",
    short: "DA",
    x: 640,
    y: 330,
    color: "#1E4D3B",
    tech: ["Pandas", "NumPy", "Matplotlib", "EDA", "Data Preprocessing", "Feature Engineering"],
    note: "Exploration before modelling — cleaning, features, visual reasoning.",
  },
  {
    id: "prog",
    label: "PROGRAMMING",
    short: "PG",
    x: 400,
    y: 412,
    color: "#141310",
    tech: ["Python", "C++", "JavaScript", "Java"],
    note: "Four languages, one habit: precise, readable, tested code.",
  },
  {
    id: "tools",
    label: "TOOLS",
    short: "TL",
    x: 160,
    y: 330,
    color: "#6F6A5E",
    tech: ["Git", "GitHub", "VS Code", "Jupyter Notebook"],
    note: "The bench: versioned, reproducible, notebook-to-production.",
  },
  {
    id: "core",
    label: "CORE CS",
    short: "CS",
    x: 160,
    y: 160,
    color: "#1226B8",
    tech: ["Data Structures & Algorithms", "OOP", "DBMS", "Operating Systems"],
    note: "Foundations that make the experiments hold up.",
  },
];

export default function Skills() {
  const [active, setActive] = useState<Discipline>(NODES[0]);
  const stageRef = useRef<HTMLDivElement>(null);

  const tilt = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    const svg = el.querySelector("svg");
    if (svg)
      svg.style.transform = `perspective(1200px) rotateX(${(-ny * 4).toFixed(2)}deg) rotateY(${(nx * 6).toFixed(2)}deg)`;
  };
  const untilt = () => {
    const svg = stageRef.current?.querySelector("svg");
    if (svg) svg.style.transform = "perspective(1200px)";
  };

  return (
    <section className="sec wrap" id="stack" aria-labelledby="stack-h">
      <div className="kicker reveal">
        <b>02</b> STACK — AN ECOSYSTEM, NOT A LIST
      </div>
      <h2 className="h2 reveal" id="stack-h">
        One mind, <em>six orbits.</em>
      </h2>
      <p className="lede reveal" style={{ marginTop: 14 }}>
        Hover or tap a node. Related technologies surface — because no skill
        lives alone. Everything here is real, from my resume. Nothing invented.
      </p>

      <div
        className="skills-stage reveal"
        ref={stageRef}
        onPointerMove={tilt}
        onPointerLeave={untilt}
      >
        <svg
          className="skills-svg"
          viewBox="0 0 800 470"
          role="group"
          aria-label="Interactive skill ecosystem around Swarnim"
          style={{ transition: "transform .4s cubic-bezier(.16,1,.3,1)" }}
        >
          <defs>
            <radialGradient id="coreg" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#2A2822" />
              <stop offset="100%" stopColor="#141310" />
            </radialGradient>
          </defs>
          {NODES.map((n) => {
            const isActive = active.id === n.id;
            return (
              <g key={n.id}>
                <line
                  x1={400}
                  y1={235}
                  x2={n.x}
                  y2={n.y}
                  stroke={isActive ? n.color : "rgba(20,19,16,0.22)"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "none" : "5 5"}
                  style={{ transition: "stroke .3s" }}
                />
                {/* faint orbit ring */}
                <circle cx={400} cy={235} r={Math.hypot(n.x - 400, n.y - 235)} fill="none" stroke="rgba(20,19,16,0.07)" />
              </g>
            );
          })}
          {/* center */}
          <g>
            <circle cx={400} cy={235} r={64} fill="url(#coreg)" />
            <circle cx={400} cy={235} r={64} fill="none" stroke="#FF3D00" strokeWidth={1.5} strokeDasharray="4 6" />
            <text x={400} y={230} textAnchor="middle" fill="#F2EFE6" fontSize={17} fontWeight={700} letterSpacing={1}>
              SWARNIM
            </text>
            <text x={400} y={249} textAnchor="middle" fill="#A39D8D" fontSize={9} letterSpacing={3}>
              SYSTEM · CORE
            </text>
          </g>
          {NODES.map((n) => {
            const isActive = active.id === n.id;
            return (
              <g
                key={n.id}
                className={`skill-node ${isActive ? "active" : ""}`}
                transform={`translate(${n.x},${n.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${n.label}: ${n.tech.join(", ")}`}
                aria-pressed={isActive}
                onMouseEnter={() => setActive(n)}
                onFocus={() => setActive(n)}
                onClick={() => setActive(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(n);
                  }
                }}
                style={{ outline: "none" }}
              >
                <circle className="halo" r={44} fill="none" stroke={n.color} strokeWidth={1} strokeDasharray="3 5" />
                <circle
                  className="core"
                  r={isActive ? 32 : 26}
                  fill={isActive ? n.color : "#FBFAF5"}
                  stroke={n.color}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dy={5}
                  fontSize={13}
                  fontWeight={700}
                  fill={isActive ? "#fff" : n.color}
                >
                  {n.short}
                </text>
                <text textAnchor="middle" dy={52} fontSize={9.5} fill="#141310" fontWeight={500}>
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="skill-detail" aria-live="polite">
          <div>
            <div className="micro" style={{ color: NODES.find((n) => n.id === active.id)?.color }}>
              {active.label} — ACTIVE ORBIT
            </div>
            <p style={{ margin: "10px 0 0", fontSize: "1.02rem", color: "#2A2822" }}>{active.note}</p>
          </div>
          <div>
            <div className="micro">RELATED TECHNOLOGIES</div>
            <div className="chips">
              {active.tech.map((t) => (
                <span className="chip" key={t}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="micro reveal" style={{ marginTop: 14 }}>
        DEEP LEARNING — TENSORFLOW · KERAS (LEARNING IN PROGRESS, VIA GÉRON + STANFORD ML SPECIALIZATION)
      </div>
    </section>
  );
}
