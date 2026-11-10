"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Clapperboard, Globe2, LoaderCircle, MessageSquare, Search, Send, X } from 'lucide-react';
import type { BlogPost } from '@/lib/posts/types';
import { STATUS_MAX_LENGTH } from '@/lib/posts/status';
import { UserAvatar } from '@/components/auth/UserAvatar';
import CommunityInteractions from './CommunityInteractions';
import CommunityComposerModal from './CommunityComposerModal';
import { CommunityHeading, CommunityPostHeader, CommunityText } from './CommunityPost';
import MyPosts from './MyPosts';
import CommunityLayout from './CommunityLayout';
import { CommunityExplore, CommunityHighlights, CommunityMembers } from './CommunitySidebar';

export type FeedPost = BlogPost & { statusText: string };

function StatusCard({ post, name, index }: { post: FeedPost; name: string; index: number }) {
  return <article id={`post-${post.id}`} className="social-card social-post" style={{ animationDelay: `${Math.min(index, 4) * 55}ms` }}>
    <CommunityPostHeader name={post.author.name} date={post.createdAt} badge={<span className="social-badge">{post.category}</span>} />
    <div className="social-post-copy"><CommunityText content={post.statusText} limit={360} /></div>
    {post.coverImageUrl && (
      // Covers are authenticated, dynamic URLs served by the existing media API.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.coverImageUrl} alt={post.title} loading="lazy" className="max-h-[540px] w-full object-contain bg-[#f0f3eb]" />
    )}
    <CommunityInteractions kind="posts" id={post.id} viewerName={name} />
  </article>;
}

