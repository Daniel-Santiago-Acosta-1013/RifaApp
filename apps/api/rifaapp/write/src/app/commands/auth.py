from __future__ import annotations

import secrets
import uuid

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
        "created_at": row["created_at"],
    }
