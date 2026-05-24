# RifaApp Front

Frontend en React + TypeScript + Vite para consumir el backend de RifaApp.

## Requisitos
- Node.js 18+

## Desarrollo local
```
npm install
npm run dev
```

Configura el backend con:
```
VITE_API_READ_BASE_URL=http://localhost:8000/rifaapp-read
VITE_API_WRITE_BASE_URL=http://localhost:8000/rifaapp-write
```

## Build
```
npm run build
```

## E2E (Playwright)
Instala Playwright y corre las pruebas:
```
npm install
npm run test:e2e:install
npm run test:e2e
```

Opciones utiles:
```
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:report
```

Notas:
- Los artefactos se guardan en `playwright-report/` y `test-results/`.
- Los errores de consola, page errors y requests fallidos quedan en `playwright-report/errors.log`.
- Para probar contra el backend real, usa:
  - `E2E_USE_LIVE_API=true VITE_API_READ_BASE_URL=... VITE_API_WRITE_BASE_URL=... npm run test:e2e`

## Deploy
El workflow `deploy.yml` aplica Terraform en el repo de infra (stack frontend),
publica el `dist/` en S3 y crea invalidacion en CloudFront.

Variables necesarias (Actions):
- `AWS_REGION`
- `VITE_API_READ_BASE_URL`
- `VITE_API_WRITE_BASE_URL`
- `INFRA_REPO` (owner/RifaApp)
- `INFRA_REF` (opcional, default `main`)
- `FRONTEND_REF` (opcional, default `main`)

Secrets necesarios:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `INFRA_DISPATCH_TOKEN` (PAT con acceso de lectura al repo infra)
