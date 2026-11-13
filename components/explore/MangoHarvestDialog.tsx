"use client";
import { useRef, useState } from "react";
import { RotateCcw, Star, X } from "lucide-react";
import { useItemDrop } from "./useItemDrop";
import "./minigames.css";

const FRUITS = [
  { left: "31%", top: "27%", ripe: true }, { left: "49%", top: "43%", ripe: true }, { left: "65%", top: "29%", ripe: true },
  { left: "25%", top: "45%", ripe: false }, { left: "43%", top: "18%", ripe: false }, { left: "59%", top: "16%", ripe: false },
];
type Props = { picked: number[]; onPick: (index: number) => void; onReplay: () => void; onClose: () => void };

export default function MangoHarvestDialog({ picked, onPick, onReplay, onClose }: Props) {
  const basket = useRef<HTMLButtonElement>(null);
  const [message, setMessage] = useState("Chọn xoài vàng chín, kéo xuống giỏ. Để xoài xanh trên cây nhé!");
  const [mistakes, setMistakes] = useState(0);
  const complete = picked.length >= 3;
  const stars = Math.max(1, 3 - mistakes);
  const drop = useItemDrop(basket, id => {
    const index = Number(id);
    if (picked.includes(index) || !FRUITS[index]?.ripe) return;
    onPick(index);
    setMessage(picked.length === 2 ? "Đủ ba trái chín rồi! Giỏ xoài đẹp quá." : `Thêm một trái vào giỏ! Còn ${2 - picked.length} trái chín trên cây.`);
  }, id => {
    const index = Number(id);
    if (complete || picked.includes(index)) return false;
    if (!FRUITS[index]?.ripe) { setMistakes(n => n + 1); setMessage("Trái này còn xanh. Mình để lại cho chín thêm nhé!"); return false; }
    setMessage("Đúng trái chín rồi! Kéo xuống giỏ, hoặc chạm vào giỏ để cất."); return true;
  });
  const replay = () => { drop.clear(); setMistakes(0); setMessage("Thử một giỏ mới nhé. Chỉ hái những trái vàng chín!"); onReplay(); };
  return <div className="ex-mangoBackdrop mg-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !drop.drag) onClose(); }}><section className="mg-card" role="dialog" aria-modal="true" aria-labelledby="mg-mango-title">
    <header className="mg-header"><div><span>VƯỜN XOÀI CAO LÃNH</span><h2 id="mg-mango-title">Hái một giỏ nắng</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng trò hái xoài" autoFocus><X size={19}/></button></header>
    <div className="mg-harvestScene"><img className="mg-sceneImage" src="/explore/mango-orchard.svg" alt="Vườn xoài dưới nắng" draggable={false}/><div className="mg-counter"><strong>{picked.length} / 3 trái chín</strong></div>
      {FRUITS.map((fruit, index) => picked.includes(index) ? null : <button key={index} {...drop.bind(String(index))} className={`mg-fruit ${drop.selected === String(index) ? "is-selected" : ""}`} style={{ left: fruit.left, top: fruit.top, ...drop.bind(String(index)).style }} aria-label={`Xoài ${fruit.ripe ? "vàng chín" : "còn xanh"} số ${index + 1}`} disabled={complete}><img src={fruit.ripe ? "/explore/mango-ripe.svg" : "/explore/mango-green.svg"} alt="" draggable={false}/></button>)}
      <button ref={basket} className={`mg-basket ${drop.selected !== null ? "is-ready" : ""}`} onClick={drop.placeSelected} aria-label={`Cất xoài đã chọn vào giỏ. Đang có ${picked.length} trên 3 trái.`}><div className="mg-basketFruit" aria-hidden="true">{picked.map((id, i) => <img key={id} className="mg-picked" src="/explore/mango-ripe.svg" alt="" style={{ left: `${20 + i * 20}%`, rotate: `${i * 16 - 18}deg` }}/>)}</div><img src="/explore/harvest-basket.svg" alt="" draggable={false}/><span>{drop.selected !== null ? "THẢ XOÀI VÀO ĐÂY" : "GIỎ CỦA BẠN"}</span></button>
    </div>
    <div className="mg-feedback" role="status"><p>{complete ? "Giỏ xoài đã đầy!" : message}</p></div>
    <footer className="mg-footer">{complete ? <><div className="mg-result"><span className="mg-stars" aria-label={`${stars} trên 3 sao`}>{[1, 2, 3].map(i => <Star key={i} size={18} fill={i <= stars ? "currentColor" : "none"}/>)}</span><strong>{mistakes === 0 ? "Tinh mắt nhà vườn!" : "Giỏ xoài đã đầy!"}</strong></div><button className="mg-secondary" onClick={replay}><RotateCcw size={14}/>Chơi lại</button></> : <small>Có thể chạm trái xoài rồi chạm giỏ, hoặc kéo thả.</small>}<button className="mg-primary" onClick={onClose}>{complete ? "Mang giỏ về" : "Về vườn"}</button></footer>
  </section></div>;
}
