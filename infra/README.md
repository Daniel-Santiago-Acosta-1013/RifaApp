# RifaApp infra (Terraform + Terragrunt)

Infraestructura en AWS para RifaApp con Terraform. Incluye red, base de datos Aurora,
Lambdas de lectura/escritura, API Gateway, frontend en S3 + CloudFront, y un bootstrap para el bucket del estado.

## Alcance
- VPC con subnets publicas y privadas
- Aurora (PostgreSQL por defecto)
- Lambdas (read/write) dentro de la VPC
- HTTP API Gateway con integracion Lambda
- S3 + CloudFront para frontend (SPA)
- Bucket S3 para el estado de Terraform (versionado, cifrado, bloqueo publico)

## Estructura del monorepo (infra)
- `infra/blueprints/bootstrap/`: crea el bucket de estado en S3
- `infra/blueprints/modules/network/`: VPC y subnets
- `infra/blueprints/modules/db/`: Aurora + SGs
- `infra/blueprints/modules/api/`: API Gateway HTTP
- `infra/blueprints/modules/lambda_api_http/`: Lambda + rutas API Gateway
- `infra/blueprints/modules/frontend/`: stack del frontend (S3 + CloudFront)
- `infra/terraform/live/shared/`: stacks shared (network, db, api)
- `infra/terraform/live/lambdas/`: stacks de lambdas (read/write)
- `infra/terraform/envs/frontend/`: Terragrunt para frontend (estado separado)
- `infra/terraform/backend.hcl.example`, `infra/terraform/root.hcl`: referencia y backend real de Terragrunt
- `apps/api/`: codigo del backend (FastAPI) y build de Lambda

## Requisitos
- Terraform >= 1.5
- Terragrunt >= 0.96
- AWS CLI configurado
- Credenciales con permisos para S3, VPC, RDS, Lambda, API Gateway, IAM y CloudWatch Logs
- Python 3.11 y uv (Astral) (para construir el artefacto de Lambda en `apps/api`)
- Sqitch (para ejecutar migraciones via la API del backend)

## Instalacion local (macOS con Homebrew)
```
brew install awscli terraform terragrunt cpanminus libpq
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Instala Sqitch (macOS):
```
env PATH="/opt/homebrew/opt/libpq/bin:$PATH" cpanm --notest App::Sqitch
cpanm --local-lib=~/perl5 local::lib
eval "$(perl -I ~/perl5/lib/perl5 -Mlocal::lib)"
```

## Configuracion de credenciales
Terraform usa las credenciales del AWS CLI o del entorno. Ejemplo:

```
export AWS_PROFILE=rifaapp-dev
export AWS_REGION=us-east-1
```

## Paso 1: bootstrap del estado
Crear el bucket del estado en S3:

```
terragrunt --working-dir infra/blueprints/bootstrap init
terragrunt --working-dir infra/blueprints/bootstrap apply -var="state_bucket_name=rifaapp-terraform-state-745819688993" -var="aws_region=us-east-1"
```

## Paso 2: configurar backend
Actualiza `infra/terraform/backend.hcl.example` (referencia) y `infra/terraform/root.hcl` (backend real)
con el bucket, key y region del estado.

## Paso 3: variables
Define `TF_VAR_db_password` (o `DB_PASSWORD`) en tu shell. El resto de variables se pueden
inyectar por entorno (ej: `PROJECT_NAME`, `ENVIRONMENT`, `API_BASE_PATH`).

## Paso 4: desplegar infraestructura
Antes de aplicar, construye los paquetes de Lambda (read/write) en el repo del backend:

```
cd apps/api
./scripts/build_lambda.sh
cd ../..
```

Si usas otro path para el build, configura `lambda_read_source_dir` y `lambda_write_source_dir`:
```
export TF_VAR_lambda_read_source_dir="/ruta/al/lambda_dist/read"
export TF_VAR_lambda_write_source_dir="/ruta/al/lambda_dist/write"
```

```
terragrunt --working-dir infra/terraform/live run-all plan
terragrunt --working-dir infra/terraform/live run-all apply
```

## Frontend (S3 + CloudFront)
El frontend se aplica con Terragrunt en `infra/terraform/envs/frontend` (estado separado) para evitar
que el deploy del backend modifique recursos del frontend.

```
terragrunt --working-dir infra/terraform/envs/frontend apply
```

## Outputs principales
- `api_url`: URL del API Gateway (stage)
- `api_base_url`: URL base del API (incluye `/rifaapp`)
- `lambda_read_function_name`: nombre de la lambda read
- `lambda_write_function_name`: nombre de la lambda write
- `db_cluster_endpoint`: endpoint de escritura del cluster
- `db_reader_endpoint`: endpoint de lectura
- `frontend_bucket_name`: bucket S3 del frontend
- `frontend_distribution_id`: ID de CloudFront
- `frontend_url`: URL publica de CloudFront

## CI/CD (GitHub Actions)
Workflow manual en `/.github/workflows/infra-lifecycle.yml` (solo `workflow_dispatch`), usa Terragrunt.
Workflow manual en `/.github/workflows/migrate.yml` para ejecutar migraciones con Sqitch.
Workflow programado/manual en `/.github/workflows/destroy-infra-scheduled.yml` para destruir recursos del entorno dev.
El deploy del frontend corre desde el repo `apps/frontend` y aplica Terragrunt en `infra/terraform/envs/frontend`.

Configura en GitHub (repo principal):
- Variables: `BACKEND_REPO` (owner/RifaApp), `BACKEND_REF` (opcional), `AWS_REGION`, `API_BASE_PATH` (por defecto `rifaapp`)
- Secrets: `DB_PASSWORD` y credenciales AWS (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`)

## Notas
- `db_password` se guarda en el estado de Terraform.
- `enable_nat_gateway` esta en `true` en live para que CodeBuild pueda instalar Sqitch desde subnets privadas y ejecutar migraciones contra Aurora.
- Para eliminar recursos: usa `infra-lifecycle.yml` con `action=destroy` y `confirm_destroy=DESTROY`, o deja correr `destroy-infra-scheduled.yml`.
- El bucket de estado remoto queda vivo por diseño. Es el unico recurso permitido despues del destroy y se elimina aparte desde `infra/blueprints/bootstrap/` si realmente quieres borrar el backend de Terraform.
- Los workflows de destroy fallan si Terraform no destruye correctamente. Luego hacen limpieza best-effort de residuos conocidos: versiones antiguas de Lambda Layers, CloudWatch Logs de Lambda/CodeBuild, snapshots manuales de Aurora, HTTP APIs huerfanas, secrets taggeados y buckets del entorno.
- Al final del destroy hay una verificacion obligatoria por tags/nombres. Si queda cualquier recurso del proyecto distinto al bucket de estado, el job falla.
- Las migraciones deben ejecutarse con Sqitch. No hay fallback a SQL directo.
- El workflow de migraciones empaqueta `rifaapp/db`, lo sube a S3 y dispara CodeBuild. CodeBuild corre dentro de la VPC con el security group `${PROJECT_NAME}-${ENVIRONMENT}-db-client`, instala Sqitch y aplica las migraciones contra Aurora privada.
