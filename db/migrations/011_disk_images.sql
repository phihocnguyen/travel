-- Preserve legacy bytea until the separate, resumable export has verified disk.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['ticket_images','ticket_outputs','blog_covers','blog_images'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN file_path text', table_name);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN image_data DROP NOT NULL', table_name);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT image_storage_location CHECK (
      (image_data IS NOT NULL AND file_path IS NULL) OR
      (image_data IS NULL AND file_path IS NOT NULL)
    )', table_name);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT image_storage_key CHECK (
      file_path IS NULL OR file_path ~ %L
    )', table_name, '^' || replace(table_name, '_', '-') || '/[a-f0-9]{64}$');
  END LOOP;
END;
$$;
