"use client";
import { useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import { useItemDrop } from "./useItemDrop";
import "./minigames.css";

type Props = { prepared: number; onPrepare: () => void; onReplay: () => void; onClose: () => void };
export default function LotusPrepDialog({ prepared, onPrepare, onReplay, onClose }: Props) {
  const [peeled, setPeeled] = useState(false);
  const tray = useRef<HTMLButtonElement>(null);
  const complete = prepared >= 3;
  const drop = useItemDrop(tray, () => { if (!peeled || complete) return; onPrepare(); setPeeled(false); }, () => peeled && !complete);
  return <div className="ex-mangoBackdrop mg-backdrop"><section className="mg-card mg-ruralCard" role="dialog" aria-modal="true" aria-labelledby="mg-lotus-title">
    <header className="mg-header"><div><span>ĐỒNG SEN · MỘT VIỆC NHỎ Ở QUÊ</span><h2 id="mg-lotus-title">Khéo tay tách tâm sen</h2></div><button className="mg-close" onClick={onClose} aria-label="Đóng trò tách tâm sen" autoFocus><X size={19}/></button></header>
    <div className="mg-lotusScene"><img className="mg-lotusDecor" src="/explore/map-lotus.svg" alt=""/><span className="mg-counter">{prepared} / 3 hạt sen</span>
      {!complete && <><button className="mg-lotusSeed" disabled={peeled} onClick={() => setPeeled(true)} aria-label="Bóc vỏ hạt sen"><svg viewBox="0 0 160 190" fill="none" aria-hidden="true"><ellipse cx="80" cy="167" rx="57" ry="12" fill="#8b865b" opacity=".18"/><path d="M80 19c61 0 70 100 35 133-22 21-51 21-73-1C9 118 19 19 80 19Z" fill={peeled ? "#f1e4bc" : "#9ca268"} stroke={peeled ? "#c3ad77" : "#737e50"} strokeWidth="3"/><path d="M81 25v126" stroke={peeled ? "#c8bd90" : "#717b4d"} strokeWidth="3"/><path d="M51 45q-20 30-13 58" stroke={peeled ? "#fff5d7" : "#bdc48b"} strokeWidth="8" strokeLinecap="round"/></svg>{!peeled && <span>Chạm để bóc vỏ</span>}</button>{peeled && <button className="mg-lotusCore" {...drop.bind("core")} aria-label="Chọn tâm sen xanh để bỏ vào khay"><svg viewBox="0 0 40 90" fill="none" aria-hidden="true"><path d="M20 80V19" stroke="#648543" strokeWidth="6" strokeLinecap="round"/><path d="M20 36Q-1 19 9 6 23 10 20 36ZM21 48q25-18 13-31-16 8-13 31Z" fill="#87a45b"/></svg></button>}</>}
      <button ref={tray} className={`mg-coreTray ${drop.selected ? "is-ready" : ""}`} onClick={drop.placeSelected} aria-label="Đặt tâm sen đã chọn vào khay"><span>KHAY TÂM SEN</span><div aria-hidden="true">{Array.from({ length: prepared }, (_, i) => <i key={i}/>)}</div><small>{drop.selected ? "Thả hoặc chạm vào đây" : "Để riêng phần tâm xanh"}</small></button>
      {complete && <div className="mg-courseOverlay"><strong>Ba hạt sen đã sẵn sàng!</strong><p>Hạt để riêng, tâm xanh vào khay. Một chút tỉ mỉ làm nên hương vị quê nhà.</p><button className="mg-primary" onClick={() => { drop.clear(); setPeeled(false); onReplay(); }}><RotateCcw size={14}/>Làm thêm một mẻ</button></div>}
    </div><div className="mg-feedback" role="status"><p>{complete ? "Đã hoàn thành mẻ hạt sen!" : peeled ? "Kéo tâm sen xanh sang khay, hoặc chọn tâm rồi chạm vào khay." : "Bóc vỏ hạt sen trước, rồi tách riêng phần tâm xanh."}</p></div><footer className="mg-footer"><small>Một trò chơi mô phỏng công việc bên đồng sen.</small><button className="mg-primary" onClick={onClose}>Về đồng sen</button></footer>
  </section></div>;
}
