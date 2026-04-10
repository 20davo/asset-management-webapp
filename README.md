# Asset Management Web App

## Docker setup

This repository now includes a local development Docker stack for:

- `frontend` (Vite dev server)
- `api` (ASP.NET Core API)
- `db` (PostgreSQL)

### Docker files in the repo

- [compose.yaml](./compose.yaml)
- [frontend/Dockerfile](./frontend/Dockerfile)
- [frontend/.dockerignore](./frontend/.dockerignore)
- [api/AssetManagement/AssetManagement.Api/Dockerfile](./api/AssetManagement/AssetManagement.Api/Dockerfile)
- [api/AssetManagement/AssetManagement.Api/.dockerignore](./api/AssetManagement/AssetManagement.Api/.dockerignore)
- [.env.example](./.env.example)

### Prerequisites

- Docker Desktop installed and running
- WSL 2 enabled on Windows

### Local environment file

Create a root `.env` file based on `.env.example`.

The root `.env` is used by Docker Compose for local values such as:

- exposed host ports
- PostgreSQL credentials
- JWT settings
- frontend API base URL
- optional local bootstrap admin credentials
- CORS origins

The root `.env` is ignored by Git and should stay local.

### Start the stack

From the repository root:

```powershell
docker compose up --build
```

Run in the background:

```powershell
docker compose up --build -d
```

### Start the production-like stack

This keeps the same API and database services, but swaps the frontend to the
build-and-serve container based on `frontend/Dockerfile.prod`.

In the production-like stack, Nginx serves the frontend and proxies:

- `/api` to the ASP.NET API
- `/uploads` to the authenticated equipment image endpoint

This means the browser can use a single origin in the production-like setup.
The API also enables forwarded-header handling in this mode so proxy-provided
host, scheme, and client IP information can flow through correctly.

From the repository root:

```powershell
docker compose -f compose.yaml -f compose.prod.yaml up --build
```

Run in the background:

```powershell
docker compose -f compose.yaml -f compose.prod.yaml up --build -d
```

### Open the app

- Frontend: `http://localhost:5173`
- API: `http://localhost:5071`
- PostgreSQL from host tools: `localhost:5433`

With the production-like compose override:

- Frontend: `http://localhost:8080`
- API through frontend origin: `http://localhost:8080/api`
- Uploads through frontend origin: `http://localhost:8080/uploads/...`

In the production-like stack, the API and PostgreSQL services are no longer
published directly to host ports. The frontend container becomes the public
entry point.

### Daily commands

Show running services:

```powershell
docker compose ps
```

See logs:

```powershell
docker compose logs -f
```

Stop and remove containers:

```powershell
docker compose down
```

Important:

- `docker compose down` keeps named volumes
- `docker compose down -v` also removes volumes and deletes persisted local Docker data

### Persisted Docker data

This stack uses named volumes for:

- PostgreSQL data
- uploaded equipment images
- ASP.NET Data Protection keys

This means the following survive container recreation:

- database records
- uploaded files
- framework protection keys

### Notes

- The frontend currently runs as a Vite development container for easier learning and iteration.
- The backend applies EF Core migrations automatically on startup.
- A local bootstrap admin can be enabled from the root `.env` for development only.
- Equipment uploads are served through authenticated API requests, not as public static files.
- The current Docker setup is a development-oriented stack, not a production deployment yet.
