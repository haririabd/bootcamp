

# Task Management App (Kanban Board)

A full-stack Kanban board application built as a monorepo with Turborepo.

To run the production deployment, students simply need to execute:

```sh
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

User App: http://localhost/
Admin App: http://localhost/admin/
API: http://localhost/api/


## Architecture

```
.
├── apps/
│   ├── web/                  ← User-facing Kanban board (Next.js)
│   └── admin/                ← Admin dashboard (Vite + React)
├── packages/
│   ├── ui/                   ← Shared UI components
│   ├── eslint-config/        ← Shared ESLint configs
│   └── typescript-config/    ← Shared TypeScript configs
├── contracts/
│   ├── typespec/             ← API contract source of truth
│   ├── openapi/              ← Generated OpenAPI spec
│   └── generated/
│       ├── ts/               ← Generated TypeScript types
│       └── dotnet/           ← Generated C# DTOs
├── services/
│   └── api-dotnet/           ← .NET 10 Web API
├── Taskfile.yaml             ← Task orchestrator (go-task)
└── docker-compose.yml        ← Local infrastructure
```

## Prerequisites

- Node.js >= 18
- pnpm 9+
- .NET 10 SDK (`10.0.101`)
- [go-task](https://taskfile.dev) — Install: `brew install go-task`
- Docker & Docker Compose

## Quick Start

```sh
# Install JS dependencies
pnpm install

# Start local infrastructure (PostgreSQL)
task infra:up

# Generate API types from TypeSpec
task generate

# Run database migrations
task db:migrate

# Start all services (API + web + admin)
task dev
```

## Available Tasks

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `task dev`          | Start all services concurrently                  |
| `task dev:web`      | Start web app only (port 3000)                   |
| `task dev:admin`    | Start admin app only (port 5173)                 |
| `task dev:api`      | Start .NET API only (port 5010)                  |
| `task build`        | Build all projects                               |
| `task lint`         | Lint all JS/TS projects                          |
| `task generate`     | Regenerate types from TypeSpec                   |
| `task clean`        | Remove all build artifacts and generated files   |
| `task infra:up`     | Start Docker infrastructure                      |
| `task infra:down`   | Stop Docker infrastructure                       |
| `task db:migrate`   | Apply EF Core migrations                         |

## Tech Stack

- **Frontend (web):** Next.js, React, TanStack Query, dnd-kit
- **Frontend (admin):** Vite, React, TanStack Query, React Router
- **Backend:** .NET 10, ASP.NET Core, Entity Framework Core, PostgreSQL
- **API Contract:** TypeSpec → OpenAPI → generated types
- **Monorepo:** Turborepo, pnpm workspaces
- **Orchestration:** go-task
