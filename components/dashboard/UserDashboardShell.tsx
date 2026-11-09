"use client";

import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, Clapperboard, Compass, House, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, Search, Settings2, Sparkles, Ticket, X } from 'lucide-react';
import { UserAvatar } from '@/components/auth/UserAvatar';
import { LogoutButton } from './LogoutButton';

export type DashboardUser = { name: string; email: string; picture?: string; provider: string };
const destinations = [
  { href: '/dashboard', label: 'Tổng quan', icon: House },
  { href: '/dashboard/tickets', label: 'Vé của tôi', icon: Ticket },
  { href: '/dashboard/posts', label: 'Bảng tin', icon: MessageSquare },
  { href: '/dashboard/videos', label: 'Video cộng đồng', icon: Clapperboard },
];
const searchable = [...destinations, { href: '/dashboard/settings', label: 'Tài khoản', icon: Settings2 }, { href: '/map', label: 'Khám phá bản đồ', icon: Compass }];
const fold = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

function NavigationProgress() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" data-navigation-pending={pending || undefined} className={`absolute inset-y-3 right-2 w-0.5 rounded-full bg-[#d9e68d] transition-opacity ${pending ? 'motion-safe:animate-pulse opacity-100' : 'opacity-0'}`} />;
}

export default function UserDashboardShell({ user, children }: { user: DashboardUser; children: ReactNode }) {
  const pathname = usePathname(), router = useRouter();
  const [collapsed, setCollapsed] = useState(false), [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const [mobile, setMobile] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const matches = searchable.filter(item => fold(item.label).includes(fold(query)));
  const section = pathname.startsWith('/dashboard/settings') ? 'Tài khoản' : destinations.find(item => item.href !== '/dashboard' && pathname.startsWith(item.href))?.label ?? 'Tổng quan';

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    sidebar.current?.querySelector<HTMLElement>('a,button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab') return;
      const links = sidebar.current?.querySelectorAll<HTMLElement>('a,button');
      if (!links?.length) return;
      const first = links[0], last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); if (previous instanceof HTMLElement) previous.focus(); };
  }, [open]);

  const close = () => { setOpen(false); setQuery(''); };
  return <div data-dashboard-shell data-user-dashboard className="fixed inset-0 overflow-hidden bg-[#fdfef9] font-sans text-[#2f483b]" style={{ '--sidebar-width': collapsed ? '84px' : '224px', '--dashboard-primary': '#2f483b' } as CSSProperties}>
    {open && <button type="button" aria-label="Đóng menu" onClick={close} className="fixed inset-0 z-40 bg-[#243c31]/35 backdrop-blur-sm lg:hidden" />}
    <aside ref={sidebar} inert={mobile && !open} role={mobile && open ? 'dialog' : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Điều hướng dashboard" className={`fixed inset-y-0 left-0 z-50 flex w-[224px] flex-col bg-[#294438] text-white transition-[width,transform] duration-200 lg:w-[var(--sidebar-width)] ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex h-24 shrink-0 items-center justify-between px-6">
        <Link href="/dashboard" onClick={close} aria-label="Vị Xoài Dẫn Lối — Tổng quan" className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#e4eac1] text-[#2f483b]"><Compass size={22} strokeWidth={1.6} /></span><span className={collapsed ? 'lg:hidden' : ''}><span className="block text-[17px] font-extrabold tracking-tight">Vị Xoài<span className="text-[#e4eac1]">.</span></span><span className="text-[9px] tracking-[0.18em] text-[#b3c1aa]">DẪN LỐI CHU DU</span></span></Link>
        <button type="button" aria-label="Đóng menu" onClick={close} className="rounded-lg p-1 text-white/70 lg:hidden"><X size={18} /></button>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pt-6">
        <p className={`mb-4 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#99ad91] ${collapsed ? 'lg:hidden' : ''}`}>Không gian của bạn</p>
        <div className="space-y-2">{destinations.map(item => {
          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} onClick={close} title={item.label} aria-label={item.label} aria-current={active ? 'page' : undefined} className={`relative flex h-12 items-center gap-3.5 rounded-2xl px-3.5 text-[12px] font-medium transition-colors ${active ? 'bg-white/10 text-white' : 'text-[#b3c1aa] hover:bg-white/5 hover:text-white'}`}><item.icon size={18} strokeWidth={1.7} className={`shrink-0 ${active ? 'text-[#e4eac1]' : ''}`} /><span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span><NavigationProgress /></Link>;
        })}</div>
        <div className={`relative mt-16 overflow-hidden rounded-[22px] bg-[#f7f5e4] p-4 text-[#2f483b] ${collapsed ? 'lg:hidden' : ''}`}><Sparkles size={19} className="relative z-10 mb-3" /><p className="relative z-10 text-xs font-bold">Một hành trình mới</p><p className="relative z-10 mt-1 text-[10px] text-[#8c947e]">Cao Lãnh đang chờ bạn.</p><Link href="/map" className="relative z-10 mt-4 inline-flex items-center gap-1 text-[10px] font-bold">Khám phá ngay <ArrowUpRight size={12} /></Link><span aria-hidden="true" className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-[#b8d9cc]" /><span aria-hidden="true" className="absolute -bottom-9 right-10 h-20 w-20 rounded-full bg-[#e2e7b8]" /></div>
      </nav>
      <div className="shrink-0 space-y-1 px-4 py-5"><Link href="/dashboard/settings" onClick={close} aria-label="Tài khoản" title="Tài khoản" className={`flex h-11 items-center gap-3.5 rounded-2xl px-3.5 text-xs transition-colors ${pathname === '/dashboard/settings' ? 'bg-white/10 text-white' : 'text-[#b3c1aa] hover:text-white'}`}><Settings2 size={18} strokeWidth={1.7} className="shrink-0" /><span className={collapsed ? 'lg:hidden' : ''}>Tài khoản</span></Link><Link href="/" title="Về website" aria-label="Về website" className="flex h-11 items-center gap-3.5 rounded-2xl px-3.5 text-xs text-[#b3c1aa] hover:text-white"><ArrowUpRight size={18} className="shrink-0" /><span className={collapsed ? 'lg:hidden' : ''}>Về website</span></Link></div>
      <div className="flex h-20 shrink-0 items-center gap-3 border-t border-white/10 px-6"><UserAvatar name={user.name} picture={user.picture} className="h-9 w-9 !rounded-full !border-white/20 !bg-[#e2e7b8] !text-[#2f483b]" /><div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}><p className="truncate text-[11px] font-semibold">{user.name}</p><p className="mt-1 text-[9px] text-[#b3c1aa]">Thành viên chu du</p></div></div>
    </aside>
    <div className="flex h-full min-h-0 flex-col transition-[padding] duration-200 lg:pl-[var(--sidebar-width)]">
      <header className="relative z-30 flex h-20 shrink-0 items-center gap-3 px-5 sm:px-8 xl:px-10">
        <button type="button" aria-label="Mở menu" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-xl bg-[#f2f5ed] p-2.5 lg:hidden"><Menu size={18} /></button>
        <button type="button" title="Thu gọn sidebar" aria-label="Thu gọn sidebar" aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)} className="hidden rounded-xl p-2 text-[#8b9c88] transition hover:bg-[#f2f5ed] lg:block">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        <form role="search" className="relative min-w-0 flex-1 sm:max-w-sm" onSubmit={event => { event.preventDefault(); if (query.trim() && matches[0]) { router.push(matches[0].href); setQuery(''); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setQuery(''); }}>
          <label className="flex items-center gap-2.5 border-b border-[#e9eee3] py-3 text-[#8f9e86]"><Search size={15} className="shrink-0" /><input aria-label="Tìm trang trong dashboard" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setQuery(''); }} placeholder="Tìm trong không gian của bạn…" className="min-w-0 w-full bg-transparent text-[11px] text-[#2f483b] outline-none placeholder:text-[#8f9e86]" /></label>
          {query.trim() && <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-[#e4ebdb] bg-white p-2 shadow-xl shadow-[#294438]/10">{matches.map(item => <Link key={item.href} href={item.href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-3 text-xs hover:bg-[#f2f5ed]"><item.icon size={15} />{item.label}</Link>)}{!matches.length && <p className="px-3 py-4 text-xs text-[#92a18a]">Không tìm thấy trang phù hợp.</p>}</div>}
        </form>
        <div className="ml-auto hidden items-center gap-3 sm:flex"><span className="mr-3 rounded-full bg-[#f0f4e8] px-3 py-1.5 text-[10px] text-[#788a6f]">{section}</span><LogoutButton className="rounded-full px-3 py-2 text-[10px] text-[#78876d] transition hover:bg-[#f2f5ed] disabled:opacity-40" /><Link href="/dashboard/settings" aria-label="Mở tài khoản" className="flex items-center gap-2"><UserAvatar name={user.name} picture={user.picture} className="h-8 w-8 !rounded-full !border-0 !bg-[#e7edd9] !text-[#6c825d]" /><ChevronDown size={12} className="text-[#92a18a]" /></Link></div>
      </header>
      <main data-dashboard-content className="min-h-0 flex-1 overflow-hidden px-5 pb-5 sm:px-8 sm:pb-8 xl:px-10 xl:pb-9">{children}</main>
    </div>
  </div>;
}
