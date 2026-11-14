# AI: chatbot Xoài

Chatbot gọi `POST /api/chat`; server dùng client chung trong `lib/ai/client.ts` để gọi API Chat Completions của Beeknoee. Model mặc định là `glm-4.5-flash`.

## Cấu hình

Local: đặt trong `.env.local` (Git bỏ qua). Production Docker: đặt trong `.env` trên VPS:

```dotenv
AI_API_KEY=YOUR_API_KEY
AI_BASE_URL=https://platform.beeknoee.com/v1
AI_MODEL=glm-4.5-flash
```

Không dùng tiền tố `NEXT_PUBLIC_` cho key. Không đưa key vào source, Dockerfile hay build args. Compose truyền cấu hình vào container lúc chạy. Khi đổi cấu hình production:

```bash
sudo docker compose up -d --force-recreate app
```

Lần đầu triển khai mã chatbot mới cần build lại image trước. Môi trường local cần khởi động lại `npm run dev` nếu Next.js chưa tải lại biến môi trường.

## Hành vi

- Gửi tối đa sáu tin nhắn gần nhất cùng câu hỏi mới đến nhà cung cấp AI.
- Ngữ cảnh lấy từ dữ liệu chiến dịch, sự kiện và điểm đến trong dự án. Chưa truy cập dữ liệu tài khoản, tồn vé hoặc đặt chỗ.
- Giữ giao diện lịch trình với ảnh và liên kết nội bộ được kiểm tra ở server.
- Khi upstream lỗi, hiển thị lỗi để người dùng gửi lại; không âm thầm dùng câu trả lời mẫu.
- Câu hỏi ngoài phạm vi rõ ràng bị từ chối ngay bằng bộ lọc server, không gọi AI. Câu hỏi có từ khóa website được kiểm tra phạm vi riêng trước khi sinh câu trả lời; yêu cầu trộn chủ đề ngoài phạm vi hoặc đổi vai trò cũng bị từ chối. Khi bộ phân loại không trả đúng `ALLOW`, server không sinh câu trả lời.
- Khi mở chat hoặc bắt đầu lại, Xoài hiện dấu ba chấm trước lời chào; dấu ba chấm tiếp tục hiển thị trong lúc chờ phản hồi thật.
- Giới hạn 12 yêu cầu/phút/IP, tối đa 8 yêu cầu đang xử lý trên mỗi process. Bộ đếm nằm trong bộ nhớ, không dùng chung giữa nhiều replica.
- Các tính năng AI phía server khác có thể dùng lại `completeAI()`; không gọi nhà cung cấp từ trình duyệt.

Tài liệu nhà cung cấp: https://platform.beeknoee.com/docs/chat-completions
