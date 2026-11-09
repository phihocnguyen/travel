-- Reuse the supplied public clip for sample posts; regular uploads remain private bytea files.
ALTER TABLE community_videos ALTER COLUMN video_data DROP NOT NULL;
ALTER TABLE community_videos ADD COLUMN video_url text;
ALTER TABLE community_videos ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE community_videos ADD CONSTRAINT community_videos_source_check CHECK (
  (video_data IS NOT NULL AND video_url IS NULL) OR
  (video_data IS NULL AND video_url IS NOT NULL AND video_url ~ '^/[A-Za-z0-9_/-]+\.(mp4|webm)$' AND video_url NOT LIKE '//%' AND video_url NOT LIKE '%..%')
);

INSERT INTO users(auth_subject,display_name,email) VALUES
 ('sample:video:minh-anh','Nguyễn Minh Anh','video-minh-anh@example.invalid'),
 ('sample:video:bao-an','Trần Bảo An','video-bao-an@example.invalid'),
 ('sample:video:hoang-nam','Lê Hoàng Nam','video-hoang-nam@example.invalid')
ON CONFLICT(auth_subject) DO NOTHING;

INSERT INTO community_videos(id,author_id,title,description,content_type,video_url,is_sample,status,review_note,reviewed_at,created_at)
SELECT sample.id::uuid,u.id,sample.title,sample.description,'video/mp4',
 '/7686711-uhd_3840_2160_24fps.mp4',true,sample.status,sample.note,
 CASE WHEN sample.status='pending' THEN NULL ELSE now()-sample.age END,now()-sample.age
FROM (VALUES
 ('8f6c6b10-90bf-40ea-9a54-000000000001','sample:video:minh-anh','Một buổi chiều dành cho những gam màu','Chậm lại một chút, dành thời gian cho điều mình yêu thích. Một góc nhỏ đầy cảm hứng để bắt đầu câu chuyện mới.','approved',NULL::text,interval '1 day'),
 ('8f6c6b10-90bf-40ea-9a54-000000000002','sample:video:bao-an','Cảm hứng từ những điều giản dị','Đôi khi một khoảng nắng, một góc yên tĩnh cũng đủ để nảy ra ý tưởng cho chuyến đi tiếp theo.','approved',NULL::text,interval '2 days'),
 ('8f6c6b10-90bf-40ea-9a54-000000000003','sample:video:hoang-nam','Góc sáng tạo của tụi mình','Gửi mọi người một khoảnh khắc nhẹ nhàng. Mong rằng bạn cũng tìm thấy cảm hứng trong những điều nhỏ bé.','pending',NULL::text,interval '2 hours'),
 ('8f6c6b10-90bf-40ea-9a54-000000000004','sample:video:minh-anh','Mỗi hành trình bắt đầu từ một ý tưởng','Một đoạn phim ngắn, một chút màu sắc và những câu chuyện đang chờ được kể.','pending',NULL::text,interval '4 hours'),
 ('8f6c6b10-90bf-40ea-9a54-000000000005','sample:video:bao-an','Một khoảnh khắc đang hoàn thiện','Bản chia sẻ đầu tiên cho góc sáng tạo của mình.','rejected','Video mẫu: cần bổ sung mô tả rõ hơn trước khi hiển thị.',interval '3 days')
) AS sample(id,subject,title,description,status,note,age)
JOIN users u ON u.auth_subject=sample.subject
ON CONFLICT(id) DO NOTHING;

INSERT INTO community_video_votes(video_id,user_id)
SELECT sample.video_id::uuid,u.id FROM (VALUES
 ('8f6c6b10-90bf-40ea-9a54-000000000001','sample:video:bao-an'),
 ('8f6c6b10-90bf-40ea-9a54-000000000001','sample:video:hoang-nam'),
 ('8f6c6b10-90bf-40ea-9a54-000000000002','sample:video:minh-anh')
) AS sample(video_id,subject) JOIN users u ON u.auth_subject=sample.subject
ON CONFLICT DO NOTHING;
