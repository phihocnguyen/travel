export const TICKET_NAME_FONTS = [
  { id: 'serif', label: 'Cổ điển', family: '"Times New Roman", serif' },
  { id: 'sans', label: 'Hiện đại', family: 'Arial, Helvetica, sans-serif' },
  { id: 'georgia', label: 'Thanh lịch', family: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Máy chữ', family: '"Courier New", monospace' },
] as const;
export function ticketNameFont(id?:string) { return TICKET_NAME_FONTS.find(font=>font.id===id)?.family??TICKET_NAME_FONTS[0].family; }
