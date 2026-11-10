import type { ReactNode } from 'react';
import './community.css';

export default function CommunityLayout({ children, sidebar }: { children: ReactNode; sidebar: ReactNode }) {
  return <div data-community-scroll className="social-scroll">
    <div data-community-layout className="social-columns">
      <div data-community-main className="social-main">{children}</div>
      <aside data-community-sidebar aria-label="Khám phá cộng đồng" className="social-sidebar">{sidebar}</aside>
    </div>
  </div>;
}
