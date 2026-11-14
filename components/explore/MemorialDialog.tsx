"use client";

import { useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { useItemDrop } from "./useItemDrop";
import "./minigames.css";

type Props = { kind: "incense" | "flowers"; title: string; progress: number; onAdvance: () => void; onReplay: () => void; onClose: () => void };

function Flower({ color = "#edc76d" }: { color?: string }) {
  return <svg viewBox="0 0 80 110" aria-hidden="true"><path d="M40 100V40M40 82Q12 80 20 62q20 0 20 20m0-10q28-2 20-20-20 0-20 20" fill="#7c9b60" stroke="#526f45" strokeWidth="3"/>{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="40" cy="22" rx="10" ry="17" fill={color} stroke="#b98c55" transform={`rotate(${angle} 40 36)`}/>)}<circle cx="40" cy="36" r="10" fill="#c58c46"/></svg>;
}

export default function MemorialDialog({ kind, title, progress, onAdvance, onReplay, onClose }: Props) {
  const [step, setStep] = useState(0);
  const altar = useRef<HTMLButtonElement>(null);
  const flowers = kind === "flowers", goal = flowers ? 3 : 1, complete = progress >= goal;
  const drop = useItemDrop(altar, () => { if (!complete) onAdvance(); }, () => !complete);
  const instruction = complete ? flowers ? "Ba nhành hoa đã được đặt ngay ngắn trên bàn tưởng niệm." : "Nén nhang đã được cắm vào lư hương." : flowers ? "Chọn một nhành hoa rồi chạm vào bình, hoặc kéo hoa vào bình. Đặt đủ ba nhành nhé." : step === 0 ? "Chọn nén nhang trên khay để bắt đầu." : step === 1 ? "Chạm vào ngọn nến để châm nhang." : "Nhang đã cháy. Chạm vào lư hương để cắm nhang tưởng niệm.";
  const replay = () => { setStep(0); drop.clear(); onReplay(); };
  return <div className="ex-mangoBackdrop mg-backdrop"><section className="mg-card mg-ruralCard" role="dialog" aria-modal="true" aria-labelledby="mg-memorial-title">
    <header className="mg-header"><div><span>MỘT KHOẢNH KHẮC TƯỞNG NIỆM</span><h2 id="mg-memorial-title">{title}</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng hoạt động tưởng niệm" autoFocus><X size={19}/></button></header>
    <ol className="mg-steps">{(flowers ? ["Chọn hoa", "Dâng ba nhành hoa"] : ["Chọn nhang", "Châm nhang", "Cắm nhang"]).map((label,index)=><li key={label} className={complete?"is-done":index===(flowers?(drop.selected?1:0):step)?"is-current":""}><b>{complete?"✓":index+1}</b>{label}</li>)}</ol>
    <div className={`mg-memorialScene${flowers?" is-flowers":""}`}>
      <span className="mg-counter">{progress} / {goal} {flowers?"nhành hoa":"nén nhang"}</span>
      {flowers ? <div className="mg-flowerTray">{["#edc76d","#e4a2a0","#eee1b8"].map((color,index)=><button key={color} {...drop.bind(String(index))} disabled={complete} aria-label={`Chọn nhành hoa ${index+1}`}><Flower color={color}/></button>)}</div>
      : <><button className={`mg-incenseTray${step>0?" is-picked":""}`} disabled={complete||step!==0} onClick={()=>setStep(1)} aria-label="Chọn nén nhang"><svg viewBox="0 0 180 120" aria-hidden="true"><path d="M12 75h156l-15 30H27Z" fill="#aa8054" stroke="#715535" strokeWidth="3"/>{[45,65,85].map(y=><path key={y} d={`M35 ${y}h110`} stroke="#c96a48" strokeWidth="4"/>)}</svg><span>Khay nhang</span></button>
        <button className="mg-memorialCandle" disabled={complete||step!==1} onClick={()=>setStep(2)} aria-label="Châm nhang bằng nến"><svg viewBox="0 0 70 130" aria-hidden="true"><path d="M35 8Q6 41 35 53 62 41 35 8" fill="#e7a447"/><path d="M35 27q-13 20 0 22 12-5 0-22" fill="#fff0be"/><path d="M21 56h28v60H21Z" fill="#c57450" stroke="#925837" strokeWidth="3"/><path d="M11 119h48" stroke="#96744b" strokeWidth="6"/></svg><span>Châm nhang</span></button>
        {step>0&&!complete&&<svg className="mg-heldIncense" viewBox="0 0 30 140" aria-label={step===2?"Nhang đã được châm":"Nén nhang đã chọn"}><path d="M15 136V20" stroke="#b66540" strokeWidth="4"/>{step===2&&<><circle cx="15" cy="18" r="4" fill="#e9a24c"/><path d="M15 13q-12-14 0-25" stroke="#c9c4b3" strokeWidth="3" fill="none"/></>}</svg>}</>}
      <button ref={altar} className={`mg-memorialAltar${drop.selected||step===2?" is-ready":""}`} disabled={complete||(!flowers&&step!==2)} onClick={()=>{if(flowers)drop.placeSelected();else if(step===2&&!complete)onAdvance();}} aria-label={flowers?"Đặt hoa đã chọn vào bình":"Cắm nhang vào lư hương"}>
        {flowers ? <><div className="mg-offeredFlowers">{Array.from({length:Math.min(3,progress)},(_,index)=><Flower key={index} color={["#edc76d","#e4a2a0","#eee1b8"][index]}/>)}</div><svg viewBox="0 0 130 120" aria-hidden="true"><path d="M43 10h44l-8 25q40 60-14 72Q12 95 51 35Z" fill="#b69c6f" stroke="#826c4d" strokeWidth="4"/><path d="M47 53h36M42 76h46" stroke="#e6d3a3" strokeWidth="5"/></svg></>
        : <svg viewBox="0 0 180 150" aria-hidden="true">{complete&&<><path d="M90 90V20" stroke="#aa6540" strokeWidth="4"/><path d="M90 15q-15-12 0-25" stroke="#b8baa9" strokeWidth="3" fill="none"/><circle cx="90" cy="19" r="3" fill="#e2a044"/></>}<ellipse cx="90" cy="85" rx="63" ry="16" fill="#d3b080" stroke="#805b3e" strokeWidth="4"/><path d="M28 85q0 48 62 48t62-48" fill="#ab7850" stroke="#805b3e" strokeWidth="4"/><path d="M30 100h120" stroke="#d4b487" strokeWidth="5"/><path d="M53 130v14m74-14v14" stroke="#805b3e" strokeWidth="7"/></svg>}
        <span>{flowers?"BÌNH HOA TƯỞNG NIỆM":"LƯ HƯƠNG"}</span>
      </button>
    </div>
    <div className="mg-feedback" role="status"><p>{instruction}</p></div><footer className="mg-footer">{complete?<button className="mg-secondary" onClick={replay}><RotateCcw size={14}/>Thực hiện lại</button>:<small>{flowers?"Dâng hoa bằng chuột, chạm hoặc bàn phím.":"Chọn nhang → Châm nhang → Cắm nhang."}</small>}<button className="mg-primary" onClick={onClose}>{complete?"Hoàn thành":"Trở lại khu tưởng niệm"}</button></footer>
  </section></div>;
}
