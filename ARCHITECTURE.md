# Architecture

## Requested stack
- `react-express` (fixed platform stack — Vite + React + React Router SPA served behind nginx with an SPA fallback, backed by a TypeScript Express API and Prisma/PostgreSQL)

## Scaffolding status
- ✅ Newly scaffolded from `template-react-express` — the project directory was empty (no `package.json`, source files, etc.) prior to this run except `.git`, `.github/`, and a stub `README.md`.

## Layout
- `web/` — Vite + React 18 + TypeScript + React Router SPA.
  - `web/src/App.tsx` — router shell, carries `data-testid="app-ready"` (readiness landmark — do not remove).
  - `web/src/pages/` — route pages (`Home.tsx`, `Login.tsx` stubs to build on).
  - `web/src/lib/api.ts` — same-origin fetch wrapper; attaches `Authorization: Bearer <token>` from `localStorage`.
  - `web/vite.config.ts` — dev proxy `/api` → `http://localhost:3000`; builds to `web/dist`.
  - `web/Dockerfile.frontend`, `web/nginx.conf` — nginx image with SPA `try_files` fallback and `/api/` reverse-proxied to the `backend` service on :3000.
- `backend/` — Express + TypeScript + Prisma API.
  - `backend/src/app.ts` — Express app; `GET /api/health`, `POST /api/auth/login` scaffolded.
  - `backend/src/server.ts` — entrypoint, listens on `$PORT` (default 3000).
  - `backend/src/lib/auth.ts` — JWT sign/verify + password hash/verify helpers.
  - `backend/src/lib/prisma.ts` — Prisma client singleton.
  - `backend/prisma/schema.prisma` — PostgreSQL datasource via `DATABASE_URL`; `User` model with `Role` enum (`ADMIN`/`USER`) seeded.
  - `backend/prisma/seed.ts` — idempotent upsert seed; prints `SEED_CRED`/`SEED_CREDS_JSON` lines (Colossus credential contract — keep when extending).
  - `backend/Dockerfile` — multi-stage build; runtime `CMD` runs `prisma migrate deploy` (falls back to `prisma db push`) then starts the server.
- `.pipeline/surface.json` — route/component/test-id manifest consumed by the test_spec agent and Playwright generator. Currently reflects only the template's starter routes/pages (`/api/health`, `/api/auth/login`, `App`, `Home`) — **must be extended by the coder as recipe, planner, and admin routes/pages/test-ids are added**, or downstream test generation cannot reference them.
- `colossus.yaml` — build manifest read by deploy agents (framework: react, backend: express on :3000, nginx SPA fallback).

## Next steps for the build/coder stage
1. Implement the Recipe Box & Meal Planner domain on top of this scaffold per the plan: extend `backend/prisma/schema.prisma` with `Recipe` and `PlanEntry` models (the seeded `User` model already exists — reuse it, do not replace), add `backend/src/routes/{recipes,planner,admin}.ts`, and wire `authMiddleware`/`requireRole` (extend `backend/src/lib/auth.ts`) into `backend/src/app.ts`.
2. Build out `web/src/pages/{RecipesPage,RecipeDetailPage,PlannerPage,AdminPage,NotFoundPage}.tsx` and add `react-router-dom` routes in `web/src/App.tsx`; add `AuthContext`/route guards under `web/src/auth/`.
3. Update `.pipeline/surface.json` with every new route, component, and `data-testid` as they're added — required for accurate Playwright coverage.
4. Set `DATABASE_URL` and `JWT_SECRET` env vars for local dev (a `postgresql` datasource is already wired in `schema.prisma`; no `.env` file is scaffolded by default — create one locally, e.g. `DATABASE_URL="postgresql://user:pass@localhost:5432/recipebox"`).
5. Local dev: `npm install` in both `backend/` and `web/`, then `npx prisma migrate dev` in `backend/`, `npm run dev` in both directories (backend on :3000, web on :5173 with `/api` proxied).
6. Replace the stub `README.md` with real setup/run/deploy instructions once the app is built out.

## Template source
- `template-react-express` from the scaffold-templates library (Vite React SPA + Express + Prisma/PostgreSQL, nginx SPA-fallback deploy).
