"use client";

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Clapperboard, Globe2, Leaf, MessageSquare } from 'lucide-react';
import { UserAvatar } from '@/components/auth/UserAvatar';

export function CommunityHeading({ current }: { current: 'posts' | 'videos' }) {
  return <header className="social-heading"><div><span className="social-eyebrow"><Leaf size={12} />Không gian kết nối</span><h1>{current === 'videos' ? 'Video cộng đồng' : 'Bảng tin cộng đồng'}<span className="text-[#a7b879]">.</span></h1><p>Chia sẻ một khoảnh khắc. Kết nối một hành trình.</p></div><nav aria-label="Nội dung cộng đồng" className="social-nav"><Link href="/dashboard/posts" aria-current={current === 'posts' ? 'page' : undefined}><MessageSquare size={15} />Bảng tin</Link><Link href="/dashboard/videos" aria-current={current === 'videos' ? 'page' : undefined}><Clapperboard size={15} />Video</Link></nav></header>;
}

export function CommunityPostHeader({ name, date, badge }: { name: string; date: string; badge?: ReactNode }) {
  return <header className="social-post-header"><UserAvatar name={name} className="social-avatar" /><div className="social-author"><p className="social-author-name">{name}</p><p className="social-meta"><time dateTime={date}>{new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', timeZone: 'Asia/Ho_Chi_Minh' })}</time><span aria-hidden>·</span><Globe2 size={11} /><span>Cộng đồng</span></p></div>{badge}</header>;
}

export function CommunityText({ content, limit = 260 }: { content: string; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  return <><p className="social-copy">{content.length > limit && !expanded ? `${content.slice(0, limit).trimEnd()}…` : content}</p>{content.length > limit && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="social-text-button">{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}</>;
}

export function CommunityLoading() {
  return <div role="status" aria-label="Đang tải bảng tin" className="social-card overflow-hidden p-5"><div className="mb-5 flex items-center gap-3"><div className="social-skeleton h-11 w-11 !rounded-full" /><div className="flex-1"><div className="social-skeleton mb-2 h-3 w-32" /><div className="social-skeleton h-2 w-20" /></div></div><div className="social-skeleton mb-2 h-3 w-3/4" /><div className="social-skeleton mb-5 h-3 w-1/2" /><div className="social-skeleton aspect-video w-full !rounded-xl" /><span className="sr-only">Đang tải…</span></div>;
}
