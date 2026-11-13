# Lưu ảnh trên disk

Tất cả ảnh do ứng dụng nhận upload/generate để lưu được ghi vào disk:

| Loại ảnh | Thư mục | Metadata trong PostgreSQL |
| --- | --- | --- |
| Ảnh thiết kế vé | `ticket-images` | `ticket_images` |
| PNG in/xuất vé | `ticket-outputs` | `ticket_outputs` |
| Ảnh bìa bài viết | `blog-covers` | `blog_covers` |
| Ảnh chèn trong bài | `blog-images` | `blog_images` |

Ảnh có sẵn trong `public` vẫn là file trong source. Ảnh bên ngoài được tham chiếu bằng URL (ví dụ avatar Google) không tự tải về. Video upload vẫn dùng PostgreSQL; thay đổi này chỉ chuyển ảnh.

## Đường dẫn và quyền truy cập

- Local: `.data/uploads`, hoặc đặt `IMAGE_STORAGE_DIR` trong `.env.local`.
- Docker: `/app/.data/uploads`, volume `travel_image_data`, dùng chung giữa app và migrate. Cả cấu hình IP và HTTPS dùng cùng volume.
- File có tên SHA-256 nội dung, không lấy tên hoặc đường dẫn từ người upload. File được ghi hoàn tất và sync trước khi công bố; lỗi ghi làm request/transaction thất bại.
- PostgreSQL lưu `file_path` tương đối cùng MIME, kích thước ảnh và quan hệ chủ sở hữu. Không ghi đường dẫn disk ra URL public.
- URL API hiện có được giữ nguyên. API vẫn kiểm tra quyền xem vé, quyền quản trị hoặc trạng thái duyệt bài trước khi đọc disk. Không mount thư mục upload thành thư mục tĩnh của Nginx.
- Các file là bất biến: thay ảnh tạo file mới rồi cập nhật DB; rollback DB không làm hỏng ảnh cũ. Ảnh không còn được tham chiếu được dọn riêng, tránh xóa khi request khác còn đang dùng.

## Cập nhật VPS đang chạy bằng IP

Trước khi chuyển, tạo backup DB theo README. Bản app cũ chỉ đọc bytea sẽ không đọc được ảnh đã chuyển; rollback bản cũ cần DB backup trước chuyển đổi.

Trên VPS, sau khi source mới đã được push/pull hoặc upload:

```bash
cd /opt/travel
sudo docker compose -f docker-compose.ip.yml build app
# Chỉ tiếp tục khi build thành công và đã backup DB.
sudo docker compose -f docker-compose.ip.yml stop nginx app
sudo docker compose -f docker-compose.ip.yml run --rm migrate
# Chỉ tiếp tục khi migrate thành công.
sudo docker compose -f docker-compose.ip.yml up -d --force-recreate app nginx
sudo docker compose -f docker-compose.ip.yml logs --tail=100 migrate app
```

Không chạy lại seed. Với domain HTTPS, dùng `-f docker-compose.yml` thay cho file IP.

Service `migrate` chạy hai bước:

1. `db:migrate`: thêm cột `file_path`, cho phép bytes cũ tồn tại để không mất ảnh trong lúc cập nhật.
2. `images:migrate`: khóa và đọc từng bản ghi cũ, ghi file, đọc lại để so sánh bytes, rồi mới cập nhật `file_path` và đặt `image_data=NULL` trong transaction.

Nếu disk lỗi/hết dung lượng, bản ghi đang xử lý rollback và bytes gốc còn trong DB. Những ảnh đã chuyển trước đó được giữ nguyên; chạy lại service migrate để tiếp tục. Không cần nạp toàn bộ ảnh vào RAM một lần. Script không thay đổi checksum các migration đã áp dụng.

Kiểm tra số ảnh còn nằm trong DB (kỳ vọng các cột đều là 0):

```bash
sudo docker compose -f docker-compose.ip.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT (SELECT count(*) FROM ticket_images WHERE image_data IS NOT NULL) AS ticket_images, (SELECT count(*) FROM ticket_outputs WHERE image_data IS NOT NULL) AS ticket_outputs, (SELECT count(*) FROM blog_covers WHERE image_data IS NOT NULL) AS blog_covers, (SELECT count(*) FROM blog_images WHERE image_data IS NOT NULL) AS blog_images;"'
```

PostgreSQL có thể chưa trả dung lượng file DB cho hệ điều hành ngay sau khi xóa bytea; autovacuum sẽ thu hồi để tái sử dụng nội bộ. Không tự chạy VACUUM FULL trên production khi chưa có maintenance window.

## Local và hosting

```bash
npm run db:migrate
npm run images:migrate
npm run dev
```

Disk cần ghi được và tồn tại lâu dài. Cấu hình này dành cho VPS/container có persistent volume; không dùng filesystem tạm của Vercel để lưu ảnh production. Nếu chạy nhiều app instance, chúng phải mount chung storage. Không đặt secret hay dữ liệu cá nhân khác trong thư mục upload.

## Backup và dọn file không còn dùng

Backup cả SQL dump và volume ảnh trong cùng khoảng dừng ghi. Hướng dẫn lệnh backup/restore ở [README triển khai](../README-DEPLOY.md#8-backup-và-restore). SQL dump sau migration chỉ chứa đường dẫn nên không đủ để khôi phục ảnh.

Xem trước số file không còn tham chiếu, cũ hơn 24 giờ:

```bash
sudo docker compose -f docker-compose.ip.yml run --rm --no-deps app npm run images:cleanup
```

Sau khi có backup, dừng **mọi tiến trình có thể ghi ảnh** (app, import và migration) trước khi xóa. Không chạy lệnh xóa song song với request upload:

```bash
sudo docker compose -f docker-compose.ip.yml stop nginx app
sudo docker compose -f docker-compose.ip.yml run --rm --no-deps app npm run images:cleanup -- --delete
sudo docker compose -f docker-compose.ip.yml start app nginx
```

Script mặc định chỉ xem trước, không xóa. Nó chỉ xét tên file do ứng dụng tạo và không chạm file đang được bốn bảng ảnh tham chiếu. Không dùng `down -v` hoặc volume prune để dọn ảnh.

## Kiểm thử

`npm run test:storage` kiểm tra ghi đồng thời, đường dẫn không hợp lệ, file thiếu, disk lỗi, migration SQL và chuyển bytea sang file bằng PostgreSQL nhúng PGlite. Kiểm thử tạo storage/DB tạm, không kết nối DB production.
