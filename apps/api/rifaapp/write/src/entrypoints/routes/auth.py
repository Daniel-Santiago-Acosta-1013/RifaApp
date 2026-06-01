from fastapi import APIRouter, Request

from rifaapp.shared.api.dependencies import require_cognito_claims, require_db
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


@router.get("/me", response_model=UserOut)
def me(request: Request):
    require_db()
    return auth_commands.sync_cognito_user(require_cognito_claims(request))
