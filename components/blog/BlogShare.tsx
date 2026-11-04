"use client";
import { useState } from "react";
export default function BlogShare({title}:{title:string}){
  const [message,setMessage]=useState("");
  async function share(){
    const url=window.location.href.split("#")[0];
    try{if(navigator.share){await navigator.share({title,url});return;}if(navigator.clipboard){await navigator.clipboard.writeText(url);setMessage("Đã sao chép liên kết");}else{window.prompt("Sao chép liên kết bài viết",url);}}
    catch(error){if(!(error instanceof DOMException&&error.name==="AbortError"))setMessage("Chưa thể chia sẻ. Bạn có thể sao chép địa chỉ trên thanh trình duyệt.");}
  }
  return <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-sm border border-[#263b2d]/20 px-3 py-2 text-[11px] text-[#5e695a] transition-colors hover:bg-[#263b2d]/5"><svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V3m-5 5 5-5 5 5M5 12v8h14v-8"/></svg>Chia sẻ bài viết</button><span role="status" className="text-[10px] text-[#7a8075]">{message}</span></div>;
}
