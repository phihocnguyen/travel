ALTER TABLE users ADD COLUMN last_login_at timestamptz;
ALTER TABLE users ADD COLUMN last_login_provider text CHECK (last_login_provider IN ('google','credentials'));
ALTER TABLE users ADD COLUMN login_count integer NOT NULL DEFAULT 0;
CREATE INDEX users_created_at_idx ON users(created_at DESC);
CREATE TABLE user_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz
);
CREATE INDEX user_sessions_active_idx ON user_sessions(last_seen_at DESC) WHERE ended_at IS NULL;
CREATE INDEX user_sessions_user_idx ON user_sessions(user_id);
