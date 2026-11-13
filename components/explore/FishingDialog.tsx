"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import FishArt, { FISH } from "./FishArt";
import "./minigames.css";

type Props = { caught: number; onCatch: () => void; onReplay: () => void; onClose: () => void };
export default function FishingDialog({ caught, onCatch, onReplay, onClose }: Props) {
  const [phase, setPhase] = useState<"ready" | "waiting" | "bite" | "reel" | "caught">("ready");
  const [message, setMessage] = useState("Thả câu, chờ phao báo cá cắn rồi thử kéo đúng nhịp.");
  const needle = useRef<HTMLSpanElement>(null), value = useRef(0);
  const complete = caught >= 3, low = 34 + caught * 3, high = 68 - caught * 3;
  useEffect(() => {
    if (phase !== "waiting" && phase !== "bite") return;
    const timer = window.setTimeout(() => {
      if (phase === "waiting") { setPhase("bite"); setMessage("Cá cắn câu! Chạm “Giật cần” ngay nhé."); }
      else { setPhase("ready"); setMessage("Cá bơi đi rồi. Thả câu lại, mình còn nhiều thời gian."); }
    }, phase === "waiting" ? 1600 + Math.random() * 1800 : 2400);
    return () => window.clearTimeout(timer);
  }, [phase]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) { setPhase(prev => prev === "caught" ? prev : "ready"); } };
    document.addEventListener("visibilitychange", hidden); return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  useEffect(() => {
    if (phase !== "reel") return;
    let raf = 0, start = 0;
    const frame = (t: number) => { if (!start) start = t; value.current = (Math.sin((t - start) / 410 - Math.PI / 2) + 1) * 50; if (needle.current) needle.current.style.left = `${value.current}%`; raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [phase]);
  const action = () => {
    if (complete) return;
    if (phase === "caught") { setPhase("ready"); setMessage("Thả câu để khám phá loài cá tiếp theo nhé."); }
    else if (phase === "ready") { setPhase("waiting"); setMessage("Phao đang trôi… Đợi cá cắn câu nhé."); }
    else if (phase === "waiting") { setPhase("ready"); setMessage("Hơi sớm rồi! Đợi phao báo cá cắn trước khi giật cần."); }
    else if (phase === "bite") { setPhase("reel"); setMessage("Canh kim vào vùng xanh rồi chạm “Kéo lên”."); }
    else { setPhase("ready"); if (value.current >= low && value.current <= high) { setPhase("caught"); onCatch(); setMessage(`Bạn vừa câu được ${FISH[caught].name.toLowerCase()}! ${caught === 2 ? "Đủ 3 loài cá, checkpoint đã hoàn thành." : "Đã ghi vào sổ cá của chuyến đi."}`); } else setMessage("Nhịp kéo chưa đúng, cá tuột mất rồi. Thử lại nhé!"); }
  };
  return <div className="ex-mangoBackdrop mg-backdrop"><section className="mg-card mg-ruralCard" role="dialog" aria-modal="true" aria-labelledby="mg-fish-title">
    <header className="mg-header"><div><span>GÁO GIỒNG · MỘT GÓC AO QUÊ</span><h2 id="mg-fish-title">Buông cần đợi cá</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng trò câu cá" autoFocus><X size={19}/></button></header>
    <div className={`mg-fishingScene mg-fishing-${phase}`}>
      <div className="mg-pondBank"/><svg className="mg-fishingRod" viewBox="0 0 600 300" aria-hidden="true"><path d="M70 285Q116 118 280 53" stroke="#876e43" strokeWidth="7" fill="none"/><path d="M280 53Q328 102 352 194" stroke="#f5ebd0" strokeWidth="1.5" fill="none"/><path d="M0 260h160v40H0z" fill="#a98b5b"/><path d="M0 275h160m-126-15v40m50-40v40m50-40v40" stroke="#7b6846" strokeWidth="3"/></svg>
      <div className="mg-fishingFloat" aria-hidden="true"><i/></div><div className="mg-counter">{caught} / 3 loài cá</div>
      {phase === "bite" && <strong className="mg-biteSignal">CÁ CẮN CÂU!</strong>}
      {(phase === "caught" || complete) && <div className="mg-courseOverlay mg-catchResult" role="status">
        <span>{complete ? "CHECKPOINT HOÀN THÀNH · 3 / 3" : "CÂU ĐƯỢC RỒI!"}</span>
        <FishArt index={Math.max(0, caught - 1)}/><strong>{FISH[Math.max(0, caught - 1)].name}</strong>
        <p>{FISH[Math.max(0, caught - 1)].note} {complete ? "Đã ghi đủ ba loài cá vào sổ. Về chợ kể cho dì nghe nhé!" : "Đã ghi vào sổ cá của chuyến đi."}</p>
        {complete && <button className="mg-primary" onClick={() => { setPhase("ready"); setMessage("Thử một buổi câu mới nhé!"); onReplay(); }}><RotateCcw size={14}/>Câu lại</button>}
      </div>}
    </div>
    {phase === "reel" && <div className="mg-reelMeter" aria-label="Canh kim vào vùng xanh để kéo cá"><i style={{ left: `${low}%`, width: `${high - low}%` }}/><span ref={needle}/></div>}
    {caught > 0 && <div className="mg-fishCollection" aria-label="Sổ cá đã câu">{FISH.slice(0, caught).map((fish, index) => <div key={fish.id}><FishArt index={index}/><span>{fish.name}</span></div>)}</div>}
    <div className="mg-feedback" role="status"><p>{message}</p></div><footer className="mg-footer"><small>Có thể dùng Enter hoặc Space trên nút hành động.</small>{!complete && <button className="mg-primary" onClick={action}>{phase === "caught" ? "Tiếp tục câu" : phase === "ready" ? "Thả câu" : phase === "waiting" ? "Nhấc cần" : phase === "bite" ? "Giật cần!" : "Kéo lên"}</button>}<button className="mg-secondary" onClick={onClose}>Về bờ</button></footer>
  </section></div>;
}
