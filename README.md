# Đồng Tháp · Miền sông nước

Landing cinematic 3D cho tỉnh Đồng Tháp (ranh giới sau sắp xếp 2025), dựng bằng
Next.js 16, React Three Fiber và Three.js.

## Chạy locally

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## PostgreSQL / Neon

Đặt chuỗi kết nối trong `DATABASE_URL` của `.env.local`. File này được Git bỏ qua;
trên hosting, thêm cùng biến vào cấu hình môi trường của ứng dụng.

Chạy `npm run db:check` để kiểm tra kết nối và TLS bằng truy vấn chỉ đọc.
Server Components và Route Handlers có thể gọi `getDatabase()` từ `lib/db.ts`,
ví dụ `await getDatabase().query("SELECT now()")`. Module chỉ chạy phía server,
khởi tạo pool khi cần và tái sử dụng kết nối khi Next.js tải lại mã.

Vé và bài viết được lưu trong PostgreSQL. Ảnh vé, file PNG in vé, ảnh bìa và ảnh
trong bài được lưu trên disk; database chỉ giữ đường dẫn và metadata. Xem
[lưu trữ ảnh](docs/image-storage.md) và [deploy VPS bằng Docker](README-DEPLOY.md).
Mỗi user có
một vé với mã `VXDL000`–`VXDL999`. File in màu xuất ở 4120 × 2320 px, 300 DPI.

```bash
npm run db:migrate       # tạo/cập nhật schema, có kiểm tra checksum
npm run db:seed          # dữ liệu chiến dịch, điểm đến, mùa và phân quyền
npm run db:import-posts  # nhập bài viết cũ từ .data, giữ nguyên file nguồn
npm run db:verify        # kiểm tra ràng buộc bằng dữ liệu thử được rollback
npm run test:print       # kiểm tra độ phân giải, DPI và màu file in
npm run test:tickets     # kiểm thử luồng vé qua API và trình duyệt
npm run test:blog        # kiểm thử dán ảnh/HTML, lưu, duyệt và đọc bài
npm run test:video       # upload/stream video trên DB tạm, phiên đăng nhập giả lập
```

Chạy kiểm thử trình duyệt ở môi trường phát triển, với Chromium của Playwright
đã cài (`npx playwright install chromium-headless-shell`). Không chạy trên DB
production: kiểm thử tạo tài khoản/bản ghi tạm rồi dọn các bản ghi đó.

`/dashboard` là Tổng quan cá nhân; `/dashboard/admin/overview` là Tổng quan quản
trị. Admin xem, tra mã và in vé ở `/dashboard/admin/tickets`, duyệt bài ở
`/dashboard/admin`. Cấu hình email quản trị bằng `ADMIN_EMAILS`.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Cấu trúc

- `components/hero/HeroOverlay.tsx` — HUD cinematic: menu, headline, CTA, panel
  xã/phường, audio, loading.
- `components/map/MapScene.tsx` — R3F Canvas, ánh sáng, sương, camera fly-in.
- `components/map/Terrain.tsx` — mesh địa hình từ DEM, sông/kênh, viền tỉnh.
- `components/map/AdminOverlay.tsx` — overlay hành chính, hover/click, label LOD.
- `lib/map/assets.ts` — tải tile vệ tinh/DEM, dựng mask, texture overlay.
- `lib/geo/` — Mercator, polygon helpers, nạp dữ liệu.
- `public/geo/` — outline tỉnh, sông/kênh, 102 xã/phường.
- `app/api/tiles/` — proxy tile ảnh Esri và DEM Terrarium (không cần token).

## Nguồn dữ liệu

- Ảnh vệ tinh: Esri World Imagery (© Esri, Maxar, Earthstar Geographics).
- Cao độ: AWS Terrarium / Mapzen.
- Ranh giới, sông/kênh, hành chính: OpenStreetMap contributors.

Overlay xã/phường được dựng từ tâm các đơn vị hành chính trong
`public/geo/communes.json` (chia theo Voronoi trong ranh tỉnh) để giữ hiệu năng
và kích thước bundle; thay bằng polygon GeoJSON thật bằng cách cập nhật
`lib/map/assets.ts`.

### Dashboard cộng đồng

- Bảng tin: `/dashboard/posts`; video và bình chọn: `/dashboard/videos`.
- Admin duyệt video tại `/dashboard/admin/videos`. Video MP4/WebM tối đa 4 MB; mỗi tài khoản có một vote/video và có thể bỏ vote.
- Chạy `npm run db:migrate` với `DATABASE_URL` đã cấu hình để áp dụng `007_community_videos.sql`.
- Dashboard yêu cầu đăng nhập qua Google hoặc tài khoản admin hiện có.

Vercel dùng `vercel.json` để chạy `npm run vercel-build`: áp dụng các migration chưa chạy, sau đó build Next.js. Cần đặt `DATABASE_URL` trong môi trường build và runtime của Vercel. Nếu migration lỗi, deployment dừng trước khi đưa mã mới lên.

Bảng tin có ô đăng status tối đa 500 ký tự ngay trong dashboard; status dùng chung luồng admin duyệt bài viết.

### Video mẫu và duyệt video

Migration `008_video_samples.sql` tạo 5 bài video mẫu: 2 đã duyệt, 2 chờ duyệt và 1 bị từ chối, kèm một số vote mẫu. Dữ liệu mẫu được đánh dấu `Video mẫu`; không tạo tài khoản đăng nhập hay quyền admin.

Các bài mẫu dùng chung `/7686711-uhd_3840_2160_24fps.mp4` và ảnh poster trích từ video. File được phục vụ tĩnh; video upload thông thường vẫn dùng dữ liệu riêng trong database và giới hạn 4 MB. Migration không ghi đè quyết định duyệt đã có nếu chạy lại phần seed.

Admin mở `/dashboard/admin/videos`, chọn `Xem & duyệt` để phát video, thêm ghi chú và chọn `Phê duyệt` hoặc `Từ chối`. User chỉ thấy video đã duyệt trong bảng tin một cột tại `/dashboard/videos`; mục `Video của tôi` giữ cả trạng thái chờ duyệt và phản hồi.

Để nạp mẫu vào database thật, chạy `npm run db:migrate` với `DATABASE_URL` đã cấu hình. Vercel chạy bước này tự động qua `npm run vercel-build`.
