"use client";

import Link from 'next/link';
import { PHOTO_FEATURES } from '@/lib/photos';
import { ArrowRight, ArrowUpRight, Clapperboard, Compass, Leaf, MessageSquare, Users } from 'lucide-react';
import { UserAvatar } from '@/components/auth/UserAvatar';

type Highlight = { id: string; title: string; detail: string; onSelect: () => void };
export function CommunityHighlights({ title, items }: { title: string; items: Highlight[] }) {
  if (!items.length) return null;
  return <section className="social-side-card"><h2 className="social-side-title">{title}<span className="text-[#a3b18e]">↗</span></h2>{items.map((item, index) => <button key={item.id} type="button" onClick={item.onSelect} className="social-side-highlight"><span>{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><p>{item.title}</p><small>{item.detail}</small></div></button>)}</section>;
}

export function CommunityMembers({ members, count, label = 'chia sẻ' }: { members: { id: string; name: string }[]; count: number; label?: string }) {
  return <section className="social-side-card"><span className="social-eyebrow !text-[8px]"><Leaf size={11} />Gặp nhau qua những câu chuyện</span><h2 className="mt-3 text-lg font-bold leading-snug tracking-tight text-[#36533c]">Một góc nhỏ.<br /><span className="font-display font-medium italic text-[#849965]">Nhiều điều thân thương.</span></h2><div className="my-4 flex items-center gap-5 border-y border-[#e8eddf] py-3"><span className="text-[10px] text-[#909a83]"><strong className="mb-1 block text-lg font-bold text-[#536d43]">{count}</strong>{label}</span><span className="h-8 w-px bg-[#e4eada]" /><span className="text-[10px] text-[#909a83]"><strong className="mb-1 block text-lg font-bold text-[#536d43]">{members.length}</strong>người góp chuyện</span></div><h3 className="social-side-title !mb-1"><Users size={13} />Những người góp chuyện</h3>{members.slice(0, 4).map(member => <div key={member.id} className="social-member-row"><UserAvatar name={member.name} className="h-8 w-8 !rounded-full !border-[#e6ebdc] !bg-[#eef2e5] !text-[#788b62]" /><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[#5d7051]">{member.name}</p><p className="mt-1 text-[9px] text-[#a0a890]">Thành viên cộng đồng</p></div></div>)}{!members.length && <p className="mt-3 text-xs leading-relaxed text-[#8b977f]">Trở thành người đầu tiên góp một câu chuyện nhé.</p>}</section>;
}

export function CommunityExplore({ current }: { current: 'posts' | 'videos' }) {
  return <section className="space-y-4"><Link href={current === 'posts' ? '/dashboard/videos' : '/dashboard/posts'} className="group flex items-center gap-3 rounded-xl border border-[#e3e9dc] bg-white/70 p-3.5"><span className="rounded-xl bg-[#eaf0df] p-2.5 text-[#7a8d5c]">{current === 'posts' ? <Clapperboard size={17} /> : <MessageSquare size={17} />}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-[#536847]">{current === 'posts' ? 'Khoảnh khắc qua ống kính' : 'Chuyện kể trên bảng tin'}</p><p className="mt-1 text-[10px] text-[#8a967f]">{current === 'posts' ? 'Xem video từ cộng đồng' : 'Ghé đọc và góp một câu chuyện'}</p></div><ArrowUpRight size={13} className="text-[#9aa68b]" /></Link><Link href="/map" className="social-map-card" style={{ backgroundImage: `url("${PHOTO_FEATURES.gaoGiong.src}")` }}><Compass size={22} className="text-[#e1e9b8]" /><p>Chuyện hay bắt đầu<br />từ một chuyến đi.</p><small>Cao Lãnh có gì?<br />Cùng tìm trạm dừng tiếp theo nhé.</small><span>Khám phá bản đồ <ArrowRight size={12} /></span></Link><p className="px-1 text-[9px] leading-relaxed text-[#a0aa94]">Vị Xoài Dẫn Lối · Kết nối những hành trình</p></section>;
}
