SELECT 1
FROM information_schema.columns
WHERE table_schema = 'write'
  AND table_name = 'raffles'
  AND column_name = 'owner_id';

SELECT 1
FROM information_schema.columns
WHERE table_schema = 'read'
  AND table_name = 'raffles'
  AND column_name = 'owner_id';
