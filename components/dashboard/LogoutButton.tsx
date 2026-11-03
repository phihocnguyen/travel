"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className={
        className ??
        "rounded-lg border border-forest/20 px-4 py-2 text-sm font-medium text-[#356b43]/75 transition hover:bg-mint/30 disabled:opacity-50"
      }
    >
      {pending ? "Đang thoát..." : "Đăng xuất"}
    </button>
  );
}
