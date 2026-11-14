"use client";

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Maximize2, MessageCircle, Minimize2, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { CHAT_TOPICS, type ChatAnswer } from '@/lib/chat/types';
import './chatbot.css';

type Message = ChatAnswer & { id: number; role: 'assistant' | 'user' };
const welcome: Message = { id: 0, role: 'assistant', text: 'Chào bạn, mình là Xoài! 🥭\nBạn đồng hành nhỏ cho chuyến khám phá Cao Lãnh. Hôm nay mình giúp gì cho bạn?' };

export default function TravelChatbot() {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false), [messages, setMessages] = useState<Message[]>([welcome]), [input, setInput] = useState(''), [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const panelId = useId(), titleId = useId(), panel = useRef<HTMLElement>(null), launcher = useRef<HTMLButtonElement>(null), field = useRef<HTMLInputElement>(null), history = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null), sequence = useRef(0), pending = useRef(false);
  useEffect(() => () => { controller.current?.abort(); }, []);
  useEffect(() => { if (open) (matchMedia('(pointer: fine)').matches ? field.current : panel.current)?.focus(); }, [open]);
  useEffect(() => { if (open && history.current) history.current.scrollTop = history.current.scrollHeight; }, [messages, typing, open]);
  function close() { setOpen(false); setExpanded(false); launcher.current?.focus(); }
  function reset() {
    controller.current?.abort(); controller.current = null;
    pending.current = false; setTyping(false); setMessages([welcome]); setInput(''); setError(''); field.current?.focus();
  }
  async function ask(text: string) {
    const question = text.trim();
    if (!question || pending.current) return;
    pending.current = true;
    const current = new AbortController(); controller.current = current;
    setMessages(previous => [...previous, { id: ++sequence.current, role: 'user', text: question }]);
    setInput(''); setTyping(true); setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: current.signal,
        body: JSON.stringify({ messages: [...messages.slice(-6).map(message => ({ role: message.role, content: message.text.slice(0,1800) })), { role: 'user', content: question }] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Xoài chưa thể trả lời lúc này.');
      if (controller.current !== current) return;
      setMessages(previous => [...previous, { ...result, id: ++sequence.current, role: 'assistant' }]);
    } catch (failure) {
      if (!current.signal.aborted && controller.current === current) { setError(failure instanceof Error ? failure.message : 'Không thể kết nối với Xoài.'); setInput(question); }
    } finally {
      if (controller.current === current) { setTyping(false); pending.current = false; controller.current = null; }
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); ask(input); }
  return <div className="travel-chat" data-travel-chatbot>
    {open && <section ref={panel} id={panelId} role="dialog" aria-labelledby={titleId} tabIndex={-1} className={`travel-chat-panel${expanded ? ' travel-chat-panel-expanded' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="travel-chat-header"><span className="travel-chat-mascot" aria-hidden="true">🥭</span><div><h2 id={titleId}>Hỏi Xoài một chút</h2><p><span />Bạn đồng hành Cao Lãnh</p></div><div className="travel-chat-controls"><button type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Thu nhỏ cửa sổ chat" : "Phóng to toàn màn hình"} title={expanded ? "Thu nhỏ" : "Toàn màn hình"}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button><button type="button" onClick={reset} aria-label="Bắt đầu cuộc trò chuyện mới" title="Bắt đầu lại"><RotateCcw size={16} /></button><button type="button" onClick={close} aria-label="Đóng chatbot"><X size={19} /></button></div></header>
      <div className="travel-chat-demo"><Sparkles size={12} />Trợ lý AI · Khám phá Cao Lãnh cùng Xoài</div>
      <div ref={history} role="log" aria-label="Cuộc trò chuyện với Xoài" aria-live="polite" aria-relevant="additions" className="travel-chat-history">
        {messages.map(message => <div key={message.id} className={`travel-chat-message travel-chat-message-${message.role}`}><span className="sr-only">{message.role === 'assistant' ? 'Xoài' : 'Bạn'}: </span><p>{message.text}</p>{message.tour && <div className="travel-tour"><div className="travel-tour-cover"><img src={message.tour.hotelImage} alt={message.tour.hotel} /><div><span>{message.tour.duration}</span><h3>{message.tour.title}</h3></div></div><p className="travel-tour-intro">{message.tour.intro}</p><div className="travel-tour-stops">{message.tour.stops.map(stop => <article key={`${stop.time}-${stop.title}`} className="travel-tour-stop"><img src={stop.image} alt={stop.alt} loading="lazy" /><div><span>{stop.time}</span><h4>{stop.title}</h4><p>{stop.detail}</p></div></article>)}</div><section className="travel-tour-info"><h4>{message.tour.hotel}</h4><p>{message.tour.hotelDetail}</p><h4>Ăn uống</h4><p>{message.tour.meals}</p><h4>Chi phí dự kiến</h4><p>{message.tour.budget}</p><h4>Trước khi khởi hành</h4><p>{message.tour.notes}</p></section></div>}{message.links && <div className="travel-chat-links">{message.links.map(link => <Link key={link.href} href={link.href} onClick={close}>{link.label}<ArrowUpRight size={14} /></Link>)}</div>}</div>)}
        {typing && <div role="status" className="travel-chat-typing"><span /><span /><span /><span className="sr-only">Xoài đang trả lời…</span></div>}
      </div>
      {error && <p role="alert" className="travel-chat-demo">{error}</p>}
      <div className="travel-chat-topics" aria-label="Chủ đề gợi ý">{CHAT_TOPICS.map(topic => <button key={topic} type="button" disabled={typing} onClick={() => ask(topic)}>{topic}</button>)}</div>
      <form onSubmit={submit} className="travel-chat-form"><input ref={field} aria-label="Nhập câu hỏi cho Xoài" value={input} onChange={event => setInput(event.target.value)} maxLength={1000} placeholder="Hỏi Xoài điều bạn muốn biết…" /><button type="submit" disabled={typing || !input.trim()} aria-label="Gửi câu hỏi"><Send size={17} /></button></form>
    </section>}
    <button ref={launcher} type="button" className="travel-chat-launcher" aria-label={open ? 'Thu gọn chatbot' : 'Mở chatbot tư vấn Cao Lãnh'} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => open ? close() : setOpen(true)}>
      {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
    </button>
  </div>;
}
