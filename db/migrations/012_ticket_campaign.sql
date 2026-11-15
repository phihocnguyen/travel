-- Ticket creation requires this campaign even when production skips db:seed.
-- Preserve any campaign metadata already configured by an administrator.
INSERT INTO campaigns (slug, name, tagline, description, status)
VALUES (
  'vi-xoai-dan-loi',
  'VỊ XOÀI DẪN LỐI',
  'Theo vị xoài Cát, mở lối chu du',
  'VỊ XOÀI DẪN LỐI là chiến dịch truyền thông quảng bá du lịch trải nghiệm gắn với vùng trồng xoài tại Cao Lãnh, Đồng Tháp, hướng đến người trẻ từ 18–24 tuổi tại TP. Hồ Chí Minh. Lấy xoài Cát làm điểm khởi đầu, dự án mong muốn đưa bạn khám phá nhiều hơn hương vị đặc sản địa phương – từ cảnh quan miệt vườn, đời sống nhà vườn đến những hoạt động trải nghiệm và câu chuyện văn hóa tại Cao Lãnh.',
  'published'
)
ON CONFLICT (slug) DO NOTHING;
