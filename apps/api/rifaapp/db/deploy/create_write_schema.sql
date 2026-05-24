BEGIN;

CREATE SCHEMA IF NOT EXISTS write;

CREATE TABLE IF NOT EXISTS write.raffles (
    id uuid PRIMARY KEY,
    title text NOT NULL,
    description text,
    ticket_price numeric(10,2) NOT NULL CHECK (ticket_price > 0),
    currency text NOT NULL DEFAULT 'USD',
    total_tickets int NOT NULL CHECK (total_tickets > 0),
    status text NOT NULL DEFAULT 'open',
    number_start int NOT NULL DEFAULT 1,
    number_padding int,
    draw_at timestamptz,
    winner_ticket_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE write.raffles ADD COLUMN IF NOT EXISTS number_start int NOT NULL DEFAULT 1;
ALTER TABLE write.raffles ADD COLUMN IF NOT EXISTS number_padding int;

CREATE TABLE IF NOT EXISTS write.participants (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS write.users (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    password_salt text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS write.tickets (
    id uuid PRIMARY KEY,
    raffle_id uuid NOT NULL REFERENCES write.raffles(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES write.participants(id),
    number int NOT NULL,
    status text NOT NULL DEFAULT 'paid',
    reserved_at timestamptz,
    reserved_until timestamptz,
    reservation_id uuid,
    purchase_id uuid,
    purchased_at timestamptz DEFAULT now(),
    UNIQUE (raffle_id, number)
);

ALTER TABLE write.tickets ADD COLUMN IF NOT EXISTS purchased_at timestamptz DEFAULT now();
ALTER TABLE write.tickets ALTER COLUMN purchased_at DROP NOT NULL;
ALTER TABLE write.tickets ADD COLUMN IF NOT EXISTS reserved_at timestamptz;
ALTER TABLE write.tickets ADD COLUMN IF NOT EXISTS reserved_until timestamptz;
ALTER TABLE write.tickets ADD COLUMN IF NOT EXISTS reservation_id uuid;
ALTER TABLE write.tickets ADD COLUMN IF NOT EXISTS purchase_id uuid;

CREATE TABLE IF NOT EXISTS write.purchases (
    id uuid PRIMARY KEY,
    raffle_id uuid NOT NULL REFERENCES write.raffles(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES write.participants(id),
    status text NOT NULL DEFAULT 'confirmed',
    total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
    currency text NOT NULL,
    payment_method text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS purchases_participant_id_idx ON write.purchases (participant_id);

COMMIT;
