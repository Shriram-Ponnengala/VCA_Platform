# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Venture Chess Academy (VCA) platform — a chess academy management system (students, coaches, batches/classes, attendance, programs) plus a real-time collaborative chess **classroom/study** feature. It's a **Turborepo monorepo** using npm workspaces.

## Repository layout

```
apps/
  web/        Next.js 16 (App Router, React 19) frontend — port 3000
  api/        Express REST API (TypeScript, ts-node) — port 4000 local
  realtime/   Socket.IO server for live chess classrooms — port 4001 local
packages/
  database/   Prisma schema + generated client + PrismaPg adapter (@vca/database)
  types/      Shared TS types incl. chess study types (MoveNode, etc.) (@vca/types)
  chess/      Custom chess.js subclass with "gamified" FEN support (@vca/chess)
  ui/         Shared React components (@vca/ui)
```

## Commands

Run from the repo root unless noted. There is **no test suite** and lint is only wired up for `web`.

```bash
npm install                 # install all workspaces
npm run dev                 # turbo: run dev for all apps in parallel
npm run build               # turbo: build all (web=next build, api/realtime=tsc)
npm run lint                # turbo: lint (only web has a lint task → next lint)
```

Run a single app's dev server:
```bash
npm run dev --workspace=web          # or api / realtime
```

Docker (spins up postgres + all three services):
```bash
docker compose up --build            # db:5432, api:5000, socket:5001, web:3000
```

### Database (Prisma)

Prisma is a devDependency of `packages/database` and there are **no npm scripts** for it — run via `npx` from that directory. The project uses **`prisma db push`** (schema-driven, **no migrations directory**), not `prisma migrate`.

```bash
cd packages/database
npx prisma db push          # sync schema.prisma → database
npx prisma generate         # regenerate the client after editing schema.prisma
node prisma/seed.js         # seed admin/coach/student demo users (see seed.js for credentials)
```

## Architecture

### Data flow (important: two paths to the database)
The web app reaches data **two different ways**:
1. **Server Components / layouts** import Prisma directly from `apps/web/src/lib/db.ts` and read auth from cookies (`apps/web/src/lib/auth.ts`).
2. **Client Components** (`src/lib/hooks/use*.ts`) `fetch('/api/...')`, which Next.js **rewrites** (see `apps/web/next.config.ts`) to the Express API (`API_URL`, default `http://localhost:4000`). The API then owns its own Prisma client in `packages/database/src/index.ts`.

Both Prisma clients use the **PrismaPg adapter over a `pg` Pool** (not the default engine) and cache the client on `globalThis` in dev.

### API module pattern
Each domain under `apps/api/src/modules/<name>/` follows a layered convention:
`<name>.route.ts` → `<name>.controller.ts` → `<name>.service.ts` → `<name>.repository.ts` (repository is the only layer touching Prisma). Not every module has all four layers. Routes are mounted in `apps/api/src/routes.ts` under `/api/*`. **There is currently no auth middleware on the Express routes** — JWTs are verified in the web layer and in the socket server.

### Auth
JWT via **`jose`** (HS256), password hashing via **`bcryptjs`**. The token lives in the `auth-token` cookie (and is also passed as socket `auth.token`). **The same `JWT_SECRET` must be set identically across api, realtime, and web** or auth silently breaks. Roles are `ADMIN | COACH | STUDENT` (see the `Role` enum in `schema.prisma`); the web dashboard branches on role.

### Real-time classroom (apps/realtime)
- Socket.IO server; connection auth middleware verifies the JWT from `auth.token` or the `auth-token` cookie.
- Live classroom state (the shared move tree, participants, chat, chapters) is held **in-memory in a global `Map` (`_chessRooms`)**, keyed `batch_<classId>`. It is **not** the source of truth per-request.
- State is persisted to the `Classroom.stateData` JSON column: on a **30s interval** and when a room ends.
- The API ends a room via an internal HTTP call: `POST /internal/end-room` on the realtime server (see `apps/realtime/src/index.ts`).
- The move tree is a graph of `MoveNode`s (`nodes` + `currentNodeId`), defined in `packages/types`.

### Chess engine (@vca/chess)
`packages/chess/src/index.ts` exports a `Chess` class **extending chess.js** to support a "gamified" board used in kids' lessons. Custom FEN is encoded as `<fen>|targets:sq=code,...|blocks:sq=code,...`. The class transparently parses/serializes this, injects temporary "dummy kings" so chess.js accepts otherwise-illegal positions, and disables check detection when gamified. **Anything reading/writing FEN in this project may encounter these `|`-suffixed strings** — use `parseGamifiedFen`/`serializeGamifiedFen` rather than assuming standard FEN.

## Gotchas / non-obvious details

- **Port mismatch between local and Docker.** Local dev defaults: API 4000, socket 4001. `docker-compose.yml` sets API to **5000** and socket to **5001**. `apps/web/.env.local` and the web rewrite point at 4000/4001.
- **`useSocket` hardcodes `http://localhost:4001`** rather than reading `NEXT_PUBLIC_SOCKET_URL` — update the hook if the socket URL changes.
- **JWT_SECRET is inconsistent across configs** (`.env` = `123456789`, docker-compose = `wdfghjifghjoixcvhjk`, plus a hardcoded fallback in several files). Keep them aligned when touching any auth path.
- **Prisma version drift**: root/`database` pin `@prisma/client` ^6.19.3, but `apps/web` uses `@prisma/adapter-pg` ^7.8.0. Be deliberate when bumping.
- LAN/multi-device access is a supported workflow — see `LAN_ACCESS.md`. CORS in both api and realtime is intentionally permissive in dev (allows any origin, special-cases `192.168.*`).
- The active feature branch is `feature/classroom`; `main` is the stable branch.
