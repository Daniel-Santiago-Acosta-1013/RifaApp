from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
from typing import Optional

from fastapi import HTTPException

from rifaapp.write.src.app.commands.participants import get_or_create_participant
from rifaapp.write.src.app.commands.wallet import charge_wallet_for_purchase
from rifaapp.write.src.infra.db import run_transaction
from rifaapp.shared.models.schemas import (
    PurchaseConfirmRequest,
    RaffleCreate,
    RaffleUpdate,
    ReservationRequest,
)
from rifaapp.shared.realtime import publish_raffle_numbers_changed

MAX_RESERVATION_MINUTES = 30


def _normalize_status(status: Optional[str]) -> str:
    if not status:
        return "open"
    normalized = status.lower().strip()
    if normalized == "published":
        return "open"
    return normalized


def _raffle_out_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "description": row.get("description"),
        "ticket_price": row["ticket_price"],
        "currency": row["currency"],
        "total_tickets": row["total_tickets"],
        "tickets_sold": row.get("tickets_sold", 0) or 0,
        "tickets_reserved": row.get("tickets_reserved", 0) or 0,
        "status": row["status"],
        "draw_at": row.get("draw_at"),
        "winner_ticket_id": str(row["winner_ticket_id"]) if row.get("winner_ticket_id") else None,
        "number_start": row["number_start"],
        "number_end": row["number_end"],
        "number_padding": row.get("number_padding"),
        "owner_id": str(row["owner_id"]) if row.get("owner_id") else None,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def create_raffle(payload: RaffleCreate, owner_id: uuid.UUID) -> dict:
    def _handler(conn):
        cur = conn.cursor()
        status = _normalize_status(payload.status)
        if status not in ("open", "draft", "closed", "cancelled", "drawn"):
            cur.close()
            raise HTTPException(status_code=400, detail="Invalid raffle status")
        raffle_id = uuid.uuid4()
        cur.execute(
            """
            INSERT INTO write.raffles (
                id, title, description, ticket_price, currency, total_tickets,
                status, draw_at, number_start, number_padding, owner_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, title, description, ticket_price, currency, total_tickets,
                      status, draw_at, winner_ticket_id, number_start, number_padding,
                      owner_id, created_at, updated_at
            """,
            (
                raffle_id,
                payload.title,
                payload.description,
                payload.ticket_price,
                payload.currency.upper(),
                payload.total_tickets,
                status,
                payload.draw_at,
                payload.number_start,
                payload.number_padding,
                owner_id,
            ),
        )
        row = cur.fetchone()
        number_start = 1 if row[9] is None else row[9]
        total_tickets = row[5]
        number_end = number_start + total_tickets - 1
        number_padding = row[10]
        cur.close()
        return {
            "id": str(row[0]),
            "title": row[1],
            "description": row[2],
            "ticket_price": row[3],
            "currency": row[4],
            "total_tickets": row[5],
            "tickets_sold": 0,
            "tickets_reserved": 0,
            "status": row[6],
            "draw_at": row[7],
            "winner_ticket_id": str(row[8]) if row[8] else None,
            "number_start": number_start,
            "number_end": number_end,
            "number_padding": number_padding,
            "owner_id": str(row[11]) if row[11] else None,
            "created_at": row[12],
            "updated_at": row[13],
        }

    return run_transaction(_handler)


