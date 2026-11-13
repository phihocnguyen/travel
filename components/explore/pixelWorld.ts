import { ACTIVITIES, HOMES, INTERIOR, PHOTO_SPOTS, QUIZZES, STOPS, WORKERS, WORLD, XEO_QUYT_RIVER, isRiver, type Activity, type Stop, type Worker } from "./world";

type Point = { x: number; y: number };
const paths: Point[][] = [
  [{x:780,y:300},{x:780,y:550},{x:745,y:860}],
  [{x:370,y:260},{x:780,y:300},{x:1150,y:335}],
  [{x:745,y:860},{x:1080,y:805}],
  [{x:780,y:550},{x:XEO_QUYT_RIVER.eastDock.x,y:XEO_QUYT_RIVER.eastDock.y}],
  [{x:XEO_QUYT_RIVER.westDock.x,y:XEO_QUYT_RIVER.westDock.y},{x:350,y:790}],
  [{x:780,y:550},{x:1080,y:805}],
  [{x:1150,y:335},{x:1080,y:805}],
  [{x:1150,y:335},{x:1480,y:310},{x:1740,y:330}],
  [{x:1740,y:330},{x:1840,y:650},{x:1810,y:1000}],
  [{x:1080,y:805},{x:1450,y:850},{x:1810,y:1000}],
];
const hash = (x: number, y: number) => { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
const rect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) => { c.fillStyle = fill; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

function tree(c: CanvasRenderingContext2D, x: number, y: number, variant = 0) {
  rect(c,x-3,y+2,6,12,"#73533e");
  rect(c,x-15,y-22,30,24,variant ? "#376d4e" : "#4b8556");
  rect(c,x-11,y-29,22,9,variant ? "#508b5f" : "#67a765");
  rect(c,x-10,y-18,5,4,"#88b976"); rect(c,x+6,y-12,5,4,"#2f674b");
}
function palm(c: CanvasRenderingContext2D, x: number, y: number) {
  rect(c,x-3,y-7,6,21,"#8d6845"); rect(c,x-8,y-21,16,13,"#427e55");
  rect(c,x-21,y-16,16,6,"#4d9a5d"); rect(c,x+5,y-16,16,6,"#4d9a5d");
  rect(c,x-12,y-29,24,8,"#5ca568"); rect(c,x-3,y-23,6,8,"#b4a14d");
}
function flower(c: CanvasRenderingContext2D,x:number,y:number) {
  rect(c,x-1,y-3,2,7,"#4d8d59"); rect(c,x-4,y-6,3,3,"#e7969b"); rect(c,x+1,y-6,3,3,"#e7969b"); rect(c,x-1,y-9,3,3,"#f5b6b1"); rect(c,x-1,y-6,2,2,"#f8d076");
}
function hut(c: CanvasRenderingContext2D,x:number,y:number,roof:string) {
  rect(c,x-27,y-5,54,31,"#8e6746"); rect(c,x-25,y-3,50,25,"#d9ba7d");
  rect(c,x-31,y-15,62,12,roof); rect(c,x-22,y-25,44,10,roof);
  rect(c,x-8,y+4,16,18,"#684833"); rect(c,x-20,y+2,8,8,"#5e8d81"); rect(c,x+12,y+2,8,8,"#5e8d81");
}
function home(c:CanvasRenderingContext2D,x:number,y:number,style:number){
  const wall=["#d9bc88","#cda984","#b6c6a2"][style],roof=["#ad654f","#8e674d","#a97952"][style];
  // Packed earth yard, raised floor, layered tile roof and a small front porch.
  rect(c,x-73,y-30,146,70,"#b7aa77");rect(c,x-65,y-23,130,56,"#c9ba85");
  rect(c,x-55,y-27,110,48,"#654e3a");rect(c,x-50,y-23,100,40,wall);
  rect(c,x-62,y-36,124,13,roof);rect(c,x-50,y-47,100,11,roof);rect(c,x-36,y-55,72,8,"#805644");
  for(let rx=x-51;rx<x+53;rx+=13)rect(c,rx,y-33,10,3,"#d49169");
  rect(c,x-17,y-13,34,31,"#795d40");rect(c,x-13,y-9,26,27,"#ab8053");rect(c,x+7,y+4,3,3,"#ead596");
  for(const wx of [x-38,x+25]){rect(c,wx,y-13,16,15,"#6e7f72");rect(c,wx+2,y-11,12,11,"#aac9bc");rect(c,wx+7,y-11,2,11,"#ddc699");rect(c,wx-3,y+2,22,3,"#8b6b4e");}
  rect(c,x-61,y+18,122,6,"#775b43");for(let fx=x-59;fx<x+62;fx+=13)rect(c,fx,y+16,3,14,"#9c774e");
  rect(c,x-27,y+18,54,23,"#b9a57b");rect(c,x-11,y+18,22,19,"#cdbb8b");
  for(const px of [x-68,x+59]){rect(c,px,y+8,15,16,"#a16f4c");rect(c,px+3,y+4,9,6,"#638d55");flower(c,px+7,y+4);}
  if(style===1){rect(c,x+58,y-40,3,45,"#806045");rect(c,x+59,y-38,28,2,"#806045");rect(c,x+68,y-34,7,13,"#e3c89a");rect(c,x+77,y-34,8,12,"#a96559");}
  if(style===2){rect(c,x-80,y-13,15,27,"#755b42");rect(c,x-83,y-25,21,15,"#4f8b58");rect(c,x+66,y-17,15,22,"#775b43");rect(c,x+63,y-28,20,13,"#57935d");}
}
function drawStop(c: CanvasRenderingContext2D, s: Stop, t: number, visited: boolean) {
  const {x,y} = s;
  rect(c,x-43,y+18,86,10,"#5a855a");
  if (s.kind === "memorial") {
    rect(c,x-31,y-27,62,51,"#d5c69e"); rect(c,x-35,y-34,70,10,"#a66758"); rect(c,x-20,y-42,40,8,"#bd8066");
    rect(c,x-11,y-13,22,37,"#8d9b81"); rect(c,x-7,y-8,14,32,"#d9dfba");
    flower(c,x-35,y+14); flower(c,x+36,y+12);
    rect(c,x-47,y-15,5,21,"#8d6949");rect(c,x+42,y-15,5,21,"#8d6949");
  } else if(s.kind === "temple") {
    rect(c,x-36,y-18,72,43,"#dfb87f"); rect(c,x-43,y-26,86,10,"#a45547"); rect(c,x-30,y-36,60,10,"#bd6e4f");
    rect(c,x-10,y-8,20,33,"#684b3c"); rect(c,x-29,y-7,12,13,"#fff0bd"); rect(c,x+17,y-7,12,13,"#fff0bd");
    rect(c,x-5,y-39,10,8,"#e7bd67");rect(c,x-8,y-31,16,3,"#966246");
  } else if(s.kind === "market") {
    hut(c,x-28,y,"#a3774b"); hut(c,x+31,y-4,"#bf8b54");
    rect(c,x-47,y+23,92,6,"#b28c62"); rect(c,x-36,y+17,9,5,"#ecbe5d"); rect(c,x+35,y+17,9,5,"#e98562");
    rect(c,x-58,y+7,16,16,"#95714a");rect(c,x+40,y+7,16,16,"#95714a");
  } else if(s.kind === "mango") {
    tree(c,x-22,y-3); tree(c,x+18,y-7,1);
    for(const [dx,dy] of [[-28,-19],[-17,-12],[11,-21],[24,-13]]) rect(c,x+dx,y+dy,5,6,"#f3c45d");
    rect(c,x-39,y+17,78,9,"#a0784c");
    rect(c,x+28,y+6,18,13,"#a27b4e");rect(c,x+31,y+1,12,7,"#e7ba5b");
  } else if(s.kind === "lotus") {
    rect(c,x-45,y-15,90,43,"#69abb2"); for(let i=0;i<5;i++){rect(c,x-35+i*17,y-8+(i%2)*17,12,5,"#6b9e65"); flower(c,x-29+i*15,y-8+(i%2)*16);}
  } else {
    for(const [dx,dy] of [[-29,0],[-11,-8],[13,-4],[30,3]]) tree(c,x+dx,y+dy,dx>0?1:0);
    rect(c,x-23,y+18,47,8,"#8e704c");
    rect(c,x+29,y+5,5,19,"#72573d");rect(c,x+25,y+2,23,11,"#c39b65");
  }
  const bob = Math.sin(t/450 + x)*2;
  rect(c,x-9,y-66+bob,18,18,visited ? "#f2cb65" : "#fff3c5");
  c.fillStyle="#624c35"; c.font="bold 12px monospace"; c.textAlign="center"; c.fillText(visited ? "✓" : "!",x,y-52+bob);
  rect(c,x-54,y+42,108,20,"#f5e7ad");rect(c,x-54,y+42,108,3,"#745d3c");
  c.fillStyle="#4e6040";c.font="bold 10px Manrope, Arial, sans-serif";c.fillText(s.short,x,y+55);
  rect(c,x-12,y+21,24,14,"#825a43");rect(c,x-8,y+23,16,12,"#2d4636");rect(c,x-4,y+27,8,8,"#e4bd61");
}

export function renderWorld(c: CanvasRenderingContext2D, view: {x:number;y:number;w:number;h:number}, player: Point & {dir:number;moving:boolean}, visited: Set<string>, t:number, boatX:number, aboard=false) {
  c.save(); c.translate(-Math.round(view.x),-Math.round(view.y));
  rect(c,0,0,WORLD.width,WORLD.height,"#8ebc74");
  const tile = 32;
  const minX=Math.max(0,Math.floor(view.x/tile)-1), maxX=Math.min(Math.ceil(WORLD.width/tile),Math.ceil((view.x+view.w)/tile)+1);
  const minY=Math.max(0,Math.floor(view.y/tile)-1), maxY=Math.min(Math.ceil(WORLD.height/tile),Math.ceil((view.y+view.h)/tile)+1);
  for(let y=minY;y<maxY;y++) for(let x=minX;x<maxX;x++) {
    const h=hash(x,y); rect(c,x*tile,y*tile,tile,tile,h>.7?"#94c47b":h<.16?"#85b66e":"#8ebc74");
    if(h>.77){rect(c,x*tile+8,y*tile+10,3,5,"#6da65d");rect(c,x*tile+20,y*tile+18,3,5,"#74aa61");}
  }
  const river=XEO_QUYT_RIVER;
  rect(c,river.outer.left,river.outer.top,river.outer.right-river.outer.left,river.outer.bottom-river.outer.top,"#59a6af");
  rect(c,river.island.left-8,river.island.top-8,river.island.right-river.island.left+16,river.island.bottom-river.island.top+16,"#d1c18d");
  rect(c,river.island.left,river.island.top,river.island.right-river.island.left,river.island.bottom-river.island.top,"#79ae70");
  for(let y=river.outer.top+17;y<river.outer.bottom-10;y+=28)for(let x=river.outer.left+14;x<river.outer.right-8;x+=38){
    if(!isRiver(x,y))continue;
    const drift=Math.sin(t/420+x*.02+y*.03)*4;
    rect(c,x+drift,y,13,3,"#9ad1ca");
    if(hash(x,y)>.77)rect(c,x+10,y+12,8,4,"#78b98b");
  }
  for(let y=river.island.top+16;y<river.island.bottom;y+=32)for(let x=river.island.left+14;x<river.island.right;x+=32){
    const h=hash(x,y);if(h>.8)rect(c,x,y,13,5,"#8fc37a");else if(h<.12)flower(c,x,y);
  }
  // Regional details: canals, lotus pond, paddies and orchard beds.
  rect(c,70,400,260,140,"#79b99d");rect(c,77,407,246,126,"#63a9ad");
  for(let i=0;i<24;i++){const x=87+(i*67)%224,y=420+(i*41)%101;rect(c,x,y,12,4,"#7da96c");if(i%3===0)flower(c,x+6,y);}
  rect(c,1110,505,245,180,"#a8bf6f");
  for(let x=1130;x<1340;x+=31)for(let y=518;y<676;y+=28){rect(c,x,y,19,4,"#6e9e5d");rect(c,x+4,y-3,3,6,"#5d945c");}
  rect(c,530,945,420,105,"#87ad62");for(let x=555;x<940;x+=70){rect(c,x,950,5,95,"#c1ab78");for(let y=968;y<1030;y+=24)flower(c,x+27,y);}
  rect(c,1190,970,190,90,"#6aaeb6");for(let i=0;i<7;i++)rect(c,1200+i*25,987+(i%3)*17,14,3,"#a5cdd0");
  // New eastern lotus fields, southern orchards and a riverside memorial approach.
  for(let x=1480;x<2050;x+=92)for(let y=70;y<230;y+=75){rect(c,x,y,72,44,"#68aeb0");rect(c,x+8,y+7,17,5,"#79a46c");rect(c,x+43,y+24,16,5,"#78a56b");if((x+y)%3)flower(c,x+47,y+22);}
  for(let x=400;x<960;x+=135)for(let y=1190;y<1530;y+=122){tree(c,x,y);rect(c,x-9,y-18,6,7,"#eec260");rect(c,x+8,y-12,5,6,"#eec260");}
  rect(c,1930,830,170,285,"#6aadb4");for(let y=850;y<1100;y+=31){rect(c,1945+(y%3)*11,y,34,4,"#a0d1cd");rect(c,2010,y+14,28,3,"#a0d1cd");}
  for(let x=1510;x<1900;x+=80){rect(c,x,1270,5,90,"#c3a875");for(let y=1290;y<1360;y+=25)flower(c,x+27,y);}
  // A winding blue edge evokes the river without claiming geographic accuracy.
  for(let y=0;y<WORLD.height;y+=16){const edge=2160+Math.round(Math.sin(y/100)*29);rect(c,edge,y,WORLD.width-edge,16,"#60a9b4");rect(c,edge-10,y,10,16,"#d9c693"); if(y%64===0)rect(c,edge+25,y+4,16,3,"#83c5c7");}
  c.lineJoin="bevel"; c.lineCap="square";
  for(const path of paths){c.beginPath();c.moveTo(path[0].x,path[0].y);for(const p of path.slice(1)) c.lineTo(p.x,p.y);c.lineWidth=33;c.strokeStyle="#b2a17c";c.stroke();c.lineWidth=24;c.strokeStyle="#dec99b";c.stroke();}
  HOMES.forEach(site=>home(c,site.x,site.y,site.style));
  // Wooden bridge and roadside markers.
  rect(c,125,457,150,13,"#8d6948");for(let x=130;x<275;x+=19)rect(c,x,457,2,13,"#d1a878");
  for(const [x,y] of [[780,560],[980,650],[540,480]]){rect(c,x-3,y-17,6,25,"#815e3e");rect(c,x-17,y-23,34,12,"#dfc587");rect(c,x+10,y-20,5,5,"#8d683f");}
  for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
    const px=x*tile+16,py=y*tile+16,h=hash(x+49,y+73);
    if(px>2100 || isRiver(px,py) || HOMES.some(home=>Math.abs(home.x-px)<91&&Math.abs(home.y-py)<75) || STOPS.some(s=>Math.hypot(s.x-px,s.y-py)<82) || paths.some(path=>path.some((p,i)=>i>0&&distanceToSegment(px,py,path[i-1],p)<30))) continue;
    if(h>.84) tree(c,px,py,h>.93?1:0); else if(h>.77) palm(c,px,py); else if(h<.09) flower(c,px,py);
  }
  // Two piers face each other. The only crossing is the player-controlled rowboat.
  rect(c,550,796,56,17,"#936d48");rect(c,427,796,67,17,"#936d48");
  for(let x=550;x<605;x+=12)rect(c,x,796,2,17,"#cb9c66");
  for(let x=430;x<493;x+=12)rect(c,x,796,2,17,"#cb9c66");
  rect(c,565,768,5,26,"#73543b");rect(c,520,757,96,21,"#e5cd94");
  c.fillStyle="#4c5f44";c.font="bold 9px Manrope, Arial, sans-serif";c.textAlign="center";c.fillText("BẾN XUỒNG",568,771);
  // Other boats make the crossing feel inhabited; the darker boat waits at the active dock.
  drawBoat(c,220+Math.sin(t/1900)*13,655,t+300,0.7);
  drawBoat(c,360+Math.sin(t/2400)*18,1019,t+900,0.65);
  drawBoat(c,boatX,815,t);
  STOPS.forEach(s=>drawStop(c,s,t,visited.has(s.id)));
  if(aboard){drawPlayer(c,{...player,x:boatX,y:803,moving:false},t);rect(c,boatX-32,826,64,4,"#aad5d0");}
  else drawPlayer(c,player,t);
  c.restore();
}
function drawBoat(c:CanvasRenderingContext2D,x:number,y:number,t:number,scale=1){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);x=0;y=0;
  const bob=Math.sin(t/260)*2;
  rect(c,x-39,y+12+bob,78,7,"#477f88");rect(c,x-34,y+4+bob,68,12,"#62422f");
  rect(c,x-28,y+4+bob,56,6,"#af8051");rect(c,x-20,y+1+bob,40,11,"#4c392d");
  rect(c,x-12,y+4+bob,24,7,"#c49a68");rect(c,x-29,y+13+bob,59,3,"#d2ad70");
  rect(c,x+17,y-18+bob,4,29,"#765538");rect(c,x+19,y-17+bob,17,4,"#c49b69");
  rect(c,x-34,y+21+bob,19,3,"#9fcfcd");rect(c,x+18,y+21+bob,17,3,"#9fcfcd");c.restore();
}

