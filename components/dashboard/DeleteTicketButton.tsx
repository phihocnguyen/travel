"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTicketButton({
  ticketId,
  title,
}: {
  ticketId: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Xoá thiết kế "${title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        window.alert("Không thể xoá thiết kế. Vui lòng thử lại.");
        return;
      }

      router.refresh();
    } catch {
      window.alert("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Đang xoá..." : "Xoá"}
    </button>
  );
}
