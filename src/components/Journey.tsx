import { useEffect, useRef, useState } from "react";
import { clamp, scrollStore } from "../lib/core";

/* ---------- tiny lab canvases ---------- */
function LabCanvas({ mode }: { mode: "type" | "flow" | "bars" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, t = 0, visible = true, last = performance.now();
    let mx = 0.5, my = 0.5, inside = false;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height || 170;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) {
        mx = (e.clientX - r.left) / r.width;
        my = (e.clientY - r.top) / r.height;
      }
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    io.observe(canvas);
    resize();

    const dots = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), s: Math.random() * Math.PI * 2,
    }));

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) { last = now; return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt * (1 + clamp(Math.abs(scrollStore.velocity) * 6, 0, 1.5));
      ctx.fillStyle = "#F2EFE6"; ctx.fillRect(0, 0, W, H);

      if (mode === "type") {
        const word = "SIGNAL";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const n = word.length;
        for (let i = 0; i < n; i++) {
          const bx = W * ((i + 0.5) / n);
          const by = H / 2 + Math.sin(t * 1.4 + i * 0.8) * 10;
          const dx = bx - mx * W, dy = by - my * H;
          const d = Math.max(20, Math.hypot(dx, dy));
          const push = inside ? clamp(1 - d / 150, 0, 1) * 34 : 0;
          const x = bx + (dx / d) * push;
          const y = by + (dy / d) * push - push * 0.3;
          ctx.font = `${i === 3 ? "italic " : ""}${30 + push * 0.5}px ${i % 2 ? "'Newsreader', serif" : "'Space Grotesk', sans-serif"}`;
          ctx.fillStyle = push > 14 ? "#FF3D00" : "#141310";
          ctx.fillText(word[i], x, y);
        }
      } else if (mode === "flow") {
        for (const p of dots) {
          p.s += dt * 2;
          p.x += Math.cos(p.s + p.y * 6 + t * 0.6) * dt * 0.25;
          p.y += Math.sin(p.s * 1.3 + p.x * 5 - t * 0.5) * dt * 0.22;
          if (p.x < 0) p.x += 1; if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1; if (p.y > 1) p.y -= 1;
          const dx = p.x - mx, dy = p.y * (H / W) - my * (H / W);
          const excite = inside ? clamp(1 - Math.hypot(dx, dy) * 3.4, 0, 1) : 0;
          ctx.fillStyle = excite > 0.5 ? "#1F3BFF" : "#141310";
          ctx.globalAlpha = 0.35 + excite * 0.6;
          ctx.fillRect(p.x * W, p.y * H, 2.4 + excite * 3, 2.4 + excite * 3);
        }
        ctx.globalAlpha = 1;
      } else {
        const bars = 36;
        const bw = W / bars;
        for (let i = 0; i < bars; i++) {
          const e = clamp(Math.abs(scrollStore.velocity) * 7, 0, 1);
          const h = 8 + Math.abs(Math.sin(i * 0.55 + t * 3.2)) * (H * 0.32) * (0.35 + e) + (inside && Math.abs(i / bars - mx) < 0.06 ? 26 : 0);
          ctx.fillStyle = i / bars > 0.72 ? "#FF3D00" : i / bars > 0.4 ? "#1F3BFF" : "#141310";
          ctx.fillRect(i * bw + 2, H / 2 - h / 2, bw - 4, h);
        }
        ctx.fillStyle = "rgba(20,19,16,0.5)";
        ctx.font = "9px 'IBM Plex Mono', monospace";
        ctx.fillText(`SCROLL → ENERGY ${clamp(Math.abs(scrollStore.velocity) * 7, 0, 1).toFixed(2)}`, 8, H - 8);
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
  }, [mode]);
  return <canvas ref={ref} aria-hidden="true" />;
}

function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current as unknown as HTMLElement | null;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d < 120) {
        el.style.transform = `translate(${(dx * 0.18).toFixed(1)}px, ${(dy * 0.22).toFixed(1)}px)`;
      } else el.style.transform = "";
    };
    const onLeave = () => (el.style.transform = "");
    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return ref;
}