function drawPlayer(c: CanvasRenderingContext2D, player: Point & {dir:number;moving:boolean}, t:number){
  // Character: straw hat, face, satchel and tiny walking animation.
  const {x,y,dir,moving}=player, step=moving?Math.floor(t/140)%2:0;
  rect(c,x-9,y+12,18,5,"#6e865e");
  rect(c,x-7,y+5,6,9,step?"#354f5c":"#3d5d69");rect(c,x+1,y+5,6,9,step?"#3d5d69":"#354f5c");
  rect(c,x-9,y-9,18,17,"#547a8c");rect(c,x+6,y-4,5,9,"#ad704e");
  rect(c,x-7,y-21,14,13,dir===2?"#574a39":"#e9ba8b");rect(c,x-11,y-24,22,5,"#bb8b4d");rect(c,x-6,y-30,12,8,"#e4c274");rect(c,x-3,y-30,6,3,"#f6dc98");
  if(dir===2){rect(c,x-5,y-5,10,5,"#476a7a");}
  else if(dir!==0){rect(c,x+(dir===1?3:-5),y-16,2,2,"#423d34");}
  else {rect(c,x-4,y-16,2,2,"#423d34");rect(c,x+3,y-16,2,2,"#423d34");}
}

export function renderInterior(c:CanvasRenderingContext2D,view:{x:number;y:number;w:number;h:number},player:Point & {dir:number;moving:boolean},stop:Stop,t:number,seen:Set<string>,activityProgress:number,ceremony:number|null=null){
  c.save();c.translate(-Math.round(view.x),-Math.round(view.y));
  const nature=stop.kind==="forest"||stop.kind==="mango"||stop.kind==="lotus";
  const ground=stop.id==="gao-giong"?"#78aa88":stop.id==="xeo-quyt"?"#658e6f":stop.id==="cho-que"?"#c7af81":stop.id==="vuon-xoai"?"#9cbd77":stop.id==="do-cong-tuong"?"#c5ae8d":"#b7bf93";
  rect(c,0,0,INTERIOR.width,INTERIOR.height,ground);
  const shades=stop.id==="gao-giong"?["#78aa88","#83b58f"]:stop.id==="xeo-quyt"?["#658e6f","#719a77"]:stop.id==="vuon-xoai"?["#9cbd77","#a9c985"]:stop.id==="cho-que"?["#c7af81","#d0ba8e"]:stop.id==="do-cong-tuong"?["#c5ae8d","#ceb998"]:["#b7bf93","#c3cba0"];
  for(let y=0;y<INTERIOR.height;y+=32)for(let x=0;x<INTERIOR.width;x+=32){const h=hash(x/32+stop.x,y/32+stop.y);rect(c,x,y,32,32,h>.6?shades[1]:shades[0]);if(nature&&h>.77)rect(c,x+8,y+10,3,5,"#5f9b60");}
  // Each destination has its own illustrated courtyard. The paths keep the photo stations legible.
  if(nature){
    rect(c,25,30,910,86,"#3d785e");rect(c,30,116,900,20,"#5f9a73");
    if(stop.kind==="lotus"){
      rect(c,35,80,885,255,"#61a9b0");rect(c,42,88,870,239,"#71b8b6");
      for(let x=86;x<890;x+=74)for(let y=118;y<310;y+=64){rect(c,x,y,30,7,"#6f9c69");rect(c,x+4,y-5,21,5,"#87b97a");if((x+y)%3)flower(c,x+13,y-6);}
      rect(c,100,340,750,21,"#9b7952");for(let x=112;x<850;x+=26)rect(c,x,340,4,22,"#d0a777");
      for(const x of [90,870]){tree(c,x,430);tree(c,x+30,500,1);}
    }else if(stop.kind==="forest"){
      rect(c,40,100,155,470,"#62a9b0");rect(c,45,100,10,470,"#d7c998");
      for(let y=135;y<560;y+=68){rect(c,78,y,45,5,"#91c7c4");rect(c,118,y+23,30,4,"#91c7c4");}
      for(let x=225;x<940;x+=82){tree(c,x,105,(x/82)%2);tree(c,x+37,535,1);}
      rect(c,175,420,100,12,"#8b6949");for(let x=180;x<265;x+=14)rect(c,x,420,2,12,"#d4a877");
      rect(c,70,345,75,14,"#815f45");rect(c,87,337,40,8,"#b29166");
    }else{
      for(let x=115;x<900;x+=145)for(let y of [105,405,545]){tree(c,x,y);rect(c,x-8,y-15,5,6,"#efc75d");rect(c,x+8,y-20,5,6,"#edbc56");}
      rect(c,58,198,75,170,"#c7ab7c");rect(c,66,208,60,155,"#e6cc99");
      for(let i=0;i<6;i++){rect(c,80,217+i*24,33,8,"#a67c4d");rect(c,84,214+i*24,9,6,"#f0bd4e");rect(c,99,214+i*24,9,6,"#e7ae45");}
    }
  } else if(stop.kind==="market"){
    rect(c,0,60,960,72,"#6baab2");for(let x=30;x<960;x+=90){rect(c,x,83,50,4,"#a1d1ca");}
    hut(c,180,160,"#a8794a");hut(c,480,120,"#b68956");hut(c,780,160,"#aa7847");
    for(const x of [180,480,780]){rect(c,x-46,195,92,12,"#845f43");for(let i=0;i<4;i++)rect(c,x-33+i*18,186,10,9,i%2?"#e9aa59":"#d97c5d");}
    rect(c,55,440,850,10,"#8d704f");for(let x=76;x<900;x+=62)rect(c,x,448,7,34,"#8d704f");
  } else {
    rect(c,70,48,820,175,"#9a795d");rect(c,82,60,796,150,"#dfc59a");
    rect(c,70,48,820,23,stop.kind==="temple"?"#a95e4c":"#ba7460");rect(c,105,33,750,18,"#9a5549");
    for(const x of [154,480,806]){rect(c,x-42,79,84,126,"#ad8c6a");rect(c,x-34,86,68,111,"#e7d5a9");rect(c,x-19,117,38,88,"#695640");rect(c,x-12,125,24,80,"#97714f");}
    rect(c,460,246,40,85,"#decb9f");rect(c,474,258,13,70,"#887d67");
    for(let x=90;x<900;x+=90){flower(c,x,345);flower(c,x+35,485);}
    if(stop.kind==="memorial")for(const [x,y] of [[150,310],[780,310],[190,520],[755,520]]){rect(c,x-24,y-4,48,25,"#6daba8");rect(c,x-15,y+4,30,6,"#77a76b");flower(c,x,y+4);}
    else for(const x of [140,820]){tree(c,x,375);rect(c,x-30,415,60,9,"#b59067");}
  }
  // Three branches converge at the entry gate.
  c.lineJoin="bevel";c.lineCap="square";
  for(const s of PHOTO_SPOTS[stop.id]){c.beginPath();c.moveTo(INTERIOR.entry.x,INTERIOR.entry.y);c.lineTo(s.x,s.y+36);c.lineWidth=28;c.strokeStyle=nature?"#ab986c":"#a99170";c.stroke();c.lineWidth=20;c.strokeStyle=nature?"#dcc99c":"#e2d1aa";c.stroke();}
  drawSignatureScene(c,stop,t,activityProgress);
  const spots=PHOTO_SPOTS[stop.id];
  for(let i=0;i<spots.length;i++){
    const spot=spots[i],done=seen.has(`${stop.id}:${i}`),bob=Math.sin(t/360+i)*2;
    rect(c,spot.x-21,spot.y+12,42,7,"#617e5b");rect(c,spot.x-15,spot.y-19,30,34,"#745b42");rect(c,spot.x-11,spot.y-15,22,20,"#f0e0ac");
    rect(c,spot.x-7,spot.y-11,14,12,i===0?"#6f9e86":i===1?"#b88566":"#7caeb3");
    rect(c,spot.x-4,spot.y-51+bob,8,8,done?"#edc561":"#fff3c5");
    c.fillStyle="#344e3b";c.textAlign="center";c.font="bold 11px Manrope, Arial, sans-serif";c.fillText(spot.label,spot.x,spot.y+38);
  }
  rect(c,421,612,118,31,"#70533f");rect(c,429,615,102,25,"#2d533f");rect(c,464,625,32,6,"#e5bb74");
  c.fillStyle="#fff0b9";c.textAlign="center";c.font="bold 11px Manrope, Arial, sans-serif";c.fillText("LỐI RA",480,660);
  WORKERS[stop.id].forEach((worker,i)=>drawWorker(c,worker,t+i*600));
  if(QUIZZES[stop.id])drawQuizStand(c,QUIZZES[stop.id].x,QUIZZES[stop.id].y,t);
  const activity=ACTIVITIES[stop.id];if(activity)drawActivity(c,activity,activityProgress,t,ceremony);
  drawPlayer(c,player,t);
  if(stop.id==="sinh-sac"&&ceremony!==null&&ceremony<.72){const handX=player.x+11,handY=player.y-9;const lift=Math.sin(Math.min(1,ceremony/.45)*Math.PI/2)*11;
    rect(c,handX,handY-lift,3,6,"#d4a176");drawIncenseStick(c,handX+2,handY-lift-1,t,true);
  }
  c.restore();
}

