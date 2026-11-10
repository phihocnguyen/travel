CREATE TABLE community_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 post_id uuid REFERENCES blog_posts ON DELETE CASCADE,
 video_id uuid REFERENCES community_videos ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 content text NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (num_nonnulls(post_id,video_id)=1)
);
CREATE INDEX community_comments_post_idx ON community_comments(post_id,created_at);
CREATE INDEX community_comments_video_idx ON community_comments(video_id,created_at);
CREATE TABLE community_post_likes (
 post_id uuid NOT NULL REFERENCES blog_posts ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 PRIMARY KEY(post_id,user_id)
);
