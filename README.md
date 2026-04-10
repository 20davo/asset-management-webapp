# Asset Management Web App

Internal asset management web application built with React, ASP.NET Core, and PostgreSQL for tracking company equipment, checkouts, availability, and maintenance.

## Project overview

This project is a full-stack demo for managing company assets in one place.

Current core capabilities:

- user login with JWT-based authentication
- inventory overview for company equipment
- equipment details with checkout history
- user checkout and return flow
- admin-only equipment creation, editing, deletion, and maintenance actions
- protected equipment image uploads
- Docker-based local development and production-like demo workflows

## Tech stack

- frontend: React, TypeScript, Vite
- backend: ASP.NET Core 8, Entity Framework Core
- database: PostgreSQL
- containers: Docker Compose
- production-like frontend serving: Nginx

## Repository structure

- [compose.yaml](./compose.yaml): local development Docker stack
- [compose.prod.yaml](./compose.prod.yaml): production-like Docker override
- [frontend/Dockerfile](./frontend/Dockerfile): frontend dev container
- [frontend/Dockerfile.prod](./frontend/Dockerfile.prod): production-like frontend build and serve container
- [frontend/nginx.conf](./frontend/nginx.conf): frontend reverse proxy config for the production-like path
- [api/AssetManagement/AssetManagement.Api/Dockerfile](./api/AssetManagement/AssetManagement.Api/Dockerfile): API container build
- [.env.example](./.env.example): example root environment file for Docker Compose

## Docker workflows

The repository currently supports two container workflows.

### 1. Local development stack

The default [compose.yaml](./compose.yaml) is the developer-friendly setup:

- frontend runs with the Vite dev server
- API is published directly to a host port
- PostgreSQL is published directly to a host port
- public registration can stay enabled
- login rate limiting is off by default

Start it from the repository root:

```powershell
docker compose up --build
```

Run in the background:

```powershell
docker compose up --build -d
```

Default local endpoints:

- frontend: `http://localhost:5173`
- API: `http://localhost:5071`
- PostgreSQL from host tools: `localhost:5433`

### 2. Production-like stack

The production-like path uses [compose.yaml](./compose.yaml) together with [compose.prod.yaml](./compose.prod.yaml).

In this mode:

- frontend is built and served from Nginx
- frontend and API behave like a single-origin app
- `/api` is proxied to the ASP.NET API
- `/uploads` is proxied to the protected equipment image endpoint
- API and PostgreSQL are no longer published to host ports
- public registration is disabled by default
- login rate limiting is enabled by default
- forwarded headers are enabled for the reverse proxy setup

Start it from the repository root:

```powershell
docker compose -f compose.yaml -f compose.prod.yaml up --build
```

Run in the background:

```powershell
docker compose -f compose.yaml -f compose.prod.yaml up --build -d
```

Default production-like endpoint:

- app entry point: `http://localhost:8080`

In the production-like setup the browser uses:

- frontend: `http://localhost:8080`
- API through the same origin: `http://localhost:8080/api`
- protected image requests through the same origin: `http://localhost:8080/uploads/...`

## Local environment setup

Create a root `.env` file based on [`.env.example`](./.env.example).

The root `.env` is used by Docker Compose for local values such as:

- host ports
- PostgreSQL credentials
- frontend runtime settings
- JWT settings
- registration flags
- login rate limit settings
- bootstrap admin values
- CORS origins

The root `.env` is ignored by Git and should stay local.

### Important local variables

Local development examples in [`.env.example`](./.env.example):

- `JWT_KEY`
- `REGISTRATION_ENABLED`
- `VITE_REGISTRATION_ENABLED`
- `AUTH_RATE_LIMIT_ENABLED`
- `BOOTSTRAP_ADMIN_ENABLED`

Production-like override examples are configured through `compose.prod.yaml` defaults such as:

- `REGISTRATION_ENABLED_PROD=false`
- `VITE_REGISTRATION_ENABLED_PROD=false`
- `AUTH_RATE_LIMIT_ENABLED_PROD=true`

## Authentication and access behavior

The app currently uses JWT Bearer authentication stored in browser `localStorage`.

Current behavior:

- expired or invalid JWT responses (`401`) clear the local session and redirect the user back to login
- forbidden responses (`403`) redirect the user to the app root and show a shared permission error message
- unknown routes redirect unauthenticated visitors back into the login flow
- unknown routes show a dedicated not-found page only for authenticated users
- visiting `/login` or `/register` while already logged in triggers an automatic logout

### Registration behavior

Registration is environment-controlled.

Local development:

- registration can stay enabled
- login and register links are visible in the guest navigation

Production-like mode:

- registration is disabled by default
- the register page is not available
- guest navigation hides both login and register links for a cleaner closed-demo flow

## Image uploads

Equipment images are no longer served as public static files.

Current behavior:

- uploaded files are stored in a Docker volume
- image URLs are resolved through authenticated API access
- protected image loading uses the logged-in user token
- unauthorized image requests follow the same session-expired flow as the rest of the app

## Persistence

The Docker setup uses named volumes for:

- PostgreSQL data
- uploaded equipment images
- ASP.NET Data Protection keys

This means the following survive container recreation:

- database records
- uploaded files
- framework protection keys

## Daily Docker commands

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

Stop containers and remove named volumes too:

```powershell
docker compose down -v
```

## Development notes

- the backend applies EF Core migrations automatically on startup
- a local bootstrap admin can be enabled from the root `.env` for development only
- the frontend forms use explicit `autocomplete` values for better browser and password manager behavior
- the production-like stack is meant as a realistic demo path, not as a final production deployment

## Current limitations

The project is in a strong demo-ready state, but a few production-level decisions are still intentionally simple:

- JWT is still stored in `localStorage`
- forwarded headers currently trust all proxies when the feature is enabled
- login rate limiting is currently IP-based
- the production-like Docker path is closer to deployment, but it is not yet a full final deployment setup with TLS, domain routing, and secret management
