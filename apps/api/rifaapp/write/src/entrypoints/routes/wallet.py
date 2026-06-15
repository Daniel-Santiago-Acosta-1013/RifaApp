import uuid

from fastapi import APIRouter, Request

from rifaapp.shared.api.dependencies import require_cognito_claims, require_db
from rifaapp.shared.models.schemas import WalletDepositRequest, WalletOut
from rifaapp.write.src.app.commands import auth as auth_commands
from rifaapp.write.src.app.commands import wallet as wallet_commands

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _current_user(request: Request) -> dict:
    return auth_commands.sync_cognito_user(require_cognito_claims(request))


@router.get("", response_model=WalletOut)
def get_wallet(request: Request):
    require_db()
    user = _current_user(request)
    return wallet_commands.get_wallet(uuid.UUID(user["id"]))


@router.post("/deposits", response_model=WalletOut)
def deposit_wallet(payload: WalletDepositRequest, request: Request):
    require_db()
    user = _current_user(request)
    return wallet_commands.deposit_wallet(uuid.UUID(user["id"]), payload)


@router.post("/reset", response_model=WalletOut)
def reset_wallet(request: Request):
    require_db()
    user = _current_user(request)
    return wallet_commands.reset_wallet(uuid.UUID(user["id"]))
