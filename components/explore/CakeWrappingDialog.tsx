"use client";
import { useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { useItemDrop } from "./useItemDrop";
import "./minigames.css";

const ITEMS = [{ id: "leaf", name: "Lá chuối" }, { id: "rice", name: "Nếp" }, { id: "filling", name: "Nhân đậu" }, { id: "tie", name: "Dây lạt" }];
function Ingredient({ kind }: { kind: string }) {
  return <svg viewBox="0 0 90 76" fill="none" aria-hidden="true">{kind === "leaf" ? <><path d="M12 65Q6 14 72 7 85 58 12 65Z" fill="#598449" stroke="#355f3c" strokeWidth="2"/><path d="m14 62 53-48m-38 34 28-4m-18-6 23-4M42 35l-7-16" stroke="#a0b776" strokeWidth="2"/></> : kind === "tie" ? <><path d="M18 12q53 4 46 35Q56 71 22 57 2 45 24 24q28-22 48 15" stroke="#bda067" strokeWidth="7"/><path d="M18 12q53 4 46 35Q56 71 22 57 2 45 24 24q28-22 48 15" stroke="#e4cf97" strokeWidth="3"/></> : <><path d="M10 34q35 28 70 0l-8 23q-27 16-54 0Z" fill="#ddd0ab" stroke="#b29b73" strokeWidth="2"/><ellipse cx="45" cy="34" rx="34" ry="20" fill={kind === "rice" ? "#f7eed4" : "#d7ab53"} stroke="#bda87d" strokeWidth="2"/><path d="m23 30 6 3m9-10 6 3m11 0 6 3m-29 5 6 3m11 0 6 3m8-9 6 3m-29 8 6 3" stroke={kind === "rice" ? "#d9cbaa" : "#f1d58a"} strokeWidth="3" strokeLinecap="round"/></>}</svg>;
}
function Cake({ step, rice, left, right }: { step: number; rice: boolean; left: boolean; right: boolean }) {
  return <svg className="mg-cakeArt" viewBox="0 0 720 440" fill="none" aria-hidden="true">{step === 0 ? <path d="M205 113q145-30 290 0v216q-145 30-290 0Z" stroke="#8c9b65" strokeWidth="3" strokeDasharray="9 9"/> : <>
    <path d="M193 107q155-25 314 0v218q-154 25-314 0Z" fill="#64914f" stroke="#365b33" strokeWidth="3"/><path d="M350 101v229" stroke="#b6c781" strokeWidth="5"/>{[132,162,192,222,252,282,310].map(y => <path key={y} d={`M211 ${y-10} 345 ${y+12}m10 0 132-22`} stroke="#9bb76e" strokeWidth="2"/>)}
    {(rice || step >= 2) && <><path d="M275 154q75-24 150 0v132q-75 22-150 0Z" fill="#eee2bc" stroke="#d7c89f" strokeWidth="2"/><path d="m289 166 12 4m19-7 12 3m28-2 12 3m24-1 12 4m-117 25 13 3m91 0 13 3m-118 25 13 3m90 0 13 3m-117 25 12 3m15 16 12 2m29 0 12-3" stroke="#fffae5" strokeWidth="4" strokeLinecap="round"/></>}
    {step >= 2 && <><path d="M322 169q28-12 56 0v101q-28 12-56 0Z" fill="#d4aa50"/><path d="m334 181 8 4m16 9 7 3m-28 16 8 4m8 20 8 3m-25 13 9 3" stroke="#f1d48b" strokeWidth="5" strokeLinecap="round"/></>}
    {(left || step === 3) && <g className="mg-folded"><path d="M205 114 374 145 374 298 205 322Z" fill="#487540" stroke="#365b33" strokeWidth="3"/><path d="m225 143 130 23m-130 7 130 20m-130 12 130 17m-130 13 130 10m-130 18 130 4" stroke="#759753" strokeWidth="2"/></g>}
    {(right || step === 3) && <g className="mg-folded"><path d="M495 114 337 145 337 298 495 322Z" fill="#6d9451" stroke="#3e6638" strokeWidth="3"/><path d="m480 139-128 27m128 9-128 20m128 14-128 16m128 15-128 10m128 22-128 2" stroke="#9cb574" strokeWidth="2"/></g>}
    {step === 3 && <><path d="m229 123 236 1-22 37H249Zm0 191 236 1-23-38H250Z" fill="#466e3d" stroke="#365b33" strokeWidth="3"/><path d="M350 128v179m-118-91h234" stroke="#6c5734" strokeWidth="9"/><path d="M350 128v179m-118-91h234" stroke="#e3cc8b" strokeWidth="5"/><path d="M350 216q-36-35-29-5 4 15 29 5 33-31 27-5-7 15-27 5Z" stroke="#f3dda0" strokeWidth="5"/></>}
  </>}</svg>;
}
type Props = { step: number; onAdvance: () => void; onReplay: () => void; onClose: () => void };
export default function CakeWrappingDialog({ step, onAdvance, onReplay, onClose }: Props) {
  const board = useRef<HTMLButtonElement>(null);
  const [rice,setRice] = useState(false), [left,setLeft] = useState(false), [right,setRight] = useState(false);
  const [feedback,setFeedback] = useState("");
  const instruction = step === 0 ? "Đặt lá chuối lên chiếu để bắt đầu." : step === 1 ? rice ? "Thêm nhân đậu lên phần nếp vừa trải." : "Trải nếp trước, rồi thêm nhân đậu vào giữa." : step === 2 ? left && right ? "Hai mép lá đã gọn. Đặt dây lạt lên bánh để buộc nhé!" : "Chạm hai mép lá để gấp vào giữa." : "Chiếc bánh đầu tiên đã gói xong!";
  const expected = step === 0 ? "leaf" : step === 1 ? rice ? "filling" : "rice" : step === 2 && left && right ? "tie" : null;
  const drop = useItemDrop(board, id => { if(id !== expected){setFeedback(instruction);return;} setFeedback("");if(id === "rice")setRice(true);else onAdvance(); }, () => {setFeedback("");return step < 3;});
  const fold = (side: string) => {drop.clear();setFeedback("");if(side === "left")setLeft(true);else setRight(true);};
  const replay = () => {drop.clear();setRice(false);setLeft(false);setRight(false);setFeedback("");onReplay();};
  return <div className="ex-mangoBackdrop mg-backdrop" onMouseDown={e => {if(e.target === e.currentTarget && !drop.drag)onClose();}}><section className="mg-card" role="dialog" aria-modal="true" aria-labelledby="mg-cake-title">
    <header className="mg-header"><div><span>CHỢ QUÊ TÂN THUẬN ĐÔNG</span><h2 id="mg-cake-title">Khéo tay gói bánh</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng trò gói bánh" autoFocus><X size={19}/></button></header>
    <ol className="mg-steps">{["Trải lá","Nếp và nhân","Gấp, buộc bánh"].map((title,i)=><li key={title} className={i < step ? "is-done" : i === step ? "is-current" : ""}><b>{i < step ? <Check size={12}/> : i+1}</b>{title}</li>)}</ol>
    <div className="mg-cakeScene"><img className="mg-sceneImage" src="/explore/cake-table.svg" alt="Bàn gỗ với chiếu lót để gói bánh" draggable={false}/><Cake step={step} rice={rice} left={left} right={right}/><button ref={board} className={`mg-boardTarget ${drop.selected !== null ? "is-ready" : ""}`} onClick={drop.placeSelected} disabled={step === 3} aria-label="Đặt nguyên liệu đã chọn lên chiếu gói bánh">{step === 0 && <span>{drop.selected ? "ĐẶT LÁ VÀO ĐÂY" : "CHIẾU GÓI BÁNH"}</span>}</button>{step === 2 && !left && <button className="mg-fold mg-foldLeft" onClick={()=>fold("left")}>Gấp vào →</button>}{step === 2 && !right && <button className="mg-fold mg-foldRight" onClick={()=>fold("right")}>← Gấp vào</button>}</div>
    {step < 3 && <div className="mg-ingredients" aria-label="Nguyên liệu gói bánh">{ITEMS.map(item=><button key={item.id} {...drop.bind(item.id)} className={drop.selected === item.id ? "is-selected" : ""}><Ingredient kind={item.id}/><span>{item.name}</span></button>)}</div>}
    <div className="mg-feedback" role="status"><p>{feedback || instruction}</p></div><footer className="mg-footer">{step === 3 ? <><strong className="mg-finished">Gọn lá, chắc lạt. Khéo tay quá!</strong><button className="mg-secondary" onClick={replay}><RotateCcw size={14}/>Gói chiếc nữa</button></> : <small>Kéo nguyên liệu vào chiếu, hoặc chọn rồi chạm vào chiếu.</small>}<button className="mg-primary" onClick={onClose}>{step === 3 ? "Hoàn thành" : "Về chợ"}</button></footer>
  </section></div>;
}
