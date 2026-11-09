export default function DashboardLoading() {
  return <div role="status" aria-label="Đang tải trang" className="flex h-full min-h-0 flex-col gap-5">
    <span className="sr-only">Đang tải trang…</span>
    <div aria-hidden="true" className="flex h-full min-h-0 flex-col gap-5 motion-safe:animate-pulse">
      <div className="flex shrink-0 items-center justify-between gap-4"><div className="space-y-3"><div className="h-6 w-40 rounded-full bg-zinc-100" /><div className="h-3 w-56 max-w-full rounded-full bg-zinc-100" /></div><div className="h-9 w-20 rounded-full bg-zinc-100" /></div>
      <div className="h-10 shrink-0 rounded-2xl bg-zinc-50" />
      <div className="grid min-h-0 flex-1 gap-4 rounded-[24px] border border-zinc-100 bg-zinc-50/60 p-4 sm:grid-cols-[1fr_2fr]">
        <div className="hidden space-y-4 rounded-2xl bg-white p-4 sm:block">{[0, 1, 2, 3].map(item => <div key={item} className="h-12 rounded-xl bg-zinc-50" />)}</div>
        <div className="space-y-4 rounded-2xl bg-white p-4"><div className="h-10 w-10 rounded-full bg-zinc-100" /><div className="h-3 w-3/4 rounded-full bg-zinc-100" /><div className="h-3 w-1/2 rounded-full bg-zinc-100" /><div className="h-28 rounded-xl bg-zinc-50" /></div>
      </div>
    </div>
  </div>;
}

export function DashboardFrameLoading() {
  return <div className="fixed inset-0 flex bg-white font-sans">
    <aside aria-hidden="true" className="hidden w-[232px] shrink-0 space-y-6 border-r border-zinc-100 bg-zinc-50 p-5 lg:block"><div className="h-8 w-32 rounded-full bg-zinc-200/50" />{[0, 1, 2, 3].map(item => <div key={item} className="h-9 rounded-xl bg-zinc-200/40" />)}</aside>
    <div className="flex min-w-0 flex-1 flex-col"><div aria-hidden="true" className="h-14 shrink-0 border-b border-zinc-100" /><main className="min-h-0 flex-1 p-4 sm:p-5 lg:p-6"><DashboardLoading /></main></div>
  </div>;
}
