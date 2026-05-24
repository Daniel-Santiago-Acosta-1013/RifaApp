BEGIN;

DROP TABLE IF EXISTS write.purchases;
DROP TABLE IF EXISTS write.tickets;
DROP TABLE IF EXISTS write.users;
DROP TABLE IF EXISTS write.participants;
DROP TABLE IF EXISTS write.raffles;
DROP SCHEMA IF EXISTS write;

COMMIT;
