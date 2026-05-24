from fastapi import APIRouter

from rifaapp.shared.api.dependencies import require_db
from rifaapp.shared.models.schemas import MigrationRunResponse
from rifaapp.write.src.app.commands import migrations

router = APIRouter(prefix="/migrations", tags=["migrations"])


@router.post("/run", response_model=MigrationRunResponse)
def run_migrations():
    require_db()
    return migrations.run_migrations()
