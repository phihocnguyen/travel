"use client";

import { useState } from "react";

export function UserAvatar({name,picture,className="h-8 w-8"}:{name:string;picture?:string;className?:string}) {
  const [failedPicture,setFailedPicture]=useState<string>();
  return <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-white text-xs font-medium ${className}`}>
    {picture&&failedPicture!==picture ? (
      // OAuth avatars come from the user's provider; keep support for its image host.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={picture} alt={`Ảnh đại diện của ${name}`} referrerPolicy="no-referrer" onError={()=>setFailedPicture(picture)} className="absolute inset-0 h-full w-full object-cover"/>
    ) : <span aria-label={`Ảnh đại diện của ${name}`}>{name.trim().charAt(0).toUpperCase()||"?"}</span>}
  </span>;
}
