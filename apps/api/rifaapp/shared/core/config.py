from dataclasses import dataclass, field
import json
import os


def _as_bool(value: str) -> bool:
    return value.lower() in ("1", "true", "yes")


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _resolve_db_password() -> str:
    """Read password from Secrets Manager if DB_SECRET_ARN is set, otherwise from env."""
    secret_arn = os.getenv("DB_SECRET_ARN", "")
    if secret_arn:
        try:
            import boto3
            client = boto3.client("secretsmanager")
            response = client.get_secret_value(SecretId=secret_arn)
            secret = json.loads(response["SecretString"])
            return secret.get("password", "")
        except Exception:
            pass
    return os.getenv("DB_PASSWORD", "")


@dataclass(frozen=True)
class Settings:
    db_host: str = os.getenv("DB_HOST", "")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_read_host: str = os.getenv("DB_READ_HOST", "")
    db_read_port: int = int(os.getenv("DB_READ_PORT", os.getenv("DB_PORT", "5432")))
    db_name: str = os.getenv("DB_NAME", "")
    db_user: str = os.getenv("DB_USER", "")
    db_password: str = field(default_factory=_resolve_db_password)
    auto_migrate: bool = _as_bool(os.getenv("AUTO_MIGRATE", "false"))
    cors_allow_origins: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ALLOW_ORIGINS", "*"))
    )
    cors_allow_methods: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ALLOW_METHODS", "*"))
    )
    cors_allow_headers: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ALLOW_HEADERS", "*"))
    )
    expose_errors: bool = _as_bool(os.getenv("EXPOSE_ERRORS", "true"))


settings = Settings()


def db_configured() -> bool:
    host = settings.db_read_host or settings.db_host
    return all([host, settings.db_name, settings.db_user, settings.db_password])
