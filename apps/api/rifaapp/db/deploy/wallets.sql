BEGIN;

CREATE TABLE IF NOT EXISTS write.wallets (
    user_id uuid PRIMARY KEY REFERENCES write.users(id) ON DELETE CASCADE,
    balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    currency text NOT NULL DEFAULT 'COP',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS write.wallet_transactions (
    id uuid PRIMARY KEY,
    wallet_user_id uuid NOT NULL REFERENCES write.wallets(user_id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund', 'reset')),
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    currency text NOT NULL DEFAULT 'COP',
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed')),
    description text NOT NULL,
    method text,
    raffle_id uuid REFERENCES write.raffles(id) ON DELETE SET NULL,
    purchase_id uuid REFERENCES write.purchases(id) ON DELETE SET NULL,
    reservation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx
    ON write.wallet_transactions (wallet_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS wallet_transactions_purchase_idx
    ON write.wallet_transactions (purchase_id)
    WHERE purchase_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS read.wallets (
    user_id uuid PRIMARY KEY,
    balance numeric(12,2) NOT NULL,
    currency text NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS read.wallet_transactions (
    id uuid PRIMARY KEY,
    wallet_user_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text NOT NULL,
    status text NOT NULL,
    description text NOT NULL,
    method text,
    raffle_id uuid,
    purchase_id uuid,
    reservation_id uuid,
    created_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS wallet_transactions_read_user_created_idx
    ON read.wallet_transactions (wallet_user_id, created_at DESC);

INSERT INTO read.wallets (user_id, balance, currency, created_at, updated_at)
SELECT user_id, balance, currency, created_at, updated_at
FROM write.wallets
ON CONFLICT (user_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    currency = EXCLUDED.currency,
    updated_at = EXCLUDED.updated_at;

INSERT INTO read.wallet_transactions (
    id,
    wallet_user_id,
    type,
    amount,
    currency,
    status,
    description,
    method,
    raffle_id,
    purchase_id,
    reservation_id,
    created_at
)
SELECT id,
       wallet_user_id,
       type,
       amount,
       currency,
       status,
       description,
       method,
       raffle_id,
       purchase_id,
       reservation_id,
       created_at
FROM write.wallet_transactions
ON CONFLICT (id) DO UPDATE SET
    wallet_user_id = EXCLUDED.wallet_user_id,
    type = EXCLUDED.type,
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    method = EXCLUDED.method,
    raffle_id = EXCLUDED.raffle_id,
    purchase_id = EXCLUDED.purchase_id,
    reservation_id = EXCLUDED.reservation_id,
    created_at = EXCLUDED.created_at;

CREATE OR REPLACE FUNCTION write.sync_wallet_to_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM read.wallet_transactions WHERE wallet_user_id = OLD.user_id;
        DELETE FROM read.wallets WHERE user_id = OLD.user_id;
        RETURN OLD;
    END IF;

    INSERT INTO read.wallets (user_id, balance, currency, created_at, updated_at)
    VALUES (NEW.user_id, NEW.balance, NEW.currency, NEW.created_at, NEW.updated_at)
    ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        currency = EXCLUDED.currency,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wallet_read ON write.wallets;
CREATE TRIGGER trg_sync_wallet_read
AFTER INSERT OR UPDATE OR DELETE ON write.wallets
FOR EACH ROW
EXECUTE FUNCTION write.sync_wallet_to_read();

CREATE OR REPLACE FUNCTION write.sync_wallet_transaction_to_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        DELETE FROM read.wallet_transactions WHERE id = OLD.id;
        RETURN OLD;
    END IF;

    INSERT INTO read.wallet_transactions (
        id,
        wallet_user_id,
        type,
        amount,
        currency,
        status,
        description,
        method,
        raffle_id,
        purchase_id,
        reservation_id,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.wallet_user_id,
        NEW.type,
        NEW.amount,
        NEW.currency,
        NEW.status,
        NEW.description,
        NEW.method,
        NEW.raffle_id,
        NEW.purchase_id,
        NEW.reservation_id,
        NEW.created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        wallet_user_id = EXCLUDED.wallet_user_id,
        type = EXCLUDED.type,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        description = EXCLUDED.description,
        method = EXCLUDED.method,
        raffle_id = EXCLUDED.raffle_id,
        purchase_id = EXCLUDED.purchase_id,
        reservation_id = EXCLUDED.reservation_id,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wallet_transaction_read ON write.wallet_transactions;
CREATE TRIGGER trg_sync_wallet_transaction_read
AFTER INSERT OR UPDATE OR DELETE ON write.wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION write.sync_wallet_transaction_to_read();

COMMIT;
