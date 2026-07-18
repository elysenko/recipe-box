# Pipeline Task Decomposition

## Summary
Recipe Box & Meal Planner: a React + React Router SPA served by a TypeScript Express API with JWT role-based auth and a Prisma/SQLite datastore. Users manage their own recipes (title, ingredients, steps, servings, tags) and assign recipes to days of an ISO week ("This Week's Menu"). Admins can view all users' recipes. Deployed as a single Docker container with an SPA fallback for deep-linkable routes.

## Surface contract
**Backend API routes**
- `GET /api/health` → `{status:"ok"}` (public, no auth)
- `POST /api/auth/login` → `{token, user:{id,email,role}}` (public)
- `POST /api/auth/signup` → creates user (first user = ADMIN, rest = USER) *(full_auth rule; see Open questions re: spec)*
- `POST /api/auth/logout` (client-side token clear)
- `GET /api/auth/me` → current user (auth)
- `GET /api/recipes` → own recipes (auth); `POST /api/recipes`; `GET /api/recipes/:id`; `PUT /api/recipes/:id`; `DELETE /api/recipes/:id` (ownership-scoped; ADMIN may access any)
- `GET /api/planner?week=<ISO>` (auth, defaults to current ISO week); `POST /api/planner` `{week,day,recipeId}` upsert; `DELETE /api/planner/:id`
- `GET /api/admin/recipes` → all users' recipes grouped by owner (requireRole ADMIN)
- `GET /api/admin/settings` → list service/config keys with masked values + configured status (ADMIN); `PATCH /api/admin/settings` → upsert key-value pairs (ADMIN)

**Client routes / screens**
- `/login` (public) — email/password login
- `/signup` (public) — registration *(full_auth rule; see Open questions)*
- `/recipes` (guarded) — list + create form
- `/recipes/:id` (guarded) — detail / edit / delete, deep-load safe
- `/planner` (guarded) — "This Week's Menu", MON–SUN slots, `?week=` param
- `/admin` (guarded, ADMIN) — all users' recipes
- `/admin/settings` (guarded, ADMIN) — service + config credential forms
- `*` → NotFound

**Entities**
- `User` (id, email, passwordHash, role, createdAt)
- `Recipe` (id, title, ingredients, steps, servings, tags, ownerId, createdAt, updatedAt)
- `PlanEntry` (id, userId, week, day, recipeId, createdAt)
- `SystemSetting` (key, value, updatedAt)

## db_agent tasks
- [ ] Create `server/prisma/schema.prisma` with SQLite datasource driven by `DATABASE_URL` (default `file:./dev.db`).
- [ ] Define `enum UserRole { ADMIN USER }` and `User` model: `id`, `email @unique`, `passwordHash`, `role UserRole @default(USER)`, `createdAt`, relations `recipes`, `planEntries`.
- [ ] Define `Recipe` model: `id`, `title`, `ingredients` (String/JSON), `steps` (String/JSON), `servings` (Int), `tags` (String/JSON), `ownerId`→User, `createdAt`, `updatedAt`.
- [ ] Define `PlanEntry` model: `id`, `userId`→User, `week` (String e.g. `2026-W29`), `day` (String MON..SUN), `recipeId`→Recipe, `createdAt`; add index on `(userId, week)`.
- [ ] Define `SystemSetting` model: `key String @id`, `value String`, `updatedAt DateTime @updatedAt` (for admin settings backing `postgresql`, `minio`).
- [ ] Create `server/src/db.ts` — Prisma client singleton.
- [ ] Create `server/prisma/seed.ts` — idempotent upsert of ADMIN (`admin@demo.test`) + USER (`user@demo.test`) with hashed passwords and a couple sample recipes; emit exactly the `SEED_CRED ADMIN`, `SEED_CRED USER`, and `SEED_CREDS_JSON` lines to stdout.

## backend_agent tasks
- [ ] Create `server/src/auth.ts` — `hashPassword`/`verifyPassword` (bcryptjs), `signToken`/verify (jsonwebtoken, `JWT_SECRET` env with dev fallback), `authMiddleware` (parses Bearer → `req.user`), `requireRole('ADMIN')`.
- [ ] Create `server/src/routes/health.ts` — `GET /api/health` → `{status:"ok"}` (200, no auth).
- [ ] Create `server/src/routes/auth.ts` — `POST /api/auth/login` (zod-validated, verify password, return `{token,user}`); `POST /api/auth/signup` (first user gets ADMIN, subsequent get USER); `GET /api/auth/me`; logout handled client-side.
- [ ] Create `server/src/routes/recipes.ts` — CRUD behind `authMiddleware`; ownership check (USER limited to `ownerId===req.user.id`, ADMIN any); parse/serialize JSON fields.
- [ ] Create `server/src/routes/planner.ts` — `GET /api/planner?week=` (default current ISO week), `POST /api/planner` upsert `{week,day,recipeId}`, `DELETE /api/planner/:id`.
- [ ] Create `server/src/routes/admin.ts` — `GET /api/admin/recipes` behind `requireRole('ADMIN')` → all users' recipes grouped by owner (email + recipes); protect the `/admin` route group.
- [ ] Create `server/src/lib/config.ts` — `resolveConfig(key)`: read `process.env[key]` first; if equal to `PLACEHOLDER_CONFIGURE_IN_SETTINGS` or absent, read `SystemSetting` DB row; return null if neither set.
- [ ] Create admin settings endpoints — `GET /api/admin/settings` (list `postgresql` + `minio` keys with masked values + configured status) and `PATCH /api/admin/settings` (upsert key-value pairs, ADMIN required).
- [ ] Create `server/src/index.ts` — Express app: JSON middleware, CORS, mount API routers under `/api` first, serve `client/dist` static + `app.get('*')` SPA fallback (excluding `/api`), listen on `$PORT` (default 8080).

