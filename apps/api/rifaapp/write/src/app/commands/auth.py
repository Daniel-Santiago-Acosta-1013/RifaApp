from __future__ import annotations

import secrets
import uuid
from typing import Any

from fastapi import HTTPException

from rifaapp.shared.core.security import hash_password
from rifaapp.write.src.infra.db import fetch_one, run_transaction
from rifaapp.shared.models.schemas import UserLogin, UserRegister


def register_user(payload: UserRegister) -> dict:
    def _handler(conn):
        cur = conn.cursor()
        cur.execute("SELECT id FROM write.users WHERE email = %s", (payload.email,))
        if cur.fetchone():
            cur.close()
            raise HTTPException(status_code=409, detail="Email already registered")
        user_id = uuid.uuid4()
        salt = secrets.token_bytes(16)
        password_hash = hash_password(payload.password, salt)
        cur.execute(
            """
            INSERT INTO write.users (id, name, email, password_hash, password_salt)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, payload.name, payload.email, password_hash, salt.hex()),
        )
        cur.execute(
            "SELECT id, name, email, created_at FROM write.users WHERE id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        cur.close()
        return {
            "id": str(row[0]),
            "name": row[1],
            "email": row[2],
            "email_verified": False,
            "created_at": row[3],
        }

    return run_transaction(_handler)


def login_user(payload: UserLogin) -> dict:
    row = fetch_one(
        """
        SELECT id, name, email, password_hash, password_salt, created_at
        FROM write.users
        WHERE email = %s
        """,
        (payload.email,),
    )
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    salt = bytes.fromhex(row["password_salt"])
    password_hash = hash_password(payload.password, salt)
    if not secrets.compare_digest(row["password_hash"], password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "email": row["email"],
        "email_verified": False,
        "created_at": row["created_at"],
    }


def sync_cognito_user(claims: dict[str, Any]) -> dict:
    cognito_sub = claims.get("sub")
    email = claims.get("email")
    if not cognito_sub or not email:
        raise HTTPException(status_code=401, detail="Invalid authentication claims")

    name = (claims.get("name") or claims.get("cognito:username") or email.split("@")[0]).strip()
    email_verified = str(claims.get("email_verified", "false")).lower() == "true"

    def _handler(conn):
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id
            FROM write.users
            WHERE cognito_sub = %s OR email = %s
            ORDER BY CASE WHEN cognito_sub = %s THEN 0 ELSE 1 END
            LIMIT 1
            FOR UPDATE
            """,
            (cognito_sub, email, cognito_sub),
        )
        row = cur.fetchone()
        if row:
            user_id = row[0]
            cur.execute(
                """
                UPDATE write.users
                SET cognito_sub = %s,
                    name = %s,
                    email = %s,
                    email_verified = %s
                WHERE id = %s
                """,
                (cognito_sub, name, email, email_verified, user_id),
            )
        else:
            user_id = uuid.uuid4()
            cur.execute(
                """
                INSERT INTO write.users (
                    id, cognito_sub, name, email, email_verified, password_hash, password_salt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, cognito_sub, name, email, email_verified, "", ""),
            )

        cur.execute(
            """
            SELECT id, name, email, email_verified, created_at
            FROM write.users
            WHERE id = %s
            """,
            (user_id,),
        )
        user = cur.fetchone()
        cur.close()
        return {
            "id": str(user[0]),
            "name": user[1],
            "email": user[2],
            "email_verified": user[3],
            "created_at": user[4],
        }

    return run_transaction(_handler)
