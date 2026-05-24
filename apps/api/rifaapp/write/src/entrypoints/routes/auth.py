from fastapi import APIRouter

from rifaapp.shared.api.dependencies import require_db
from rifaapp.shared.models.schemas import UserLogin, UserOut, UserRegister
from rifaapp.write.src.app.commands import auth as auth_commands

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserRegister):
    require_db()
    return auth_commands.register_user(payload)


@router.post("/login", response_model=UserOut)
def login(payload: UserLogin):
    require_db()
    return auth_commands.login_user(payload)
