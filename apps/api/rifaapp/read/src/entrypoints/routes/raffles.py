import uuid
from typing import Optional

from fastapi import APIRouter, Query

from rifaapp.shared.api.dependencies import require_db
from rifaapp.shared.models.schemas import RaffleNumbersResponse, RaffleOut
from rifaapp.read.src.app.queries import raffles as raffles_queries

router = APIRouter(prefix="/raffles", tags=["raffles"])


@router.get("", response_model=list[RaffleOut])
def list_raffles(status: Optional[str] = Query(None, description="Filter by status")):
    require_db()
    return raffles_queries.list_raffles(status)


@router.get("/{raffle_id}", response_model=RaffleOut)
def get_raffle(raffle_id: uuid.UUID):
    require_db()
    return raffles_queries.get_raffle(raffle_id)


@router.get("/{raffle_id}/numbers", response_model=RaffleNumbersResponse)
def list_numbers(
    raffle_id: uuid.UUID,
    offset: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1),
):
    require_db()
    return raffles_queries.list_numbers(raffle_id, offset=offset, limit=limit)
