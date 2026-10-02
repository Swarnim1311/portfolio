import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Loader from "./components/Loader";
import Cursor from "./components/Cursor";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import { About, Archive, Contact, Finale } from "./components/Journey";
import Saarthi from "./components/Saarthi";
import { initGlobalPointer, initMagnetic, scrollStore, useRevealRoot } from "./lib/core";

gsap.registerPlugin(ScrollTrigger);

function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} style={{ display: "flex" }}>
            {doubled.map((s, i) => (
              <span key={`${half}-${i}`}>{s}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const lenisRef = useRef<Lenis | null>(null);
  useRevealRoot();

  const handleLoaded = useCallback(() => {
    ScrollTrigger.refresh();
  }, []);

  useEffect(() => {
    const cleanupPointer = initGlobalPointer();
    const cleanupMagnetic = initMagnetic();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenisRef.current = lenis;
      lenis.on("scroll", (e: { velocity?: number; scroll?: number }) => {
        scrollStore.velocity = Math.max(-3, Math.min(3, e.velocity ?? 0));
        scrollStore.y = e.scroll ?? window.scrollY;
      });
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      // anchor navigation through lenis
      const onClick = (ev: MouseEvent) => {
        const a = (ev.target as HTMLElement).closest?.('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (el) {
          ev.preventDefault();
          lenis?.scrollTo(el as HTMLElement, { offset: -10, duration: 1.4 });
        }
      };
      document.addEventListener("click", onClick);

      // HOLY-SHIT #3: hero poster lifts + field card drifts as you leave the hero
      const heroTitle = document.querySelector(".hero-title");
      const fieldCard = document.querySelector(".field-card");
      const st1 = heroTitle
        ? gsap.to(heroTitle, {
            yPercent: -14,
            scale: 0.97,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
          })
        : null;
      const st2 = fieldCard
        ? gsap.to(fieldCard, {
            y: -60,
            rotate: -1.2,
            ease: "none",
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
          })
        : null;
      // scroll-velocity text stretch on big titles (subtle, settles on stop)
      const titles = gsap.utils.toArray<HTMLElement>(".proj-title, .contact-title");
      const stretchers = titles.map((el) =>
        gsap.to(el, {
          scaleY: 1.06,
          scaleX: 0.99,
          transformOrigin: "50% 100%",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
        })
      );
      void st1; void st2;
      return () => {
        document.removeEventListener("click", onClick);
        cancelAnimationFrame(raf);
        lenisRef.current?.destroy();
        lenisRef.current = null;
        ScrollTrigger.getAll().forEach((s) => s.kill());
        stretchers.forEach((s) => s.kill());
        cleanupPointer();
        cleanupMagnetic();
      };
    }
    // velocity decay when no lenis (reduced motion): derive from native scroll
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      scrollStore.velocity = (y - lastY) / 40;
      lastY = y;
      scrollStore.y = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      cleanupPointer();
      cleanupMagnetic();
    };
  }, []);

  return (
    <>
      <a className="skip" href="#about">
        Skip to content
      </a>
      <Loader onDone={handleLoaded} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <div className="ambient" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <Marquee
          items={[
            "DESIGN × CODE × INTELLIGENCE",
            "INPUT → PROCESS → OUTPUT",
            "SWARNIM MANE — 2026",
            "EXPERIMENT / BUILD / ITERATE",
          ]}
        />
        <About />
        <Skills />
        <Projects />
        <Marquee
          items={[
            "SAARTHI — FROM ATMOSPHERE TO ACTION",
            "FEATURED PROJECT — 01",
            "16-DAY OUTLOOK · RISK · ADVISORY",
            "SCROLL IS AN INPUT",
          ]}
        />
        <Saarthi />
        <Archive />
        <Contact />
        <Finale />
      </main>
    </>
  );
}
