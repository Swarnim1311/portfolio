import FieldInstrument from "./FieldInstrument";

export default function Hero() {
  return (
    <header className="hero wrap" id="top">
      <div className="micro reveal" style={{ marginBottom: 14 }}>
        PORTFOLIO AS SYSTEM — V.2026 / CS UNDERGRAD / VIT-AP
      </div>
      <div className="hero-grid">
        <div>
          <h1 className="hero-title" aria-label="I design. I build. I experiment.">
            <span className="row">
              <span>I DESIGN.</span>
            </span>
            <span className="row">
              <span>
                I BUILD<span className="x">.</span>
              </span>
            </span>
            <span className="row">
              <span>
                I <span className="it">experiment.</span>
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
