import uuid
from fastapi import APIRouter, Request

from rifaapp.shared.api.dependencies import require_cognito_claims, require_db
from rifaapp.shared.models.schemas import (
    DrawResponse,
    PurchaseConfirmRequest,
    PurchaseConfirmResponse,
    RaffleCreate,
    RaffleOut,
    RaffleUpdate,
    ReservationReleaseRequest,
    ReservationRequest,
    ReservationResponse,
)
from rifaapp.write.src.app.commands import raffles as raffles_commands
from rifaapp.write.src.app.commands import auth as auth_commands

router = APIRouter(prefix="/raffles", tags=["raffles"])


@router.post("", response_model=RaffleOut, status_code=201)
def create_raffle(payload: RaffleCreate, request: Request):
    require_db()
    user = auth_commands.sync_cognito_user(require_cognito_claims(request))
    return raffles_commands.create_raffle(payload, uuid.UUID(user["id"]))


@router.patch("/{raffle_id}", response_model=RaffleOut)
def update_raffle(
    raffle_id: uuid.UUID,
    payload: RaffleUpdate,
    request: Request,
):
    require_db()
    user = auth_commands.sync_cognito_user(require_cognito_claims(request))
    return raffles_commands.update_raffle(raffle_id, payload, user["id"])


@router.delete("/{raffle_id}")
def delete_raffle(
    raffle_id: uuid.UUID,
    request: Request,
):
    require_db()
    user = auth_commands.sync_cognito_user(require_cognito_claims(request))
    return raffles_commands.delete_raffle(raffle_id, user["id"])


@router.post("/{raffle_id}/reservations", response_model=ReservationResponse, status_code=201)
def reserve_numbers(raffle_id: uuid.UUID, payload: ReservationRequest):
    require_db()
    return raffles_commands.reserve_numbers(raffle_id, payload)


@router.post("/{raffle_id}/confirm", response_model=PurchaseConfirmResponse)
def confirm_purchase(raffle_id: uuid.UUID, payload: PurchaseConfirmRequest):
    require_db()
    return raffles_commands.confirm_purchase(raffle_id, payload)


@router.post("/{raffle_id}/release")
def release_reservation(raffle_id: uuid.UUID, payload: ReservationReleaseRequest):
    require_db()
    return raffles_commands.release_reservation(raffle_id, payload.reservation_id)


@router.post("/{raffle_id}/draw", response_model=DrawResponse)
def draw_raffle(raffle_id: uuid.UUID, request: Request):
    require_db()
    user = auth_commands.sync_cognito_user(require_cognito_claims(request))
    return raffles_commands.draw_raffle(raffle_id, user["id"])
