from __future__ import annotations

from decimal import Decimal
import uuid
from typing import Optional

from fastapi import HTTPException

from rifaapp.shared.models.schemas import WalletDepositRequest
from rifaapp.write.src.infra.db import run_transaction

SUPPORTED_CURRENCY = "COP"
TRANSACTION_LIMIT = 80


def _normalize_currency(currency: str) -> str:
    normalized = currency.upper().strip()
    if normalized != SUPPORTED_CURRENCY:
        raise HTTPException(status_code=400, detail="La billetera demo solo soporta COP.")
    return normalized


def _wallet_transaction_from_row(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "type": row["type"],
        "amount": row["amount"],
        "currency": row["currency"],
        "status": row["status"],
        "description": row["description"],
        "method": row.get("method"),
        "raffle_id": str(row["raffle_id"]) if row.get("raffle_id") else None,
        "purchase_id": str(row["purchase_id"]) if row.get("purchase_id") else None,
        "reservation_id": str(row["reservation_id"]) if row.get("reservation_id") else None,
        "created_at": row["created_at"],
    }


def _wallet_from_rows(wallet_row: dict, transaction_rows: list[dict]) -> dict:
    return {
        "user_id": str(wallet_row["user_id"]),
        "balance": wallet_row["balance"],
        "currency": wallet_row["currency"],
        "transactions": [_wallet_transaction_from_row(row) for row in transaction_rows],
        "created_at": wallet_row["created_at"],
        "updated_at": wallet_row["updated_at"],
    }


def _ensure_wallet(cur, user_id: uuid.UUID, currency: str = SUPPORTED_CURRENCY) -> dict:
    cur.execute(
        """
        INSERT INTO write.wallets (user_id, balance, currency)
        VALUES (%s, 0, %s)
        ON CONFLICT (user_id) DO NOTHING
        """,
        (user_id, currency),
    )
    cur.execute(
        """
        SELECT user_id, balance, currency, created_at, updated_at
        FROM write.wallets
        WHERE user_id = %s
        FOR UPDATE
        """,
        (user_id,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wallet not found")
    columns = [col[0] for col in cur.description]
    return dict(zip(columns, row))


def _insert_transaction(
    cur,
    *,
    user_id: uuid.UUID,
    transaction_type: str,
    amount: Decimal,
    currency: str,
    description: str,
    method: Optional[str] = None,
    raffle_id: Optional[uuid.UUID] = None,
    purchase_id: Optional[uuid.UUID] = None,
    reservation_id: Optional[uuid.UUID] = None,
) -> uuid.UUID:
    transaction_id = uuid.uuid4()
    cur.execute(
        """
        INSERT INTO write.wallet_transactions (
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
            reservation_id
        )
        VALUES (%s, %s, %s, %s, %s, 'completed', %s, %s, %s, %s, %s)
        """,
        (
            transaction_id,
            user_id,
            transaction_type,
            amount,
            currency,
            description,
            method,
            raffle_id,
            purchase_id,
            reservation_id,
        ),
    )
    return transaction_id


def _load_wallet(cur, user_id: uuid.UUID) -> dict:
    cur.execute(
        """
        SELECT user_id, balance, currency, created_at, updated_at
        FROM write.wallets
        WHERE user_id = %s
        """,
        (user_id,),
    )
    wallet_row = cur.fetchone()
    if not wallet_row:
        wallet_row = _ensure_wallet(cur, user_id)
    else:
        wallet_columns = [col[0] for col in cur.description]
        wallet_row = dict(zip(wallet_columns, wallet_row))

    cur.execute(
        """
        SELECT id, wallet_user_id, type, amount, currency, status, description,
               method, raffle_id, purchase_id, reservation_id, created_at
        FROM write.wallet_transactions
        WHERE wallet_user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (user_id, TRANSACTION_LIMIT),
    )
    columns = [col[0] for col in cur.description]
    transaction_rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    return _wallet_from_rows(wallet_row, transaction_rows)


def get_wallet(user_id: uuid.UUID) -> dict:
    def _handler(conn):
        cur = conn.cursor()
        wallet = _load_wallet(cur, user_id)
        cur.close()
        return wallet

    return run_transaction(_handler)


def deposit_wallet(user_id: uuid.UUID, payload: WalletDepositRequest) -> dict:
    currency = _normalize_currency(payload.currency)
    amount = payload.amount.quantize(Decimal("0.01"))

    def _handler(conn):
        cur = conn.cursor()
        _ensure_wallet(cur, user_id, currency)
        cur.execute(
            """
            UPDATE write.wallets
            SET balance = balance + %s,
                currency = %s,
                updated_at = now()
            WHERE user_id = %s
            """,
            (amount, currency, user_id),
        )
        _insert_transaction(
            cur,
            user_id=user_id,
            transaction_type="deposit",
            amount=amount,
            currency=currency,
            description=f"Recarga demo con {payload.method}",
            method=payload.method,
        )
        wallet = _load_wallet(cur, user_id)
        cur.close()
        return wallet

    return run_transaction(_handler)


def reset_wallet(user_id: uuid.UUID) -> dict:
    def _handler(conn):
        cur = conn.cursor()
        wallet = _ensure_wallet(cur, user_id)
        previous_balance = Decimal(wallet["balance"]).quantize(Decimal("0.01"))
        cur.execute(
            """
            UPDATE write.wallets
            SET balance = 0,
                updated_at = now()
            WHERE user_id = %s
            """,
            (user_id,),
        )
        _insert_transaction(
            cur,
            user_id=user_id,
            transaction_type="reset",
            amount=previous_balance,
            currency=wallet["currency"],
            description="Billetera demo vaciada",
        )
        result = _load_wallet(cur, user_id)
        cur.close()
        return result

    return run_transaction(_handler)


def charge_wallet_for_purchase(
    cur,
    *,
    user_id: uuid.UUID,
    amount: Decimal,
    currency: str,
    raffle_id: uuid.UUID,
    purchase_id: uuid.UUID,
    reservation_id: uuid.UUID,
    description: str,
) -> None:
    normalized_currency = _normalize_currency(currency)
    charge_amount = amount.quantize(Decimal("0.01"))
    wallet = _ensure_wallet(cur, user_id, normalized_currency)
    if wallet["currency"] != normalized_currency:
        raise HTTPException(status_code=400, detail="La moneda de la billetera no coincide con la rifa.")
    if Decimal(wallet["balance"]) < charge_amount:
        missing = charge_amount - Decimal(wallet["balance"])
        raise HTTPException(
            status_code=402,
            detail=f"Saldo insuficiente. Te faltan {missing} {normalized_currency}.",
        )

    cur.execute(
        """
        UPDATE write.wallets
        SET balance = balance - %s,
            updated_at = now()
        WHERE user_id = %s
        """,
        (charge_amount, user_id),
    )
    _insert_transaction(
        cur,
        user_id=user_id,
        transaction_type="purchase",
        amount=charge_amount,
        currency=normalized_currency,
        description=description,
        method="wallet_demo",
        raffle_id=raffle_id,
        purchase_id=purchase_id,
        reservation_id=reservation_id,
    )
