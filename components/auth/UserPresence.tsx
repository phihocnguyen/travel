"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function UserPresence(){
  const pathname=usePathname();
  useEffect(()=>{
    let stopped=false,inFlight=false,controller:AbortController|undefined;
    const ping=async()=>{
      if(stopped||inFlight||document.visibilityState!=="visible")return;
      inFlight=true;controller=new AbortController();
      try{await fetch("/api/auth/presence",{method:"POST",signal:controller.signal});}catch{}finally{inFlight=false;}
    };
    void ping();const timer=setInterval(()=>void ping(),60_000);
    const visible=()=>{void ping();};
    document.addEventListener("visibilitychange",visible);
    window.addEventListener("focus",visible);
    return()=>{stopped=true;controller?.abort();clearInterval(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("focus",visible);};
  },[pathname]);
  return null;
}
