"use client";

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Maximize2, MessageCircle, Minimize2, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { CHAT_TOPICS, mockChatAnswer, type ChatAnswer } from '@/lib/chat/mock';
import './chatbot.css';

type Message = ChatAnswer & { id: number; role: 'assistant' | 'user' };
const welcome: Message = { id: 0, role: 'assistant', text: 'Chào bạn, mình là Xoài! 🥭\nBạn đồng hành nhỏ cho chuyến khám phá Cao Lãnh. Hôm nay mình giúp gì cho bạn?' };

export default function TravelChatbot() {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false), [messages, setMessages] = useState<Message[]>([welcome]), [input, setInput] = useState(''), [typing, setTyping] = useState(false);
  const panelId = useId(), titleId = useId(), panel = useRef<HTMLElement>(null), launcher = useRef<HTMLButtonElement>(null), field = useRef<HTMLInputElement>(null), history = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), sequence = useRef(0), pending = useRef(false);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { if (open) (matchMedia('(pointer: fine)').matches ? field.current : panel.current)?.focus(); }, [open]);
  useEffect(() => { if (open && history.current) history.current.scrollTop = history.current.scrollHeight; }, [messages, typing, open]);
  function close() { setOpen(false); setExpanded(false); launcher.current?.focus(); }
  function reset() {
    if (timer.current) clearTimeout(timer.current);
    pending.current = false; setTyping(false); setMessages([welcome]); setInput(''); field.current?.focus();
  }
  function ask(text: string) {
    const question = text.trim();
    if (!question || pending.current) return;
    pending.current = true;
    setMessages(previous => [...previous, { id: ++sequence.current, role: 'user', text: question }]);
    setInput(''); setTyping(true);
    timer.current = setTimeout(() => {
      const answer = { ...mockChatAnswer(question), id: ++sequence.current, role: 'assistant' as const };
      setMessages(previous => [...previous, answer]); setTyping(false); pending.current = false; timer.current = null;
    }, 550);
  }
  function submit(event: FormEvent) { event.preventDefault(); ask(input); }
  return <div className="travel-chat" data-travel-chatbot>
    {open && <section ref={panel} id={panelId} role="dialog" aria-labelledby={titleId} tabIndex={-1} className={`travel-chat-panel${expanded ? ' travel-chat-panel-expanded' : ''}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <header className="travel-chat-header"><span className="travel-chat-mascot" aria-hidden="true">🥭</span><div><h2 id={titleId}>Hỏi Xoài một chút</h2><p><span />Bạn đồng hành Cao Lãnh</p></div><div className="travel-chat-controls"><button type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Thu nhỏ cửa sổ chat" : "Phóng to toàn màn hình"} title={expanded ? "Thu nhỏ" : "Toàn màn hình"}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button><button type="button" onClick={reset} aria-label="Bắt đầu cuộc trò chuyện mới" title="Bắt đầu lại"><RotateCcw size={16} /></button><button type="button" onClick={close} aria-label="Đóng chatbot"><X size={19} /></button></div></header>
      <div className="travel-chat-demo"><Sparkles size={12} />Trải nghiệm với dữ liệu mẫu</div>
      <div ref={history} role="log" aria-label="Cuộc trò chuyện với Xoài" aria-live="polite" aria-relevant="additions" className="travel-chat-history">
        {messages.map(message => <div key={message.id} className={`travel-chat-message travel-chat-message-${message.role}`}><span className="sr-only">{message.role === 'assistant' ? 'Xoài' : 'Bạn'}: </span><p>{message.text}</p>{message.links && <div className="travel-chat-links">{message.links.map(link => <Link key={link.href} href={link.href} onClick={close}>{link.label}<ArrowUpRight size={14} /></Link>)}</div>}</div>)}
        {typing && <div role="status" className="travel-chat-typing"><span /><span /><span /><span className="sr-only">Xoài đang trả lời…</span></div>}
      </div>
      <div className="travel-chat-topics" aria-label="Chủ đề gợi ý">{CHAT_TOPICS.map(topic => <button key={topic} type="button" disabled={typing} onClick={() => ask(topic)}>{topic}</button>)}</div>
      <form onSubmit={submit} className="travel-chat-form"><input ref={field} aria-label="Nhập câu hỏi cho Xoài" value={input} onChange={event => setInput(event.target.value)} maxLength={1000} placeholder="Hỏi Xoài điều bạn muốn biết…" /><button type="submit" disabled={typing || !input.trim()} aria-label="Gửi câu hỏi"><Send size={17} /></button></form>
    </section>}
    <button ref={launcher} type="button" className="travel-chat-launcher" aria-label={open ? 'Thu gọn chatbot' : 'Mở chatbot tư vấn Cao Lãnh'} aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => open ? close() : setOpen(true)}>
      {open ? <X size={22} aria-hidden="true" /> : <MessageCircle size={24} aria-hidden="true" />}
    </button>
  </div>;
}
