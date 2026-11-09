"use client";

import { Clapperboard, RefreshCw } from "lucide-react";

export default function VideoError({ retry }: { error: unknown; retry: () => void }) {
  return <section className="flex h-full flex-col items-center justify-center gap-4 rounded-[28px] bg-[#f3f5ef] p-6 text-center">
    <Clapperboard className="text-[#6a8153]" size={36} />
    <h1 className="text-xl font-semibold">Chưa thể tải video</h1>
    <p className="max-w-sm text-sm leading-relaxed text-zinc-500">Kết nối đang tạm gián đoạn. Bạn hãy thử tải lại sau ít phút.</p>
    <button type="button" onClick={retry} className="flex items-center gap-2 rounded-full bg-[#294c37] px-5 py-3 text-sm text-white"><RefreshCw size={16} />Thử lại</button>
  </section>;
}
