"use client";
import { useEffect } from "react";

export default function UserPresence(){
  useEffect(()=>{
    let stopped=false,inFlight=false,lastPing=0,controller:AbortController|undefined;
    const ping=async()=>{
      if(stopped||inFlight||document.visibilityState!=="visible"||Date.now()-lastPing<30_000)return;
      lastPing=Date.now();inFlight=true;controller=new AbortController();
      try{await fetch("/api/auth/presence",{method:"POST",signal:controller.signal});}catch{}finally{inFlight=false;}
    };
    void ping();const timer=setInterval(()=>void ping(),60_000);
    const visible=()=>{void ping();};
    document.addEventListener("visibilitychange",visible);
    window.addEventListener("focus",visible);
    return()=>{stopped=true;controller?.abort();clearInterval(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("focus",visible);};
  },[]);
  return null;
}
