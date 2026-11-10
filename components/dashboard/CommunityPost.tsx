"use client";

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Clapperboard, Globe2, Leaf, MessageSquare } from 'lucide-react';
import CommunityTime from './CommunityTime';
import { UserAvatar } from '@/components/auth/UserAvatar';

export function CommunityHeading({ current }: { current: 'posts' | 'videos' }) {
  return <header className="social-heading"><div><span className="social-eyebrow"><Leaf size={12} />Không gian kết nối</span><h1>{current === 'videos' ? 'Video cộng đồng' : 'Bảng tin cộng đồng'}<span className="text-[#a7b879]">.</span></h1><p>Chia sẻ một khoảnh khắc. Kết nối một hành trình.</p></div><nav aria-label="Nội dung cộng đồng" className="social-nav"><Link href="/dashboard/posts" aria-current={current === 'posts' ? 'page' : undefined}><MessageSquare size={15} />Bảng tin</Link><Link href="/dashboard/videos" aria-current={current === 'videos' ? 'page' : undefined}><Clapperboard size={15} />Video</Link></nav></header>;
}

export function CommunityPostHeader({ name, date, badge }: { name: string; date: string; badge?: ReactNode }) {
  return <header className="social-post-header"><UserAvatar name={name} className="social-avatar" /><div className="social-author"><p className="social-author-name">{name}</p><p className="social-meta"><CommunityTime date={date} /><span aria-hidden>·</span><Globe2 size={11} /><span>Cộng đồng</span></p></div>{badge}</header>;
}

export function CommunityText({ content, limit = 260 }: { content: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  return <><p className="social-copy">{content.length > limit && !expanded ? `${content.slice(0, limit).trimEnd()}…` : content}</p>{content.length > limit && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="social-text-button">{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}</>;
}

export function CommunityLoading({ video = false }: { video?: boolean }) {
  return <article role="status" aria-label="Đang tải bảng tin" className="social-card social-post">
    <div aria-hidden="true"><div className="social-post-header"><div className="social-skeleton social-avatar shrink-0" /><div className="social-author"><div className="social-skeleton h-3 w-32" /><div className="social-skeleton mt-2 h-2 w-24" /></div><div className="social-skeleton h-5 w-14" /></div>
      <div className="social-post-copy"><div className="social-skeleton mb-2 h-3 w-3/4" /><div className="social-skeleton h-3 w-1/2" /></div>
      {video && <div className="social-skeleton aspect-video w-full !rounded-none" />}
      <div className="social-interactions"><div className="social-counts"><span className="social-skeleton h-3 w-20" /><span className="social-skeleton h-3 w-16" /></div><div className="social-actions justify-between">{[0, 1, 2].map(item => <div key={item} className="social-skeleton my-2 h-5 w-20" />)}</div><div className="social-comment-form"><div className="social-skeleton h-8 w-8 shrink-0 !rounded-full" /><div className="social-skeleton h-10 flex-1 !rounded-2xl" /></div></div>
    </div><span className="sr-only">Đang tải…</span>
  </article>;
}
