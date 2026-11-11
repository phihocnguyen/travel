"use client";
import { useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import { ticketNameFont } from '@/lib/tickets/name-style';
import { TICKET_STICKER_ASSETS, type TicketDesign, type TicketSticker } from '@/lib/tickets/types';

type MoveSticker = (id: string, x: number, y: number) => void;

function clampPosition(sticker: TicketSticker, x: number, y: number, width: number, height: number) {
 const rotatedFactor = Math.abs(Math.cos(sticker.rotation * Math.PI / 180)) + Math.abs(Math.sin(sticker.rotation * Math.PI / 180));
 const marginX = sticker.size * rotatedFactor / 2;
 const marginY = sticker.size * width / height * rotatedFactor / 2;
 return {
  x: Math.min(100 - marginX, Math.max(marginX, x)),
  y: Math.min(100 - marginY, Math.max(marginY, y)),
 };
}

function StickerImage({sticker,interactive,onMove}:{sticker:TicketSticker;interactive:boolean;onMove?:MoveSticker}) {
 const drag=useRef<{pointerId:number;startX:number;startY:number;x:number;y:number;width:number;height:number}|null>(null);
 const asset=TICKET_STICKER_ASSETS.find(choice=>choice.id===sticker.asset);
 const style:CSSProperties={position:'absolute',left:`${sticker.x}%`,top:`${sticker.y}%`,width:`${sticker.size}%`,aspectRatio:'1',transform:`translate(-50%,-50%) rotate(${sticker.rotation}deg)`,zIndex:20};
 if(!asset) return sticker.emoji ? <span aria-hidden="true" style={style} className="grid place-items-center text-[7cqw]">{sticker.emoji}</span> : null;
 const image=<img src={asset.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain"/>;
 if(!interactive||!onMove) return <span aria-hidden="true" data-ticket-sticker style={style}>{image}</span>;
 const onPointerDown=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const bounds=event.currentTarget.parentElement?.getBoundingClientRect();
  if(!bounds||!onMove)return;
  event.preventDefault();
  event.currentTarget.setPointerCapture(event.pointerId);
  drag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:sticker.x,y:sticker.y,width:bounds.width,height:bounds.height};
 };
 const onPointerMove=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const start=drag.current;
  if(!start||start.pointerId!==event.pointerId||!onMove)return;
  const next=clampPosition(sticker,start.x+(event.clientX-start.startX)/start.width*100,start.y+(event.clientY-start.startY)/start.height*100,start.width,start.height);
  onMove(sticker.id,next.x,next.y);
 };
 const onKeyDown=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
  if(!onMove||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  const bounds=event.currentTarget.parentElement?.getBoundingClientRect();
  if(!bounds)return;
  const step=event.shiftKey?3:1;
  const next=clampPosition(sticker,sticker.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),sticker.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0),bounds.width,bounds.height);
  onMove(sticker.id,next.x,next.y);
 };
 return <button type="button" data-ticket-sticker aria-label={`Hình dán ${asset.label}. Kéo hoặc dùng phím mũi tên để di chuyển.`} title={`${asset.label} · Kéo để di chuyển`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={onKeyDown} style={style} className="absolute touch-none appearance-none border-0 bg-transparent p-0 cursor-grab active:cursor-grabbing focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e6b43]">{image}</button>;
}

export default function TicketPreview({design,className='',rootRef,onStickerMove}:{design:TicketDesign;className?:string;rootRef?:Ref<HTMLDivElement>;onStickerMove?:MoveSticker}) {
 const name=design.to.trim()||'Tên của bạn';
 return <div ref={rootRef} data-ticket-preview role={onStickerMove?'group':'img'} aria-label={`Vé chu du dành cho ${name}. ${design.message}`} style={{containerType:'inline-size',background:"white url('/template-ticket.jpg') center / 100% 100% no-repeat"} as CSSProperties} className={`relative overflow-hidden ${className}`}>
 <div data-ticket-content className="absolute left-[36%] right-[14%] top-[33.2%] flex h-[11.5%] items-center justify-center bg-[#fef8e2] px-[1%] text-center"><span className="block w-full font-bold leading-tight text-black" style={{fontFamily:ticketNameFont(design.theme.nameFont),color:design.theme.ink,fontSize:`${name.length>32?2.7:name.length>24?3.3:4}cqw`,overflowWrap:'anywhere'}}>{name}</span></div>
 <div className="absolute left-[35%] right-[13%] top-[47%] flex h-[16%] items-center justify-center text-center"><p className="whitespace-pre-line italic leading-relaxed text-[#527b36]" style={{fontFamily:'"Times New Roman", serif',fontSize:'1.75cqw'}}>{design.message}</p></div>
 <div className="absolute left-[63%] right-[5%] top-[62%] flex h-[12%] items-center justify-center bg-[#fff9e3] px-[1%] text-center font-serif italic leading-tight text-[#659c40]" style={{fontSize:'1.1cqw'}}>
  <span className="whitespace-pre-line">Đại học FPT TP. Hồ Chí Minh{"\n"}Lô E2a-7, Đường D1, Khu Công nghệ cao,{"\n"}Phường Tăng Nhơn Phú, TP. Hồ Chí Minh</span>
 </div>
 {design.stickers.map(sticker=><StickerImage key={sticker.id} sticker={sticker} interactive={Boolean(onStickerMove)} onMove={onStickerMove}/>) }
 </div>;
}