function drawQuizStand(c:CanvasRenderingContext2D,x:number,y:number,t:number){
  const bob=Math.sin(t/420)*2;
  rect(c,x-39,y+12,78,8,"#6b7b58");rect(c,x-28,y-1,56,15,"#815d41");rect(c,x-22,y-11,44,12,"#b58d61");
  rect(c,x-23,y-27,22,18,"#e5d4a5");rect(c,x+1,y-27,22,18,"#f1e2b7");rect(c,x-1,y-26,2,18,"#a5825e");
  for(let i=0;i<3;i++){rect(c,x-18,y-22+i*5,13,2,"#a48765");rect(c,x+5,y-22+i*5,12,2,"#a48765");}
  rect(c,x-12,y-57+bob,24,20,"#fff0bd");c.fillStyle="#4b6445";c.textAlign="center";c.font="bold 13px Manrope, Arial, sans-serif";c.fillText("?",x,y-42+bob);
  rect(c,x-49,y+25,98,19,"#f5e8b9");c.fillStyle="#405b43";c.font="bold 10px Manrope, Arial, sans-serif";c.fillText("3 CÂU HỎI",x,y+38);
}

function drawWorker(c:CanvasRenderingContext2D,w:Worker,t:number){
  const sway=Math.sin(t/370)*3,arm=Math.sin(t/230)*4, x=w.x,y=w.y;
  rect(c,x-13,y+11,27,5,"#5d805e");
  rect(c,x-7,y+3,6,10,"#4c5d55");rect(c,x+2,y+3,6,10,"#4c5d55");
  const shirt=w.sprite==="vendor"?"#b96657":w.sprite==="guide"?"#e5c57a":w.sprite==="rower"?"#507988":w.sprite==="caretaker"?"#887766":"#63876a";
  rect(c,x-9,y-15,18,20,shirt);rect(c,x-6,y-28,13,14,"#c99369");rect(c,x-8,y-31,17,5,"#4c4234");
  rect(c,x-12,y-32+sway,24,5,w.sprite==="guide"?"#eacb86":"#b69962");
  rect(c,x+8,y-13+arm,6,15,"#c99369");
  if(w.sprite==="caretaker"||w.sprite==="gardener"){rect(c,x+17,y-22,3,34,"#795c3c");rect(c,x+13,y+11,15,5,w.sprite==="caretaker"?"#c6a36c":"#6ba867");}
  if(w.sprite==="rower"){rect(c,x+17,y-26,3,47,"#795c3c");rect(c,x+12,y+19,14,4,"#bba47c");}
  if(w.sprite==="vendor"||w.sprite==="farmer"){rect(c,x+17,y-1,18,11,"#9a7049");for(let i=0;i<3;i++)rect(c,x+20+i*5,y-5,4,5,w.sprite==="farmer"?"#e9be5d":"#d2a969");}
  rect(c,x-8,y-49,16,13,"#fff0bb");c.fillStyle="#4d5638";c.textAlign="center";c.font="bold 10px Manrope, Arial, sans-serif";c.fillText("…",x,y-39);
  rect(c,x-48,y+21,96,18,"#f5e8b9");c.fillStyle="#405b43";c.font="bold 10px Manrope, Arial, sans-serif";c.fillText(w.name,x,y+34);
}

