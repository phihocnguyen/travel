"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardFrameLoading } from "@/components/dashboard/DashboardLoading";

export default function DashboardSignInRedirect(){
  const pathname=usePathname(),search=useSearchParams(),router=useRouter();
  useEffect(()=>{
    const destination=pathname+(search.size?`?${search.toString()}`:"");
    router.replace(pathname.startsWith("/dashboard/admin")?"/admin/login":`/login?next=${encodeURIComponent(destination)}`);
  },[pathname,search,router]);
  return <DashboardFrameLoading/>;
}