export default function CommunityFeed({ posts, mine, name }: { posts: FeedPost[]; mine: BlogPost[]; name: string }) {
  const router = useRouter(), composer = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState('feed'), [query, setQuery] = useState(''), [category, setCategory] = useState('all'), [sort, setSort] = useState('new');
  const [compose, setCompose] = useState(false);
  const [content, setContent] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const categories = [...new Set(posts.map(post => post.category))];
  const members = [...new Map(posts.map(post => [post.author.sub, { id: post.author.sub, name: post.author.name }])).values()];
  const filtered = posts.filter(post => (category === 'all' || post.category === category) && `${post.statusText} ${post.author.name}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).sort((a, b) => sort === 'new' ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : Date.parse(a.createdAt) - Date.parse(b.createdAt));
  function focusComposer() { setError(''); setCompose(true); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !content.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/statuses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Chưa thể đăng bài. Bạn hãy thử lại.');
      setContent(''); setCompose(false); setNotice('Đã gửi câu chuyện! Bài đăng sẽ xuất hiện sau khi được duyệt.'); router.refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Chưa thể kết nối. Bạn hãy thử lại.'); }
    finally { setBusy(false); }
  }
  const sidebar = <>
    <CommunityMembers members={members} count={posts.length} />
    <CommunityHighlights title="Chuyện mới trong cộng đồng" items={[...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3).map(post => ({ id: post.id, title: post.statusText.slice(0, 100) || post.title, detail: `${post.author.name} · ${post.category}`, onSelect: () => { setCategory('all'); setQuery(post.statusText.slice(0, 80) || post.author.name); } }))} />
    <CommunityExplore current="posts" />
  </>;
  return <div className="social-page">
    <CommunityHeading current="posts" />
    {tab === 'mine' ? <><div className="social-tabs"><button type="button" onClick={() => setTab('feed')}>Cộng đồng</button><button type="button" aria-pressed onClick={() => setTab('mine')}>Bài của tôi <span>{mine.length}</span></button></div><div className="min-h-0 flex-1"><MyPosts posts={mine} /></div></> : <CommunityLayout sidebar={sidebar}>
      <section aria-label="Chia sẻ khoảnh khắc" className="social-card social-composer">
        <div className="social-composer-top"><UserAvatar name={name} className="social-avatar" /><button type="button" aria-haspopup="dialog" onClick={focusComposer} className="social-composer-prompt">{name.trim()} ơi, bạn muốn chia sẻ điều gì?</button></div>
        <div className="social-composer-bottom"><Link href="/dashboard/videos?compose=1" className="social-composer-action"><Clapperboard size={18} />Chia sẻ video<span className="sr-only"> — đăng video</span></Link><button type="button" onClick={focusComposer} className="social-composer-action"><MessageSquare size={18} />Chia sẻ khoảnh khắc</button></div>
      </section>
      {compose && <CommunityComposerModal title="Tạo bài viết" busy={busy} onClose={() => setCompose(false)}>
        <form onSubmit={submit} className="social-form !border-0 !p-0">
          <div className="social-composer-top"><UserAvatar name={name} className="social-avatar" /><div><strong className="social-author-name">{name}</strong><p className="social-meta"><Globe2 size={12} />Chia sẻ cùng cộng đồng</p></div></div>
          <label className="social-field"><span className="sr-only">Nội dung status</span><textarea ref={composer} autoFocus value={content} disabled={busy} onChange={event => setContent(event.target.value)} maxLength={STATUS_MAX_LENGTH} rows={6} placeholder={`${name.trim()} ơi, bạn muốn chia sẻ điều gì?`} className="social-input !mt-0" /></label>
          <div className="flex justify-between gap-3"><span className="social-helper">Bài đăng sẽ được duyệt trước khi hiển thị. · {content.length}/{STATUS_MAX_LENGTH}</span><button type="submit" disabled={busy || !content.trim()} className="social-primary">{busy ? <LoaderCircle size={14} className="motion-safe:animate-spin" /> : <Send size={14} />}{busy ? 'Đang gửi…' : 'Đăng bài'}</button></div>
          {error && <p role="alert" className="social-notice" data-error="true">{error}</p>}
        </form>
      </CommunityComposerModal>}
      {error && !compose && <p role="alert" className="social-notice" data-error="true">{error}</p>}
      {notice && <p role="status" className="social-notice"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{notice}</p>}
      <div className="social-toolbar"><div className="social-tabs"><button type="button" aria-pressed={tab === 'feed'} onClick={() => setTab('feed')}>Dành cho bạn <span>{posts.length}</span></button><button type="button" onClick={() => setTab('mine')}>Bài của tôi</button></div><select aria-label="Sắp xếp status" value={sort} onChange={event => setSort(event.target.value)} className="social-select"><option value="new">Mới nhất</option><option value="old">Cũ nhất</option></select></div>
      <label className="social-search"><Search size={15} className="shrink-0" /><input aria-label="Tìm trên bảng tin" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm câu chuyện, người chia sẻ…" />{query && <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setQuery('')}><X size={13} /></button>}</label>
      {categories.length > 1 && <div className="flex flex-wrap gap-2">{[{ value: 'all', label: 'Tất cả chủ đề' }, ...categories.map(value => ({ value, label: value }))].map(item => <button key={item.value} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition-colors ${category === item.value ? 'border-[#d3dec4] bg-[#e9f0df] text-[#658247]' : 'border-[#e5eadd] bg-white/70 text-[#929c85] hover:bg-white'}`}>{item.label}</button>)}</div>}
      {filtered.map((post, index) => <StatusCard key={post.id} post={post} name={name} index={index} />)}
      {!filtered.length && <section className="social-card social-empty"><MessageSquare /><h2>{query || category !== 'all' ? 'Chưa tìm thấy câu chuyện phù hợp' : 'Một lời chia sẻ, một kết nối mới'}</h2><p>{query || category !== 'all' ? 'Thử một từ khóa hoặc chủ đề khác nhé.' : 'Kể về một chuyến đi, một món ngon hay một điều khiến bạn mỉm cười hôm nay.'}</p><button type="button" onClick={() => query || category !== 'all' ? (setQuery(''), setCategory('all')) : focusComposer()} className="social-primary">{query || category !== 'all' ? 'Xem tất cả chia sẻ' : 'Viết câu chuyện đầu tiên'}</button></section>}
      {filtered.length > 0 && <p className="py-3 text-center text-[10px] text-[#9aa68f]">Chia sẻ một chút, gần nhau hơn.</p>}
    </CommunityLayout>}
  </div>;
}
