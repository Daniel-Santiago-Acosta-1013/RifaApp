# RifaApp

Monorepositorio de RifaApp. Contiene el backend (FastAPI + Lambda), el frontend (React + Vite) y la infraestructura (Terraform + Terragrunt) en un solo repo.

## Estructura

```
.
├── apps/
│   ├── api/          # Backend FastAPI (AWS Lambda)
│   └── frontend/     # Frontend React + TypeScript + Vite
├── infra/
│   ├── blueprints/   # Módulos y bootstrap de Terraform
│   └── hcl/          # Configuraciones Terragrunt (live, envs, root.hcl)
├── docker-compose.yml
├── skaffold.yaml
├── Taskfile.yml
└── package.json
```

## Requisitos

- Python 3.11 + uv
- Node.js 18+
- Terraform >= 1.5
- Terragrunt >= 0.96
- AWS CLI configurado
- Docker (opcional, para local)
- Task (opcional, para comandos)

## Desarrollo local

### Backend

```bash
cd apps/api
uv sync --extra dev
uv run uvicorn rifaapp.write.src.entrypoints.api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

## Build y deploy

### Con Task

```bash
# Build de Lambdas
task build:api

# Deploy de infraestructura
task deploy

# Plan de infra
task infra:live:plan
```

### Manual

Ver los READMEs específicos:
- [`apps/api/README.md`](apps/api/README.md)
- [`apps/frontend/README.md`](apps/frontend/README.md)
- [`infra/README.md`](infra/README.md)

## Docker Compose

```bash
docker compose up --build
```

## Licencia

[LICENSE](LICENSE)
