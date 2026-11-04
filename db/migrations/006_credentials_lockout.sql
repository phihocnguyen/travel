ALTER TABLE auth_accounts ADD COLUMN failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE auth_accounts ADD COLUMN locked_until timestamptz;