## ui_agent tasks
- [ ] Create `client/src/main.tsx` + `client/src/App.tsx` — `BrowserRouter` with routes `/login`, `/signup`, `/recipes`, `/recipes/:id`, `/planner`, `/admin`, `/admin/settings`, `*`→NotFound.
- [ ] Create `client/src/auth/AuthContext.tsx` — token/user state persisted in `localStorage`.
- [ ] Create `client/src/auth/RequireAuth.tsx` + `client/src/auth/RequireAdmin.tsx` — route guards redirecting unauthenticated users to `/login`; admin nav section visible only to admins.
- [ ] Create `client/src/pages/LoginPage.tsx` and `SignupPage.tsx` — email/password forms as part of main app.
- [ ] Create `client/src/pages/RecipesPage.tsx` — list + create form with empty/loading/error states; links to `/recipes/:id`.
- [ ] Create `client/src/pages/RecipeDetailPage.tsx` — read `:id` param, fetch on mount (deep-load safe), show/edit/delete full recipe.
- [ ] Create `client/src/pages/PlannerPage.tsx` — heading "This Week's Menu", seven day slots MON–SUN, read `?week=` (default current ISO week, update URL), assign recipe per day.
- [ ] Create `client/src/pages/AdminPage.tsx` — list all users' recipes from `/api/admin/recipes`.
- [ ] Create `client/src/pages/AdminSettingsPage.tsx` at `/admin/settings` — list `postgresql` and `minio` with configured/unconfigured badge + per-service credential form. (No third-party integrations to display.)
- [ ] Create `client/src/pages/NotFoundPage.tsx`; create `client/src/lib/week.ts` ISO-week helpers (current week, parse/format `2026-W29`); create `index.html`, `vite.config.ts` (dev proxy `/api`→`:4000`).

## service_agent tasks
- [ ] Create `client/src/api.ts` — fetch wrapper attaching `Authorization: Bearer <token>`, 401 → redirect `/login`.
- [ ] Wire recipes data layer — list/create/get/update/delete calls against `/api/recipes[/:id]` used by RecipesPage + RecipeDetailPage.
- [ ] Wire planner data layer — `GET /api/planner?week=`, `POST /api/planner`, `DELETE /api/planner/:id` used by PlannerPage.
- [ ] Wire auth data layer — login/signup/me calls feeding AuthContext.
- [ ] Wire admin data layer — `GET /api/admin/recipes` and settings `GET/PATCH /api/admin/settings` used by AdminPage + AdminSettingsPage.

## tester tasks
- [ ] Health: `curl /api/health` → `200 {"status":"ok"}`.
- [ ] Seed contract: run seed; assert stdout has both `SEED_CRED` lines + one `SEED_CREDS_JSON`; log in with each credential.
- [ ] Auth/roles: login as USER and ADMIN; USER cannot reach `/admin` (guard + API 403); ADMIN `/api/admin/recipes` returns all.
- [ ] Recipe CRUD happy path: create "Lemon Pasta" → appears in list → `/recipes/:id` shows full recipe.
- [ ] Deep links (fresh load): open `/recipes/:id`, `/planner?week=2026-W29`, `/admin`, `/login` in a new tab — each renders, no blank page/home redirect.
- [ ] Planner persistence: assign "Lemon Pasta" to Wednesday → reload → still present; `?week=` renders that week's entries from URL alone.
- [ ] Ownership edge case: USER A cannot GET/PUT USER B's recipe (403/404).
- [ ] Admin settings: ADMIN can view `/admin/settings`, see `postgresql`/`minio` configured status, and PATCH credentials; non-admin blocked.

## Open questions
- **Auth model vs. spec conflict:** `<auth_model>` is `full_auth` (requires `/signup` + first-signup-becomes-ADMIN), but the spec explicitly omits public signup ("seeded accounts only, no public signup") and satisfies "first user is ADMIN" via the seed. Tasks include signup per the auth-model rule — confirm whether to keep `/signup` + `POST /api/auth/signup` or drop them to match the spec's seed-only model.
- **Integrations:** `<spec_integrations>` contains a placeholder "None (no third-party APIs/SDKs; all self-contained)" sentinel, not a real integration; no integration client modules or credential fields were generated. Confirm there are genuinely no third-party integrations.
- **Deployments vs. spec datastore:** `<spec_deployments>` lists `postgresql` and `minio`, but the spec's data model uses SQLite via `DATABASE_URL` and declares no object storage. Confirm whether Postgres should replace SQLite and what `minio` (object storage) is used for (recipe images?), since neither is described in the spec's behaviour.
