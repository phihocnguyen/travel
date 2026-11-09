"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Check, Clapperboard, Globe, Search, Send } from 'lucide-react';
import type { BlogPost } from '@/lib/posts/types';
import { STATUS_MAX_LENGTH } from '@/lib/posts/status';
import { UserAvatar } from '@/components/auth/UserAvatar';
import MyPosts from './MyPosts';

export type FeedPost = BlogPost & { statusText: string };

function StatusCard({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  const long = post.statusText.length > 280;
  return <article className="overflow-hidden rounded-[22px] border border-[#e5ebdd] bg-white shadow-sm">
    <header className="flex items-center gap-3 px-4 pt-4">
      <UserAvatar name={post.author.name} />
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{post.author.name}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">{new Date(post.createdAt).toLocaleDateString('vi-VN')} · <Globe size={11} />Cộng đồng</p></div>
    </header>
    <div className="px-4 py-3 text-sm leading-relaxed">
      <p className="whitespace-pre-line break-words">{long && !expanded ? `${post.statusText.slice(0, 280).trimEnd()}…` : post.statusText}</p>
      {long && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-1 font-semibold text-[#71845d] hover:underline">{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}
    </div>
    {post.coverImageUrl && <img src={post.coverImageUrl} alt="Ảnh trong status" loading="lazy" className="max-h-72 w-full object-cover" />}
    <footer className="flex items-center gap-1.5 border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-400"><Check size={11} />Đã được duyệt</footer>
  </article>;
}

export default function CommunityFeed({ posts, mine, name }: { posts: FeedPost[]; mine: BlogPost[]; name: string }) {
  const router = useRouter();
  const [tab, setTab] = useState('feed');
  const [query, setQuery] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filtered = posts.filter(post => `${post.statusText} ${post.author.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/statuses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Chưa thể đăng status. Bạn hãy thử lại.');
      setContent(''); setNotice('Đã gửi status. Nội dung sẽ xuất hiện sau khi admin duyệt.'); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Chưa thể kết nối. Bạn hãy thử lại.'); }
    finally { setBusy(false); }
  }

  return <div className="flex h-full min-h-0 flex-col gap-4">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold tracking-tight">Bảng tin</h1><div className="flex rounded-full bg-zinc-100 p-1">{[['feed', 'Cộng đồng'], ['mine', 'Của tôi']].map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-xs ${tab === id ? 'bg-white font-semibold shadow-sm' : 'text-zinc-500'}`}>{label}</button>)}</div></header>
    {tab === 'mine' ? <div className="min-h-0 flex-1"><MyPosts posts={mine} /></div> : <div className="min-h-0 flex-1 overflow-y-auto rounded-[28px] bg-[#f4f6ef] p-3 sm:p-5">
      <div className="mx-auto max-w-[620px] space-y-3">
        <form onSubmit={submit} className="rounded-[22px] border border-[#e5ebdd] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3"><UserAvatar name={name} /><label className="min-w-0 flex-1"><span className="sr-only">Nội dung status</span><textarea value={content} disabled={busy} onChange={event => setContent(event.target.value)} maxLength={STATUS_MAX_LENGTH} rows={3} placeholder={`${name.split(' ').at(-1)} ơi, bạn đang nghĩ gì?`} className="w-full resize-none rounded-2xl bg-[#f4f6f0] px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#cbd9bc] disabled:opacity-60" /></label></div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3"><Link href="/dashboard/videos" className="flex items-center gap-2 text-xs font-medium text-[#ad7939]"><Clapperboard size={16} />Video</Link><div className="flex items-center gap-3"><span className="text-[10px] text-zinc-400">{content.length}/{STATUS_MAX_LENGTH}</span><button type="submit" disabled={busy || !content.trim()} className="flex items-center gap-2 rounded-full bg-[var(--dashboard-primary,#294c37)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send size={13} />{busy ? 'Đang gửi…' : 'Đăng status'}</button></div></div>
          {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-xs text-emerald-700">{notice}</p>}
        </form>
        <label className="flex items-center gap-3 rounded-full border border-[#e5ebdd] bg-white px-4 py-2.5 text-zinc-400"><Search size={15} /><input aria-label="Tìm trên bảng tin" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm status, bạn bè…" className="w-full bg-transparent text-xs text-zinc-700 outline-none" /></label>
        {filtered.map(post => <StatusCard key={post.id} post={post} />)}
        {!filtered.length && <p className="rounded-[22px] bg-white p-8 text-center text-sm text-zinc-500">{query ? 'Không tìm thấy status phù hợp.' : 'Chưa có status. Chia sẻ một khoảnh khắc nhé!'}</p>}
      </div>
    </div>}
  </div>;
}
