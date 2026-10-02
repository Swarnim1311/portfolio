import { useEffect, useState } from "react";

export default function Loader({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      setTimeout(onDone, 750);
    }, 1650);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`loader ${done ? "done" : ""}`} aria-hidden={done}>
      <div className="loader-inner">
        <div className="loader-top">
          <span>SYS / 01</span>
          <span>INITIALIZING FIELD</span>
        </div>
        <div className="loader-word">
          DESIGN <em>×</em> CODE <em>×</em> MIND
        </div>
        <div className="loader-bar">
          <i />
        </div>
        <div className="loader-sub">CALIBRATING SIGNAL — SWARNIM MANE</div>
      </div>
    </div>
  );
}