def update_raffle(raffle_id: uuid.UUID, payload: RaffleUpdate, actor_id: Optional[str]) -> dict:
    if not actor_id:
        raise HTTPException(status_code=401, detail="Missing user id")
    try:
        editor_id = uuid.UUID(actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    data = payload.dict(exclude_unset=True)
    if "status" in data:
        data["status"] = _normalize_status(data["status"])
        if data["status"] not in ("open", "draft", "closed", "cancelled", "drawn"):
            raise HTTPException(status_code=400, detail="Invalid raffle status")
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            """
            SELECT owner_id, number_start, total_tickets, number_padding
            FROM write.raffles
            WHERE id = %s
            FOR UPDATE
            """,
            (raffle_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        owner_id, number_start, current_total_tickets, number_padding = row
        if owner_id is None or owner_id != editor_id:
            cur.close()
            raise HTTPException(status_code=403, detail="Not allowed to edit this raffle")

        if "total_tickets" in data:
            next_total_tickets = data["total_tickets"]
            normalized_number_start = 1 if number_start is None else number_start
            next_number_end = normalized_number_start + next_total_tickets - 1
            cur.execute(
                """
                SELECT MAX(number)
                FROM write.tickets
                WHERE raffle_id = %s
                  AND status IN ('reserved', 'sold', 'paid')
                """,
                (raffle_id,),
            )
            max_taken_number = cur.fetchone()[0]
            if max_taken_number is not None and max_taken_number > next_number_end:
                cur.close()
                raise HTTPException(
                    status_code=400,
                    detail="Total tickets cannot be lower than assigned numbers",
                )

        set_clauses = []
        params: list = []
        for field in ("title", "description", "ticket_price", "total_tickets", "draw_at", "status"):
            if field in data:
                set_clauses.append(f"{field} = %s")
                params.append(data[field])
        set_clauses.append("updated_at = now()")
        params.append(raffle_id)
        set_clause = ", ".join(set_clauses)
        cur.execute(f"UPDATE write.raffles SET {set_clause} WHERE id = %s", params)

        if "total_tickets" in data:
            normalized_number_start = 1 if number_start is None else number_start
            previous_number_end = normalized_number_start + current_total_tickets - 1
            next_number_end = normalized_number_start + data["total_tickets"] - 1
            if next_number_end > previous_number_end:
                cur.execute(
                    """
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
                    SELECT %s,
                           n,
                           'available',
                           NULL,
                           NULL,
                           NULL,
                           NULL,
                           CASE
                               WHEN %s::int IS NULL THEN n::text
                               ELSE lpad(n::text, %s::int, '0')
                           END,
                           now()
                    FROM generate_series(%s::int, %s::int) AS n
                    ON CONFLICT (raffle_id, number) DO NOTHING
                    """,
                    (
                        raffle_id,
                        number_padding,
                        number_padding,
                        previous_number_end + 1,
                        next_number_end,
                    ),
                )
            elif next_number_end < previous_number_end:
                cur.execute(
                    """
                    DELETE FROM read.raffle_numbers
                    WHERE raffle_id = %s
                      AND number > %s
                      AND status = 'available'
                    """,
                    (raffle_id, next_number_end),
                )

        cur.execute(
            """
            SELECT r.id, r.title, r.description, r.ticket_price, r.currency, r.total_tickets,
                   r.status, r.draw_at, r.winner_ticket_id, r.number_start, r.number_end,
                   r.number_padding, r.owner_id, r.created_at, r.updated_at,
                   COALESCE(s.sold, 0) AS tickets_sold,
                   COALESCE(res.reserved, 0) AS tickets_reserved
            FROM read.raffles r
            LEFT JOIN (
                SELECT raffle_id, COUNT(*) AS sold
                FROM read.raffle_numbers
                WHERE status = 'sold'
                GROUP BY raffle_id
            ) s ON s.raffle_id = r.id
            LEFT JOIN (
                SELECT raffle_id, COUNT(*) AS reserved
                FROM read.raffle_numbers
                WHERE status = 'reserved' AND reserved_until > now()
                GROUP BY raffle_id
            ) res ON res.raffle_id = r.id
            WHERE r.id = %s
            """,
            (raffle_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        columns = [col[0] for col in cur.description]
        cur.close()
        return _raffle_out_from_row(dict(zip(columns, row)))

    return run_transaction(_handler)


def delete_raffle(raffle_id: uuid.UUID, actor_id: Optional[str]) -> dict:
    if not actor_id:
        raise HTTPException(status_code=401, detail="Missing user id")
    try:
        editor_id = uuid.UUID(actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    def _handler(conn):
        cur = conn.cursor()
        cur.execute("SELECT owner_id FROM write.raffles WHERE id = %s FOR UPDATE", (raffle_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        owner_id = row[0]
        if owner_id is None or owner_id != editor_id:
            cur.close()
            raise HTTPException(status_code=403, detail="Not allowed to delete this raffle")

        cur.execute("DELETE FROM write.raffles WHERE id = %s", (raffle_id,))
        cur.close()
        return {"status": "deleted", "raffle_id": str(raffle_id)}

    return run_transaction(_handler)


def reserve_numbers(raffle_id: uuid.UUID, payload: ReservationRequest) -> dict:
    numbers = payload.numbers
    if len(set(numbers)) != len(numbers):
        raise HTTPException(status_code=400, detail="Duplicate numbers are not allowed")
    ttl_minutes = min(payload.ttl_minutes, MAX_RESERVATION_MINUTES)

    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            """
            SELECT total_tickets, status, ticket_price, currency, number_start, number_padding
            FROM write.raffles
            WHERE id = %s
            FOR UPDATE
            """,
            (raffle_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        total_tickets, status, ticket_price, currency, number_start, _ = row
        if status not in ("open", "published"):
            cur.close()
            raise HTTPException(status_code=400, detail="Raffle is not open for reservations")
        number_start = 1 if number_start is None else number_start
        number_end = number_start + total_tickets - 1
        for number in numbers:
            if number < number_start or number > number_end:
                cur.close()
                raise HTTPException(status_code=400, detail="Number out of range")

        cur.execute(
            """
            DELETE FROM write.tickets
            WHERE raffle_id = %s
              AND status = 'reserved'
              AND reserved_until IS NOT NULL
              AND reserved_until < now()
            RETURNING number
            """,
            (raffle_id,),
        )
        cur.fetchall()

        participant_id = get_or_create_participant(conn, payload.participant)
        reservation_id = uuid.uuid4()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=ttl_minutes)
        conflicts: list[int] = []
        for number in numbers:
            ticket_id = uuid.uuid4()
            cur.execute(
                """
                INSERT INTO write.tickets (
                    id, raffle_id, participant_id, number, status,
                    reserved_at, reserved_until, reservation_id, purchased_at
                )
                VALUES (%s, %s, %s, %s, 'reserved', now(), %s, %s, NULL)
                ON CONFLICT DO NOTHING
                """,
                (ticket_id, raffle_id, participant_id, number, expires_at, reservation_id),
            )
            if cur.rowcount != 1:
                conflicts.append(number)

        if conflicts:
            cur.close()
            raise HTTPException(
                status_code=409,
                detail={
                    "message": "Some numbers are no longer available",
                    "numbers": conflicts,
                },
            )

        cur.close()
        total_price = Decimal(ticket_price) * len(numbers)
        return {
            "reservation_id": str(reservation_id),
            "participant_id": str(participant_id),
            "raffle_id": str(raffle_id),
            "numbers": sorted(numbers),
            "expires_at": expires_at,
            "ticket_price": ticket_price,
            "currency": currency,
            "total_price": total_price,
        }

    result = run_transaction(_handler)
    publish_raffle_numbers_changed(
        raffle_id=str(raffle_id),
        event="reserved",
        numbers=result["numbers"],
        status="reserved",
        reserved_until=result["expires_at"].isoformat(),
        reservation_id=result["reservation_id"],
    )
    return result


def confirm_purchase(raffle_id: uuid.UUID, payload: PurchaseConfirmRequest, actor: dict) -> dict:
    try:
        actor_id = uuid.UUID(actor["id"])
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid authenticated user") from exc
    actor_email = (actor.get("email") or "").strip().lower()
    if not actor_email:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")
    try:
        reservation_id = uuid.UUID(payload.reservation_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid reservation_id") from exc

    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            """
            SELECT total_tickets, status, ticket_price, currency
            FROM write.raffles
            WHERE id = %s
            FOR UPDATE
            """,
            (raffle_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        total_tickets, status, ticket_price, currency = row
        if status not in ("open", "published"):
            cur.close()
            raise HTTPException(status_code=400, detail="Raffle is not open for purchases")

        participant_id: Optional[uuid.UUID] = None
        if payload.participant_id:
            try:
                participant_id = uuid.UUID(payload.participant_id)
            except ValueError as exc:
                cur.close()
                raise HTTPException(status_code=400, detail="Invalid participant_id") from exc
        elif payload.participant:
            participant_id = get_or_create_participant(conn, payload.participant)
        else:
            cur.execute(
                """
                SELECT DISTINCT t.participant_id
                FROM write.tickets t
                JOIN write.participants p ON p.id = t.participant_id
                WHERE t.raffle_id = %s
                  AND t.reservation_id = %s
                  AND lower(p.email) = %s
                  AND t.status = 'reserved'
                  AND t.reserved_until > now()
                """,
                (raffle_id, reservation_id, actor_email),
            )
            participant_row = cur.fetchone()
            if not participant_row:
                cur.close()
                raise HTTPException(status_code=400, detail="Reservation expired or not found")
            participant_id = participant_row[0]

        cur.execute(
            """
            SELECT t.id, t.number, p.email
            FROM write.tickets t
            JOIN write.participants p ON p.id = t.participant_id
            WHERE t.raffle_id = %s
              AND t.status = 'reserved'
              AND t.reservation_id = %s
              AND t.participant_id = %s
              AND t.reserved_until > now()
            FOR UPDATE
            """,
            (raffle_id, reservation_id, participant_id),
        )
        rows = cur.fetchall()
        if not rows:
            cur.close()
            raise HTTPException(status_code=400, detail="Reservation expired or not found")
        participant_email = (rows[0][2] or "").strip().lower()
        if participant_email != actor_email:
            cur.close()
            raise HTTPException(status_code=403, detail="Reservation does not belong to the authenticated user")

        ticket_ids = [row[0] for row in rows]
        numbers = sorted(row[1] for row in rows)
        purchase_id = uuid.uuid4()
        total_price = Decimal(ticket_price) * len(ticket_ids)
        cur.execute(
            """
            INSERT INTO write.purchases (
                id, raffle_id, participant_id, status, total_price, currency, payment_method
            ) VALUES (%s, %s, %s, 'confirmed', %s, %s, %s)
            """,
            (purchase_id, raffle_id, participant_id, total_price, currency, payload.payment_method),
        )
        charge_wallet_for_purchase(
            cur,
            user_id=actor_id,
            amount=total_price,
            currency=currency,
            raffle_id=raffle_id,
            purchase_id=purchase_id,
            reservation_id=reservation_id,
            description=f"Compra de {len(ticket_ids)} numeros",
        )
        placeholders = ", ".join(["%s"] * len(ticket_ids))
        cur.execute(
            f"""
            UPDATE write.tickets
            SET status = 'sold',
                purchased_at = now(),
                reserved_until = NULL,
                reservation_id = NULL,
                purchase_id = %s
            WHERE id IN ({placeholders})
            """,
            [purchase_id, *ticket_ids],
        )
        cur.execute(
            "SELECT COUNT(*) FROM write.tickets WHERE raffle_id = %s AND status IN ('paid', 'sold')",
            (raffle_id,),
        )
        sold_count = cur.fetchone()[0]
        if sold_count >= total_tickets:
            cur.execute(
                "UPDATE write.raffles SET status = 'closed', updated_at = now() WHERE id = %s",
                (raffle_id,),
            )
        cur.execute("SELECT created_at FROM write.purchases WHERE id = %s", (purchase_id,))
        created_at = cur.fetchone()[0]
        cur.close()
        return {
            "purchase_id": str(purchase_id),
            "raffle_id": str(raffle_id),
            "participant_id": str(participant_id),
            "numbers": sorted(numbers),
            "total_price": total_price,
            "currency": currency,
            "status": "confirmed",
            "created_at": created_at,
        }

    result = run_transaction(_handler)
    publish_raffle_numbers_changed(
        raffle_id=str(raffle_id),
        event="sold",
        numbers=result["numbers"],
        status="sold",
        purchase_id=result["purchase_id"],
    )
    return result


def release_reservation(raffle_id: uuid.UUID, reservation_id: str) -> dict:
    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            """
            DELETE FROM write.tickets
            WHERE raffle_id = %s AND reservation_id = %s AND status = 'reserved'
            RETURNING number
            """,
            (raffle_id, reservation_id),
        )
        rows = cur.fetchall()
        released_numbers = [row[0] for row in rows]
        released = len(released_numbers)
        cur.close()
        return {"status": "released", "released": released, "numbers": released_numbers}

    result = run_transaction(_handler)
    if result["numbers"]:
        publish_raffle_numbers_changed(
            raffle_id=str(raffle_id),
            event="released",
            numbers=result["numbers"],
            status="available",
            reservation_id=reservation_id,
        )
    return {"status": result["status"], "released": result["released"]}


def draw_raffle(raffle_id: uuid.UUID, actor_id: Optional[str]) -> dict:
    if not actor_id:
        raise HTTPException(status_code=401, detail="Missing user id")
    try:
        editor_id = uuid.UUID(actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id") from exc

    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            "SELECT status, winner_ticket_id, owner_id FROM write.raffles WHERE id = %s FOR UPDATE",
            (raffle_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            raise HTTPException(status_code=404, detail="Raffle not found")
        status, winner_ticket_id, owner_id = row
        if owner_id is None or owner_id != editor_id:
            cur.close()
            raise HTTPException(status_code=403, detail="Not allowed to draw this raffle")
        if status == "drawn" and winner_ticket_id:
            cur.execute(
                "SELECT id, participant_id, number FROM write.tickets WHERE id = %s",
                (winner_ticket_id,),
            )
            ticket = cur.fetchone()
            if ticket:
                cur.close()
                return {
                    "raffle_id": str(raffle_id),
                    "winner_ticket_id": str(ticket[0]),
                    "winner_participant_id": str(ticket[1]),
                    "winning_number": ticket[2],
                }
            cur.close()
            raise HTTPException(status_code=404, detail="Winning ticket not found")

        cur.execute(
            """
            SELECT id, participant_id, number
            FROM write.tickets
            WHERE raffle_id = %s AND status IN ('paid', 'sold')
            ORDER BY random()
            LIMIT 1
            """,
            (raffle_id,),
        )
        ticket = cur.fetchone()
        if not ticket:
            cur.close()
            raise HTTPException(status_code=400, detail="No tickets sold")
        ticket_id, participant_id, number = ticket
        cur.execute(
            "UPDATE write.raffles SET status = 'drawn', winner_ticket_id = %s, updated_at = now() WHERE id = %s",
            (ticket_id, raffle_id),
        )
        cur.close()
        return {
            "raffle_id": str(raffle_id),
            "winner_ticket_id": str(ticket_id),
            "winner_participant_id": str(participant_id),
            "winning_number": number,
        }

    return run_transaction(_handler)
