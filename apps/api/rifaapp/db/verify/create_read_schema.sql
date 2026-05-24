BEGIN;

SELECT 1 FROM read.raffles LIMIT 1;
SELECT 1 FROM read.raffle_numbers LIMIT 1;
SELECT 1 FROM read.purchases LIMIT 1;

ROLLBACK;
