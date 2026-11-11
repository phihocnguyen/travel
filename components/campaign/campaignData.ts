/**
 * Copy for the VỊ XOÀI DẪN LỐI campaign and its Trạm Hẹn Cao Lãnh event.
 * Kept in one place so the intro, journey chapters and CTA stay in sync.
 */

export const CAMPAIGN = {
  name: "VỊ XOÀI DẪN LỐI",
  tagline: "Theo vị xoài Cát, mở lối chu du",
  description:
    "VỊ XOÀI DẪN LỐI là chiến dịch truyền thông quảng bá du lịch trải nghiệm gắn với vùng trồng xoài tại Cao Lãnh, Đồng Tháp, hướng đến người trẻ từ 18–24 tuổi tại TP. Hồ Chí Minh. Lấy xoài Cát làm điểm khởi đầu, dự án mong muốn đưa bạn khám phá nhiều hơn hương vị đặc sản địa phương – từ cảnh quan miệt vườn, đời sống nhà vườn đến những hoạt động trải nghiệm và câu chuyện văn hóa tại Cao Lãnh.",
} as const;

export const EVENT = {
  name: "TRẠM HẸN CAO LÃNH",
  tagline: "Một vé chu du – Muôn điều khám phá",
  description:
    "Trạm Hẹn Cao Lãnh là sự kiện trải nghiệm thuộc chiến dịch VỊ XOÀI DẪN LỐI. Lấy cảm hứng từ hội chợ miệt vườn kết hợp trò chơi hành trình, sự kiện đưa bạn vào chuyến chu du Cao Lãnh thông qua các trạm tương tác và thử thách thú vị.",
  highlights: [
    "Khám phá những lựa chọn di chuyển và lưu trú cho chuyến đi.",
    "Tìm hiểu hoạt động trải nghiệm tại vườn xoài.",
    "Khám phá ẩm thực và đặc sản địa phương.",
    "Thử sức với các trò chơi, tích lũy Điểm Vườn và nhận những phần quà thú vị.",
  ],
  meta: [
    { label: "Thời gian", value: "17/11/2026" },
    { label: "Địa điểm", value: "Lô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh" },
  ],
  ctaTitle: "SẴN SÀNG KHỞI HÀNH?",
  ctaBody:
    "Tạo ngay Vé Hẹn Chu Du mang dấu ấn riêng và chuẩn bị cho hành trình khám phá Cao Lãnh cùng chúng mình!",
  ticketNote:
    "Vé Hẹn Chu Du – Tấm vé mở đầu cho hành trình muôn điều khám phá.",
  ticketHref: "/dashboard/tickets/new",
} as const;
