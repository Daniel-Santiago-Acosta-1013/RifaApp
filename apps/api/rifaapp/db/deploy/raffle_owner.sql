BEGIN;

ALTER TABLE write.raffles ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES write.users(id);
ALTER TABLE read.raffles ADD COLUMN IF NOT EXISTS owner_id uuid;

UPDATE read.raffles r
SET owner_id = rw.owner_id
FROM write.raffles rw
WHERE r.id = rw.id
  AND r.owner_id IS NULL;

COMMIT;
