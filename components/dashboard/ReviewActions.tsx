"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function review(action: "approve" | "reject") {
    let note: string | null = null;

    if (action === "reject") {
      const input = window.prompt(
        "Lý do từ chối (gửi lại cho tác giả):",
        "Bài viết cần bổ sung thông tin và hình ảnh.",
      );

      if (input === null) return;
      note = input.trim() || null;
    }

    setPending(action);

    try {
      const response = await fetch(`/api/posts/${postId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        window.alert(data?.error ?? "Không thể duyệt bài viết.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => review("approve")}
        disabled={pending !== null}
        className="rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
      >
        {pending === "approve" ? "Đang duyệt..." : "Duyệt bài"}
      </button>
      <button
        onClick={() => review("reject")}
        disabled={pending !== null}
        className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {pending === "reject" ? "Đang xử lý..." : "Từ chối"}
      </button>
    </div>
  );
}