export function About() {
  return (
    <section className="sec wrap" id="about" aria-labelledby="about-h">
      <div className="about-grid">
        <div className="micro reveal">01<br />ABOUT</div>
        <div>
          <h2 className="h2 reveal" id="about-h">
            Entering the <em>system.</em>
          </h2>
          <div className="about-tri reveal" aria-label="Design times code times machine learning">
            DESIGN <span className="x">×</span> CODE <span className="x">×</span>{" "}
            <span className="soft">machine learning</span>
          </div>
          <p className="lede reveal">
            I&apos;m Swarnim Mane, a Computer Science undergraduate who treats
            design, frontend engineering and ML as one practice — input,
            process, output. This portfolio is built like I think: as an
            instrument you play, not a document you scroll past.
          </p>
          <div className="about-cols">
            <div className="fact reveal">
              <h3>FACT / IDENTITY</h3>
              <ul>
                <li><span>Swarnim Mane</span><span>IN</span></li>
                <li><span>CS Undergraduate</span><span>VIT-AP</span></li>
                <li><span>Bachelor of CS</span><span>2024 → 2028</span></li>
                <li><span>GPA</span><span>7.94 / 10</span></li>
              </ul>
            </div>
            <div className="fact reveal">
              <h3>OPERATING MODE</h3>
              <ul>
                <li><span>Design</span><span>EDITORIAL</span></li>
                <li><span>Build</span><span>REACT / TS</span></li>
                <li><span>Model</span><span>PYTHON ML</span></li>
                <li><span>Method</span><span>ITERATE</span></li>
              </ul>
            </div>
            <div className="fact reveal">
              <h3>SIGNAL / METHOD</h3>
              <p style={{ margin: 0, fontSize: ".94rem", color: "#2A2822" }}>
                Calm → tension → exploration → surprise → calm. Restraint first;
                effects only when they earn their place. If it doesn&apos;t
                serve the idea, it ships to /dev/null.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Lab() {
  return (
    <section className="sec wrap" id="lab" aria-labelledby="lab-h">
      <div className="kicker reveal">
        <b>04</b> LAB — EXPERIMENTS, HONESTLY LABELLED
      </div>
      <h2 className="h2 reveal" id="lab-h">
        Play is <em>research.</em>
      </h2>
      <div className="lab-grid reveal">
        <div className="lab-cell" data-cursor="drag">
          <span className="lab-kind">GENERATIVE STUDY — 001</span>
          <h3>Typographic repulsion field</h3>
          <LabCanvas mode="type" />
          <p>Letters with self-esteem issues. Approach and they scatter.</p>
          <span className="micro">CANVAS · POINTER VECTOR · SPRING</span>
        </div>
        <div className="lab-cell" data-cursor="drag">
          <span className="lab-kind">INTERACTION STUDY — 002</span>
          <h3>Flow-field swarm</h3>
          <LabCanvas mode="flow" />
          <p>Ninety particles negotiating a sine-based weather system.</p>
          <span className="micro">FLOW FIELD · EXCITATION RADIUS</span>
        </div>
        <div className="lab-cell" data-cursor="drag">
          <span className="lab-kind">DATA STUDY — 003</span>
          <h3>Scroll-velocity equalizer</h3>
          <LabCanvas mode="bars" />
          <p>Your scrolling is the audio. Fast flicks spike the spectrum.</p>
          <span className="micro">SCROLL VELOCITY AS INPUT</span>
        </div>
      </div>
    </section>
  );
}

export function Archive() {
  const btnRef = useMagnetic<HTMLAnchorElement>();
  return (
    <section className="sec wrap" aria-labelledby="learn-h" style={{ paddingTop: 0 }}>
      <div className="kicker reveal">
        <b>05</b> LEARNING ARCHIVE — INDEX, NOT CARDS
      </div>
      <h2 className="h2 reveal" id="learn-h">
        The <em>syllabus.</em>
      </h2>
      <div className="archive reveal">
        <div className="arch-row">
          <span className="yr">2026</span>
          <div>
            <h3>Machine Learning Specialization</h3>
            <p>Coursera &amp; Stanford Online — supervised, unsupervised &amp; applied ML foundations.</p>
          </div>
          <span className="tag">CERTIFICATION</span>
        </div>
        <div className="arch-row">
          <span className="yr">TEXT</span>
          <div>
            <h3>Hands-On Machine Learning with Scikit-Learn, Keras &amp; TensorFlow</h3>
            <p>Aurélien Géron — the working textbook behind the models above.</p>
          </div>
          <span className="tag">REFERENCE</span>
        </div>
        <div className="arch-row">
          <span className="yr">CORE</span>
          <div>
            <h3>DSA · OOP · DBMS · Operating Systems</h3>
            <p>Undergraduate core — the unsexy part that makes everything else possible.</p>
          </div>
          <span className="tag">CURRICULUM</span>
        </div>
      </div>
      <div className="edu-strip reveal">
        <div>
          <div className="micro">EDUCATION — VIT-AP UNIVERSITY · AMARAVATI, AP</div>
          <strong>Bachelor of Computer Science · 2024 — 2028 · GPA 7.94/10</strong>
        </div>
        <a
          ref={btnRef}
          className="resume-btn magnetic"
          href="mailto:swarnimmane1311@gmail.com?subject=Resume%20request%20—%20Swarnim%20Mane"
          data-cursor="hover"
        >
          VIEW RESUME ↗
        </a>
      </div>
    </section>
  );
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const email = "swarnimmane1311@gmail.com";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };
  return (
    <section className="sec wrap" id="contact" aria-labelledby="contact-h">
      <div className="kicker reveal">
        <b>06</b> CONTACT — THE FINALE BEGINS
      </div>
      <h2 className="contact-title reveal" id="contact-h">
        LET&apos;S MAKE<br />
        <span className="stroke">SOMETHING</span><br />
        INTERESTING.
      </h2>
      <a
        className="email-line ulink reveal"
        href={`mailto:${email}`}
        aria-label={`Email Swarnim at ${email}`}
      >
        {email.split("").map((ch, i) => (
          <span className="ch" key={i} style={{ transitionDelay: `${i * 8}ms` }}>
            {ch}
          </span>
        ))}
      </a>
      <div className="contact-row reveal">
        <a className="pill solid" href={`mailto:${email}`} data-cursor="hover">
          WRITE → {copied ? "COPIED" : "SAY HELLO"}
        </a>
        <button className="pill" onClick={copy} data-cursor="hover" type="button">
          {copied ? "✓ IN CLIPBOARD" : "⧉ COPY EMAIL"}
        </button>
      </div>
      <p className="micro reveal" style={{ marginTop: 18 }}>
        REAL INBOX. REAL HUMAN. NO CONTACT FORM THEATRE — JUST MAILTO, AS GOD INTENDED.
      </p>
    </section>
  );
}

export function Finale() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, t = 0, last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      t += dt;
      ctx.clearRect(0, 0, 120, 40);
      ctx.strokeStyle = "#141310"; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const x = (i / 60) * 120;
        const y = 20 + Math.sin(i * 0.3 + t * 1.6) * 9 * Math.exp(-Math.abs(i - 30) / 26);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#FF3D00";
      ctx.beginPath(); ctx.arc(60 + Math.sin(t) * 8, 20, 2.6, 0, Math.PI * 2); ctx.fill();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <footer className="wrap" aria-label="Footer">
      <div className="finale">
        <span>SWARNIM MANE — © 2026</span>
        <canvas ref={ref} width={120} height={40} aria-hidden="true" />
        <span className="sig">keep building.</span>
        <a href="#top" className="ulink" style={{ textDecoration: "none" }}>BACK TO SIGNAL ↑</a>
      </div>
    </footer>
  );
}
