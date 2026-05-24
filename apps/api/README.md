# RifaApp backend (FastAPI)

API de rifas para ejecutarse en AWS Lambda con FastAPI + Mangum.

## Requisitos
- Python 3.11
- uv (Astral)
- Sqitch
- Terragrunt

Instalar Sqitch (macOS):
```
brew install cpanminus libpq
env PATH="/opt/homebrew/opt/libpq/bin:$PATH" cpanm --notest App::Sqitch
cpanm --local-lib=~/perl5 local::lib
eval "$(perl -I ~/perl5/lib/perl5 -Mlocal::lib)"
```

## Instalacion local
```
uv sync --extra dev
```

## Ejecutar localmente
```
uv run uvicorn rifaapp.write.src.entrypoints.api:app --reload --host 0.0.0.0 --port 8000
uv run uvicorn rifaapp.read.src.entrypoints.api:app --reload --host 0.0.0.0 --port 8001
```

Swagger (write): `http://localhost:8000/rifaapp/docs`
Swagger (read): `http://localhost:8001/rifaapp/docs`
OpenAPI: `http://localhost:8000/rifaapp/openapi.json` (write) / `http://localhost:8001/rifaapp/openapi.json` (read)

## Variables de entorno
- `DB_HOST`
- `DB_PORT`
- `DB_READ_HOST` (opcional, read replica)
- `DB_READ_PORT` (opcional)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Para crear tablas automaticamente en desarrollo (usa `sqitch deploy`):
```
export AUTO_MIGRATE=true
```

Para ejecutar migraciones manuales en CI/CD, se expone:
```
POST /rifaapp/migrations/run
```

Sqitch toma los cambios desde `rifaapp/db/` y requiere tener el binario disponible
en el entorno (PATH o `SQITCH_BIN`). Opcionalmente puedes definir:
- `SQITCH_TARGET`: override de la conexion (ej. `db:pg://user@host:5432/dbname`)
- `SQITCH_DIR`: directorio raiz donde viven `sqitch.conf` y `sqitch.plan`

En Lambda, provee `sqitch` via layer o runtime base si usas `AUTO_MIGRATE` o
el endpoint de migraciones. Si `sqitch` no esta disponible, el backend ejecuta
los SQL de `rifaapp/db/deploy` directamente como fallback.

## Build para Lambda
Genera `lambda_dist/read` y `lambda_dist/write` con dependencias y paquetes `rifaapp/`:

```
./scripts/build_lambda.sh
```

Terragrunt en `../../infra/hcl/envs/dev/` usa `lambda_dist/read` y `lambda_dist/write`.

## Deploy local con uv
Este comando construye la Lambda y ejecuta Terragrunt desde `envs/dev` en el repo infra:

```
uv sync --extra dev
uv run deploy
```

Variables requeridas:
- `AWS_PROFILE` y `AWS_REGION` (o credenciales AWS por env)
- `TF_VAR_db_password` o `DB_PASSWORD`

Opciones utiles:
- `uv run deploy --plan-only`
- `uv run deploy --lambda-only`
- `uv run deploy --infra-dir /ruta/a/infra/hcl`

## Deploy CI/CD
Este repo puede notificar al repo de infraestructura para desplegar cambios.
Tambien incluye un workflow manual para ejecutar migraciones en infra.

Configura en GitHub (repo backend):
- `INFRA_REPO` (Variable): `owner/RifaApp`
- `INFRA_DISPATCH_TOKEN` (Secret): token con permiso para disparar workflows en el repo infra

## Estructura
- `rifaapp/write/src/entrypoints/`: API write + handler
- `rifaapp/read/src/entrypoints/`: API read + handler
- `rifaapp/write/src/app/commands/`: write-side (comandos)
- `rifaapp/read/src/app/queries/`: read-side (consultas)
- `rifaapp/write/src/infra/`: conexion write + migraciones
- `rifaapp/read/src/infra/`: conexion read
- `rifaapp/shared/`: config, modelos y utilidades comunes
- `rifaapp/db/`: migraciones (write schema + read schema)

## CQRS (fuerte)
- Write model: `write.raffles`, `write.tickets`, `write.purchases`, `write.participants`, `write.users`
- Read model: `read.raffles`, `read.raffle_numbers`, `read.purchases`
- Las proyecciones del read model se actualizan **sincrónicamente en la misma transacción** mediante triggers en la base de datos.
- Las queries solo leen del read model.
- La migración `create_read_schema` crea y hace backfill del read model.

## Endpoints principales
- `GET /rifaapp/health`
- `POST /rifaapp/auth/register`
- `POST /rifaapp/auth/login`
- `POST /rifaapp/migrations/run`
- `POST /rifaapp/raffles`
- `GET /rifaapp/raffles`
- `GET /rifaapp/raffles/{raffle_id}`
- `GET /rifaapp/raffles/{raffle_id}/numbers`
- `POST /rifaapp/raffles/{raffle_id}/reservations`
- `POST /rifaapp/raffles/{raffle_id}/confirm`
- `POST /rifaapp/raffles/{raffle_id}/release`
- `POST /rifaapp/raffles/{raffle_id}/draw`
- `GET /rifaapp/participants/{participant_id}/purchases`
