import uuid

from fastapi import APIRouter

from rifaapp.shared.api.dependencies import require_db
from rifaapp.shared.models.schemas import PurchaseOut
from rifaapp.read.src.app.queries import purchases

router = APIRouter(prefix="/participants", tags=["purchases"])


@router.get("/{participant_id}/purchases", response_model=list[PurchaseOut])
def list_purchases(participant_id: uuid.UUID):
    require_db()
    return purchases.list_purchases(participant_id)