function drawIncenseStick(c:CanvasRenderingContext2D,x:number,y:number,t:number,lit:boolean){
  rect(c,x-1,y-21,3,23,"#8a5439");rect(c,x-1,y-21,3,8,"#c94939");
  if(lit){rect(c,x-2,y-25,5,4,"#f5c263");rect(c,x-1,y-27,3,3,"#fff2be");
    for(let i=0;i<3;i++){const drift=Math.sin(t/360+i*1.4)*3+i*2;rect(c,x+drift-1,y-34-i*9,3,5,i===2?"#e6e2d1":"#eee8d5");}}
}
function drawActivity(c:CanvasRenderingContext2D,a:Activity|undefined,progress:number,t:number,ceremony:number|null){
  if(!a)return;
  const x=a.x,y=a.y,bob=Math.sin(t/400)*2;
  rect(c,x-35,y+15,70,9,"#6b855b");
  if(a.icon==="fish"){rect(c,x-36,y-14,72,31,"#64aeb7");for(let i=0;i<3+progress;i++){const fx=x-24+i*12+Math.sin(t/500+i)*5;rect(c,fx,y-5+(i%2)*9,8,4,"#e5b872");rect(c,fx-3,y-5+(i%2)*9,3,4,"#e5b872");}}
  if(a.icon==="mango"){tree(c,x,y-3);for(let i=0;i<5-progress;i++)rect(c,x-13+i*7,y-20+(i%2)*6,5,6,"#efc260");rect(c,x+19,y+6,26,13,"#966c49");for(let i=0;i<progress;i++)rect(c,x+22+i*6,y+2,5,6,"#f1c762");}
  if(a.icon==="boat"){rect(c,x-35,y-9,70,22,"#62aab4");rect(c,x-25+progress*8,y-4,38,9,"#8d664a");rect(c,x+4+progress*8,y-15,3,24,"#c19b6a");}
  if(a.icon==="cake"){rect(c,x-30,y-4,60,19,"#966e4c");for(let i=0;i<progress;i++){rect(c,x-19+i*16,y-12,12,9,"#6e9c62");rect(c,x-17+i*16,y-14,8,4,"#8eb774");}}
  if(a.icon==="lotus"){rect(c,x-43,y-10,86,32,"#5ca6ad");for(let i=0;i<3;i++){const lx=x-25+i*25;rect(c,lx-9,y+3,19,5,"#7eaa72");if(i<progress){rect(c,lx-6,y-8,12,12,"#d9869b");rect(c,lx-2,y-15,5,13,"#f3b5be");rect(c,lx-9,y-9,6,10,"#e999aa");rect(c,lx+4,y-9,6,10,"#e999aa");rect(c,lx-2,y-3,5,4,"#f2cb70");}}}
  if(a.icon==="incense"){
    // A raised bronze censer, ash bed, and individual glowing sticks.
    rect(c,x-39,y+11,78,11,"#80523e");rect(c,x-31,y+3,62,13,"#a66b49");
    rect(c,x-27,y-2,54,7,"#d3945d");rect(c,x-20,y-7,40,8,"#6e4c3c");
    rect(c,x-16,y-5,32,5,"#b8a98c");rect(c,x-25,y+16,8,12,"#764c37");rect(c,x+17,y+16,8,12,"#764c37");
    rect(c,x-12,y+5,3,3,"#e4bb75");rect(c,x+8,y+7,3,3,"#e4bb75");
    for(const offset of [-9,9])drawIncenseStick(c,x+offset,y-5,t,false);
    if(progress||(ceremony!==null&&ceremony>.72))drawIncenseStick(c,x,y-5,t,true);
  }
  if(a.icon==="flowers"){for(let i=0;i<3;i++){rect(c,x-27+i*25,y+2,19,16,"#a37756");if(i<progress)for(let j=0;j<3;j++)flower(c,x-22+i*25+j*5,y+2);}}
  const goal=a.goal??3;
  if(a.icon==="incense"){
    rect(c,x-19,y-64+bob,38,32,"#842f2d");rect(c,x-16,y-61+bob,32,26,"#c83e35");rect(c,x-11,y-56+bob,22,16,"#f66c4d");rect(c,x-5,y-53+bob,10,9,"#ffe6bd");
  } else {
    rect(c,x-10,y-52+bob,20,17,"#fff0b9");c.fillStyle="#526842";c.textAlign="center";c.font="bold 11px Manrope, Arial, sans-serif";c.fillText(progress>=goal?"✓":"★",x,y-39+bob);
  }
  rect(c,x-56,y+30,112,20,"#f5e8b9");c.fillStyle="#405b43";c.font="bold 10px Manrope, Arial, sans-serif";c.fillText(a.name,x,y+44);
}
function drawSignatureScene(c:CanvasRenderingContext2D,stop:Stop,t:number,progress:number){
  if(stop.id==="sinh-sac"){
    for(const x of [54,750]){rect(c,x,245,146,75,"#6eaab0");for(let i=0;i<5;i++){rect(c,x+14+i*26,265+(i%2)*25,18,5,"#7da96a");if(i%2===0)flower(c,x+22+i*26,267+(i%2)*25);}}
    rect(c,438,62,84,148,"#e6d4a8");rect(c,455,80,50,113,"#a6ad92");rect(c,470,102,20,71,"#e6d8bc");rect(c,414,208,132,16,"#a67c5d");
    for(const x of [268,683]){rect(c,x,360,42,28,"#a67d57");rect(c,x+5,355,32,7,"#d0aa72");}
    for(const x of [125,365,610,850]){tree(c,x,400);rect(c,x+39,365,4,35,"#876143");rect(c,x+32,363,18,8,"#e1bc7a");flower(c,x-12,440);}
  } else if(stop.id==="do-cong-tuong"){
    for(const x of [80,810]){rect(c,x,260,70,125,"#b46d50");rect(c,x+11,275,48,105,"#e8c391");rect(c,x+18,280,34,42,"#7d4e3c");rect(c,x+24,287,22,29,"#efc879");}
    for(const x of [250,480,710]){rect(c,x-21,68,42,7,"#ad5447");rect(c,x-16,75,32,18,"#c66052");rect(c,x-11,93,22,6,"#e6c873");}
    rect(c,365,335,230,45,"#ab8763");for(let x=383;x<590;x+=27)rect(c,x,344,11,27,"#d5b48c");
    rect(c,458,322,44,24,"#a5784e");rect(c,468,307,24,17,"#e2b562");for(const x of [150,760]){rect(c,x,390,5,32,"#805f44");rect(c,x-7,385,19,8,"#e5bc71");rect(c,x+39,400,20,13,"#956b4b");flower(c,x+65,405);}
  } else if(stop.id==="gao-giong"){
    rect(c,38,360,220,150,"#65aeb7");for(let i=0;i<8;i++){const x=70+i*21+Math.sin(t/420+i)*4,y=390+(i%3)*30;rect(c,x,y,10,4,"#d8b775");rect(c,x-3,y,3,4,"#d8b775");}
    rect(c,710,65,28,240,"#7d6248");rect(c,675,110,100,15,"#a7845b");rect(c,691,80,68,30,"#c6a878");rect(c,704,70,40,12,"#a47b53");
    for(let i=0;i<10;i++){const x=275+i*60,y=68+(i%3)*24;rect(c,x,y,11,4,"#e9e5c6");rect(c,x+7,y-3,5,3,"#e9e5c6");}
    for(const [x,y] of [[220,420],[355,102],[610,420],[805,370]]){tree(c,x,y);rect(c,x+37,y+8,18,15,"#629fa6");flower(c,x+65,y+15);}
  } else if(stop.id==="xeo-quyt"){
    rect(c,36,94,155,480,"#5197a3");for(let y=130;y<540;y+=72){rect(c,61,y,40,4,"#85c1bf");rect(c,125,y+26,28,3,"#85c1bf");}
    hut(c,748,124,"#6c7352");rect(c,635,365,125,20,"#765e45");rect(c,643,383,109,19,"#9a7d55");for(let x=650;x<740;x+=21)rect(c,x,380,5,25,"#584f3d");
    rect(c,90,425,70,12,"#9a704b");rect(c,105+progress*7,414,42,8,"#775a42");rect(c,133+progress*7,391,3,28,"#c7a478");
    for(const x of [305,812]){tree(c,x,280,1);tree(c,x+25,320,1);}
    for(const [x,y] of [[270,365],[540,90],[820,390]]){rect(c,x+6,y+6,5,26,"#786046");rect(c,x,y,23,12,"#c4a16c");rect(c,x+35,y+18,23,9,"#846849");tree(c,x+75,y);}
  } else if(stop.id==="cho-que"){
    for(const [x,y] of [[95,345],[270,75],[660,85],[820,350]]){hut(c,x,y,"#a4774b");rect(c,x-37,y+30,74,12,"#906541");for(let i=0;i<4;i++)rect(c,x-25+i*14,y+22,9,8,i%2?"#edba59":"#d67456");}
    for(let x=80;x<900;x+=80){rect(c,x,48,4,20,"#78604b");rect(c,x+4,52,22,10,x%160?"#e2ad69":"#cc795b");}
    rect(c,110,555,110,20,"#8d6946");for(let i=0;i<4;i++)rect(c,125+i*22,545,15,10,"#e9b95c");
    for(const [x,y] of [[160,215],[480,215],[790,215],[315,380]]){rect(c,x,y+10,23,16,"#98714a");rect(c,x+32,y+8,26,17,"#a47952");for(let i=0;i<3;i++)rect(c,x+35+i*7,y+3,5,7,"#ebba61");rect(c,x-23,y+8,15,17,"#b2634e");}
  } else if(stop.id==="vuon-xoai"){
    for(const [x,y] of [[80,160],[260,100],[690,110],[845,210],[115,515],[840,500]]){tree(c,x,y);for(let i=0;i<5;i++)rect(c,x-11+(i%3)*9,y-22+(i%2)*7,5,6,"#eec261");}
    hut(c,780,325,"#ad7e49");rect(c,80,360,120,35,"#75acb3");for(let x=95;x<190;x+=25)rect(c,x,373,15,4,"#8fbe83");
    rect(c,220,496,80,18,"#986f48");for(let i=0;i<6;i++)rect(c,230+i*10,487,7,9,"#e5bb59");
    for(const [x,y] of [[90,250],[300,105],[630,105],[820,265]]){tree(c,x,y);rect(c,x-8,y-18,5,7,"#eec260");rect(c,x+8,y-21,5,7,"#eec260");rect(c,x+35,y+28,23,15,"#96704d");tree(c,x+75,y+8,1);}
  } else if(stop.id==="my-phuoc-thanh"){
    for(const [x,y] of [[150,390],[350,410],[570,395],[790,425]]){rect(c,x-34,y,68,11,"#856d4b");rect(c,x-25,y-8,50,9,"#b39262");for(let i=0;i<4;i++)flower(c,x-20+i*12,y-10);}
    hut(c,785,125,"#aa8254");for(const x of [210,450,690]){rect(c,x,120,35,7,"#78aa70");flower(c,x+15,116);}
  } else if(stop.id==="tap-ket"){
    rect(c,85,320,790,55,"#6caeb5");for(let x=105;x<870;x+=62)rect(c,x,342,34,4,"#a4d1ca");
    rect(c,420,86,120,120,"#bd9874");rect(c,435,98,90,105,"#e0c69a");rect(c,465,66,30,120,"#a77b62");rect(c,470,58,20,13,"#dfbd8c");
    rect(c,360,208,240,19,"#9e765e");for(const x of [120,810]){rect(c,x-4,250,8,65,"#805d43");rect(c,x-22,250,44,10,"#ccaa77");}
  }
}
function distanceToSegment(x:number,y:number,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-u*dx,y-a.y-u*dy);}
