CREATE TABLE community_videos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
 description text NOT NULL DEFAULT '' CHECK (length(description)<=2000),
 content_type text NOT NULL CHECK (content_type IN ('video/mp4','video/webm')),
 video_data bytea NOT NULL CHECK (octet_length(video_data) BETWEEN 1 AND 52428800),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 review_note text, reviewed_by uuid REFERENCES users ON DELETE SET NULL,
 reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX community_videos_feed_idx ON community_videos(status,created_at DESC);
CREATE INDEX community_videos_author_idx ON community_videos(author_id);
CREATE TABLE community_video_votes (
 video_id uuid NOT NULL REFERENCES community_videos ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(video_id,user_id)
);
