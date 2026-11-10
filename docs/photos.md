# Ảnh thật trên website

Ảnh trong 12 thư mục địa điểm/bộ ảnh ở `public` được dùng đầy đủ trong thư viện ảnh tại `/#photos`. Trang chủ, thẻ hành trình, thông tin điểm đến trên bản đồ, ảnh dự phòng bài viết và khu vực cộng đồng dùng chung danh mục `lib/photos/catalog.ts`.

Chạy `npm run photos:prepare` sau khi bổ sung ảnh vào các thư mục hiện có. Script tạo ảnh WebP trong `public/photos` và cập nhật danh mục. Không chỉnh sửa/xóa ảnh gốc. Hai file CR2 được lấy ảnh JPEG xem trước có sẵn trong RAW để trình duyệt hiển thị được.

- Bản xem lớn tối đa 2560 px, chất lượng WebP 90; thumbnail tối đa 720 px.
- Không phóng lớn ảnh nguồn, không kéo giãn hay crop phá hủy ảnh.
- Khung nội dung và thumbnail dùng tỷ lệ 16:9; trình xem phóng to hiển thị toàn ảnh với `scale-down` để ảnh nhỏ không bị kéo mờ.
- Next Image dùng `sizes` để chọn kích thước theo thiết bị; ảnh ngoài màn hình tải trễ.
- 59 ảnh trong bộ nguồn; 19 ảnh có đủ cả chiều ngang 1920 và chiều dọc 1080 px sau xử lý. Ảnh nguồn nhỏ hơn không thể có thêm chi tiết Full HD bằng cách đổi kích thước.

Ảnh kiến trúc trong thư mục “Nhà truyền thống vùng đất Cao Lãnh” có tên file liên quan Văn Thánh Miếu và nhà cổ, nên được đặt trong bộ “Kiến trúc & văn hóa”, không gắn nhầm vào Nhà truyền thống trong khu lưu niệm Chi bộ. Chỉ ảnh hồ lá sen có nội dung phù hợp được gắn vào Chùa Phước Kiển. Chưa có ảnh xác nhận riêng cho Phủ thờ Thư Ngọc Hầu và Vườn xoài Tư Mách: hai điểm này dùng ảnh nhà vườn với chú thích rõ là minh họa.

Logo, mẫu vé, hình nhận diện chiến dịch và poster của video mẫu được giữ theo đúng chức năng, không trộn vào ảnh du lịch hay thay hình của bài đăng do người dùng tải lên.
