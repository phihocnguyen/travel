# Deploy lên VPS Ubuntu bằng Docker, PostgreSQL và Cloudflare

Hướng dẫn dành cho dự án này: Next.js 16, PostgreSQL, đăng nhập Google và tài khoản admin. VPS: **103.252.137.103**. Ví dụ tên miền: **travel.example.com** — thay bằng tên miền thật trong mọi bước.

```text
Trình duyệt → Cloudflare (HTTPS) → VPS:443 / Nginx (HTTPS)
                                           ↓
                                      Next.js:3000
                                           ↓
                                      PostgreSQL:5432
```

Chỉ Nginx công khai cổng 80/443. App và database không publish cổng ra Internet. Database nằm trong Docker volume `travel_postgres_data`, tồn tại khi thay container.

## Chạy trước bằng IP khi chưa có domain

Dùng `docker-compose.ip.yml` **thay cho** `docker-compose.yml`, không ghép hai file bằng hai cờ `-f`. File IP tái sử dụng app/database của file chính, nên cần upload cả hai file. Chưa cần Cloudflare, certificate hoặc Google OAuth. Mở TCP 80 tại firewall nhà cung cấp VPS.

Sau khi cài Docker và đưa source vào `/opt/travel` theo bước 2–3, chạy trong SSH Ubuntu:

```bash
cd /opt/travel
# Chỉ tạo secret nếu chưa có .env; không ghi đè mật khẩu DB đang dùng.
if [ ! -f .env ]; then
  (umask 077; printf 'POSTGRES_DB=travel\nPOSTGRES_USER=travel\nPOSTGRES_PASSWORD=%s\nAUTH_SECRET=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" > .env)
fi
sed -i '/^NEXT_PUBLIC_SITE_URL=/d; /^GOOGLE_REDIRECT_URI=/d' .env
printf '\nNEXT_PUBLIC_SITE_URL=http://103.252.137.103\nGOOGLE_REDIRECT_URI=\n' >> .env
chmod 600 .env

sudo docker compose -f docker-compose.ip.yml config --quiet
sudo docker compose -f docker-compose.ip.yml build app
sudo docker compose -f docker-compose.ip.yml run --rm migrate
# Chỉ chạy seed cho DB mới; bỏ qua nếu đang dùng dữ liệu production cũ.
sudo docker compose -f docker-compose.ip.yml run --rm --no-deps app npm run db:seed
sudo docker compose -f docker-compose.ip.yml up -d
sudo docker compose -f docker-compose.ip.yml ps -a
curl -I http://103.252.137.103
```

Chạy từng lệnh, chỉ tiếp tục khi lệnh trước thành công. Mở **http://103.252.137.103** để kiểm tra giao diện/bản đồ. Cookie production có `Secure`, nên không dùng bản HTTP để đăng nhập, không nhập mật khẩu admin qua HTTP. Google OAuth chưa hoạt động khi chỉ có IP. Các lệnh vận hành bên dưới phải thêm `-f docker-compose.ip.yml` nếu vẫn dùng chế độ IP.

Nếu lỗi, lấy log:

```bash
sudo docker compose -f docker-compose.ip.yml logs --tail=100 db migrate app nginx
```

Khi có domain, làm bước 4–6, đổi `.env` sang HTTPS, build lại bằng file chính và chạy `sudo docker compose -f docker-compose.yml up -d --force-recreate`. Hai file dùng chung project `travel` và volume database, không cần xóa volume hoặc seed lại.

## 1. Chuẩn bị

- VPS Ubuntu 22.04/24.04 LTS 64-bit, quyền SSH và sudo. Các lệnh bên dưới chạy bằng Bash trên VPS, trừ đoạn ghi rõ PowerShell.
- Nên có 2 CPU, RAM 4 GB trở lên để build; dung lượng đĩa cần tính cả ảnh/video trong `public`, Docker image và dữ liệu PostgreSQL. Đây là mức khởi đầu, cần theo dõi theo lượng truy cập.
- Một tên miền do bạn sở hữu, đã thêm vào Cloudflare và đổi nameserver tại nhà đăng ký theo Cloudflare.
- Source đầy đủ gồm `public`, `db`, `scripts`, `package-lock.json` và các file Docker đi kèm.
- Nếu VPS đang chạy dịch vụ khác, kiểm tra cổng 80/443 trước khi triển khai; không dừng dịch vụ cũ khi chưa xác định tác động.

