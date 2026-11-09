import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {transpileModule,ModuleKind,ScriptTarget} from 'typescript';

const source=transpileModule(readFileSync('lib/ui/scroll-lock.ts','utf8'),{compilerOptions:{module:ModuleKind.CommonJS,target:ScriptTarget.ES2020}}).outputText;

test('overlapping scroll locks restore the original styles only after every owner leaves',async({page})=>{
 await page.setContent('<div style="height:3000px">Scroll lock test</div>');
 const result=await page.evaluate(code=>{
  document.documentElement.style.setProperty('overflow-y','scroll','important');
  document.body.style.setProperty('overflow-x','clip');
  const snapshot=()=>[document.documentElement,document.body].map(element=>['overflow','overflow-x','overflow-y'].map(name=>[element.style.getPropertyValue(name),element.style.getPropertyPriority(name)]));
  const before=snapshot();
  const exports={} as {lockPageScroll:()=>()=>void};
  new Function('exports',code)(exports);
  const first=exports.lockPageScroll(),second=exports.lockPageScroll();
  first();first();
  const lockedAfterFirst=[document.documentElement.style.overflow,document.body.style.overflow];
  const third=exports.lockPageScroll();second();
  const lockedAfterSecond=[document.documentElement.style.overflow,document.body.style.overflow];
  third();return {before,after:snapshot(),lockedAfterFirst,lockedAfterSecond};
 },source);
 expect(result.lockedAfterFirst).toEqual(['hidden','hidden']);
 expect(result.lockedAfterSecond).toEqual(['hidden','hidden']);
 expect(result.after).toEqual(result.before);
});

test('map remains scrollable when Chrome never fires the intro transition event',async({page})=>{
 await page.route('**/geo/**',route=>route.abort());
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');style.textContent='[data-map-intro]{transition:none!important}';document.head.appendChild(style);
 }));
 await page.goto('/map');
 await expect(page.locator('[data-map-intro]')).toHaveCount(0,{timeout:30000});
 await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');
 await page.mouse.move(700,350);await page.mouse.wheel(0,600);
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
 await expect(page.locator('[data-journey-scroll-space]')).toBeAttached();
});

test('reduced-motion map intro also releases document scrolling',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/geo/**',route=>route.abort());
 await page.goto('/map');
 await expect(page.locator('[data-map-intro]')).toHaveCount(0,{timeout:30000});
 await page.mouse.move(700,350);await page.mouse.wheel(0,600);
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
});

test('a browser without WebGL can still scroll through the journey',async({page})=>{
 await page.addInitScript(()=>{
  const prototype=HTMLCanvasElement.prototype;
  const original=prototype.getContext as (this:HTMLCanvasElement,id:string,options?:unknown)=>RenderingContext|null;
  prototype.getContext=function(this:HTMLCanvasElement,id:string,options?:unknown){
   return id.includes('webgl')?null:original.call(this,id,options);
  } as typeof prototype.getContext;
 });
 await page.goto('/map');
 await expect(page.getByText('Chưa thể hiển thị bản đồ 3D trên trình duyệt này.',{exact:false})).toBeVisible({timeout:30000});
 await expect(page.locator('[data-map-intro]')).toHaveCount(0,{timeout:30000});
 await page.mouse.move(700,350);await page.mouse.wheel(0,600);
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
});

test.describe('touch scrolling',()=>{
 test.use({hasTouch:true,viewport:{width:390,height:844}});
 test('narrative mode allows a native swipe over the 3D canvas',async({page,context})=>{
  await page.route('**/geo/**',route=>route.abort());
  await page.goto('/map');
  await expect(page.locator('[data-map-intro]')).toHaveCount(0,{timeout:30000});
  await expect(page.locator('[data-journey-stage] canvas')).toHaveCSS('touch-action','pan-y');
  const point=await page.evaluate(()=>{
   const y=Math.floor(innerHeight*0.8);
   for(const x of [8,16,innerWidth-8])if(document.elementFromPoint(x,y)?.tagName==='CANVAS')return {x,y};
   return null;
  });
  expect(point).not.toBeNull();
  const client=await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point!]});
  for(let offset=30;offset<=360;offset+=30){
   await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point!.x,y:point!.y-offset}]});
   await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
 });
});
