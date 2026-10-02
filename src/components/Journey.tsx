import { useEffect, useRef, useState } from "react";

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
