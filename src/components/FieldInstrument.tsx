import { useEffect, useRef } from "react";
import { clamp, damp, pointerStore, scrollStore } from "../lib/core";

type P = { x: number; y: number; vx: number; vy: number; s: number; a: number };

/**
 * FIELD INSTRUMENT — the signature visual.
 * Concept: observations (particles) + model (cobalt thread) + prediction.
 * Inputs: cursor position/velocity, scroll velocity, idle breathing.
 * Single 2D canvas, DPR-clamped, pauses offscreen. No WebGL needed.
 */
export default function FieldInstrument({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const local = useRef({ x: 0.7, y: 0.4, active: false, energy: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const COUNT = compact ? 220 : mobile ? 300 : 720;
    let W = 0;
    let H = 0;
    let parts: P[] = [];
    let raf = 0;
    let t = Math.random() * 100;
    let visible = true;
    let last = performance.now();
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = Math.max(280, r.width);
      H = compact ? 170 : Math.max(300, r.height);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const seed = () => {
      parts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0,
        vy: 0,
        s: 0.6 + Math.random() * 1.6,
        a: 0.25 + Math.random() * 0.55,
      }));
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      local.current.active = inside;
      if (inside) {
        local.current.x = (e.clientX - r.left) / r.width;
        local.current.y = (e.clientY - r.top) / r.height;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(canvas);
    resize();
    window.addEventListener("resize", resize);

    const field = (x: number, y: number, time: number) => {
      const nx = x / W;
      const ny = y / H;
      return (
        Math.sin(nx * 4.2 + time * 0.7) * 0.9 +
        Math.sin(ny * 3.1 - time * 0.5) * 0.7 +
        Math.sin((nx + ny) * 5.0 + time * 0.3) * 0.5
      );
    };

    let frame = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame++;
      const scrollE = clamp(Math.abs(scrollStore.velocity) * 6, 0, 1);
      const ptrE = pointerStore.speed;
      const energy = clamp(scrollE * 0.9 + ptrE * 0.7 + local.current.energy * 0.4, 0, 1.4);
      local.current.energy += ((local.current.active ? 1 : 0) - local.current.energy) * damp(4, dt);
      t += dt * (0.55 + energy * 1.6);

      // paper
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#FBFAF5";
      ctx.fillRect(0, 0, W, H);

      // faint grid — editorial graph paper
      ctx.strokeStyle = "rgba(20,19,16,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gs = 44;
      for (let gx = 0.5; gx < W; gx += gs) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
      }
      for (let gy = 0.5; gy < H; gy += gs) {
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
      }
      ctx.stroke();

      const cx = local.current.x * W;
      const cy = local.current.y * H;

      // observations
      for (const p of parts) {
        const ang = field(p.x, p.y, t);
        const fx = Math.cos(ang) * (14 + energy * 46);
        const fy = Math.sin(ang * 1.3) * (14 + energy * 46);
        p.vx += (fx * dt * 3 - p.vx * 1.6 * dt * 3) * 0.5;
        p.vy += (fy * dt * 3 - p.vy * 1.6 * dt * 3 + Math.sin(t * 2 + p.x * 0.01) * 6 * dt) * 0.5;

        // cursor perturbation — push + swirl
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d2 = dx * dx + dy * dy;
        const R = 150 + energy * 90;
        if (d2 < R * R) {
          const d = Math.max(12, Math.sqrt(d2));
          const f = (1 - d / R) * (26 + energy * 60);
          p.vx += ((dx / d) * f + (-dy / d) * f * 0.6) * dt * 4;
          p.vy += ((dy / d) * f + (dx / d) * f * 0.6) * dt * 4;
        }
        p.x += p.vx * dt * 8;
        p.y += p.vy * dt * 8;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 40);
        ctx.globalAlpha = p.a * (0.55 + sp * 0.7);
        ctx.fillStyle = sp > 0.62 ? "#FF3D00" : "#141310";
        const sz = p.s * (1 + sp * 1.6 + energy * 0.4);
        ctx.fillRect(p.x, p.y, sz, sz);
      }
      ctx.globalAlpha = 1;

      // model thread — cobalt regression line through the field
      const base = H * 0.58;
      const pts: [number, number][] = [];
      const K = 64;
      for (let i = 0; i <= K; i++) {
        const nx = i / K;
        const x = nx * W;
        const wob =
          Math.sin(nx * 6.0 + t * 1.1) * (10 + energy * 26) +
          Math.sin(nx * 13.0 - t * 0.8) * 6 +
          Math.sin(nx * 2.2 + t * 0.4) * 14;
        const pull = Math.exp(-Math.pow((nx - local.current.x) * 3.2, 2));
        const y = base + wob - pull * (local.current.y - 0.58) * H * 0.55;
        pts.push([x, y]);
      }
      // confidence band
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y - 16) : ctx.lineTo(x, y - 16)));
      for (let i = K; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 16);
      ctx.closePath();
      ctx.fillStyle = "rgba(31,59,255,0.08)";
      ctx.fill();
      // thread
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = "#1F3BFF";
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // thread echo
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const yy = y + Math.sin(t * 2 + i * 0.4) * 3;
        i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      });
      ctx.strokeStyle = "rgba(31,59,255,0.25)";
      ctx.lineWidth = 6;
      ctx.stroke();

      // prediction marker at cursor x
      const pi = clamp(Math.round(local.current.x * K), 0, K);
      const [pxm, pym] = pts[pi];
      ctx.strokeStyle = "rgba(20,19,16,0.35)";
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(pxm, pym);
      ctx.lineTo(pxm, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#FF3D00";
      ctx.beginPath();
      ctx.arc(pxm, pym, 5 + Math.sin(t * 4) * 1.2 + energy * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#141310";
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.fillText(`ŷ ${(pym / H).toFixed(3)}`, clamp(pxm - 60, 8, W - 70), pym - 12);

      // crosshair when cursor inside
      if (local.current.active) {
        ctx.strokeStyle = "rgba(20,19,16,0.4)";
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#141310";
        ctx.fillRect(cx - 0.5, cy - 30, 1, 60);
        ctx.fillRect(cx - 30, cy - 0.5, 60, 1);
      }

      if (readoutRef.current && frame % 12 === 0) {
        readoutRef.current.textContent = `OBS ${COUNT} · MODEL w(t) · E ${energy.toFixed(2)} · V ${scrollStore.velocity.toFixed(2)}`;
      }
      if (reduced && frame > 2) cancelAnimationFrame(raf);
    };

    if (reduced) {
      // single static render
      raf = requestAnimationFrame(draw);
      setTimeout(() => cancelAnimationFrame(raf), 300);
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [compact]);

  return (
    <>
      <canvas ref={canvasRef} aria-label="Interactive field instrument: particle observations with a live model thread reacting to your cursor" />
      <div ref={readoutRef} className="field-readout" aria-hidden="true">
        OBS — · MODEL w(t)
      </div>
    </>
  );
}
