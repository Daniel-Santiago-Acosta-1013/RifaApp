BEGIN;

SELECT user_id, balance, currency, created_at, updated_at
FROM write.wallets
WHERE FALSE;

SELECT id, wallet_user_id, type, amount, currency, status, description,
       method, raffle_id, purchase_id, reservation_id, created_at
FROM write.wallet_transactions
WHERE FALSE;

SELECT user_id, balance, currency, created_at, updated_at
FROM read.wallets
WHERE FALSE;

SELECT id, wallet_user_id, type, amount, currency, status, description,
       method, raffle_id, purchase_id, reservation_id, created_at
FROM read.wallet_transactions
WHERE FALSE;

DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM pg_trigger
        WHERE tgname IN ('trg_sync_wallet_read', 'trg_sync_wallet_transaction_read')
    ) <> 2 THEN
        RAISE EXCEPTION 'wallet sync triggers are missing';
    END IF;
END;
$$;

ROLLBACK;
