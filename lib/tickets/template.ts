import { DEFAULT_TICKET_TEXT_TRANSFORM, DEFAULT_TICKET_TITLE_TRANSFORM } from './types';
export const TICKET_MESSAGES = [
  { id: 'journey', label: 'Một chuyến đi đẹp', text: 'Chúc bạn một chuyến chu du thật đẹp,\nvà mang về những kỷ niệm đáng nhớ.' },
  { id: 'meeting', label: 'Hẹn nhau ở Cao Lãnh', text: 'Hẹn bạn ở Trạm Hẹn Cao Lãnh,\ncùng theo vị xoài, mở lối chu du!' },
  { id: 'mango', label: 'Ngọt ngào như vị xoài', text: 'Mong những ngày của bạn luôn ngọt ngào\nnhư hương vị xoài quê mình.' },
  { id: 'memories', label: 'Gửi một miền thương', text: 'Gửi bạn một chút nắng, một chút thương,\nvà cả một miền ký ức Cao Lãnh.' },
  { id: 'friends', label: 'Cùng nhau khám phá', text: 'Đi cùng nhau, khám phá những điều mới,\nvà viết tiếp câu chuyện của chúng mình.' },
  { id: 'welcome', label: 'Chào mừng bạn', text: 'Chào mừng bạn đến với Trạm Hẹn Cao Lãnh.\nMột hành trình đầy niềm vui đang chờ!' },
] as const;
export const FIXED_TICKET = { title: 'Vé chu du · Trạm Hẹn Cao Lãnh', from: 'Vị Xoài Dẫn Lối', layout: 'left' as const, theme: { background: '#fff9e3', ink: '#111111', accent: '#659c40' }, stickers: [], image: { scale: 1, x: 0, y: 0 }, titleTransform: DEFAULT_TICKET_TITLE_TRANSFORM, textTransform: DEFAULT_TICKET_TEXT_TRANSFORM };