## 2. SSH và cài Docker

Từ PowerShell trên Windows:

```powershell
ssh root@103.252.137.103
```

Nếu nhà cung cấp dùng tài khoản khác, thay `root`. Trên VPS:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

Hướng dẫn dùng `sudo docker compose` (Compose V2), tên file là **docker-compose.yml**. Không cần cài lệnh `docker-compose` V1. Nếu máy đã cài Docker bằng nguồn khác và gặp xung đột package, xem [hướng dẫn chính thức](https://docs.docker.com/engine/install/ubuntu/) trước khi thay thế.

Firewall tại nhà cung cấp VPS: cho phép TCP 80/443 và cổng SSH đang dùng. Không mở 3000/5432. Docker publish cổng có thể đi vòng qua UFW; không dựa riêng vào UFW để khóa cổng container.

## 3. Đưa source lên VPS

Nếu source đã có trên Git, chạy trên VPS (thay URL):

```bash
sudo mkdir -p /opt/travel
sudo chown "$(id -u):$(id -g)" /opt/travel
git clone <URL_REPOSITORY_CUA_BAN> /opt/travel
cd /opt/travel
```

Repository private: dùng SSH deploy key chỉ đọc hoặc cơ chế xác thực của Git provider; không ghi token vào README hay source.

Nếu chưa dùng Git, tạo `/opt/travel` như trên rồi chạy từ **PowerShell máy Windows**:

```powershell
Set-Location C:\Users\Administrator\Desktop\travel
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env --exclude='.env.*' --exclude=.data --exclude=backups --exclude=deploy/certs -czf "$env:TEMP\travel-deploy.tar.gz" .
scp "$env:TEMP\travel-deploy.tar.gz" root@103.252.137.103:/tmp/travel-deploy.tar.gz
```

Trở lại VPS:

```bash
cd /opt/travel
tar -xzf /tmp/travel-deploy.tar.gz -C /opt/travel
```

Gói upload loại trừ các file `.env`, nên nếu dùng cách tar, tạo mẫu lại trên VPS:

```bash
cat > .env.docker.example <<'EOF'
POSTGRES_DB=travel
POSTGRES_USER=travel
POSTGRES_PASSWORD=
AUTH_SECRET=
NEXT_PUBLIC_SITE_URL=https://travel.example.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://travel.example.com/api/auth/google/callback
ADMIN_EMAILS=
EOF
```

Không upload `node_modules` hay `.next` từ Windows sang Linux; Docker sẽ cài/build đúng môi trường.

## 4. Cấu hình Cloudflare DNS và HTTPS

Trong Cloudflare, chọn tên miền:

1. **DNS → Records**: thêm A record cho `travel` (hoặc `@` nếu dùng tên miền gốc), trỏ tới `103.252.137.103`, bật **Proxied** (mây cam). Không giữ AAAA sai nếu VPS chưa cấu hình IPv6.
2. **SSL/TLS → Origin Server → Create Certificate**: tạo Origin Certificate cho đúng hostname, chọn RSA và PEM. Lưu cả Origin Certificate lẫn Private Key; key chỉ hiển thị khi tạo.
3. **SSL/TLS → Overview**: chọn **Full (strict)**. Không chọn Flexible.
4. Bật **Always Use HTTPS**; chờ Edge Certificate hoạt động nếu tên miền mới thêm.

Trên VPS:

```bash
cd /opt/travel
mkdir -p deploy/certs
chmod 700 deploy/certs
nano deploy/certs/origin.pem
nano deploy/certs/origin.key
chmod 600 deploy/certs/origin.key
chmod 644 deploy/certs/origin.pem
nano deploy/nginx.conf
```

Dán certificate vào `origin.pem`, private key vào `origin.key`, giữ nguyên dòng BEGIN/END. Thay **tất cả** `travel.example.com` trong `deploy/nginx.conf` bằng hostname thật. Không commit key/certificate vào Git; thư mục này đã được loại khỏi Git và Docker build context.

Origin Certificate chỉ được Cloudflare tin cậy. Truy cập IP trực tiếp, tắt mây cam hoặc pause Cloudflare có thể gây cảnh báo chứng chỉ trên trình duyệt. Đặt lịch thay certificate trước khi hết hạn; cách này không có Certbot tự gia hạn.

Không bật Cache Everything cho toàn site. Nếu đã có cache rule rộng, tạo rule **Bypass cache** cho `/api/*`, `/dashboard*`, `/login*` để không cache dữ liệu tài khoản. Không cần Cloudflare Tunnel cho mô hình này.

## 5. Cấu hình môi trường

```bash
cd /opt/travel
cp .env.docker.example .env
chmod 600 .env
openssl rand -hex 32
openssl rand -hex 32
nano .env
```

Điền hai chuỗi vừa tạo vào `POSTGRES_PASSWORD` và `AUTH_SECRET`:

```dotenv
POSTGRES_DB=travel
POSTGRES_USER=travel
POSTGRES_PASSWORD=CHUOI_HEX_NGAU_NHIEN_THU_NHAT
AUTH_SECRET=CHUOI_HEX_NGAU_NHIEN_THU_HAI
NEXT_PUBLIC_SITE_URL=https://travel.example.com
GOOGLE_CLIENT_ID=CLIENT_ID_CUA_BAN
GOOGLE_CLIENT_SECRET=CLIENT_SECRET_CUA_BAN
GOOGLE_REDIRECT_URI=https://travel.example.com/api/auth/google/callback
ADMIN_EMAILS=email-quan-tri@example.com
```

Dùng mật khẩu DB dạng hex như trên để không cần URL-encode ký tự đặc biệt. `DATABASE_URL` được Compose ghép tự động với hostname **db**, không phải localhost. `NEXT_PUBLIC_SITE_URL` phải đúng cả lúc build; đổi domain cần build lại image.

PostgreSQL được tự tạo user/database khi khởi tạo volume lần đầu. `POSTGRES_USER` là tài khoản quản trị của cluster Docker này; không dùng chung DB cho ứng dụng khác. Kết nối app–DB hiện đi qua mạng Docker nội bộ trên cùng VPS, không bật TLS cho PostgreSQL. Chặng Internet qua Cloudflare và Nginx dùng HTTPS.

Nếu đang có DB Neon/DB cũ: việc tạo DB mới không tự chuyển dữ liệu. Cần dump/restore DB cũ trước khi migrate và chuyển traffic. Đừng chạy seed trên DB production cũ nếu chưa kiểm tra vì seed có upsert nội dung chiến dịch/điểm đến.

## 6. Cấu hình Google Login

Trong Google Cloud Console / Google Auth Platform:

1. Cấu hình Branding/Consent và Audience cho ứng dụng.
2. Tạo OAuth client loại **Web application**.
3. Authorized JavaScript origin: `https://travel.example.com`.
4. Authorized redirect URI: `https://travel.example.com/api/auth/google/callback` — phải khớp tuyệt đối với `.env`.
5. Nếu còn Testing, thêm email thử vào Test users; khi mở cho người dùng thật, cấu hình trạng thái phát hành phù hợp.

Điền client ID/secret vào `.env`. Google OAuth yêu cầu domain HTTPS cho production, không dùng raw IP của VPS. Có thể để trống thông tin Google trong lần kiểm tra hạ tầng đầu tiên, nhưng nút đăng nhập Google sẽ chưa hoạt động.

## 7. Build và khởi tạo database

```bash
cd /opt/travel
sudo docker compose -f docker-compose.yml config --quiet
sudo docker compose build app
sudo docker compose up -d db
sudo docker compose run --rm migrate
sudo docker compose run --rm --no-deps app npm run db:seed
```

Chỉ tiếp tục nếu từng lệnh thành công. `db:migrate` tạo/cập nhật schema, có kiểm tra checksum; một số migration hiện có cũng thêm video mẫu. `db:seed` nạp nội dung khởi đầu và quyền. Không cần tự viết SQL tạo bảng.

Tạo tài khoản admin ban đầu với mật khẩu bạn nhập, tránh mật khẩu mặc định `admin` của script:

```bash
read -rsp 'Mat khau admin moi: ' ADMIN_INITIAL_PASSWORD
echo
export ADMIN_INITIAL_PASSWORD
sudo --preserve-env=ADMIN_INITIAL_PASSWORD docker compose run --rm --no-deps -e ADMIN_INITIAL_PASSWORD app npm run db:create-admin
unset ADMIN_INITIAL_PASSWORD
```

Username là `admin`. Chạy lại script không đổi mật khẩu tài khoản đã tồn tại. Email Google trong `ADMIN_EMAILS` cũng được ứng dụng nhận diện là admin.

Khởi động toàn bộ:

```bash
sudo docker compose up -d
sudo docker compose ps -a
sudo docker compose logs --tail=100 migrate app nginx
sudo docker compose exec nginx nginx -t
curl -I https://travel.example.com
```

Kết quả mong đợi: DB/app healthy, Nginx running, migrate **Exited (0)** là bình thường. Compose chờ DB sẵn sàng và migration thành công trước khi chạy app. Truy cập `https://travel.example.com`, thử Google login, admin login tại `/login`, dashboard, bản đồ, ảnh và upload video.

Image giữ TypeScript và các script để chạy seed/migration bằng cùng image; ưu tiên dễ vận hành, chưa tối ưu kích thước bằng standalone. App chạy bằng user `node`, không chạy root. Build không nhận secret DB/OAuth; các secret chỉ đưa vào container lúc chạy. File `.env.local` bị loại khỏi image.

Lệnh `db:check` hiện yêu cầu TLS, nên không dùng để kết luận DB nội bộ này lỗi. Kiểm tra DB trực tiếp:

```bash
sudo docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT current_database(), now();"'
```

Không chạy Playwright/kiểm thử tạo dữ liệu trên database production.

## 8. Backup và restore

Vé, bài viết và media upload được lưu trong PostgreSQL. Các file `public` cần giữ trong source hoặc bản sao riêng. Volume không phải backup: mất VPS/đĩa vẫn mất dữ liệu.

Tạo backup (chạy bằng Bash trên VPS):

```bash
cd /opt/travel
mkdir -p backups
chmod 700 backups
umask 077
backup_file="backups/travel-$(date +%F-%H%M%S).dump"
sudo docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup_file"
test -s "$backup_file" && echo "Backup: $backup_file"
```

Chỉ coi backup thành công nếu `pg_dump` thoát với mã 0. Sao chép backup ra máy khác, ví dụ từ PowerShell:

```powershell
scp root@103.252.137.103:/opt/travel/backups/travel-YYYY-MM-DD-HHMMSS.dump .
```

Thiết lập lịch backup hằng ngày bằng cron/timer theo các lệnh trên, lưu bản ngoài VPS và định kỳ thử restore. Giữ riêng bản sao `.env`, certificate/private key ở nơi an toàn; chúng không nằm trong SQL dump.

Thử restore vào database **mới** để không đè production (thay đường dẫn dump):

```bash
sudo docker compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" travel_restore_test'
sudo docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d travel_restore_test --no-owner --no-acl --exit-on-error' < backups/travel-YYYY-MM-DD-HHMMSS.dump
sudo docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d travel_restore_test -c "SELECT count(*) FROM users;"'
```

Nếu cần phục hồi thật: dừng app để tránh ghi mới, restore vào DB mới, đổi `POSTGRES_DB` trong `.env` sang DB đã restore rồi tạo lại container app/migrate. Giữ DB cũ đến khi xác minh dữ liệu. Restore backup cũ đồng nghĩa dữ liệu ghi sau thời điểm backup không có trong DB phục hồi.

**Không chạy `docker compose down -v`** nếu muốn giữ database. `down` không có `-v` giữ named volume. Không đổi major version PostgreSQL trực tiếp trên volume đang dùng; cần quy trình pg_upgrade hoặc dump/restore.

Đổi `POSTGRES_PASSWORD` trong `.env` không đổi mật khẩu của DB đã khởi tạo. Muốn rotate phải đổi password role bằng PostgreSQL rồi cập nhật môi trường app tương ứng.

## 9. Cập nhật website

Cách này có downtime ngắn, không phải rolling deployment. Backup DB trước mỗi lần có migration. Build image mới trước khi dừng app để lỗi build không ảnh hưởng bản đang chạy.

```bash
cd /opt/travel
git pull --ff-only
# Chọn tag riêng cho mỗi bản, ghi lại tag đang chạy để có thể quay lại.
export APP_IMAGE_TAG="$(date +%Y%m%d-%H%M%S)"
sudo --preserve-env=APP_IMAGE_TAG docker compose build app
```

Sau khi build thành công và đã backup:

```bash
sudo docker compose stop nginx app
sudo --preserve-env=APP_IMAGE_TAG docker compose run --rm migrate
# Chỉ chạy bước tiếp nếu migration thành công.
sudo --preserve-env=APP_IMAGE_TAG docker compose up -d --force-recreate app nginx
sudo docker compose ps -a
curl -I https://travel.example.com
```

Lưu tag thành công vào `.env`: thêm/cập nhật `APP_IMAGE_TAG=TAG_VUA_DEPLOY` rồi `unset APP_IMAGE_TAG` để các lần vận hành sau dùng đúng image. Nếu upload source bằng tar, thay bước `git pull` bằng upload/giải nén bản mới, giữ `.env` và `deploy/certs`.

Không chạy lại seed mỗi lần update. Nếu migration lỗi, dừng cập nhật và xem log; runner hiện dùng transaction nên migration thất bại được rollback. Có thể khởi động lại image cũ nếu DB còn tương thích. Quay về image cũ không tự rollback schema: khi schema đã thay đổi không tương thích, cần bản sửa hoặc phục hồi DB đã backup và source tương ứng.

## 10. Xử lý lỗi và vận hành

```bash
cd /opt/travel
sudo docker compose ps -a
sudo docker compose logs --tail=150 db migrate app nginx
sudo docker stats --no-stream
df -h
```

| Hiện tượng | Kiểm tra |
| --- | --- |
| Cloudflare 521/522 | DNS đúng IP, Nginx chạy, firewall nhà cung cấp mở 443, cổng không bị dịch vụ khác chiếm |
| Cloudflare 525/526 | Full (strict), certificate/key khớp, hostname có trong certificate, certificate chưa hết hạn |
| Nginx 502 | App healthy, migration thành công; xem log app và Nginx |
| `redirect_uri_mismatch` | Callback Google Console khớp tuyệt đối `GOOGLE_REDIRECT_URI`, gồm https và hostname |
| Login lặp về `/login` hoặc 403 | Dùng đúng domain HTTPS; kiểm tra Host/X-Forwarded-Proto, cookie, Cloudflare cache bypass |
| `password authentication failed` | Mật khẩu `.env` phải khớp role trong volume cũ; đổi env không reset DB |
| Build bị kill / hết RAM | Xem RAM/đĩa, tăng tài nguyên hoặc build trên máy Linux/CI cùng kiến trúc |
| Upload 413 | Nginx cho phép 20 MB nhưng app hiện vẫn có giới hạn video 4 MB; proxy không nâng giới hạn ứng dụng |

Các container dài hạn tự chạy lại sau reboot nhờ `restart: unless-stopped`, khi Docker service được enable. Healthcheck chỉ báo tình trạng; không tự restart một process còn sống nhưng unhealthy.

Hiện Nginx ghi nhận IP của Cloudflare, không phải IP thật của khách. Nếu cần log/rate limit theo khách, cấu hình real_ip chỉ tin dải IP Cloudflare chính thức; không tin trực tiếp header IP do Internet gửi vào. Nếu muốn bắt buộc toàn bộ traffic qua Cloudflare, giới hạn 80/443 ở firewall nhà cung cấp chỉ cho IP Cloudflare (cả IPv4/IPv6 và cập nhật định kỳ), giữ riêng đường SSH quản trị.

## Tài liệu tham khảo

- [Docker Engine trên Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Compose: chờ database và migration](https://docs.docker.com/compose/how-tos/startup-order/)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Cloudflare Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Google OAuth Web Server](https://developers.google.com/identity/protocols/oauth2/web-server)

Các file cấu hình đã được chuẩn bị trong repository. Cần chạy các bước build, kiểm tra và đăng nhập trên VPS để xác nhận triển khai; không có thông tin SSH/tên miền thật trong cấu hình mẫu.
