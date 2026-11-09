"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AccountMenu from "./AccountMenu";
import { UserAvatar } from "./UserAvatar";

type HeaderUser = { name: string; picture?: string };

export default function HeaderAccount({ dark = false, navigation = false }: { dark?: boolean; navigation?: boolean }) {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let controller: AbortController | undefined;
    async function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) return;
        const data = await response.json() as { user: HeaderUser | null };
        if (!request.signal.aborted) setUser(data.user);
      } catch {
        // Keep the last known account during a temporary connection failure.
      } finally {
        if (!request.signal.aborted) setLoading(false);
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const className = `inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium transition-colors sm:h-10 sm:px-4 ${dark ? "bg-white text-[#263f30] hover:bg-white/90" : "bg-[#263f30] text-white hover:bg-[#3b5840]"}`;

  if (loading) return <span aria-label="Đang kiểm tra đăng nhập" aria-busy="true" className={`${className} w-10 animate-pulse sm:w-28`} />;

  if (navigation) return <AccountMenu user={user}/>;

  return user ? (
    <Link href="/dashboard" data-cursor-magnet aria-label={`Tài khoản ${user.name}`} className={className}>
      <UserAvatar name={user.name} picture={user.picture} className="h-6 w-6" />
      <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
    </Link>
  ) : (
    <Link href="/login?next=/dashboard" data-cursor-magnet aria-label="Đăng nhập" className={className}>
      <span className="hidden sm:inline">Đăng nhập</span>
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 3h5v18h-5M3 12h12M10 7l5 5-5 5" /></svg>
    </Link>
  );
}
