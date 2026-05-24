BEGIN;

DROP TRIGGER IF EXISTS trg_sync_purchase_read ON write.purchases;
DROP FUNCTION IF EXISTS write.sync_purchase_to_read();

DROP TRIGGER IF EXISTS trg_sync_ticket_read ON write.tickets;
DROP FUNCTION IF EXISTS write.sync_ticket_to_read();

DROP TRIGGER IF EXISTS trg_delete_raffle_read ON write.raffles;
DROP FUNCTION IF EXISTS write.delete_raffle_from_read();

DROP TRIGGER IF EXISTS trg_sync_raffle_read ON write.raffles;
DROP FUNCTION IF EXISTS write.sync_raffle_to_read();

COMMIT;
