"use client";
import { useRef, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import { ticketNameFont } from '@/lib/tickets/name-style';
import { TICKET_STICKER_ASSETS, type TicketDesign, type TicketSticker } from '@/lib/tickets/types';

type MoveSticker = (id: string, x: number, y: number) => void;
type ResizeSticker = (id: string, size: number, x: number, y: number) => void;
type SelectSticker = (id: string | null) => void;

function clampPosition(sticker: TicketSticker, x: number, y: number, width: number, height: number) {
 const rotatedFactor = Math.abs(Math.cos(sticker.rotation * Math.PI / 180)) + Math.abs(Math.sin(sticker.rotation * Math.PI / 180));
 const marginX = sticker.size * rotatedFactor / 2;
 const marginY = sticker.size * width / height * rotatedFactor / 2;
 return {
  x: Math.min(100 - marginX, Math.max(marginX, x)),
  y: Math.min(100 - marginY, Math.max(marginY, y)),
 };
}

function StickerImage({sticker,interactive,selected,onMove,onResize,onSelect}:{sticker:TicketSticker;interactive:boolean;selected:boolean;onMove?:MoveSticker;onResize?:ResizeSticker;onSelect?:SelectSticker}) {
 const moveDrag=useRef<{pointerId:number;startX:number;startY:number;x:number;y:number;width:number;height:number}|null>(null);
 const resizeDrag=useRef<{pointerId:number;startX:number;startY:number;size:number;x:number;y:number;width:number;height:number;sx:number;sy:number}|null>(null);
 const asset=TICKET_STICKER_ASSETS.find(choice=>choice.id===sticker.asset);
 const rotation=Number.isFinite(sticker.rotation)?sticker.rotation:0;
 const style:CSSProperties={position:'absolute',left:`${sticker.x}%`,top:`${sticker.y}%`,width:`${sticker.size}%`,aspectRatio:'1',transform:`translate(-50%,-50%) rotate(${rotation}deg)`,zIndex:20};
 if(!asset) return sticker.emoji ? <span aria-hidden="true" style={style} className="grid place-items-center text-[7cqw]">{sticker.emoji}</span> : null;
 // eslint-disable-next-line @next/next/no-img-element -- Preserve the source pixels in exported print artwork.
 const image=<img src={asset.src} alt="" draggable={false} className="pointer-events-none h-full w-full select-none object-contain"/>;
 if(!interactive||!onMove||!onSelect) return <span aria-hidden="true" data-ticket-sticker style={style}>{image}</span>;
 const onMovePointerDown=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const bounds=event.currentTarget.parentElement?.getBoundingClientRect();
  if(!bounds)return;
  event.preventDefault();event.stopPropagation();onSelect(sticker.id);event.currentTarget.setPointerCapture(event.pointerId);
  moveDrag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:sticker.x,y:sticker.y,width:bounds.width,height:bounds.height};
 };
 const onMovePointerMove=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const start=moveDrag.current;if(!start||start.pointerId!==event.pointerId||!onMove)return;
  const next=clampPosition(sticker,start.x+(event.clientX-start.startX)/start.width*100,start.y+(event.clientY-start.startY)/start.height*100,start.width,start.height);onMove(sticker.id,next.x,next.y);
 };
 const onKeyDown=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
  if(!onMove||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();const bounds=event.currentTarget.parentElement?.getBoundingClientRect();if(!bounds)return;
  const step=event.shiftKey?3:1;const next=clampPosition(sticker,sticker.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),sticker.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0),bounds.width,bounds.height);onMove(sticker.id,next.x,next.y);
 };
 const handlePointerDown=(sx:number,sy:number)=>(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const bounds=event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();if(!bounds||!onResize)return;
  event.preventDefault();event.stopPropagation();onSelect(sticker.id);event.currentTarget.setPointerCapture(event.pointerId);
  resizeDrag.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,size:sticker.size,x:sticker.x,y:sticker.y,width:bounds.width,height:bounds.height,sx,sy};
 };
 const handlePointerMove=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const start=resizeDrag.current;if(!start||start.pointerId!==event.pointerId||!onResize)return;
  const delta=((event.clientX-start.startX)*start.sx+(event.clientY-start.startY)*start.sy)/2;
  const size=Math.max(2,Math.min(22,start.size+delta/start.width*100));
  const aspect=start.width/start.height;const anchorX=start.x-start.sx*start.size/2;const anchorY=start.y-start.sy*start.size*aspect/2;
  const x=anchorX+start.sx*size/2;const y=anchorY+start.sy*size*aspect/2;onResize(sticker.id,size,x,y);
 };
 const stopResize=()=>{resizeDrag.current=null;};
 const corners=[
  {name:'trên trái',sx:-1,sy:-1,position:'-left-1.5 -top-1.5'},
  {name:'trên phải',sx:1,sy:-1,position:'-right-1.5 -top-1.5'},
  {name:'dưới trái',sx:-1,sy:1,position:'-left-1.5 -bottom-1.5'},
  {name:'dưới phải',sx:1,sy:1,position:'-right-1.5 -bottom-1.5'},
 ];
 return <>
  <button type="button" data-ticket-sticker aria-label={`Hình dán ${asset.label}. Kéo để di chuyển; dùng phím mũi tên để chỉnh.`} title={`${asset.label} · Kéo để di chuyển`} onPointerDown={onMovePointerDown} onPointerMove={onMovePointerMove} onPointerUp={()=>{moveDrag.current=null;}} onPointerCancel={()=>{moveDrag.current=null;}} onKeyDown={onKeyDown} onClick={()=>onSelect(sticker.id)} style={style} className="absolute touch-none appearance-none border-0 bg-transparent p-0 cursor-grab active:cursor-grabbing focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2e6b43]">{image}</button>
  {selected&&<div data-export-ignore aria-hidden="false" className="pointer-events-none absolute" style={{...style,zIndex:30}}>
   <span className="absolute inset-0 border border-dashed border-[#39704d]" />
   {corners.map(corner=><button key={corner.name} type="button" aria-label={`Đổi kích thước, góc ${corner.name}`} onPointerDown={handlePointerDown(corner.sx,corner.sy)} onPointerMove={handlePointerMove} onPointerUp={stopResize} onPointerCancel={stopResize} className={`pointer-events-auto absolute ${corner.position} h-3 w-3 touch-none rounded-[3px] border-2 border-[#39704d] bg-white shadow-sm`} />)}
  </div>}
 </>;
}

