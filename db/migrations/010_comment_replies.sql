ALTER TABLE community_comments ADD COLUMN parent_id uuid REFERENCES community_comments(id) ON DELETE CASCADE;
CREATE INDEX community_comments_parent_idx ON community_comments(parent_id);

-- Keep replies on the same discussion and enforce a single reply level for all writers.
CREATE FUNCTION validate_community_reply() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM community_comments p WHERE p.id=NEW.parent_id AND p.parent_id IS NULL
   AND p.post_id IS NOT DISTINCT FROM NEW.post_id
   AND p.video_id IS NOT DISTINCT FROM NEW.video_id
 ) THEN
  RAISE EXCEPTION 'Reply must reference a root comment in the same discussion' USING ERRCODE='23514';
 END IF;
 IF EXISTS (SELECT 1 FROM community_comments c WHERE c.parent_id=NEW.id) AND
  (NEW.parent_id IS NOT NULL OR NEW.post_id IS DISTINCT FROM OLD.post_id OR NEW.video_id IS DISTINCT FROM OLD.video_id) THEN
  RAISE EXCEPTION 'Cannot move a thread with replies' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER community_reply_depth BEFORE INSERT OR UPDATE ON community_comments
 FOR EACH ROW EXECUTE FUNCTION validate_community_reply();
