"use client";

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { lockPageScroll } from '@/lib/ui/scroll-lock';

export default function CommunityComposerModal({ title, busy = false, onClose, children }: { title: string; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => {
    const element = dialog.current, previous = document.activeElement;
    element?.showModal();
    const unlock = lockPageScroll();
    return () => { element?.close(); unlock(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} className="social-composer-modal" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget || busy) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }}><header className="social-modal-heading"><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} aria-label="Đóng cửa sổ chia sẻ" onClick={onClose}><X size={20} /></button></header><div className="social-modal-body">{children}</div></dialog>;
}
