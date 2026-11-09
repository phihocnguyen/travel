"use client";
import type { CSSProperties, Ref } from 'react';
import type { TicketDesign } from '@/lib/tickets/types';
export default function TicketPreview({design,className='',rootRef}:{design:TicketDesign;className?:string;rootRef?:Ref<HTMLDivElement>}) {
 const name=design.to.trim()||'Tên của bạn';
 return <div ref={rootRef} data-ticket-preview role="img" aria-label={`Vé chu du dành cho ${name}. ${design.message}`} style={{containerType:'inline-size',background:"white url('/template-ticket.jpg') center / 100% 100% no-repeat"} as CSSProperties} className={`relative overflow-hidden ${className}`}>
 <div data-ticket-content className="absolute left-[36%] right-[14%] top-[33.2%] flex h-[11.5%] items-center justify-center bg-[#fef8e2] px-[1%] text-center"><span className="block w-full font-bold leading-tight text-black" style={{fontFamily:'"Times New Roman", serif',fontSize:`${name.length>32?2.7:name.length>24?3.3:4}cqw`,overflowWrap:'anywhere'}}>{name}</span></div>
 <div className="absolute left-[35%] right-[13%] top-[47%] flex h-[16%] items-center justify-center text-center"><p className="whitespace-pre-line italic leading-relaxed text-[#527b36]" style={{fontFamily:'"Times New Roman", serif',fontSize:'1.75cqw'}}>{design.message}</p></div>
 </div>;
}
