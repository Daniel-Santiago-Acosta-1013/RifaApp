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

```bash
task db
task db:migrate
task api
task frontend
```

## Comandos locales

- `task db`: levanta PostgreSQL local.
- `task db:migrate`: aplica migraciones con Sqitch en Docker.
- `task api`: levanta API write en `8000` y read en `8001`.
- `task frontend`: levanta Vite.

## Docker Compose

```bash
docker compose up -d db
```

## Licencia

[LICENSE](LICENSE)
