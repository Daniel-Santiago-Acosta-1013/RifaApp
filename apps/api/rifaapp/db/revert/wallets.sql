BEGIN;

DROP TRIGGER IF EXISTS trg_sync_wallet_transaction_read ON write.wallet_transactions;
DROP FUNCTION IF EXISTS write.sync_wallet_transaction_to_read();

DROP TRIGGER IF EXISTS trg_sync_wallet_read ON write.wallets;
DROP FUNCTION IF EXISTS write.sync_wallet_to_read();

DROP TABLE IF EXISTS read.wallet_transactions;
DROP TABLE IF EXISTS read.wallets;
DROP TABLE IF EXISTS write.wallet_transactions;
DROP TABLE IF EXISTS write.wallets;

COMMIT;
