"use client";

import { useEffect, useState } from 'react';
import { relativeTime } from '@/lib/community/time';

export default function CommunityTime({ date }: { date: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 15000);
    return () => clearInterval(timer);
  }, []);
  const absolute = new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return <time dateTime={date} title={absolute}>{now === null ? absolute : relativeTime(date, now)}</time>;
}
