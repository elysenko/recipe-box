# Recipe Box & Meal Planner

A full-stack web app for a household to keep a recipe collection and plan the
week's meals. Roles: **ADMIN** (manages all users' recipes) and **USER**
(browses recipes, plans their own week).

- **`backend/`** — TypeScript Express API with JWT role-based auth and a
  Prisma/PostgreSQL datastore. Passwords are hashed with **bcrypt**.
- **`web/`** — Vite + React + React Router SPA. Every navigable state is
  URL-addressable (`/recipes`, `/recipes/:id`, `/planner?week=`, `/admin`,
  `/login`).

## Prerequisites

- Node.js 20+
- A PostgreSQL database (connection string via `DATABASE_URL`)

## Environment variables

| Variable       | Used by  | Description                                                        |
| -------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | backend  | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/recipes` |
| `JWT_SECRET`   | backend  | Secret used to sign/verify JWTs (set a strong value in production) |
| `PORT`         | backend  | Port the API listens on (defaults to the platform-provided port)  |
| `SEED_ADMIN_PASSWORD` | seed | Optional override for the seeded ADMIN password (default `demo-password`) |
| `SEED_USER_PASSWORD`  | seed | Optional override for the seeded USER password (default `demo-password`)  |

## Backend (`backend/`)

```bash
cd backend
npm install

# Generate the Prisma client and apply migrations
npx prisma generate
npx prisma migrate deploy      # or `npx prisma migrate dev` in development

# Seed the demo accounts + sample recipes (see credential contract below)
npx prisma db seed

# Run the API
npm run dev                    # tsx watch (development)
npm run build && npm run start:prod   # compiled (production)
```

### Seeded demo credentials

Running the seed creates one ADMIN and one USER account and prints the
platform credential contract to stdout:

```
SEED_CRED ADMIN admin@demo.test demo-password
SEED_CRED USER user@demo.test demo-password
SEED_CREDS_JSON [{"role":"ADMIN",...},{"role":"USER",...}]
```

The USER account is seeded with a couple of sample recipes ("Lemon Pasta",
"Veggie Stir-Fry") so a fresh deploy isn't empty. The seed is idempotent
(upserts by email / stable recipe id) and re-asserts the password on every run.

## Frontend (`web/`)

```bash
cd web
npm install
npm run dev        # Vite dev server (proxies /api to the backend)
npm run build      # production build to web/dist
```

The Login page's "Try a demo account" buttons fill the seeded
`admin@demo.test` / `user@demo.test` credentials and authenticate against the
real backend.

## Deployment

The app is built and containerized for the Colossus platform. The API serves
`GET /api/health` → `{"status":"ok"}` for the reachability probe, mounts the
API under `/api`, and the SPA is served with a fallback so deep-linked routes
render on direct load. Provide `DATABASE_URL`, `JWT_SECRET`, and `PORT` via the
injected environment; run `prisma migrate deploy && prisma db seed` before
starting the server.
