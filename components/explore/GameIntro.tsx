"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Play, RotateCcw } from "lucide-react";
import { PROLOGUE } from "./story";

type Props = { ready: boolean; hasSave: boolean; chapter: string; onStart: () => void; onResume: () => void; desktop: boolean };

export default function GameIntro({ ready, hasSave, chapter, onStart, onResume, desktop }: Props) {
  const [page, setPage] = useState(-1);
  const [confirmNew, setConfirmNew] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { if(ready)panel.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, [page, confirmNew, ready]);
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") { setPage(-1); setConfirmNew(false); }
    if (event.key !== "Tab") return;
    const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    if (!buttons?.length) return;
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const scene = page >= 0 ? PROLOGUE[page] : null;
  return <div className={`ex-gameIntro${ready ? " is-ready" : ""}`} role="dialog" aria-modal="true" aria-labelledby="ex-titleScreen" aria-busy={!ready} inert={!ready} ref={panel} onKeyDown={keys}>
    <div className="ex-introFade" aria-hidden="true"/>
    <div className="ex-introLandscape" aria-hidden="true"><img src="/explore/mango-orchard.svg" alt=""/><div/><img className="ex-introHut" src="/explore/map-hut.svg" alt=""/></div>
    <span className="ex-introEdition">MỘT CHUYẾN ĐI VỀ MIỀN TÂY</span>
    {scene ? <section className="ex-prologue" key={page}><span>{scene.kicker}</span><img src={scene.image} alt=""/><h2 id="ex-titleScreen">{scene.title}</h2><p>{scene.text}</p><div className="ex-prologueDots" aria-label={`Đoạn ${page + 1} trên ${PROLOGUE.length}`}>{PROLOGUE.map((_, i) => <i key={i} className={page === i ? "is-current" : ""}/>)}</div><div className="ex-prologueActions"><button onClick={() => setPage(page - 1)}><ArrowLeft size={15}/>Quay lại</button><button className="ex-introPrimary" onClick={() => page === PROLOGUE.length - 1 ? onStart() : setPage(page + 1)}>{page === PROLOGUE.length - 1 ? "Lên đường thôi" : "Tiếp tục"}<ArrowRight size={16}/></button></div><button className="ex-introSkip" onClick={onStart}>Bỏ qua lời dẫn, vào chơi</button></section>
      : <section className="ex-titleMenu"><p>CAO LÃNH · ĐỒNG THÁP</p><h1 id="ex-titleScreen">VỊ XOÀI<span>DẪN LỐI</span></h1><div className="ex-titleRule"><i/>MỘT GIỎ NẮNG, MỘT CHUYẾN ĐI<i/></div><p className="ex-titleDescription">Ghé vườn, xuống xuồng, phụ một tay ở chợ quê.<br/>Mang về những câu chuyện của riêng mình.</p>
        {confirmNew ? <div className="ex-newGameConfirm"><p>Bắt đầu chuyến đi mới sẽ thay thế tiến độ đang lưu trên trình duyệt này.</p><button className="ex-introPrimary" onClick={() => { setConfirmNew(false); setPage(0); }}>Bắt đầu chuyến mới</button><button onClick={() => setConfirmNew(false)}>Giữ chuyến đi hiện tại</button></div> : <div className="ex-titleButtons">{hasSave && <><button className="ex-introPrimary" onClick={onResume}><Play size={17}/>Tiếp tục hành trình</button><small>{chapter}</small></>}<button className={hasSave ? "ex-introSecondary" : "ex-introPrimary"} onClick={() => hasSave ? setConfirmNew(true) : setPage(0)}>{hasSave ? <RotateCcw size={16}/> : <Play size={17}/>} {hasSave ? "Một chuyến đi mới" : "Bắt đầu hành trình"}</button></div>}
      </section>}
    <footer className="ex-introControls"><span>{desktop ? "WASD / ↑ ↓ ← →  Di chuyển" : "Chạm bản đồ hoặc dùng phím điều hướng"}</span><span>{desktop ? "E  Tương tác · Esc  Đóng" : "Chạm nút E để tương tác"}</span></footer>
  </div>;
}

export function StoryEnding({ onContinue }: { onContinue: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { button.current?.focus(); }, []);
  return <div className="ex-storyEnding" role="dialog" aria-modal="true" aria-labelledby="ex-ending-title" onKeyDown={e => { e.stopPropagation(); if (e.key === "Escape") onContinue(); if (e.key === "Tab") { e.preventDefault(); button.current?.focus(); } }}><section><img src="/explore/harvest-basket.svg" alt=""/><span>HÀNH TRÌNH CHÍNH ĐÃ HOÀN THÀNH</span><h2 id="ex-ending-title">Bạn mang về<br/>nhiều hơn một giỏ xoài.</h2><p>Một chiếc bánh tự tay gói, một chuyến xuồng giữa rừng tràm và những người đã nhớ tên bạn. Cao Lãnh vẫn ở đây, đợi một lần ghé nữa.</p><button ref={button} className="ex-introPrimary" onClick={onContinue}>Đi chơi thêm một chút<ArrowRight size={16}/></button></section></div>;
}
