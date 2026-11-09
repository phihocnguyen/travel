import type { ReactNode } from 'react';

export default function CommunityLayout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return <div data-community-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[28px] bg-[#f4f6ef] p-3 sm:p-5">
    <div data-community-layout className="mx-auto grid w-full max-w-[1440px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_310px]">
      <div data-community-main className="min-w-0 space-y-4">{children}</div>
      <aside data-community-sidebar aria-label="Khám phá cộng đồng" className="hidden min-w-0 space-y-5 xl:block">{sidebar}</aside>
    </div>
  </div>;
}
