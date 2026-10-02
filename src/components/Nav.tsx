import { useEffect } from "react";

const LINKS = [
  ["HOME", "#top"],
  ["ABOUT", "#about"],
  ["WORK", "#work"],
  ["SAARTHI", "#saarthi"],
  ["STACK", "#stack"],
  ["CONTACT", "#contact"],
] as const;

export default function Nav() {
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      const bar = document.querySelector<HTMLElement>(".progress i");
      if (bar) bar.style.transform = `scaleX(${p})`;
      const ids = ["top", "about", "stack", "work", "saarthi", "contact"];
      let current = "top";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4)
          current = id;
      }
      document.querySelectorAll(".navlinks a").forEach((a) => {
        a.classList.toggle(
          "active",
          a.getAttribute("href") === `#${current}`
        );
      });
      // atmospheric temperature: sonar section turns page dark-aware
      const sonar = document.getElementById("sonar");
      if (sonar) {
        const r = sonar.getBoundingClientRect();
        const inside =
          r.top < window.innerHeight * 0.55 &&
          r.bottom > window.innerHeight * 0.45;
        document.body.dataset.atmos = inside ? "sonar" : "";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <i />
      </div>
      <nav className="topnav" aria-label="Primary">
        <a className="brand" href="#top">
          <b>S</b>
          <span>
            SWARNIM&nbsp;MANE — <span style={{ opacity: 0.55 }}>SYS.2026</span>
          </span>
        </a>
        <div className="navlinks">
          {LINKS.map(([label, href], i) => (
            <a key={href} href={href}>
              <span style={{ opacity: 0.5, marginRight: 4 }}>
                0{i + 1}
              </span>
              {label}
            </a>
          ))}
        </div>
        <span className="nav-meta">IVORY / INK / SIGNAL</span>
      </nav>
    </>
  );
}
