"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { lockPageScroll } from "@/lib/ui/scroll-lock";
import "./ugc-demo.css";

const demo = "/AQMk9qe369KsMqlobyVnbZekwYeB2Z-oZE2toXMr-NsL1JJnrIff_-i2JDYaHwExUJsVbQY5-x8Tg5Q8TdMSPlWSfyRu9-AuCPiqMQ34DlYAdQ.mp4";

export default function UGCDemoButton() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    if (!modal) return;
    modal.showModal();
    const unlock = lockPageScroll();
    return () => { modal.close(); unlock(); trigger.current?.focus(); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className="ugc-button ugc-buttonDemo" aria-haspopup="dialog" onClick={()=>setOpen(true)}><Play size={17}/> Xem demo</button>
    {open&&<dialog ref={dialog} className="ugc-demoModal" aria-labelledby="ugc-demo-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget){const bounds=event.currentTarget.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)setOpen(false);}}}>
      <header><div><span>XOÀI CÓ GU, HÁT CÓ VIBE!</span><h2 id="ugc-demo-title">Một chút vibe để bắt đầu</h2></div><button type="button" aria-label="Đóng video demo" onClick={()=>setOpen(false)} autoFocus><X size={21}/></button></header>
      <video src={demo} controls playsInline autoPlay preload="metadata" aria-label="Video demo UGC Cover Challenge"/>
    </dialog>}
  </>;
}
