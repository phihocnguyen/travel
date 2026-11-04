ALTER TABLE blog_posts ADD COLUMN content_format text NOT NULL DEFAULT 'plain' CHECK (content_format IN ('plain','html'));
CREATE TABLE blog_covers (
  post_id uuid PRIMARY KEY REFERENCES blog_posts ON DELETE CASCADE,
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 8388608)
);
CREATE TABLE blog_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 8388608),
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  width integer NOT NULL CHECK (width > 0), height integer NOT NULL CHECK (height > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_images_owner_idx ON blog_images(owner_id);
CREATE TABLE blog_post_images (
  post_id uuid NOT NULL REFERENCES blog_posts ON DELETE CASCADE,
  image_id uuid NOT NULL REFERENCES blog_images ON DELETE CASCADE,
  PRIMARY KEY (post_id,image_id)
);
CREATE INDEX blog_post_images_image_idx ON blog_post_images(image_id);
