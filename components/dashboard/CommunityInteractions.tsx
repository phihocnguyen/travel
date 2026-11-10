"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, LoaderCircle, MessageCircle, Send, Share2, ThumbsUp } from 'lucide-react';
import { UserAvatar } from '@/components/auth/UserAvatar';
import './community.css';

type Comment = { id: string; content: string; authorName: string; createdAt: string };
type Discussion = { comments: Comment[]; likes: number; liked: boolean; total: number };
type Props = { kind: 'posts' | 'videos'; id: string; disabled?: boolean; initialLikes?: number; initialLiked?: boolean; viewerName?: string; onChange?: (id: string, likes: number, liked: boolean) => void };
export default function CommunityInteractions({ kind, id, disabled = false, initialLikes = 0, initialLiked = false, viewerName = 'Bạn', onChange }: Props) {
  const [data, setData] = useState<Discussion>({ comments: [], likes: initialLikes, liked: initialLiked, total: 0 });
  const [content, setContent] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(!disabled), [loaded, setLoaded] = useState(false), [expanded, setExpanded] = useState(false), [burst, setBurst] = useState(false), [shared, setShared] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null), section = useRef<HTMLElement>(null), working = useRef(false), shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = `/api/community/${kind}/${id}`;
  const read = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const response = await fetch(url, { signal }), result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (!signal?.aborted) { setData(result); setLoaded(true); }
    } catch (failure) { if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Chưa thể tải bình luận.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [url]);
  useEffect(() => {
    if (disabled || !section.current) return;
    const controller = new AbortController();
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void read(controller.signal); }
    }, { rootMargin: '300px' });
    observer.observe(section.current);
    return () => { observer.disconnect(); controller.abort(); };
  }, [disabled, read]);
  useEffect(() => () => { if (shareTimer.current) clearTimeout(shareTimer.current); }, []);
  async function update(method: 'POST' | 'PUT') {
    if (working.current || !loaded) return;
    working.current = true; setBusy(true); setError('');
    const previous = data;
    if (method === 'PUT') {
      setData({ ...data, liked: !data.liked, likes: data.likes + (data.liked ? -1 : 1) });
      setBurst(!data.liked);
    }
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(method === 'POST' ? { content } : { liked: !previous.liked }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result); onChange?.(id, result.likes, result.liked);
      if (method === 'POST') { setContent(''); setExpanded(true); input.current?.focus(); }
    } catch (failure) {
      if (method === 'PUT') { setData(previous); setBurst(false); }
      setError(failure instanceof Error ? failure.message : 'Chưa thể kết nối.');
    } finally { working.current = false; setBusy(false); }
  }
  async function share() {
    const link = new URL(kind === 'posts' ? `/blog/${id}` : `/dashboard/videos#video-${id}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: 'Một câu chuyện từ cộng đồng Vị Xoài', url: link });
      else { await navigator.clipboard.writeText(link); setShared(true); if (shareTimer.current) clearTimeout(shareTimer.current); shareTimer.current = setTimeout(() => setShared(false), 2500); }
    } catch (failure) { if (!(failure instanceof Error && failure.name === 'AbortError')) setError('Chưa thể chia sẻ liên kết. Hãy thử lại nhé.'); }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (content.trim()) void update('POST'); }
  return <section ref={section} aria-label="Tương tác và bình luận" className="social-interactions">
    <div className="social-counts"><span><span className="social-count-icon"><ThumbsUp size={10} fill="currentColor" /></span><span aria-live="polite">{data.likes} lượt thích</span></span><button type="button" disabled={disabled} onClick={() => input.current?.focus()}>{loaded ? `${data.total} bình luận` : disabled ? 'Chờ duyệt' : 'Bình luận'}</button></div>
    <div className="social-actions">
      <button type="button" disabled={disabled || busy || !loaded} aria-pressed={data.liked} data-burst={burst || undefined} onAnimationEnd={() => setBurst(false)} onClick={() => update('PUT')} className="social-action"><ThumbsUp size={16} fill={data.liked ? 'currentColor' : 'none'} />{data.liked ? 'Đã thích' : 'Thích'}</button>
      <button type="button" disabled={disabled} onClick={() => input.current?.focus()} className="social-action"><MessageCircle size={16} />Bình luận</button>
      <button type="button" disabled={disabled} onClick={share} className="social-action ml-auto">{shared ? <Check size={16} /> : <Share2 size={16} />}<span aria-live="polite">{shared ? 'Đã sao chép' : 'Chia sẻ'}</span></button>
    </div>
    {disabled ? <p className="pt-3 text-xs leading-relaxed text-[#87917c]">Tương tác sẽ mở khi nội dung được duyệt.</p> : <>
      {loading && <div role="status" aria-label="Đang tải bình luận" className="flex gap-2 pt-4"><span className="social-skeleton h-7 w-7 !rounded-full" /><span className="social-skeleton h-10 w-3/5 !rounded-xl" /></div>}
      {data.comments.length > 2 && <button type="button" onClick={() => setExpanded(!expanded)} className="social-text-button mt-3">{expanded ? 'Thu gọn bình luận' : `Xem thêm bình luận (${data.comments.length - 2})`}</button>}
      {data.comments.length > 0 && <div className="social-comments">{(expanded ? data.comments : data.comments.slice(-2)).map(comment => <div key={comment.id} className="social-comment"><UserAvatar name={comment.authorName} className="h-8 w-8 !rounded-full !border-[#e6ebdc] !bg-[#eef2e5] !text-[#788b62]" /><div className="min-w-0 max-w-full"><div className="social-comment-bubble"><strong>{comment.authorName}</strong><p>{comment.content}</p></div><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('vi-VN', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}</time></div></div>)}</div>}
      {!loading && loaded && !data.total && <p className="mt-3 text-[11px] leading-relaxed text-[#929d86]">Một lời bình luận có thể bắt đầu một câu chuyện mới.</p>}
      <form onSubmit={submit} className="social-comment-form"><UserAvatar name={viewerName} className="h-8 w-8 !rounded-full !border-[#e6ebdc] !bg-[#eef2e5] !text-[#788b62]" /><div className="social-comment-input"><textarea ref={input} aria-label="Viết bình luận" placeholder="Viết bình luận của bạn…" value={content} onChange={event => setContent(event.target.value)} maxLength={2000} rows={1} disabled={busy} /><button type="submit" aria-label="Gửi bình luận" disabled={busy || !loaded || !content.trim()}>{busy ? <LoaderCircle size={14} className="motion-safe:animate-spin" /> : <Send size={14} />}</button></div></form>
    </>}
    {error && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-xs leading-relaxed text-[#a96655]"><span>{error}</span>{!loaded && !disabled && <button type="button" disabled={loading} onClick={() => read()} className="font-semibold underline">Thử lại</button>}</div>}
  </section>;
}
