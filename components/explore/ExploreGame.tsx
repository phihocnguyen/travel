"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Camera, Compass, DoorOpen, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { renderInterior, renderWorld } from "./pixelWorld";
import { ACTIVITIES, INTERIOR, PHOTO_SPOTS, QUIZZES, STOPS, WORKERS, WORLD, XEO_QUYT_RIVER, isHouse, isRiver, type Stop } from "./world";
import { LOCAL_PHOTOS } from "@/lib/photos/catalog";
import "./explore.css";

type Player = { x: number; y: number; dir: number; moving: boolean };
const START: Player = { x: 770, y: 540, dir: 0, moving: false };
const SAVE_KEY = "cao-lanh-explore-stamps-v1";
const MOVE_KEYS: Record<string, [number, number]> = { ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0] };

export default function ExploreGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>({...START});
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef<[number,number]>([0,0]);
  const destinationRef = useRef<{x:number;y:number}|null>(null);
  const viewRef = useRef({x:0,y:0,w:960,h:560});
  const nearRef = useRef<Stop|null>(null);
  const spotRef = useRef<number|null>(null);
  const workerRef = useRef<number|null>(null);
  const activityRef = useRef(false);
  const quizRef = useRef(false);
  const exitRef = useRef(false);
  const nearBoatRef = useRef(false);
  const boatSideRef = useRef<"east"|"west">("east");
  const crossingRef = useRef<{from:"east"|"west";started:number}|null>(null);
  const ceremonyRef = useRef<number|null>(null);
  const ceremonyDoneRef = useRef(false);
  const seenRef = useRef<Set<string>>(new Set());
  const [inside,setInside] = useState<Stop|null>(null);
  const [nearSpot,setNearSpot] = useState<number|null>(null);
  const [nearWorker,setNearWorker] = useState<number|null>(null);
  const [nearActivity,setNearActivity] = useState(false);
  const [nearQuiz,setNearQuiz] = useState(false);
  const [nearExit,setNearExit] = useState(false);
  const [nearBoat,setNearBoat] = useState(false);
  const [boatSide,setBoatSide] = useState<"east"|"west">("east");
  const [crossing,setCrossing] = useState(false);
  const [ceremony,setCeremony] = useState(false);
  const [photoIndex,setPhotoIndex] = useState<number|null>(null);
  const [dialogue,setDialogue] = useState<{worker:number;line:number}|null>(null);
  const [activityProgress,setActivityProgress] = useState<Record<string,number>>({});
  const [quizId,setQuizId] = useState<string|null>(null);
  const [quizIndex,setQuizIndex] = useState(0);
  const [quizChoice,setQuizChoice] = useState<number|null>(null);
  const [quizScore,setQuizScore] = useState(0);
  const [quizResults,setQuizResults] = useState<Record<string,number>>({});
  const [toast,setToast] = useState("");
  const visitedRef = useRef<Set<string>>(new Set());
  const [visited,setVisited] = useState<string[]>([]);
  const [near,setNear] = useState<Stop|null>(null);
  const [journal,setJournal] = useState(false);
  const [intro,setIntro] = useState(true);
  const [sound,setSound] = useState(false);
  const [mounted,setMounted] = useState(false);
  const [position,setPosition] = useState({x:START.x,y:START.y});
  const audioRef = useRef<AudioContext|null>(null);
  const renderStateRef=useRef({inside:inside as Stop|null,photoIndex:photoIndex as number|null,dialogue:dialogue as {worker:number;line:number}|null,intro,journal,activityProgress,quizId});
  useEffect(()=>{renderStateRef.current={inside,photoIndex,dialogue,intro,journal,activityProgress,quizId};},[inside,photoIndex,dialogue,intro,journal,activityProgress,quizId]);

  useEffect(()=>{
    try { const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"[]"); if(Array.isArray(saved)){const clean=saved.filter((id:unknown)=>typeof id==="string"&&STOPS.some(s=>s.id===id));visitedRef.current=new Set(clean);setVisited(clean);} } catch { /* a fresh passport is fine */ }
    setMounted(true);
  },[]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(""),2200);return()=>window.clearTimeout(timer);},[toast]);

  const blip = useCallback(()=>{
    if(!sound) return;
    try { const audio=audioRef.current ?? new AudioContext(); audioRef.current=audio; void audio.resume(); const osc=audio.createOscillator(), gain=audio.createGain(); osc.type="square";osc.frequency.setValueAtTime(520,audio.currentTime);osc.frequency.setValueAtTime(780,audio.currentTime+.09);gain.gain.setValueAtTime(.025,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.18); } catch { /* audio is optional */ }
  },[sound]);

  const enterStop = useCallback((stop:Stop|null)=>{
    if(!stop) return;
    if(crossingRef.current)return;
    renderStateRef.current.inside=stop;
    setInside(stop);setIntro(false);setPhotoIndex(null);setDialogue(null);setQuizId(null);setNear(null);nearRef.current=null;spotRef.current=null;workerRef.current=null;activityRef.current=false;quizRef.current=false;exitRef.current=false;
    playerRef.current={x:INTERIOR.entry.x,y:INTERIOR.entry.y,dir:0,moving:false};
    destinationRef.current=null;
    viewRef.current.x=Math.max(0,Math.min(INTERIOR.width-viewRef.current.w,INTERIOR.entry.x-viewRef.current.w/2));
    viewRef.current.y=Math.max(0,Math.min(INTERIOR.height-viewRef.current.h,INTERIOR.entry.y-viewRef.current.h/2));blip();
    if(!visitedRef.current.has(stop.id)){
      const next=new Set(visitedRef.current);next.add(stop.id);visitedRef.current=next;
      const list=Array.from(next);setVisited(list);try{localStorage.setItem(SAVE_KEY,JSON.stringify(list));}catch{}
    }
  },[blip]);

  const leaveStop = useCallback(()=>{
    if(!inside)return;
    renderStateRef.current.inside=null;
    ceremonyRef.current=null;setCeremony(false);
    playerRef.current={x:inside.x,y:inside.y+104,dir:0,moving:false};
    destinationRef.current=null;setInside(null);setPhotoIndex(null);setDialogue(null);setQuizId(null);setNearSpot(null);setNearWorker(null);setNearActivity(false);setNearQuiz(false);setNearExit(false);
    spotRef.current=null;workerRef.current=null;activityRef.current=false;quizRef.current=false;exitRef.current=false;
    viewRef.current.x=Math.max(0,Math.min(WORLD.width-viewRef.current.w,playerRef.current.x-viewRef.current.w/2));
    viewRef.current.y=Math.max(0,Math.min(WORLD.height-viewRef.current.h,playerRef.current.y-viewRef.current.h/2));blip();
  },[inside,blip]);

  const openQuiz=useCallback((id:string)=>{setQuizId(id);setQuizIndex(0);setQuizChoice(null);setQuizScore(0);destinationRef.current=null;blip();},[blip]);
  const chooseQuiz=(choice:number)=>{if(quizChoice!==null||!quizId)return;setQuizChoice(choice);if(choice===QUIZZES[quizId].questions[quizIndex].answer)setQuizScore(score=>score+1);blip();};
  const nextQuiz=()=>{if(!quizId||quizChoice===null)return;if(quizIndex<2){setQuizIndex(index=>index+1);setQuizChoice(null);}else{setQuizResults(prev=>({...prev,[quizId]:quizScore}));setQuizId(null);setToast(`Hoàn thành 3 câu hỏi · đúng ${quizScore}/3`);}};

  const interact=useCallback(()=>{
    if(crossingRef.current||ceremonyRef.current!==null||quizId)return;
    if(photoIndex!==null){setPhotoIndex(null);return;}
    if(dialogue&&inside){if(dialogue.line<WORKERS[inside.id][dialogue.worker].lines.length-1)setDialogue({...dialogue,line:dialogue.line+1});else setDialogue(null);return;}
    if(intro){setIntro(false);return;}
    if(journal)return;
    if(inside){
      if(quizRef.current&&QUIZZES[inside.id]){openQuiz(inside.id);return;}
      if(activityRef.current){
        const activity=ACTIVITIES[inside.id];
        if(!activity)return;
        if(activity.icon==="incense")return;
        const goal=activity.goal??3;const next=Math.min(goal,(activityProgress[inside.id]??0)+1);
        setActivityProgress(prev=>({...prev,[inside.id]:next}));setToast(next===goal?activity.done:`${activity.action} · ${next}/${goal}`);blip();return;
      }
      if(workerRef.current!==null){setDialogue({worker:workerRef.current,line:0});blip();return;}
      if(spotRef.current!==null){seenRef.current.add(`${inside.id}:${spotRef.current}`);setPhotoIndex(spotRef.current);blip();return;}
      if(exitRef.current){leaveStop();return;}
    }
    else if(boatSideRef.current==="east"&&Math.hypot(playerRef.current.x-XEO_QUYT_RIVER.eastDock.x,playerRef.current.y-XEO_QUYT_RIVER.eastDock.y)<68){crossingRef.current={from:"east",started:performance.now()};destinationRef.current=null;setCrossing(true);blip();}
    else if(boatSideRef.current==="west"&&Math.hypot(playerRef.current.x-XEO_QUYT_RIVER.westDock.x,playerRef.current.y-XEO_QUYT_RIVER.westDock.y)<68){crossingRef.current={from:"west",started:performance.now()};destinationRef.current=null;setCrossing(true);blip();}
    else if(nearRef.current)enterStop(nearRef.current);
  },[photoIndex,dialogue,intro,journal,inside,leaveStop,enterStop,blip,activityProgress,quizId,openQuiz]);

  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(event.code in MOVE_KEYS){event.preventDefault();keysRef.current.add(event.code);destinationRef.current=null;}
      if(event.code==="KeyE"||event.code==="Space"){if(!event.repeat){event.preventDefault();interact();}}
      if(event.code==="Escape"){if(quizId)setQuizId(null);else if(photoIndex!==null)setPhotoIndex(null);else if(dialogue)setDialogue(null);else if(journal)setJournal(false);else if(inside)leaveStop();else setIntro(false);}
    };
    const up=(event:KeyboardEvent)=>keysRef.current.delete(event.code);
    const blur=()=>{keysRef.current.clear();touchRef.current=[0,0];};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",blur);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",blur);};
  },[interact,photoIndex,dialogue,journal,inside,leaveStop,quizId]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");if(!ctx)return;
    let raf=0,prev=0,lastUi=0;
    const resize=()=>{
      const box=canvas.getBoundingClientRect();
      const width=Math.max(1,Math.round(box.width)),height=Math.max(1,Math.round(box.height));
      if(canvas.width!==width)canvas.width=width;
      if(canvas.height!==height)canvas.height=height;
      ctx.imageSmoothingEnabled=false;
    };
    resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
    const frame=(time:number)=>{
      const dt=Math.min(40,time-prev||16)/1000;prev=time;
      const scene=renderStateRef.current;
      const inside=scene.inside;
      const p=playerRef.current;let dx=touchRef.current[0],dy=touchRef.current[1];
      for(const code of keysRef.current){const vector=MOVE_KEYS[code];if(vector){dx+=vector[0];dy+=vector[1];}}
      if(dx||dy)destinationRef.current=null;
      const target=destinationRef.current;
      if(!dx&&!dy&&target){const dist=Math.hypot(target.x-p.x,target.y-p.y);if(dist<7)destinationRef.current=null;else{dx=(target.x-p.x)/dist;dy=(target.y-p.y)/dist;}}
      const len=Math.hypot(dx,dy);p.moving=len>.05&&scene.photoIndex===null&&!scene.dialogue&&!scene.intro&&!scene.journal&&!scene.quizId&&!crossingRef.current&&ceremonyRef.current===null;
      const world=inside?INTERIOR:WORLD;
      if(p.moving){const speed=190*dt;const nx=Math.max(35,Math.min((inside?world.width-35:WORLD.width-160),p.x+dx/len*speed));const ny=Math.max(45,Math.min(world.height-36,p.y+dy/len*speed));
        if(inside){p.x=nx;p.y=ny;}else{if(!isRiver(nx,p.y)&&!isHouse(nx,p.y))p.x=nx;if(!isRiver(p.x,ny)&&!isHouse(p.x,ny))p.y=ny;}
        p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):0;}
      const crossingNow=crossingRef.current;
      if(crossingNow){const river=XEO_QUYT_RIVER;const progress=Math.min(1,(time-crossingNow.started)/1900);const eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2;
        const start=crossingNow.from==="east"?river.eastDock:river.westDock;const end=crossingNow.from==="east"?river.westDock:river.eastDock;
        p.x=start.x+(end.x-start.x)*eased;p.y=start.y-9*Math.sin(progress*Math.PI);p.moving=false;
        if(progress>=1){boatSideRef.current=crossingNow.from==="east"?"west":"east";setBoatSide(boatSideRef.current);crossingRef.current=null;setCrossing(false);setToast(crossingNow.from==="east"?"Đã cập bến Xẻo Quýt!":"Đã trở lại bờ bên này.");}}
      if(inside?.id==="sinh-sac"&&ceremonyRef.current!==null&&time-ceremonyRef.current>=2100){ceremonyRef.current=null;ceremonyDoneRef.current=true;setCeremony(false);setActivityProgress(prev=>({...prev,"sinh-sac":1}));setToast(ACTIVITIES["sinh-sac"]!.done);}
      const view=viewRef.current;
      const scale=Math.max(1,canvas.width/world.width,canvas.height/world.height);
      view.w=canvas.width/scale;view.h=canvas.height/scale;
      const tx=Math.max(0,Math.min(Math.max(0,world.width-view.w),p.x-view.w/2));const ty=Math.max(0,Math.min(Math.max(0,world.height-view.h),p.y-view.h/2));
      view.x+=(tx-view.x)*Math.min(1,dt*6);view.y+=(ty-view.y)*Math.min(1,dt*6);
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,0,0);
      if(inside)renderInterior(ctx,view,p,inside,time,seenRef.current,scene.activityProgress[inside.id]??0,ceremonyRef.current===null?null:Math.min(1,(time-ceremonyRef.current)/2100));else {
        const trip=crossingRef.current;const river=XEO_QUYT_RIVER;const boatX=trip?river[trip.from==="east"?"eastBoatX":"westBoatX"]+(river[trip.from==="east"?"westBoatX":"eastBoatX"]-river[trip.from==="east"?"eastBoatX":"westBoatX"])*Math.min(1,(time-trip.started)/1900):river[boatSideRef.current==="east"?"eastBoatX":"westBoatX"];
        renderWorld(ctx,view,p,visitedRef.current,time,boatX,!!trip);
      }
      if(time-lastUi>100){
        lastUi=time;
        if(inside){
          const spot=PHOTO_SPOTS[inside.id].findIndex(s=>Math.hypot(s.x-p.x,s.y-p.y)<67);const index=spot<0?null:spot;
          if(spotRef.current!==index){spotRef.current=index;setNearSpot(index);}
          const worker=WORKERS[inside.id].findIndex(w=>Math.hypot(w.x-p.x,w.y-p.y)<64);const workerIndex=worker<0?null:worker;
          if(workerRef.current!==workerIndex){workerRef.current=workerIndex;setNearWorker(workerIndex);}
          const activity=ACTIVITIES[inside.id];const byActivity=!!activity&&Math.hypot(activity.x-p.x,activity.y-p.y)<70;
          if(activityRef.current!==byActivity){activityRef.current=byActivity;setNearActivity(byActivity);}
          const quiz=QUIZZES[inside.id];const byQuiz=!!quiz&&Math.hypot(quiz.x-p.x,quiz.y-p.y)<65;
          if(quizRef.current!==byQuiz){quizRef.current=byQuiz;setNearQuiz(byQuiz);}
          if(inside.id==="sinh-sac"&&activity&&byActivity&&ceremonyRef.current===null&&!ceremonyDoneRef.current&&(scene.activityProgress[inside.id]??0)===0){ceremonyRef.current=time;destinationRef.current=null;p.x=activity.x;p.y=activity.y+54;p.dir=2;p.moving=false;setCeremony(true);setToast("Đang thắp nhang tưởng niệm…");}
          const byExit=Math.hypot(INTERIOR.exit.x-p.x,INTERIOR.exit.y-p.y)<64;
          if(exitRef.current!==byExit){exitRef.current=byExit;setNearExit(byExit);}
        } else {
          const candidate=STOPS.find(s=>Math.hypot(s.x-p.x,s.y-p.y)<88)||null;
          if(candidate?.id!==nearRef.current?.id){nearRef.current=candidate;setNear(candidate);}
          const dock=boatSideRef.current==="east"?XEO_QUYT_RIVER.eastDock:XEO_QUYT_RIVER.westDock;
          const byBoat=Math.hypot(dock.x-p.x,dock.y-p.y)<68;
          if(byBoat!==nearBoatRef.current){nearBoatRef.current=byBoat;setNearBoat(byBoat);}
        }
        setPosition({x:p.x,y:p.y});
      }
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();};
  },[]);

  const setDirection=(x:number,y:number)=>(event:React.PointerEvent<HTMLButtonElement>)=>{
    event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);touchRef.current=[x,y];destinationRef.current=null;
  };
  const stopDirection=(event:React.PointerEvent<HTMLButtonElement>)=>{event.preventDefault();touchRef.current=[0,0];};
  const clickMap=(event:React.MouseEvent<HTMLCanvasElement>)=>{
    if(photoIndex!==null||dialogue||intro||journal||crossing||ceremony||quizId)return;
    const bounds=event.currentTarget.getBoundingClientRect();const view=viewRef.current;
    const x=view.x+(event.clientX-bounds.left)/bounds.width*view.w;
    const y=view.y+(event.clientY-bounds.top)/bounds.height*view.h;
    if(inside){
      const spot=PHOTO_SPOTS[inside.id].findIndex(s=>Math.hypot(s.x-x,s.y-y)<45);
      const worker=WORKERS[inside.id].findIndex(w=>Math.hypot(w.x-x,w.y-y)<42);
      const activity=ACTIVITIES[inside.id];
      const quiz=QUIZZES[inside.id];
      if(quiz&&Math.hypot(quiz.x-x,quiz.y-y)<43&&Math.hypot(playerRef.current.x-quiz.x,playerRef.current.y-quiz.y)<68){openQuiz(inside.id);return;}
      if(worker>=0&&Math.hypot(playerRef.current.x-WORKERS[inside.id][worker].x,playerRef.current.y-WORKERS[inside.id][worker].y)<65)setDialogue({worker,line:0});
      else if(activity&&activity.icon!=="incense"&&Math.hypot(activity.x-x,activity.y-y)<43&&Math.hypot(playerRef.current.x-activity.x,playerRef.current.y-activity.y)<72)interact();
      else if(spot>=0&&Math.hypot(playerRef.current.x-PHOTO_SPOTS[inside.id][spot].x,playerRef.current.y-PHOTO_SPOTS[inside.id][spot].y)<70){seenRef.current.add(`${inside.id}:${spot}`);setPhotoIndex(spot);}
      else destinationRef.current={x:Math.max(35,Math.min(INTERIOR.width-35,x)),y:Math.max(45,Math.min(INTERIOR.height-36,y))};
    } else {
      const dock=boatSideRef.current==="east"?XEO_QUYT_RIVER.eastDock:XEO_QUYT_RIVER.westDock;
      if(Math.hypot(dock.x-x,dock.y-y)<44&&Math.hypot(playerRef.current.x-dock.x,playerRef.current.y-dock.y)<68){interact();return;}
      const stop=STOPS.find(s=>Math.hypot(s.x-x,s.y-y)<42);
      if(stop&&Math.hypot(playerRef.current.x-stop.x,playerRef.current.y-stop.y)<90)enterStop(stop);else destinationRef.current=isRiver(x,y)?dock:{x:Math.min(WORLD.width-160,x),y};
    }
  };
  const reset=()=>{visitedRef.current=new Set();seenRef.current=new Set();boatSideRef.current="east";crossingRef.current=null;ceremonyRef.current=null;ceremonyDoneRef.current=false;nearBoatRef.current=false;setVisited([]);setActivityProgress({});setQuizResults({});setQuizId(null);setBoatSide("east");setCrossing(false);setCeremony(false);setNearBoat(false);try{localStorage.removeItem(SAVE_KEY);}catch{}playerRef.current={...START};destinationRef.current=null;setJournal(false);setInside(null);setPhotoIndex(null);setDialogue(null);};
  const photos=inside?LOCAL_PHOTOS.filter(p=>p.group===inside.photoGroup):[];
  const selectedSpot=inside&&photoIndex!==null?PHOTO_SPOTS[inside.id][photoIndex]:null;
  const selectedPhoto=selectedSpot?photos[selectedSpot.photoIndex]:null;
  const activity=inside?ACTIVITIES[inside.id]:undefined;

  return <main className={"ex-page"}>
    <header className={"ex-header"}><Link href="/" className={"ex-back"}><ArrowLeft size={16}/> Về trang chủ</Link><span className={"ex-brand"}>VỊ XOÀI DẪN LỐI <span>✦</span> PIXEL ADVENTURE</span><button className={"ex-sound"} onClick={()=>setSound(v=>!v)} aria-label={sound?"Tắt âm thanh":"Bật âm thanh"}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button></header>
    <section className={"ex-hero"}><div><div className={"ex-eyebrow"}><span/> CHƯƠNG 01 · CAO LÃNH, ĐỒNG THÁP</div><h1>Một chuyến đi <em>rất nhỏ,</em><br/>ngàn điều để khám phá</h1><p>Đi theo những con đường màu mật ong, ghé từng trạm dừng và sưu tầm dấu mộc Cao Lãnh.</p></div><div className={"ex-progress"}><span>HỘ CHIẾU HÀNH TRÌNH</span><strong>{String(visited.length).padStart(2,"0")}<small> / {String(STOPS.length).padStart(2,"0")}</small></strong><div className={"ex-progressTrack"}><i style={{width:`${visited.length/STOPS.length*100}%`}}/></div><button onClick={()=>setJournal(true)}>Mở sổ hành trình <ArrowRight size={14}/></button></div></section>
    <section className={"ex-gameShell"} aria-label="Trò chơi phiêu lưu Cao Lãnh">
      <div className={"ex-gameTop"}><span><i/> {inside?`ĐANG Ở TRONG · ${inside.short.toUpperCase()}`:"CAO LÃNH · THẾ GIỚI PIXEL"}</span><span className={"ex-gameTopRight"}><Compass size={14}/> {inside?"KHÁM PHÁ ẢNH THẬT":"TỰ DO KHÁM PHÁ"}</span></div>
      <div className={"ex-stage"}><canvas ref={canvasRef} onClick={clickMap} aria-label="Bản đồ trò chơi; dùng phím mũi tên hoặc W A S D để di chuyển, E để tương tác"/>
        {inside?<>
          <div className={"ex-insideGuide"}><span className={"ex-insideKicker"}><Camera size={13}/> KHU KHÁM PHÁ</span><strong>{inside.name}</strong><p>{inside.prompt}</p><div>{PHOTO_SPOTS[inside.id].map((spot,i)=><button key={spot.label} onClick={()=>{destinationRef.current={x:spot.x,y:spot.y};setPhotoIndex(null);setDialogue(null);}}><span>{seenRef.current.has(`${inside.id}:${i}`)?"✓":"○"}</span>{spot.label}<ArrowRight size={11}/></button>)}</div>{activity&&<button className={"ex-activityJump"} onClick={()=>{destinationRef.current={x:activity.x,y:activity.y+50};setPhotoIndex(null);setDialogue(null);}}>✦ {activity.name} <b>{activityProgress[inside.id]??0}/{activity.goal??3}</b></button>}{QUIZZES[inside.id]&&<button className={"ex-activityJump"} onClick={()=>{const quiz=QUIZZES[inside.id];destinationRef.current={x:quiz.x,y:quiz.y};setPhotoIndex(null);setDialogue(null);}}>▣ Trả lời 3 câu hỏi <b>{quizResults[inside.id]===undefined?"MỚI":`${quizResults[inside.id]}/3`}</b></button>}<p className={"ex-npcHint"}>Gặp người dân có dấu … để nghe kể chuyện.</p></div>
          <button className={"ex-exitTop"} onClick={leaveStop}><DoorOpen size={15}/> Ra bản đồ</button>
          {photoIndex===null&&!journal&&!dialogue&&<>
            {nearActivity&&activity?.icon==="incense"&&ceremony?<div className={"ex-interact"}><span>✦</span> Đang thắp và cắm nhang…</div>
            :nearQuiz?<button className={"ex-interact"} onClick={()=>openQuiz(inside.id)}><BookOpen size={15}/> Nhấn <kbd>E</kbd> trả lời 3 câu hỏi <strong>{quizResults[inside.id]===undefined?"BẮT ĐẦU":`${quizResults[inside.id]}/3 · LÀM LẠI`}</strong></button>
            :nearActivity&&activity?.icon==="incense"?<div className={"ex-interact"}><span>✦</span> {activityProgress[inside.id]?"Đã cắm nhang tưởng niệm":"Bước vào vùng đỏ để thắp nhang"}</div>
            :nearActivity&&activity?<button className={"ex-interact"} onClick={interact}><span>✦</span> Nhấn <kbd>E</kbd> {activity.action} <strong>{activityProgress[inside.id]??0}/{activity.goal??3}</strong></button>
            :nearWorker!==null?<button className={"ex-interact"} onClick={interact}><span>…</span> Nhấn <kbd>E</kbd> trò chuyện <strong>{WORKERS[inside.id][nearWorker].name}</strong></button>
            :nearSpot!==null?<button className={"ex-interact"} onClick={interact}><Camera size={15}/> Nhấn <kbd>E</kbd> xem ảnh thật <strong>{PHOTO_SPOTS[inside.id][nearSpot].label}</strong></button>
            :nearExit?<button className={"ex-interact"} onClick={leaveStop}><DoorOpen size={15}/> Nhấn <kbd>E</kbd> trở ra bản đồ</button>:null}
          </>}
        </>:<>
          <div className={"ex-mapBadge"}>CAO LÃNH <span>● LIVE</span></div>
          <div className={"ex-miniMap"} aria-label="Bản đồ thu nhỏ"><span>BẢN ĐỒ</span><div className={"ex-miniInner"}>{STOPS.map(s=><i key={s.id} className={visited.includes(s.id)?"ex-done":""} style={{left:`${s.x/WORLD.width*100}%`,top:`${s.y/WORLD.height*100}%`}}/>)}<b style={{left:`${position.x/WORLD.width*100}%`,top:`${position.y/WORLD.height*100}%`}}/></div></div>
          {nearBoat&&!intro&&!journal&&!crossing?<button className={"ex-interact"} onClick={interact}><span>🚣</span> Nhấn <kbd>E</kbd> lên xuồng qua sông <strong>{boatSide==="east"?"Đến Xẻo Quýt":"Về bờ"}</strong></button>
          :near&&!intro&&!journal&&!crossing?<button className={"ex-interact"} onClick={()=>enterStop(near)}><DoorOpen size={15}/> Nhấn <kbd>E</kbd> bước vào <strong>{near.short}</strong></button>:null}
          {crossing&&<div className={"ex-interact"}>🚣 Đang chèo xuồng qua sông…</div>}
        </>}
        <div className={"ex-dpad"} aria-label="Điều khiển nhân vật"><button className={"ex-up"} aria-label="Đi lên" onPointerDown={setDirection(0,-1)} onPointerUp={stopDirection} onPointerCancel={stopDirection}>▲</button><button className={"ex-left"} aria-label="Đi trái" onPointerDown={setDirection(-1,0)} onPointerUp={stopDirection} onPointerCancel={stopDirection}>◀</button><button className={"ex-down"} aria-label="Đi xuống" onPointerDown={setDirection(0,1)} onPointerUp={stopDirection} onPointerCancel={stopDirection}>▼</button><button className={"ex-right"} aria-label="Đi phải" onPointerDown={setDirection(1,0)} onPointerUp={stopDirection} onPointerCancel={stopDirection}>▶</button></div>
        <button className={"ex-actionButton"} onClick={interact} disabled={inside?nearSpot===null&&nearWorker===null&&!nearQuiz&&(!nearActivity||!activity||activity.icon==="incense")&&!nearExit:!near&&!nearBoat} aria-label="Tương tác với điểm đến">E</button>
        {toast&&<div className={"ex-activityToast"} role="status">✦ {toast}</div>}
        {dialogue&&inside&&<div className={"ex-dialogue"} role="dialog" aria-label={`Trò chuyện với ${WORKERS[inside.id][dialogue.worker].name}`}><div className={"ex-dialoguePortrait"}>☺</div><div><span>{WORKERS[inside.id][dialogue.worker].name} · {WORKERS[inside.id][dialogue.worker].role}</span><p>{WORKERS[inside.id][dialogue.worker].lines[dialogue.line]}</p><button onClick={interact}>{dialogue.line<WORKERS[inside.id][dialogue.worker].lines.length-1?"Nghe tiếp":"Tạm biệt"} <ArrowRight size={14}/></button></div></div>}
        {quizId&&<div className="ex-quizBackdrop"><section className="ex-quizCard" role="dialog" aria-modal="true" aria-label={QUIZZES[quizId].title}><button className="ex-quizClose" onClick={()=>setQuizId(null)} aria-label="Đóng câu hỏi"><X size={18}/></button><span className="ex-quizKicker">THỬ THÁCH LỊCH SỬ · CÂU {quizIndex+1}/3</span><h2>{QUIZZES[quizId].title}</h2><div className="ex-quizProgress"><i style={{width:`${(quizIndex+1)/3*100}%`}}/></div><p className="ex-quizQuestion">{QUIZZES[quizId].questions[quizIndex].question}</p><div className="ex-quizOptions">{QUIZZES[quizId].questions[quizIndex].options.map((option,index)=><button key={option} className={quizChoice!==null?(index===QUIZZES[quizId].questions[quizIndex].answer?"ex-correct":index===quizChoice?"ex-wrong":""):""} disabled={quizChoice!==null} onClick={()=>chooseQuiz(index)}><b>{"ABCD"[index]}</b>{option}</button>)}</div>{quizChoice!==null&&<div className="ex-quizFeedback" role="status"><strong>{quizChoice===QUIZZES[quizId].questions[quizIndex].answer?"Chính xác!":"Chưa đúng."}</strong> {QUIZZES[quizId].questions[quizIndex].detail}<button onClick={nextQuiz}>{quizIndex===2?`Xem kết quả · ${quizScore}/3`:"Câu tiếp theo"}<ArrowRight size={15}/></button></div>}<a className="ex-quizSource" href={QUIZZES[quizId].source} target="_blank" rel="noopener noreferrer">Nguồn: Cổng thông tin Đồng Tháp ↗</a></section></div>}
        {selectedPhoto&&selectedSpot&&inside&&<div className={"ex-photoBackdrop"} onMouseDown={event=>{if(event.target===event.currentTarget)setPhotoIndex(null);}}><div className={"ex-photoCard"} role="dialog" aria-modal="true" aria-label={`Ảnh thật: ${selectedSpot.label}`}><button className={"ex-photoClose"} onClick={()=>setPhotoIndex(null)} aria-label="Đóng ảnh"><X size={18}/></button><div className={"ex-photoFrame"}><img src={selectedPhoto.src} alt={selectedPhoto.alt}/><span>ẢNH CHỤP TẠI ĐỊA ĐIỂM</span></div><div className={"ex-photoContent"}><span>GÓC KHÁM PHÁ {String((photoIndex??0)+1).padStart(2,"0")} / 03</span><h2>{selectedSpot.label}</h2><p>{selectedSpot.note}</p><small>{selectedPhoto.alt}</small><div className={"ex-photoThumbs"}>{PHOTO_SPOTS[inside.id].map((spot,i)=>{const photo=photos[spot.photoIndex];return <button key={spot.label} className={i===photoIndex?"ex-selected":""} onClick={()=>{seenRef.current.add(`${inside.id}:${i}`);setPhotoIndex(i);}} aria-label={`Xem ảnh ${spot.label}`}><img src={photo.thumbnail} alt=""/></button>;})}</div><button className={"ex-photoContinue"} onClick={()=>setPhotoIndex(null)}>Tiếp tục đi dạo <ArrowRight size={15}/></button></div></div></div>}
        {intro&&<div className={"ex-introBackdrop"}><div className={"ex-introCard"}><div className={"ex-introIcon"}>🥭</div><span>CHÀO MỪNG ĐẾN CAO LÃNH</span><h2>Hành trình bắt đầu!</h2><p>Đi đến gần cửa của mỗi điểm đến và nhấn <b>E</b> để bước vào. Bên trong, hãy tìm các khung ảnh để xem Cao Lãnh ngoài đời thật.</p><div className={"ex-introHow"}><span>⌨ Phím mũi tên / WASD để đi</span><span>✦ E để vào cửa và xem ảnh</span><span>☝ Chạm bản đồ để di chuyển</span></div><button onClick={()=>setIntro(false)}>Bắt đầu khám phá <ArrowRight size={17}/></button></div></div>}
      </div>
      <div className={"ex-gameBottom"}><span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> hoặc <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> để di chuyển <span className={"ex-separator"}>·</span> <kbd>E</kbd> để {inside?"xem ảnh / qua cửa":"bước qua cửa"}</span><button onClick={()=>setJournal(true)}><BookOpen size={16}/> Sổ hành trình <b>{visited.length}/{STOPS.length}</b></button></div>
    </section>
    <div className={"ex-below"}><span>✳ MỖI TRẠM DỪNG LÀ MỘT CÂU CHUYỆN</span><p>Bản đồ trò chơi là thế giới minh họa, không thể hiện vị trí địa lý thực tế. <Link href="/map">Xem bản đồ điểm đến thật <ArrowRight size={13}/></Link></p></div>
    {journal&&<div className={"ex-modalBackdrop"} onMouseDown={event=>{if(event.target===event.currentTarget)setJournal(false);}}><div className={"ex-modal"} role="dialog" aria-modal="true" aria-label="Sổ hành trình">
      <button className={"ex-close"} onClick={()=>setJournal(false)} aria-label="Đóng"><X size={19}/></button>
      <div className={"ex-journalHeading"}><span>✦ HỘ CHIẾU HÀNH TRÌNH</span><h2>Những nơi bạn đã ghé</h2><p>{visited.length===STOPS.length?"Bạn đã hoàn thành chuyến phiêu lưu Cao Lãnh!":"Bước qua cửa địa điểm để nhận dấu mộc. Bên trong còn có ba góc ảnh thật để khám phá."}</p></div><div className={"ex-stampGrid"}>{STOPS.map((s,i)=><div key={s.id} className={`${"ex-stamp"} ${visited.includes(s.id)?"ex-stamped":""}`}><b>{String(i+1).padStart(2,"0")}</b><span>{visited.includes(s.id)?"✦":"?"}</span><strong>{s.short}</strong><small>{visited.includes(s.id)?"ĐÃ KHÁM PHÁ":"CHƯA GHÉ"}</small></div>)}</div><div className={"ex-journalFooter"}><button onClick={reset}><RotateCcw size={14}/> Bắt đầu lại</button><button onClick={()=>setJournal(false)}>Quay lại hành trình <ArrowRight size={16}/></button></div>
    </div></div>}
    {!mounted&&<span className={"ex-srOnly"}>Đang tải trò chơi</span>}
  </main>;
}
