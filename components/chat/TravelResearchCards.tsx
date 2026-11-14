"use client";

import { useState } from "react";
import { ArrowUpRight, Building2, Globe2, MapPin } from "lucide-react";
import type { ChatAnswer, HotelSuggestion } from "@/lib/chat/types";

function HotelCard({ hotel }: { hotel:HotelSuggestion }) {
  const [failed,setFailed]=useState(false);
  return <article className="travel-hotel">
    {hotel.image&&!failed?<figure><img src={hotel.image} alt={`Ảnh từ nguồn tham khảo cho ${hotel.name}`} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/><figcaption>Ảnh từ {hotel.source.title}</figcaption></figure>:<div className="travel-hotel-placeholder"><Building2 size={28}/><span>Xem ảnh tại nguồn</span></div>}
    <div className="travel-hotel-body"><h4>{hotel.name}</h4><p className="travel-hotel-location"><MapPin size={12}/>{hotel.location}</p><strong className="travel-hotel-price">{hotel.price}</strong><p className="travel-hotel-note">{hotel.priceNote}</p><a href={hotel.source.url} target="_blank" rel="noopener noreferrer">Xem nguồn & kiểm tra giá <ArrowUpRight size={14}/></a></div>
  </article>;
}

export default function TravelResearchCards({ answer }: {answer:ChatAnswer}) {
  if(!answer.research)return null;
  return <div className="travel-research">
    <p className="travel-research-status"><Globe2 size={13}/>{answer.research.available?"Thông tin tra cứu trên web":"Chưa truy cập được nguồn web"}<time dateTime={answer.research.checkedAt}>{new Date(answer.research.checkedAt).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"})}</time></p>
    {!!answer.hotels?.length&&<section aria-label="Khách sạn và giá tham khảo"><h3 className="travel-hotels-title">Gợi ý lưu trú</h3><div className="travel-hotels">{answer.hotels.map((hotel,index)=><HotelCard key={`${hotel.name}-${index}`} hotel={hotel}/>)}</div><p className="travel-price-disclaimer">Giá tham khảo theo nguồn, có thể thay đổi theo ngày ở, loại phòng, số khách và thuế/phí. Kiểm tra lại trước khi đặt.</p></section>}
    {!!answer.sources?.length&&<details className="travel-sources"><summary>Nguồn tham khảo ({answer.sources.length})</summary><ol>{answer.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<ArrowUpRight size={12}/></a></li>)}</ol></details>}
  </div>;
}
