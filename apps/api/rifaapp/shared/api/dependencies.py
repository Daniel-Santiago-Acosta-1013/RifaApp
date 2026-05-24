from fastapi import HTTPException

from rifaapp.shared.core.config import db_configured


def require_db() -> None:
    if not db_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
