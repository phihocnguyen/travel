-- PostgreSQL 15+. All timestamps are stored as timestamptz (UTC).
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text UNIQUE,
  email text,
  display_name text NOT NULL,
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE email IS NOT NULL;

CREATE TABLE roles (id text PRIMARY KEY, name text NOT NULL);
CREATE TABLE permissions (id text PRIMARY KEY, description text NOT NULL);
CREATE TABLE role_permissions (
  role_id text NOT NULL REFERENCES roles ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES permissions ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE user_roles (
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES roles ON DELETE CASCADE,
  granted_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
CREATE TABLE auth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google','credentials')),
  provider_subject text NOT NULL,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject),
  CHECK ((provider = 'credentials' AND password_hash IS NOT NULL) OR (provider <> 'credentials' AND password_hash IS NULL))
);
CREATE INDEX auth_accounts_user_idx ON auth_accounts(user_id);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES users ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('image','video','audio','document')),
  storage_provider text NOT NULL CHECK (storage_provider IN ('local','object_storage','external')),
  storage_key text,
  url text,
  mime_type text NOT NULL,
  byte_size bigint CHECK (byte_size >= 0),
  width integer CHECK (width > 0), height integer CHECK (height > 0),
  duration_seconds numeric CHECK (duration_seconds >= 0),
  alt_text text NOT NULL DEFAULT '',
  credit text, source_url text,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_key IS NOT NULL OR url IS NOT NULL)
);
CREATE UNIQUE INDEX media_storage_key_unique ON media_assets(storage_provider, storage_key) WHERE storage_key IS NOT NULL;
CREATE INDEX media_uploaded_by_idx ON media_assets(uploaded_by);

CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
  name text NOT NULL, tagline text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '',
  hero_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  starts_at timestamptz, ends_at timestamptz,
  created_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES campaigns ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE, name text NOT NULL, description text NOT NULL DEFAULT '',
  location_name text, address text, starts_at timestamptz, ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh', schedule_note text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled','completed')),
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX events_campaign_idx ON events(campaign_id);
CREATE TABLE campaign_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES campaigns ON DELETE CASCADE,
  event_id uuid REFERENCES events ON DELETE SET NULL,
  content_key text NOT NULL, kind text NOT NULL CHECK (kind IN ('hero','section','hero_mv','video','communication','event_information')),
  title text NOT NULL, summary text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
  media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  settings jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(settings) = 'object'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
  sort_order integer NOT NULL DEFAULT 0, published_at timestamptz,
  updated_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, content_key)
);
CREATE INDEX campaign_contents_public_idx ON campaign_contents(campaign_id, status, sort_order);

CREATE TABLE seasons (
  id text PRIMARY KEY CHECK (id IN ('mango','dry','flood')),
  name text NOT NULL, description text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE destination_categories (
  id text PRIMARY KEY, name text NOT NULL, sort_order integer NOT NULL DEFAULT 0
);
CREATE TABLE destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES destinations ON DELETE RESTRICT,
  legacy_map_id integer UNIQUE,
  name text NOT NULL, alternate_name text, destination_type text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '', story text NOT NULL DEFAULT '', features text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '', best_time text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '', legacy_address text, locality text NOT NULL DEFAULT '',
  latitude numeric(10,7) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(10,7) CHECK (longitude BETWEEN -180 AND 180),
  coordinates_verified boolean NOT NULL DEFAULT false,
  contact_name text, phone text, email text, website_url text, directions_url text,
  opening_hours jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(opening_hours) = 'object'),
  admission_note text, cover_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden','archived')),
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  search_document tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(alternate_name,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(address,''))) STORED,
  created_by uuid REFERENCES users ON DELETE SET NULL, updated_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (parent_id IS DISTINCT FROM id),
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);
CREATE INDEX destinations_search_idx ON destinations USING gin(search_document);
CREATE INDEX destinations_public_idx ON destinations(status, sort_order);
CREATE INDEX destinations_parent_idx ON destinations(parent_id);
CREATE TABLE destination_category_links (
  destination_id uuid NOT NULL REFERENCES destinations ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES destination_categories ON DELETE CASCADE,
  PRIMARY KEY (destination_id, category_id)
);
CREATE INDEX destination_category_filter_idx ON destination_category_links(category_id, destination_id);
CREATE TABLE destination_seasons (
  destination_id uuid NOT NULL REFERENCES destinations ON DELETE CASCADE,
  season_id text NOT NULL REFERENCES seasons ON DELETE CASCADE,
  is_visible boolean NOT NULL DEFAULT true, is_featured boolean NOT NULL DEFAULT false,
  headline text, description text, best_time_note text,
  cover_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (destination_id, season_id)
);
CREATE INDEX destination_seasons_filter_idx ON destination_seasons(season_id, is_visible, is_featured, sort_order);
CREATE TABLE destination_media (
  destination_id uuid NOT NULL REFERENCES destinations ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets ON DELETE CASCADE,
  caption text, sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (destination_id, media_id)
);
CREATE TABLE destination_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), destination_id uuid NOT NULL REFERENCES destinations ON DELETE CASCADE,
  name text NOT NULL, description text NOT NULL DEFAULT '', price_note text, booking_contact text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX destination_activities_destination_idx ON destination_activities(destination_id, status);
