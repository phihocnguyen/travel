import "server-only";
import type { AIMessage } from "@/lib/ai/client";
import type { TravelSource } from "./types";
import type { ChatAnswer } from "./types";

export type TravelResearch = { checkedAt: string; available: boolean; answer: string; sources: TravelSource[] };
const normalize=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
const planning=/lich trinh|ke hoach|planning|khach san|hotel|homestay|farmstay|luu tru|gia phong|dat phong|nghi dem|chi phi|ngan sach|budget|tour|chuyen di/;
export function needsTravelResearch(history: AIMessage[]) {
  return history.filter(message=>message.role==="user").some(message=>planning.test(normalize(message.content)));
}

export function tripIntake(history:AIMessage[]):ChatAnswer|null{
  const text=normalize(history.filter(message=>message.role==="user").map(message=>message.content).join("\n"));
  if(!/lich trinh|ke hoach|planning|tour|chuyen di|goi y (khach san|luu tru)/.test(text))return null;
  const budget=/\d+(?:[.,]\d+)?\s*(trieu|tr\b|nghin|ngan\b|k\b|vnd|dong\b|d\b)|ngan sach[^\n]{0,20}\d{3,}|(mot|hai|ba|bon|nam) trieu|ngan sach (linh hoat|khong gioi han)/.test(text);
  const guests=/\d+\s*(nguoi|khach|ban)\b|(mot|hai|ba|bon|nam|sau) (nguoi|khach)|di mot minh/.test(text);
  const dates=/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|chua (chot|biet|co) ngay|ngay (linh hoat|bat ky)/.test(text);
  const duration=/\b\d+\s*(ngay|dem)\b|(mot|hai|ba|bon|nam) (ngay|dem)|trong ngay/.test(text);
  const missing=[!budget?"Ngân sách khoảng bao nhiêu? Cho Xoài biết là tổng chi phí cả nhóm hay chi phí mỗi người nhé.":null,!guests?"Bạn đi mấy người? Có trẻ em đi cùng không?":null,!dates?"Bạn dự định đi ngày nào? Nếu chưa chốt, bạn cứ nói ngày linh hoạt.":null,!duration?"Chuyến đi kéo dài mấy ngày, mấy đêm?":null].filter((value):value is string=>!!value);
  if(!missing.length)return null;
  return {text:`Để lên lịch trình Cao Lãnh và chọn khách sạn phù hợp, Xoài cần thêm một chút thông tin nhé 🥭\n\n${missing.map((question,index)=>`${index+1}. ${question}`).join("\n")}\n\nCó đủ thông tin, mình sẽ tra cứu gợi ý lưu trú, giá tham khảo, hình ảnh và nguồn để bạn kiểm tra.`};
}

const trustedPages=["dongthap.gov.vn","vietnam.travel","traveloka.com","booking.com","agoda.com","ivivu.com","mia.vn","bazantravel.com","mytour.vn","vntrip.vn","vietnambooking.com","wikipedia.org","wikimedia.org","vertexaisearch.cloud.google.com"];
function trustedPage(value:string) {
  try { const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&(!url.port||url.port==="443")&&trustedPages.some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`)); } catch {return false;}
}
export function externalURL(value:unknown):string|undefined {
  if(typeof value!=="string"||value.length>4096)return;
  try{const url=new URL(value);if(url.protocol==="https:"&&!url.username&&!url.password&&/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)&&!url.hostname.endsWith(".local")&&!url.hostname.endsWith(".localhost"))return url.toString();}catch{}
}
function attribute(tag:string,name:string){return new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`,"i").exec(tag)?.[1]?.replace(/&amp;/g,"&").replace(/&quot;/g,'"');}

// Only inspect known public travel publishers. Never fetch arbitrary model URLs.
async function sourceImage(source:TravelSource,signal:AbortSignal):Promise<TravelSource> {
  let page=source.url;
  try{
    const deadline=AbortSignal.any([signal,AbortSignal.timeout(5000)]);
    for(let redirect=0;redirect<4;redirect++){
      if(!trustedPage(page))return source;
      const response=await fetch(page,{redirect:"manual",signal:deadline,headers:{Accept:"text/html"},cache:"no-store"});
      if(response.status>=300&&response.status<400){const location=response.headers.get("location");await response.body?.cancel();if(!location)return source;page=new URL(location,page).toString();continue;}
      if(!response.ok||!response.headers.get("content-type")?.includes("text/html")){await response.body?.cancel();return source;}
      const reader=response.body?.getReader();if(!reader)return source;
      let html="",bytes=0;const decoder=new TextDecoder();
      try{while(bytes<200_000){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;html+=decoder.decode(chunk.value,{stream:true});if(html.includes("</head>"))break;}}finally{await reader.cancel();}
      const tags=html.match(/<meta\b[^>]{0,4096}>/gi)??[];
      const tag=tags.find(tag=>/^(og:image|twitter:image)$/.test(attribute(tag,"property")??attribute(tag,"name")??""));
      const value=tag&&attribute(tag,"content");
      const image=value?externalURL(new URL(value,page).toString()):undefined;
      return {...source,url:page,...(image?{image}:{})};
    }
  }catch{/* Images are optional; keep the source and its citation available. */}
  return source;
}

export async function researchTravel(history:AIMessage[],signal:AbortSignal):Promise<TravelResearch>{
  const empty:TravelResearch={checkedAt:new Date().toISOString(),available:false,answer:"",sources:[]};
  if(!process.env.AI_API_KEY)return empty;
  const questions=history.filter(message=>message.role==="user").slice(-2).map(message=>message.content.slice(0,450)).join("; ");
  const query=`Cao Lãnh Đồng Tháp Việt Nam lịch trình du lịch khách sạn giá phòng VND mỗi đêm hình ảnh ${questions}`;
  try{
    const base=(process.env.AI_BASE_URL||"https://platform.beeknoee.com/v1").replace(/\/+$/,"");
    const response=await fetch(`${base}/search`,{method:"POST",redirect:"error",cache:"no-store",signal:AbortSignal.any([signal,AbortSignal.timeout(20_000)]),headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.AI_API_KEY}`},body:JSON.stringify({model:"web-search",query,max_results:5})});
    if(!response.ok)return empty;
    const data=await response.json();
    const results:unknown[]=Array.isArray(data.results)?data.results:[];
    const sources:TravelSource[]=[];
    for(const item of results.slice(0,5)){
      if(!item||typeof item!=="object")continue;
      const result=item as Record<string,unknown>,url=externalURL(result.url);if(!url)continue;
      sources.push({id:sources.length,title:typeof result.title==="string"?result.title.slice(0,200):new URL(url).hostname,url,snippet:typeof result.snippet==="string"?result.snippet.slice(0,2000):""});
    }
    if(!sources.length)return empty;
    return {...empty,available:true,answer:typeof data.answer==="string"?data.answer.slice(0,10000):"",sources:await Promise.all(sources.map(source=>sourceImage(source,signal)))};
  }catch{return empty;}
}
