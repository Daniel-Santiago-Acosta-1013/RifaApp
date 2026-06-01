from typing import Any

from fastapi import HTTPException, Request

from rifaapp.shared.core.config import db_configured


def require_db() -> None:
    if not db_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")


def require_cognito_claims(request: Request) -> dict[str, Any]:
    event = request.scope.get("aws.event") or {}
    request_context = event.get("requestContext") or {}
    authorizer = request_context.get("authorizer") or {}
    claims = ((authorizer.get("jwt") or {}).get("claims") or {})
    if not claims.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required")
    return claims
