"use client";
import { useEffect,useLayoutEffect,useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

const BUTTONS='button:not(:disabled), [role="button"]:not([aria-disabled="true"]), a[data-cursor-magnet]';
export default function SiteCursor(){
  const pathname=usePathname(),dot=useRef<HTMLDivElement>(null),ring=useRef<HTMLDivElement>(null),overlay=useRef<HTMLDivElement>(null);
  const last=useRef({x:0,y:0,known:false});
  useLayoutEffect(()=>{
    const html=document.documentElement;
    html.dataset.sitePage=pathname.startsWith("/dashboard")?"dashboard":pathname==="/blog"||pathname.startsWith("/blog/")?"blog":"public";
    return ()=>{delete html.dataset.sitePage;};
  },[pathname]);
  useEffect(()=>{
    const dotNode=dot.current,ringNode=ring.current,root=overlay.current,html=document.documentElement;
    const publicPage=pathname==="/"||pathname==="/map"||pathname==="/blog"||pathname.startsWith("/blog/");
    const fine=window.matchMedia("(pointer: fine) and (hover: hover)");
    if(!dotNode||!ringNode||!root)return;
    const nodes=[dotNode,ringNode],reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hide=()=>{html.removeAttribute("data-site-cursor-active");root.dataset.magnet="none";gsap.set(nodes,{autoAlpha:0});};
    hide();
    if(!publicPage||!fine.matches)return hide;
    gsap.set(nodes,{xPercent:-50,yPercent:-50});
    gsap.set(ringNode,{scale:1});
    const dotX=gsap.quickSetter(dotNode,"x","px"),dotY=gsap.quickSetter(dotNode,"y","px");
    const ringX=gsap.quickSetter(ringNode,"x","px"),ringY=gsap.quickSetter(ringNode,"y","px");
    let previousButton:Element|null=null;
    const place=(x:number,y:number,target:Element|null)=>{
      // Inputs keep their native caret; image and text targets never attract.
      if(target?.closest('input,textarea,select,[contenteditable="true"],dialog')){hide();return;}
      let button=target?.closest<HTMLElement>(BUTTONS)??null;
      if(target?.closest("img,picture,[role=img]")||button?.querySelector("img,picture,[role=img]"))button=null;
      let px=x,py=y;
      if(button&&!reduced){const bounds=button.getBoundingClientRect();px+=gsap.utils.clamp(-5,5,(bounds.left+bounds.width/2-x)*0.18);py+=gsap.utils.clamp(-5,5,(bounds.top+bounds.height/2-y)*0.18);}
      // Only the cursor moves. No transforms are ever applied to text/images/buttons.
      dotX(px);dotY(py);ringX(px);ringY(py);
      gsap.set(nodes,{autoAlpha:1});html.setAttribute("data-site-cursor-active","true");root.dataset.magnet=button?"button":"none";
      if(button!==previousButton){gsap.to(ringNode,{scale:button?1.35:1,duration:reduced?0:0.15,overwrite:true});previousButton=button;}
    };
    if(last.current.known)place(last.current.x,last.current.y,document.elementFromPoint(last.current.x,last.current.y));
    const move=(event:PointerEvent)=>{if(event.pointerType!=="mouse"||!fine.matches){hide();return;}last.current={x:event.clientX,y:event.clientY,known:true};place(event.clientX,event.clientY,event.target instanceof Element?event.target:null);};
    const leave=()=>hide();
    const key=(event:KeyboardEvent)=>{if(event.key==="Tab")hide();};
    const change=()=>{if(!fine.matches)hide();};
    window.addEventListener("pointermove",move,{passive:true});document.addEventListener("pointerleave",leave);window.addEventListener("blur",leave);window.addEventListener("keydown",key);fine.addEventListener("change",change);
    return ()=>{window.removeEventListener("pointermove",move);document.removeEventListener("pointerleave",leave);window.removeEventListener("blur",leave);window.removeEventListener("keydown",key);fine.removeEventListener("change",change);gsap.killTweensOf(nodes);hide();};
  },[pathname]);
  return <div ref={overlay} data-site-cursor data-magnet="none" aria-hidden className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden">
    <div ref={ring} data-cursor-ring className="absolute left-0 top-0 h-7 w-7 rounded-full border border-[#8b946c] opacity-0"/>
    <div ref={dot} data-cursor-dot className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-[#c09a35] opacity-0"/>
  </div>;
}
