import { EVENT } from '@/components/campaign/campaignData';

export type TourStop = { time: string; title: string; detail: string; image: string; alt: string };
export type ChatAnswer = { text: string; links?: { label: string; href: string }[]; tour?: { title: string; duration: string; intro: string; hotel: string; hotelDetail: string; hotelImage: string; meals: string; budget: string; notes: string; stops: TourStop[] } };
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
        ? 'Mình lên tour mẫu 2 ngày 1 đêm theo nhịp thư thả, kết hợp di tích, vườn xoài và ẩm thực địa phương. Có thể đổi thứ tự theo giờ đến của bạn.'
        : 'Mình lên tour mẫu 1 ngày, bắt đầu ở trung tâm Cao Lãnh rồi ghé di tích và không gian miệt vườn. Lịch có thời gian nghỉ, không xếp điểm quá sát nhau.',
      tour: twoDays ? {
        title: 'Cao Lãnh · Vườn xoài và chuyện đất sen', duration: '2 ngày 1 đêm · tự túc',
        intro: 'Phù hợp nhóm bạn hoặc gia đình đi xe riêng. Chặng giữa các điểm cần tự kiểm tra trên bản đồ trước ngày khởi hành.',
        hotel: 'Gợi ý lưu trú · The Mango Trail Farmstay', hotelDetail: 'Trải nghiệm nghỉ giữa vườn xoài tại khu vực Cao Lãnh. Cần liên hệ nơi lưu trú để xác nhận phòng, giá, bữa ăn và lịch trải nghiệm theo ngày.', hotelImage: '/cao-lanh-orchard.jpg',
        meals: 'Bữa ăn · Ưu tiên dùng bữa tại farmstay hoặc chọn quán địa phương ở trung tâm Cao Lãnh. Gợi ý món theo mùa gồm cá đồng, lẩu mắm, bánh xèo và món từ xoài. Hỏi quán về giờ mở cửa, chỗ ngồi và thực đơn trước khi đi.',
        budget: 'Ngân sách tham khảo · Chưa gồm di chuyển đến Đồng Tháp. Tiền phòng, bữa ăn và trải nghiệm vườn thay đổi theo ngày, số khách và dịch vụ thực tế. Hãy hỏi giá trực tiếp trước khi đặt.',
        notes: 'Gọi trước để xác nhận phòng và hoạt động vườn. Mùa thu hoạch, thời tiết và giờ mở cửa có thể làm thay đổi lịch.',
        stops: [
          {time:'NGÀY 1 · 08:00',title:'Đến trung tâm Cao Lãnh, ăn sáng',detail:'Chọn quán ăn sáng tại trung tâm, gửi hành lý nếu chỗ nghỉ hỗ trợ nhận sớm. Dành khoảng 60–90 phút.',image:'/photos/vuon-xoai-d3b2b95d.webp',alt:'Những giỏ xoài trong ngày thu hoạch'},
          {time:'10:00',title:'Khu di tích Nguyễn Sinh Sắc',detail:'Tham quan khu mộ, không gian tưởng niệm và trưng bày. Đi nhẹ nhàng, dành khoảng 1,5–2 giờ.',image:'/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg',alt:'Không gian di tích tại Cao Lãnh'},
          {time:'12:00',title:'Ăn trưa món miền Tây',detail:'Chọn nhà hàng địa phương ở trung tâm. Hỏi món theo mùa và đặt bàn nếu đi nhóm đông.',image:'/cao-lanh-orchard.jpg',alt:'Cảnh quan xanh vùng Cao Lãnh'},
          {time:'14:00',title:'Nhận phòng và trải nghiệm nhà vườn',detail:'Di chuyển đến The Mango Trail Farmstay. Đạp xe, đi xuồng hoặc tham quan vườn nếu cơ sở xác nhận có hoạt động trong ngày.',image:'/cao-lanh-orchard.jpg',alt:'Vườn cây xanh ở Cao Lãnh'},
          {time:'18:30',title:'Bữa tối và nghỉ tại farmstay',detail:'Đặt trước bữa tối với cơ sở lưu trú hoặc ăn tại trung tâm rồi quay lại nghỉ.',image:'/photos/vuon-xoai-f553586a.webp',alt:'Người làm vườn chăm sóc những trái xoài'},
          {time:'NGÀY 2 · 07:30',title:'Ăn sáng, trả phòng',detail:'Xác nhận giờ ăn và giờ trả phòng với nơi lưu trú. Mang nước uống, nón và giày đi bộ.',image:'/photos/vuon-xoai-b0e31e81.webp',alt:'Xoài Cao Lãnh'},
          {time:'09:00',title:'Chợ quê cù lao Tân Thuận Đông',detail:'Dạo chợ, tìm trái cây và bánh dân gian. Chợ và hoạt động có thể theo phiên, nên xác nhận lịch trước khi đi.',image:'/photos/vuon-xoai-d3b2b95d.webp',alt:'Chợ quê cù lao Tân Thuận Đông'},
          {time:'12:00 · 14:00',title:'Ăn trưa, mua đặc sản rồi khởi hành',detail:'Dùng bữa gần trung tâm, mua xoài đúng mùa và chừa thời gian di chuyển về điểm xuất phát.',image:'/photos/vuon-xoai-f5d7675e.webp',alt:'Xoài địa phương'}
        ]
      } : {
        title:'Một ngày ở Cao Lãnh · Di tích và miệt vườn',duration:'1 ngày · tự túc',
        intro:'Lịch phù hợp người đã có mặt tại Cao Lãnh từ buổi sáng. Nếu đi từ TP. Hồ Chí Minh, hãy tính riêng thời gian và phương tiện liên tỉnh.',
        hotel:'Lưu trú · Không cần đặt phòng cho tour trong ngày',hotelDetail:'Nếu muốn ở lại, có thể tham khảo Khách sạn Lan Thái Ngọc ở trung tâm hoặc The Mango Trail Farmstay để trải nghiệm không gian vườn. Gọi trực tiếp xác nhận phòng và giá.',hotelImage:'/cao-lanh-orchard.jpg',
        meals:'Bữa ăn · Ăn sáng và trưa tại quán địa phương ở trung tâm. Buổi chiều thử nước uống hoặc món từ xoài nếu có. Hỏi giờ mở cửa và thực đơn trước khi ghé.',
        budget:'Ngân sách tham khảo · Chưa gồm xe đến Cao Lãnh. Chi phí phụ thuộc phương tiện nội tỉnh, bữa ăn và dịch vụ tại điểm. Xác nhận phí vào cửa và hoạt động với từng nơi.',
        notes:'Thứ tự có thể đổi theo giờ mở cửa, thời tiết và tình trạng vườn. Mang nước, nón và tiền mặt dự phòng.',
        stops:[
          {time:'08:00',title:'Ăn sáng tại trung tâm',detail:'Chọn món địa phương, chuẩn bị nước uống và kiểm tra đường đi trong ngày.',image:'/photos/vuon-xoai-d3b2b95d.webp',alt:'Những giỏ xoài trong ngày thu hoạch'},
          {time:'09:00',title:'Khu di tích Nguyễn Sinh Sắc',detail:'Tham quan khu mộ và không gian trưng bày. Dự kiến 1,5–2 giờ.',image:'/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg',alt:'Không gian di tích ở Cao Lãnh'},
          {time:'11:30',title:'Ăn trưa món địa phương',detail:'Dùng bữa ở trung tâm Cao Lãnh. Hỏi nhà hàng món theo mùa, giờ phục vụ và đặt bàn nếu đi nhóm.',image:'/cao-lanh-orchard.jpg',alt:'Cảnh quan xanh Cao Lãnh'},
          {time:'13:30',title:'Tham quan vườn xoài',detail:'Liên hệ trước một nhà vườn hoặc farmstay để hỏi lịch khách tham quan, mùa trái và chi phí trải nghiệm.',image:'/photos/vuon-xoai-f553586a.webp',alt:'Người làm vườn chăm sóc xoài'},
          {time:'16:00',title:'Mua đặc sản và kết thúc tour',detail:'Chọn xoài theo mùa tại điểm bán uy tín. Kiểm tra thời gian quay về và chặng đường tiếp theo.',image:'/photos/vuon-xoai-f5d7675e.webp',alt:'Xoài địa phương'}
        ]
      },
      links:[{label:'Mở bản đồ các điểm đến',href:'/map'}]
    };
  }
  if (/cao lanh|kham pha|di dau|an gi|xoai|vuon|du lich|tham quan|dac san/.test(query)) return {
    text: 'Cao Lãnh có nhiều điều để khám phá từ hương vị xoài Cát! 🥭\n\n🌿 Miệt vườn: tìm hiểu câu chuyện trồng xoài, đời sống nhà vườn và ghi lại khoảnh khắc xanh.\n🍲 Ẩm thực: khám phá món ăn, đặc sản và những hương vị địa phương.\n📍 Văn hóa & thiên nhiên: mở bản đồ, chọn điểm dừng theo sở thích của bạn.\n\nBạn thích đi trong một ngày hay dành trọn hai ngày? Mình có lịch trình mẫu cho cả hai.',
    links: [{ label: 'Khám phá bản đồ Cao Lãnh', href: '/map' }],
  };
  if (/chao|hello|hi\b|cam on/.test(query)) return { text: 'Chào bạn, mình là Xoài 🥭 Rất vui được đồng hành! Bạn muốn khám phá Cao Lãnh, lên lịch trình, tìm hiểu sự kiện & vé hay tham gia cover nhạc UGC?' };
  return { text: 'Mình đang hỗ trợ bốn chủ đề: khám phá Cao Lãnh, lịch trình du lịch, sự kiện & vé, và thử thách cover nhạc UGC. Bạn chọn gợi ý bên dưới hoặc hỏi như “Lên lịch trình Cao Lãnh 2 ngày” nhé! 🥭' };
}