CREATE TABLE activity_seasons (
  activity_id uuid NOT NULL REFERENCES destination_activities ON DELETE CASCADE,
  season_id text NOT NULL REFERENCES seasons ON DELETE CASCADE,
  description text, is_visible boolean NOT NULL DEFAULT true,
  PRIMARY KEY (activity_id, season_id)
);
CREATE TABLE favorite_destinations (
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES destinations ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, destination_id)
);

CREATE TABLE gallery_categories (id text PRIMARY KEY, name text NOT NULL, sort_order integer NOT NULL DEFAULT 0);
CREATE TABLE gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('photo','video','story','portrait','postcard')),
  title text NOT NULL, summary text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '',
  local_person_name text, local_person_bio text, message text,
  destination_id uuid REFERENCES destinations ON DELETE SET NULL,
  cover_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden','archived')),
  is_featured boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz, created_by uuid REFERENCES users ON DELETE SET NULL,
  updated_by uuid REFERENCES users ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_items_public_idx ON gallery_items(status, kind, sort_order, published_at DESC);
CREATE INDEX gallery_items_destination_idx ON gallery_items(destination_id);
CREATE TABLE gallery_category_links (
  gallery_item_id uuid NOT NULL REFERENCES gallery_items ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES gallery_categories ON DELETE CASCADE,
  PRIMARY KEY (gallery_item_id, category_id)
);
CREATE INDEX gallery_category_filter_idx ON gallery_category_links(category_id, gallery_item_id);
CREATE TABLE gallery_media (
  gallery_item_id uuid NOT NULL REFERENCES gallery_items ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES media_assets ON DELETE CASCADE,
  caption text, sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (gallery_item_id, media_id)
);

CREATE TABLE ticket_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL,
  layout text NOT NULL CHECK (layout IN ('left','right','full')),
  canvas_width integer NOT NULL CHECK (canvas_width > 0), canvas_height integer NOT NULL CHECK (canvas_height > 0),
  dpi integer NOT NULL DEFAULT 300 CHECK (dpi > 0),
  design_defaults jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(design_defaults) = 'object'),
  preview_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','hidden')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ticket_stickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name text NOT NULL,
  emoji text, media_id uuid REFERENCES media_assets ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  CHECK (emoji IS NOT NULL OR media_id IS NOT NULL)
);
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  user_id uuid NOT NULL UNIQUE REFERENCES users ON DELETE RESTRICT,
  campaign_id uuid NOT NULL REFERENCES campaigns ON DELETE RESTRICT,
  template_id uuid REFERENCES ticket_templates ON DELETE RESTRICT,
  title text NOT NULL DEFAULT '', sender_name text NOT NULL DEFAULT '', recipient_name text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '', layout text NOT NULL CHECK (layout IN ('left','right','full')),
  theme jsonb NOT NULL CHECK (jsonb_typeof(theme) = 'object'),
  stickers jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(stickers) = 'array'),
  image_transform jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(image_transform) = 'object'),
  title_transform jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(title_transform) = 'object'),
  text_transform jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(text_transform) = 'object'),
  image_media_id uuid REFERENCES media_assets ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'saved' CHECK (status IN ('draft','saved','archived')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tickets_user_idx ON tickets(user_id, updated_at DESC);
CREATE INDEX tickets_campaign_idx ON tickets(campaign_id, status, created_at DESC);
CREATE TABLE ticket_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  scope text NOT NULL CHECK (scope IN ('view','edit','recover')),
  expires_at timestamptz, revoked_at timestamptz, last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);
