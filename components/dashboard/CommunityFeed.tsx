"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Check, Clapperboard, Globe, PenLine, Search, Send } from 'lucide-react';
import type { BlogPost } from '@/lib/posts/types';
import { STATUS_MAX_LENGTH } from '@/lib/posts/status';
import { UserAvatar } from '@/components/auth/UserAvatar';
import MyPosts from './MyPosts';
import CommunityLayout from './CommunityLayout';
import { CommunityExplore, CommunityHighlights, CommunityMembers } from './CommunitySidebar';

export type FeedPost = BlogPost & { statusText: string };

function StatusCard({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  const long = post.statusText.length > 280;
  return <article className="mx-auto w-full max-w-[680px] overflow-hidden rounded-[20px] border border-[#e5ebdd] bg-white shadow-[0_4px_18px_-12px_#62754b25]">
    <header className="flex items-center gap-3 px-4 pt-3"><UserAvatar name={post.author.name} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{post.author.name}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#849077]">{new Date(post.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} · <Globe size={11} />Cộng đồng</p></div><span className="ml-auto rounded-full bg-[#f2f5e9] px-2.5 py-1 text-[9px] text-[#849368]">{post.category}</span></header>
    <div className="px-4 py-2.5 text-sm leading-relaxed"><p className="whitespace-pre-line break-words">{long && !expanded ? `${post.statusText.slice(0, 280).trimEnd()}…` : post.statusText}</p>{long && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-1 font-semibold text-[#71845d] hover:underline">{expanded ? 'Thu gọn' : 'Xem thêm'}</button>}</div>
    {post.coverImageUrl && <img src={post.coverImageUrl} alt="Ảnh trong status" loading="lazy" className="max-h-64 w-full object-cover" />}
    <footer className="flex items-center gap-1.5 border-t border-[#edf1e6] px-4 py-2 text-[10px] text-[#8c977f]"><Check size={11} />Đã được duyệt</footer>
  </article>;
}

export default function CommunityFeed({ posts, mine, name }: { posts: FeedPost[]; mine: BlogPost[]; name: string }) {
  const router = useRouter(), composer = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState('feed'), [query, setQuery] = useState(''), [category, setCategory] = useState('all'), [sort, setSort] = useState('new');
  const [content, setContent] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const categories = [...new Set(posts.map(post => post.category))].map(value => ({ value, count: posts.filter(post => post.category === value).length }));
  const members = [...new Map(posts.map(post => [post.author.sub, { id: post.author.sub, name: post.author.name }])).values()];
  const filtered = posts.filter(post => (category === 'all' || post.category === category) && `${post.statusText} ${post.author.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).sort((a, b) => sort === 'new' ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : Date.parse(a.createdAt) - Date.parse(b.createdAt));

  function focusComposer(text?: string) { if (text) setContent(text); composer.current?.focus(); }
  function chooseCategory(value: string) { setCategory(value); setQuery(''); }
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

  const sidebar = <>
    <CommunityMembers members={members} count={posts.length} />
    <CommunityHighlights title="Mới chia sẻ" items={[...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3).map(post => ({ id: post.id, title: post.statusText.slice(0, 100) || post.title, detail: `${post.author.name} · ${post.category}`, onSelect: () => { setCategory('all'); setQuery(post.statusText.slice(0, 80) || post.author.name); } }))} />
    {categories.length > 0 && <section><h2 className="mb-3 text-sm font-semibold text-[#36503f]">Chủ đề trong bảng tin</h2><div className="flex flex-wrap gap-2">{categories.map(item => <button key={item.value} type="button" onClick={() => chooseCategory(item.value)} aria-pressed={category === item.value} className={`rounded-full border px-3 py-2 text-[10px] transition ${category === item.value ? 'border-[#bfcda7] bg-[#eaf0dc] text-[#677c50]' : 'border-[#e4e9dc] bg-white text-[#87927c] hover:bg-[#f2f5e9]'}`}>{item.value} <span className="ml-1 opacity-60">{item.count}</span></button>)}</div></section>}
    <CommunityExplore current="posts" />
  </>;

  return <div className="flex h-full min-h-0 flex-col gap-4">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-semibold tracking-tight">Bảng tin</h1><div className="flex rounded-full bg-[#eef2e7] p-1">{[['feed', 'Cộng đồng'], ['mine', 'Của tôi']].map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id} className={`rounded-full px-4 py-2 text-xs ${tab === id ? 'bg-white font-semibold shadow-sm' : 'text-[#89967e]'}`}>{label}</button>)}</div></header>
    {tab === 'mine' ? <div className="min-h-0 flex-1"><MyPosts posts={mine} /></div> : <CommunityLayout sidebar={sidebar}>
      <section className="flex items-start justify-between gap-4 px-1 pb-1"><div><h2 className="text-lg font-semibold tracking-tight text-[#36503f]">Chia sẻ một chút, gần nhau hơn.</h2><p className="mt-2 max-w-lg text-xs leading-relaxed text-[#7e8c74]">Kể một câu chuyện, gửi một gợi ý hay tìm cảm hứng cho chuyến đi tiếp theo.</p></div><span className="hidden rounded-2xl bg-[#e9efda] p-3 text-[#8b9d67] sm:block"><PenLine size={20} strokeWidth={1.5} /></span></section>
      <form onSubmit={submit} className="rounded-[22px] border border-[#e5ebdd] bg-white p-4 shadow-[0_4px_18px_-12px_#62754b25]">
        <div className="flex items-start gap-3"><UserAvatar name={name} /><label className="min-w-0 flex-1"><span className="sr-only">Nội dung status</span><textarea ref={composer} value={content} disabled={busy} onChange={event => setContent(event.target.value)} maxLength={STATUS_MAX_LENGTH} rows={2} placeholder={`${name.trim()} ơi, bạn đang nghĩ gì?`} className="w-full resize-none rounded-2xl bg-[#f4f6f0] px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#cbd9bc] disabled:opacity-60" /></label></div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eef1e7] pt-3"><Link href="/dashboard/videos" className="flex items-center gap-2 text-xs font-medium text-[#9e8b55]"><Clapperboard size={16} />Chia sẻ video</Link><div className="flex items-center gap-3"><span className="text-[10px] text-[#96a08c]">{content.length}/{STATUS_MAX_LENGTH}</span><button type="submit" disabled={busy || !content.trim()} className="flex items-center gap-2 rounded-full bg-[var(--dashboard-primary,#294c37)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send size={13} />{busy ? 'Đang gửi…' : 'Đăng status'}</button></div></div>
        {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-xs text-emerald-700">{notice}</p>}
      </form>
      <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold text-[#496041]">Câu chuyện trong cộng đồng <span className="ml-1 text-[10px] font-normal text-[#9ba58e]">{filtered.length} chia sẻ</span></h2><select aria-label="Sắp xếp status" value={sort} onChange={event => setSort(event.target.value)} className="rounded-full border border-[#e5ebdd] bg-white px-3 py-2 text-[10px] text-[#849177]"><option value="new">Mới nhất</option><option value="old">Cũ nhất</option></select></div>
        <label className="flex items-center gap-3 rounded-2xl border border-[#e5ebdd] bg-white px-4 py-3 text-[#9aa58d]"><Search size={15} /><input aria-label="Tìm trên bảng tin" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm câu chuyện, người chia sẻ…" className="w-full bg-transparent text-xs text-[#536848] outline-none" /></label>
        {categories.length > 0 && <div className="flex flex-wrap gap-1.5">{[{ value: 'all', label: 'Tất cả' }, ...categories.map(item => ({ value: item.value, label: item.value }))].map(item => <button key={item.value} type="button" onClick={() => chooseCategory(item.value)} aria-pressed={category === item.value} className={`rounded-full px-3 py-1.5 text-[10px] ${category === item.value ? 'bg-[#e6edd5] font-semibold text-[#6c7f50]' : 'bg-white/80 text-[#929c85]'}`}>{item.label}</button>)}</div>}
      </section>
      {filtered.map(post => <StatusCard key={post.id} post={post} />)}
      {!filtered.length && <section className="rounded-[22px] border border-[#e5ebdd] bg-white p-6"><h2 className="text-sm font-semibold text-[#536848]">{query || category !== 'all' ? 'Chưa tìm thấy câu chuyện phù hợp.' : 'Câu chuyện đầu tiên có thể đến từ bạn.'}</h2><p className="mt-2 text-xs leading-relaxed text-[#8d987f]">{query || category !== 'all' ? 'Thử một từ khóa hoặc chủ đề khác nhé.' : 'Một góc đẹp, một món ngon hay một điều đáng nhớ đều là khởi đầu tuyệt vời.'}</p><button type="button" onClick={() => query || category !== 'all' ? (setQuery(''), setCategory('all')) : focusComposer('Khoảnh khắc mình nhớ nhất trong chuyến đi là…')} className="mt-4 rounded-full bg-[#eef3df] px-4 py-2 text-xs font-semibold text-[#7b8d59]">{query || category !== 'all' ? 'Xem tất cả chia sẻ' : 'Bắt đầu một status'}</button></section>}
    </CommunityLayout>}
  </div>;
}
