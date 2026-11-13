"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";

// Pointer capture supports mouse and touch. Selecting an item then tapping the
// destination provides the same action for keyboard users and small screens.
export function useItemDrop(target: RefObject<HTMLElement | null>, onPlace: (id: string) => void, canSelect: (id: string) => boolean = () => true) {
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const gesture = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const place = (id: string) => { onPlace(id); setSelected(null); };
  const cancel = () => { gesture.current = null; setDrag(null); };
  const clear = () => { cancel(); setSelected(null); };
  const bind = (id: string) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || gesture.current) return;
      if (!canSelect(id)) { setSelected(null); return; }
      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.current = { id, x: event.clientX, y: event.clientY, moved: false };
      setSelected(id);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const current = gesture.current;
      if (!current || current.id !== id) return;
      const dx = event.clientX - current.x, dy = event.clientY - current.y;
      if (Math.hypot(dx, dy) > 7) current.moved = true;
      if (current.moved) setDrag({ id, dx, dy });
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      const current = gesture.current;
      if (!current || current.id !== id) return;
      const box = target.current?.getBoundingClientRect();
      if (current.moved && box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) place(id);
      cancel();
    },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (event.detail === 0) setSelected(canSelect(id) ? id : null);
    },
    "aria-pressed": selected === id,
    style: (drag?.id === id ? { translate: `${drag.dx}px ${drag.dy}px`, zIndex: 20 } : undefined) as CSSProperties | undefined,
  });
  return { selected, drag, bind, clear, placeSelected: () => { if (selected !== null) place(selected); } };
}
