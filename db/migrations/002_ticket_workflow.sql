-- Human-readable codes are allocated transactionally; rolled-back saves do not
-- consume numbers. 000..999 is an intentional global capacity of 1,000 tickets.
CREATE TABLE ticket_code_counter (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  next_number integer NOT NULL CHECK (next_number BETWEEN 0 AND 1000)
);
INSERT INTO ticket_code_counter VALUES (true, 0);
DO $$
DECLARE item record; number integer := 0;
BEGIN
  FOR item IN SELECT id FROM tickets ORDER BY created_at, id LOOP
    IF number > 999 THEN RAISE EXCEPTION 'Ticket capacity exceeded'; END IF;
    UPDATE tickets SET ticket_code = 'VXDL' || lpad(number::text, 3, '0') WHERE id = item.id;
    number := number + 1;
  END LOOP;
  UPDATE ticket_code_counter SET next_number = number;
END;
$$;
CREATE FUNCTION next_ticket_code() RETURNS text LANGUAGE plpgsql AS $$
DECLARE allocated integer;
BEGIN
  UPDATE ticket_code_counter SET next_number = next_number + 1
  WHERE singleton = true AND next_number < 1000 RETURNING next_number - 1 INTO allocated;
  IF NOT FOUND THEN RAISE EXCEPTION 'TICKET_CAPACITY_REACHED' USING ERRCODE = 'P0001'; END IF;
  RETURN 'VXDL' || lpad(allocated::text, 3, '0');
END;
$$;
ALTER TABLE tickets ALTER COLUMN ticket_code SET DEFAULT next_ticket_code();
ALTER TABLE tickets ADD CONSTRAINT ticket_code_format CHECK (ticket_code ~ '^VXDL[0-9]{3}$');

-- One image per ticket, stored durably in Neon, not on an ephemeral app disk.
CREATE TABLE ticket_images (
  ticket_id uuid PRIMARY KEY REFERENCES tickets ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png')),
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 8388608),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The single current print/export file; no design version history.
CREATE TABLE ticket_outputs (
  ticket_id uuid PRIMARY KEY REFERENCES tickets ON DELETE CASCADE,
  design_updated_at timestamptz NOT NULL,
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 16777216),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION guard_ticket_design() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Freeze a design once a print operator has claimed it or handed it over.
  -- Queued/failed/cancelled attempts may still be corrected and re-exported.
  IF EXISTS (SELECT 1 FROM ticket_print_jobs WHERE ticket_id = OLD.id AND status IN ('processing','printed'))
    OR EXISTS (SELECT 1 FROM ticket_collections WHERE ticket_id = OLD.id) THEN
    RAISE EXCEPTION 'TICKET_PRINT_LOCKED' USING ERRCODE = 'P0001';
  END IF;
  DELETE FROM ticket_outputs WHERE ticket_id = OLD.id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ticket_design_guard BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION guard_ticket_design();
