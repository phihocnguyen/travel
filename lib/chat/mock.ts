import { EVENT } from '@/components/campaign/campaignData';

export type ChatAnswer = { text: string; links?: { label: string; href: string }[] };
export const CHAT_TOPICS = [
  'Khám phá Cao Lãnh',
  'Gợi ý lịch trình du lịch',
  'Sự kiện và đặt vé',
  'Thử thách cover nhạc UGC',
] as const;

function normalize(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

export function mockChatAnswer(question: string): ChatAnswer {
  const query = normalize(question);
  if (/ugc|cover|thu thach|am nhac|bai hat|nhac|hashtag/.test(query)) return {
    text: 'Cùng kể câu chuyện Cao Lãnh bằng âm nhạc nhé! 🥭\n\n1. Chọn đoạn nhạc của chiến dịch mà bạn yêu thích.\n2. Quay một video cover: hát, nhảy hoặc biểu diễn theo cách riêng.\n3. Đặt tiêu đề, kể ngắn về ý tưởng rồi gửi video lên Video cộng đồng.\n4. Chờ duyệt để mọi người cùng xem và tương tác.\n\nVideo hỗ trợ MP4/WebM. Thể lệ, nhạc chính thức và hashtag sẽ được cập nhật khi chiến dịch công bố; đây là hướng dẫn trải nghiệm mẫu.',
    links: [{ label: 'Chia sẻ video cover', href: '/dashboard/videos?compose=1' }, { label: 'Xem video cộng đồng', href: '/dashboard/videos' }],
  };
  if (/\b(su kien|tram hen|dang ky|dat cho|tao ve|dat ve|mua ve|ve cua toi|gia ve|ve hen chu du)\b/.test(query) || query.trim() === 've' || /(^|[^\p{L}])vé(?=$|[^\p{L}])/iu.test(question)) return {
    text: `${EVENT.name} là sự kiện trải nghiệm của Vị Xoài Dẫn Lối: khám phá miệt vườn, ẩm thực, các trạm trò chơi và tích lũy Điểm Vườn.\n\n📅 ${EVENT.meta[0].value}\n📍 ${EVENT.meta[1].value}\n\nBạn có thể tạo Vé Hẹn Chu Du, thiết kế lời nhắn và xem vé trong “Vé của tôi”. Nếu chưa đăng nhập, website sẽ hướng dẫn bạn đăng nhập trước.\n\nMình đang hỗ trợ bằng dữ liệu mẫu; thao tác trong chat chưa đặt chỗ hay xác nhận thanh toán.`,
    links: [{ label: 'Tạo Vé Hẹn Chu Du', href: EVENT.ticketHref }, { label: 'Vé của tôi', href: '/dashboard/tickets' }],
  };
  if (/lich|lich trinh|ke hoach|\bngay\b|\bdem\b|tour|chuyen di/.test(query)) {
    const twoDays = /2|hai|cuoi tuan/.test(query);
    return {
      text: twoDays
        ? 'Lịch trình mẫu 2 ngày 1 đêm ở Cao Lãnh 🌿\n\nNGÀY 1\n• Sáng: đến Cao Lãnh, ăn sáng và nghỉ ngơi.\n• Trưa: thưởng thức món ăn địa phương.\n• Chiều: trải nghiệm vườn xoài, chụp ảnh và nghe chuyện nhà vườn.\n• Tối: ăn tối, dạo phố rồi nghỉ đêm.\n\nNGÀY 2\n• Sáng: chọn một điểm văn hóa hoặc sinh thái trên bản đồ.\n• Trưa: dùng bữa, chọn đặc sản làm quà.\n• Chiều: trở về, chia sẻ khoảnh khắc cùng cộng đồng.\n\nĐây là lịch trình tham khảo; hãy kiểm tra giờ mở cửa, thời tiết và đặt dịch vụ trước chuyến đi.'
        : 'Một ngày khám phá Cao Lãnh theo nhịp chậm 🥭\n\n• 08:00 — Ăn sáng, bắt đầu hành trình.\n• 09:00 — Khám phá miệt vườn và câu chuyện xoài Cát.\n• 11:30 — Dùng bữa với món ăn địa phương.\n• 14:00 — Chọn một điểm văn hóa hoặc sinh thái trên bản đồ.\n• 16:00 — Chụp ảnh, mua đặc sản và khép lại chuyến đi.\n\nĐây là lịch trình mẫu, chưa bao gồm thời gian di chuyển từ nơi bạn xuất phát. Bạn cũng có thể hỏi mình “lịch trình 2 ngày 1 đêm”.',
      links: [{ label: 'Mở bản đồ khám phá', href: '/map' }],
    };
  }
  if (/cao lanh|kham pha|di dau|an gi|xoai|vuon|du lich|tham quan|dac san/.test(query)) return {
    text: 'Cao Lãnh có nhiều điều để khám phá từ hương vị xoài Cát! 🥭\n\n🌿 Miệt vườn: tìm hiểu câu chuyện trồng xoài, đời sống nhà vườn và ghi lại khoảnh khắc xanh.\n🍲 Ẩm thực: khám phá món ăn, đặc sản và những hương vị địa phương.\n📍 Văn hóa & thiên nhiên: mở bản đồ, chọn điểm dừng theo sở thích của bạn.\n\nBạn thích đi trong một ngày hay dành trọn hai ngày? Mình có lịch trình mẫu cho cả hai.',
    links: [{ label: 'Khám phá bản đồ Cao Lãnh', href: '/map' }],
  };
  if (/chao|hello|hi\b|cam on/.test(query)) return { text: 'Chào bạn, mình là Xoài 🥭 Rất vui được đồng hành! Bạn muốn khám phá Cao Lãnh, lên lịch trình, tìm hiểu sự kiện & vé hay tham gia cover nhạc UGC?' };
  return { text: 'Mình đang hỗ trợ bốn chủ đề: khám phá Cao Lãnh, lịch trình du lịch, sự kiện & vé, và thử thách cover nhạc UGC. Bạn chọn gợi ý bên dưới hoặc hỏi như “Lên lịch trình Cao Lãnh 2 ngày” nhé! 🥭' };
}
