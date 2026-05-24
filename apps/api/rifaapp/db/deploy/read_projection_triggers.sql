BEGIN;

CREATE OR REPLACE FUNCTION write.sync_raffle_to_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_number_start int;
    v_number_end int;
BEGIN
    v_number_start := COALESCE(NEW.number_start, 1);
    v_number_end := v_number_start + NEW.total_tickets - 1;

    INSERT INTO read.raffles (
        id,
        title,
        description,
        ticket_price,
        currency,
        total_tickets,
        status,
        draw_at,
        winner_ticket_id,
        number_start,
        number_end,
        number_padding,
        owner_id,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.title,
        NEW.description,
        NEW.ticket_price,
        NEW.currency,
        NEW.total_tickets,
        NEW.status,
        NEW.draw_at,
        NEW.winner_ticket_id,
        v_number_start,
        v_number_end,
        NEW.number_padding,
        NEW.owner_id,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        ticket_price = EXCLUDED.ticket_price,
        currency = EXCLUDED.currency,
        total_tickets = EXCLUDED.total_tickets,
        status = EXCLUDED.status,
        draw_at = EXCLUDED.draw_at,
        winner_ticket_id = EXCLUDED.winner_ticket_id,
        number_start = EXCLUDED.number_start,
        number_end = EXCLUDED.number_end,
        number_padding = EXCLUDED.number_padding,
        owner_id = EXCLUDED.owner_id,
        updated_at = EXCLUDED.updated_at;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO read.raffle_numbers (
            raffle_id,
            number,
            status,
            reserved_until,
            reservation_id,
            purchase_id,
            participant_id,
            label,
            updated_at
        )
        SELECT NEW.id,
               n,
               'available',
               NULL,
               NULL,
               NULL,
               NULL,
               CASE
                   WHEN NEW.number_padding IS NULL THEN n::text
                   ELSE lpad(n::text, NEW.number_padding, '0')
               END AS label,
               now()
        FROM generate_series(v_number_start, v_number_end) AS n
        ON CONFLICT (raffle_id, number) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_raffle_read ON write.raffles;
CREATE TRIGGER trg_sync_raffle_read
AFTER INSERT OR UPDATE ON write.raffles
FOR EACH ROW
EXECUTE FUNCTION write.sync_raffle_to_read();

CREATE OR REPLACE FUNCTION write.delete_raffle_from_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM read.purchases WHERE raffle_id = OLD.id;
    DELETE FROM read.raffles WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_raffle_read ON write.raffles;
CREATE TRIGGER trg_delete_raffle_read
AFTER DELETE ON write.raffles
FOR EACH ROW
EXECUTE FUNCTION write.delete_raffle_from_read();

CREATE OR REPLACE FUNCTION write.sync_ticket_to_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_status text;
    v_reserved_until timestamptz;
    v_reservation_id uuid;
    v_purchase_id uuid;
    v_participant_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE read.raffle_numbers
        SET status = 'available',
            reserved_until = NULL,
            reservation_id = NULL,
            purchase_id = NULL,
            participant_id = NULL,
            updated_at = now()
        WHERE raffle_id = OLD.raffle_id
          AND number = OLD.number;
        RETURN OLD;
    END IF;

    IF NEW.status IN ('sold', 'paid') THEN
        v_status = 'sold';
        v_reserved_until = NULL;
        v_reservation_id = NULL;
        v_purchase_id = NEW.purchase_id;
        v_participant_id = NEW.participant_id;
    ELSIF NEW.status = 'reserved' AND NEW.reserved_until IS NOT NULL AND NEW.reserved_until > now() THEN
        v_status = 'reserved';
        v_reserved_until = NEW.reserved_until;
        v_reservation_id = NEW.reservation_id;
        v_purchase_id = NULL;
        v_participant_id = NEW.participant_id;
    ELSE
        v_status = 'available';
        v_reserved_until = NULL;
        v_reservation_id = NULL;
        v_purchase_id = NULL;
        v_participant_id = NULL;
    END IF;

    UPDATE read.raffle_numbers
    SET status = v_status,
        reserved_until = v_reserved_until,
        reservation_id = v_reservation_id,
        purchase_id = v_purchase_id,
        participant_id = v_participant_id,
        updated_at = now()
    WHERE raffle_id = NEW.raffle_id
      AND number = NEW.number;

    IF NEW.purchase_id IS NOT NULL AND NEW.status IN ('sold', 'paid') THEN
        UPDATE read.purchases
        SET numbers = (
            SELECT COALESCE(array_agg(number ORDER BY number), '{}')
            FROM write.tickets
            WHERE purchase_id = NEW.purchase_id
        )
        WHERE purchase_id = NEW.purchase_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ticket_read ON write.tickets;
CREATE TRIGGER trg_sync_ticket_read
AFTER INSERT OR UPDATE OR DELETE ON write.tickets
FOR EACH ROW
EXECUTE FUNCTION write.sync_ticket_to_read();

CREATE OR REPLACE FUNCTION write.sync_purchase_to_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_numbers int[];
    v_raffle_title text;
    v_raffle_status text;
BEGIN
    SELECT title, status
    INTO v_raffle_title, v_raffle_status
    FROM write.raffles
    WHERE id = NEW.raffle_id;

    SELECT COALESCE(array_agg(number ORDER BY number), '{}')
    INTO v_numbers
    FROM write.tickets
    WHERE purchase_id = NEW.id;

    INSERT INTO read.purchases (
        purchase_id,
        raffle_id,
        participant_id,
        raffle_title,
        raffle_status,
        numbers,
        total_price,
        currency,
        status,
        payment_method,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.raffle_id,
        NEW.participant_id,
        v_raffle_title,
        v_raffle_status,
        v_numbers,
        NEW.total_price,
        NEW.currency,
        NEW.status,
        NEW.payment_method,
        NEW.created_at
    )
    ON CONFLICT (purchase_id) DO UPDATE SET
        raffle_id = EXCLUDED.raffle_id,
        participant_id = EXCLUDED.participant_id,
        raffle_title = EXCLUDED.raffle_title,
        raffle_status = EXCLUDED.raffle_status,
        numbers = EXCLUDED.numbers,
        total_price = EXCLUDED.total_price,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        payment_method = EXCLUDED.payment_method,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_purchase_read ON write.purchases;
CREATE TRIGGER trg_sync_purchase_read
AFTER INSERT OR UPDATE ON write.purchases
FOR EACH ROW
EXECUTE FUNCTION write.sync_purchase_to_read();

COMMIT;