CREATE INDEX ticket_tokens_ticket_idx ON ticket_access_tokens(ticket_id);
CREATE TABLE ticket_print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES events ON DELETE RESTRICT,
  output_media_id uuid REFERENCES media_assets ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','printed','failed','cancelled')),
  copies integer NOT NULL DEFAULT 1 CHECK (copies > 0),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  priority integer NOT NULL DEFAULT 0, printer_name text,
  requested_by uuid REFERENCES users ON DELETE SET NULL, processed_by uuid REFERENCES users ON DELETE SET NULL,
  error_message text, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, ticket_id, event_id),
  CHECK (status <> 'printed' OR completed_at IS NOT NULL)
);
CREATE UNIQUE INDEX ticket_one_active_print_idx ON ticket_print_jobs(ticket_id, event_id) WHERE status IN ('queued','processing');
CREATE INDEX ticket_print_queue_idx ON ticket_print_jobs(event_id, priority DESC, created_at) WHERE status = 'queued';
CREATE INDEX ticket_print_history_idx ON ticket_print_jobs(ticket_id, created_at DESC);
CREATE TABLE ticket_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES tickets ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES events ON DELETE RESTRICT,
  print_job_id uuid, verified_by uuid NOT NULL REFERENCES users ON DELETE RESTRICT,
  collected_at timestamptz NOT NULL DEFAULT now(), note text,
  UNIQUE (ticket_id, event_id),
  FOREIGN KEY (print_job_id, ticket_id, event_id) REFERENCES ticket_print_jobs(id, ticket_id, event_id) ON DELETE RESTRICT
);
CREATE INDEX ticket_collections_event_idx ON ticket_collections(event_id, collected_at DESC);

-- Existing website blog/moderation feature is separate from curated gallery content.
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users ON DELETE RESTRICT,
  title text NOT NULL, category text NOT NULL, excerpt text NOT NULL DEFAULT '', content text NOT NULL DEFAULT '',
  cover_media_id uuid REFERENCES media_assets ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES users ON DELETE SET NULL, reviewed_at timestamptz, review_note text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_posts_author_idx ON blog_posts(author_id, created_at DESC);
CREATE INDEX blog_posts_status_idx ON blog_posts(status, created_at DESC);

CREATE TABLE interaction_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name text NOT NULL CHECK (event_name IN ('page_view','destination_view','destination_favorite','directions_open','season_change','gallery_view','content_share','ticket_created','ticket_download','ticket_share')),
  user_id uuid REFERENCES users ON DELETE SET NULL,
  anonymous_session_hash text,
  campaign_id uuid REFERENCES campaigns ON DELETE SET NULL,
  destination_id uuid REFERENCES destinations ON DELETE SET NULL,
  gallery_item_id uuid REFERENCES gallery_items ON DELETE SET NULL,
  ticket_id uuid REFERENCES tickets ON DELETE SET NULL,
  season_id text REFERENCES seasons ON DELETE SET NULL,
  page_path text, properties jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(properties) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX interaction_events_analytics_idx ON interaction_events(campaign_id, event_name, occurred_at DESC);
CREATE INDEX interaction_events_time_idx ON interaction_events USING brin(occurred_at);
CREATE TABLE audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid REFERENCES users ON DELETE SET NULL,
  action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(changes) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_id, created_at DESC);

CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','media_assets','campaigns','events','campaign_contents','destinations','destination_activities','gallery_items','ticket_templates','tickets','ticket_print_jobs','blog_posts']
  LOOP
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', table_name);
  END LOOP;
END;
$$;

CREATE VIEW campaign_ticket_stats AS
SELECT c.id AS campaign_id,
  (SELECT count(*) FROM tickets t WHERE t.campaign_id = c.id) AS tickets_created,
  (SELECT count(DISTINCT p.ticket_id) FROM ticket_print_jobs p JOIN tickets t ON t.id = p.ticket_id WHERE t.campaign_id = c.id AND p.status = 'printed') AS tickets_printed,
  (SELECT count(DISTINCT x.ticket_id) FROM ticket_collections x JOIN tickets t ON t.id = x.ticket_id WHERE t.campaign_id = c.id) AS tickets_collected
FROM campaigns c;
CREATE VIEW event_ticket_stats AS
SELECT e.id AS event_id,
  (SELECT count(*) FROM ticket_print_jobs p WHERE p.event_id = e.id AND p.status = 'queued') AS print_jobs_queued,
  (SELECT count(DISTINCT p.ticket_id) FROM ticket_print_jobs p WHERE p.event_id = e.id AND p.status = 'printed') AS tickets_printed,
  (SELECT count(*) FROM ticket_collections x WHERE x.event_id = e.id) AS tickets_collected
FROM events e;
CREATE VIEW daily_interaction_stats AS
SELECT campaign_id, (occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, event_name, count(*) AS event_count
FROM interaction_events GROUP BY campaign_id, (occurred_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, event_name;
