"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, RotateCcw, X } from "lucide-react";
import "./minigames.css";

const OBSTACLES = [
  { at: 14, lane: 1, kind: "branch" }, { at: 26, lane: 0, kind: "weed" }, { at: 35, lane: 2, kind: "branch" },
  { at: 45, lane: 1, kind: "weed" }, { at: 55, lane: 0, kind: "branch" }, { at: 64, lane: 2, kind: "weed" },
  { at: 74, lane: 1, kind: "branch" }, { at: 83, lane: 0, kind: "weed" }, { at: 92, lane: 2, kind: "branch" },
];
type Props = { completed: boolean; onComplete: () => void; onClose: () => void };
export default function BoatRideDialog({ completed, onComplete, onClose }: Props) {
  const [phase, setPhase] = useState<"ready" | "playing" | "won" | "lost">(completed ? "won" : "ready");
  const [lane, setLane] = useState(1), [lives, setLives] = useState(3), [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Né nhánh cây và lục bình, đưa xuồng tới cuối lạch.");
  const [hit, setHit] = useState(false);
  const boat = useRef<HTMLImageElement>(null);
  const laneRef = useRef(1), obstacles = useRef<(HTMLDivElement | null)[]>([]), finish = useRef(onComplete);
  useEffect(() => { finish.current = onComplete; }, [onComplete]);
  const steer = useCallback((next: number) => { if (phase !== "playing") return; laneRef.current = Math.max(0, Math.min(2, next)); setLane(laneRef.current); }, [phase]);
  useEffect(() => {
    if (phase !== "playing") return;
    const down = (e: KeyboardEvent) => { if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code)) { e.preventDefault(); steer(laneRef.current + (e.code === "ArrowLeft" || e.code === "KeyA" ? -1 : 1)); } };
    window.addEventListener("keydown", down); return () => window.removeEventListener("keydown", down);
  }, [phase, steer]);
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0, previous = 0, distance = 0, remaining = 3, lastUi = 0, hitUntil = 0;
    const passed = new Set<number>();
    const tick = (time: number) => {
      const dt = previous ? Math.min(50, time - previous) : 0; previous = time;
      if (document.hidden) { raf = requestAnimationFrame(tick); return; }
      distance += dt / 250; // A complete trip takes about 25 seconds of active play.
      const hull = boat.current?.getBoundingClientRect();
      if (hitUntil && time > hitUntil) { setHit(false); hitUntil = 0; }
      OBSTACLES.forEach((item, index) => {
        const node = obstacles.current[index];
        if (node) { const top = 82 - (item.at - distance) * 1.65; node.style.top = `${top}%`; node.style.visibility = top > -8 && top < 108 ? "visible" : "hidden"; }
        if (!node || !hull || passed.has(index)) return;
        const obstacle = node.getBoundingClientRect();
        // Test the visible hull throughout contact, including while changing lanes.
        // Inset the transparent SVG padding and paddle, so near misses stay fair.
        const touches = hull.left + hull.width * .2 < obstacle.right - obstacle.width * .1
          && hull.right - hull.width * .2 > obstacle.left + obstacle.width * .1
          && hull.top + hull.height * .08 < obstacle.bottom - obstacle.height * .15
          && hull.bottom - hull.height * .1 > obstacle.top + obstacle.height * .15;
        if (touches) {
          passed.add(index); remaining = Math.max(0, remaining - 1); setLives(remaining);
          node.dataset.hit = "true"; setHit(true); hitUntil = time + 650;
          setMessage(`Va vào ${item.kind === "branch" ? "nhánh cây" : "lục bình"}! −1 lượt. ${remaining ? `Còn ${remaining}/3 lượt, đổi hướng để né nhé.` : "Xuồng mắc lại rồi. Thử lại từ đầu chặng xuồng; các checkpoint trước vẫn được giữ."}`);
        } else if (obstacle.top > hull.bottom) passed.add(index);
      });
      if (remaining <= 0) { setPhase("lost"); return; }
      if (distance >= 100) { setProgress(100); setPhase("won"); setMessage("Cập bến rồi! Tay chèo của bạn vững lắm."); finish.current(); return; }
      if (time - lastUi > 180) { setProgress(Math.floor(distance)); lastUi = time; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [phase]);
  const start = () => { laneRef.current = 1; setLane(1); setLives(3); setProgress(0); setHit(false); obstacles.current.forEach(node => { if (node) { delete node.dataset.hit; node.style.visibility = "hidden"; } }); setMessage("Nhìn phía trước, chạm trái hoặc phải để né chướng ngại."); setPhase("playing"); };
  return <div className="ex-mangoBackdrop mg-backdrop"><section className="mg-card mg-ruralCard" role="dialog" aria-modal="true" aria-labelledby="mg-boat-title">
    <header className="mg-header"><div><span>XẺO QUÝT · XUỒNG BA LÁ</span><h2 id="mg-boat-title">Chèo qua miền tràm xanh</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng trò chèo xuồng" autoFocus><X size={19}/></button></header>
    <div className="mg-boatStats"><span>{phase === "won" ? "Đã cập bến" : `Quãng đường · ${progress}%`}</span><span aria-label={`Còn ${lives} lượt va chạm`}>{[1, 2, 3].map(n => <Heart key={n} size={17} fill={n <= lives ? "currentColor" : "none"}/>)}</span></div>
    <div className={`mg-riverCourse${hit ? " is-hit" : ""}`} onPointerDown={e => { const box = e.currentTarget.getBoundingClientRect(); steer(Math.round(((e.clientX - box.left) / box.width - .25) / .25)); }}>
      <div className="mg-riverBank mg-bankLeft"/><div className="mg-riverBank mg-bankRight"/>
      {OBSTACLES.map((item, i) => <div key={i} ref={node => { obstacles.current[i] = node; }} className={`mg-riverObstacle mg-obstacle-${item.kind}`} style={{ left: `${25 + item.lane * 25}%`, visibility: "hidden" }} aria-hidden="true">{item.kind === "branch" ? <svg viewBox="0 0 70 30"><path d="m5 23 59-14M28 17l-5-12m22 8 8 11" stroke="#846548" strokeWidth="8" strokeLinecap="round"/><path d="m9 21 52-11" stroke="#b39a6e" strokeWidth="2"/></svg> : <svg viewBox="0 0 70 40"><g fill="#74975c" stroke="#51774e"><ellipse cx="20" cy="25" rx="15" ry="8"/><ellipse cx="45" cy="20" rx="19" ry="10"/><ellipse cx="33" cy="10" rx="12" ry="8"/></g><path d="m32 14 3-9" stroke="#a4b677" strokeWidth="3"/><circle cx="35" cy="5" r="4" fill="#bda8c8"/></svg>}</div>)}
      <img ref={boat} className="mg-playerBoat" src="/explore/rowing-boat.svg" alt="Xuồng của bạn" style={{ left: `${25 + lane * 25}%` }}/>
      {hit && phase === "playing" && <strong className="mg-collisionSignal" aria-hidden="true">VA CHẠM · −1</strong>}
      {phase !== "playing" && <div className="mg-courseOverlay"><strong>{phase === "won" ? "Cập bến bình yên!" : phase === "lost" ? "Thử một chuyến nữa nhé" : "Sẵn sàng cầm mái chèo?"}</strong><p>Chạm hai bên dòng nước, dùng ← → hoặc A / D. Tránh nhánh cây và lục bình.</p><button className="mg-primary" onClick={start}>{phase === "ready" ? "Bắt đầu chèo" : <><RotateCcw size={14}/>Chèo lại</>}</button></div>}
    </div>
    <div className="mg-steering"><button onClick={() => steer(laneRef.current - 1)} disabled={phase !== "playing" || lane === 0}><ArrowLeft size={18}/>Sang trái</button><button onClick={() => steer(laneRef.current + 1)} disabled={phase !== "playing" || lane === 2}>Sang phải<ArrowRight size={18}/></button></div>
    <div className="mg-feedback" role="status"><p>{message}</p></div><footer className="mg-footer"><small>Qua lạch sẽ hoàn thành chặng xuồng trong câu chuyện.</small><button className="mg-primary" onClick={onClose}>Về bến</button></footer>
  </section></div>;
}