export default function TicketPreview({design,className='',rootRef,onStickerMove,onStickerResize,onStickerSelect,selectedStickerId}:{design:TicketDesign;className?:string;rootRef?:Ref<HTMLDivElement>;onStickerMove?:MoveSticker;onStickerResize?:ResizeSticker;onStickerSelect?:SelectSticker;selectedStickerId?:string|null}) {
 const name=design.to.trim()||'Tên của bạn';
 return <div ref={rootRef} data-ticket-preview role={onStickerMove?'group':'img'} aria-label={`Vé chu du dành cho ${name}. ${design.message}`} onPointerDown={event=>{if(event.target===event.currentTarget)onStickerSelect?.(null);}} style={{containerType:'inline-size',background:"white url('/template-ticket.jpg') center / 100% 100% no-repeat"} as CSSProperties} className={`relative overflow-hidden ${className}`}>
 {design.stickers.map(sticker=><StickerImage key={sticker.id} sticker={sticker} interactive={Boolean(onStickerMove)} selected={selectedStickerId===sticker.id} onMove={onStickerMove} onResize={onStickerResize} onSelect={onStickerSelect}/>) }
 <div data-ticket-content className="absolute left-[36%] right-[14%] top-[33.2%] z-10 flex h-[11.5%] items-center justify-center bg-[#fef8e2] px-[1%] text-center"><span className="block w-full font-bold leading-tight text-black" style={{fontFamily:ticketNameFont(design.theme.nameFont),color:design.theme.ink,fontSize:`${name.length>32?2.7:name.length>24?3.3:4}cqw`,overflowWrap:'anywhere'}}>{name}</span></div>
 <div className="absolute left-[35%] right-[13%] top-[47%] z-10 flex h-[16%] items-center justify-center text-center"><p className="whitespace-pre-line italic leading-relaxed text-[#527b36]" style={{fontFamily:'"Times New Roman", serif',fontSize:'1.75cqw'}}>{design.message}</p></div>
 <div className="absolute left-[67%] right-[13%] top-[64%] z-10 flex h-[9%] items-center justify-center bg-[#fef8e2] px-[0.5%] text-center font-serif italic leading-tight text-[#659c40]" style={{fontSize:'0.9cqw'}}>
  <span className="whitespace-pre-line">Đại học FPT TP. Hồ Chí Minh{"\n"}Lô E2a-7, Đường D1, Khu Công nghệ cao,{"\n"}Phường Tăng Nhơn Phú, TP. Hồ Chí Minh</span>
 </div>
 </div>;
}
