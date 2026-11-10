export function relativeTime(date: string, now = Date.now()): string {
  const timestamp = Date.parse(date);
  if (!Number.isFinite(timestamp)) return 'Không rõ thời gian';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return 'Vài giây trước';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} tuần trước`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} tháng trước`;
  return `${Math.floor(seconds / 31536000)} năm trước`;
}
