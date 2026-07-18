# Test Specification

> ⚠️ **Warning — `surface.json` is stale.** The committed `.pipeline/surface.json`
> only lists 2 routes (`GET /api/health`, `POST /api/auth/login`) and generic
> `App`/`Home` components, and is self-described as an auto-generated placeholder
> ("overwritten by the scaffolder agent"). It does **not** reflect the approved
> spec's surface. This test spec therefore derives the API surface from
> `requirements/spec.md` (the approved product spec), which is authoritative.
>
> ⚠️ **Scope note — `tasks.md` includes unresolved extras.** `tasks.md` lists
> `/signup`, `/logout`, and `/admin/settings` (+ `postgresql`/`minio` config)
> under an unresolved "Open questions" section. The approved spec explicitly
> states *"seeded accounts only, no public signup"* and describes no admin
> settings surface. These are treated as **Out of scope** below until the open
> questions are resolved.

## Coverage summary
- Total cases: 58
- API endpoints covered: 12 / 12 (derived from spec; `surface.json` lists only 2 stale placeholder routes)
- User journeys covered: 8

## API tests

All routes are prefixed `/api`. Unless stated, protected routes require a valid
`Authorization: Bearer <token>`. Tokens are obtained via `POST /api/auth/login`
using the seeded credentials emitted on `SEED_CRED*` lines.

### `GET /api/health`
- **Happy path**: no auth, no body → `200` with exact body `{"status":"ok"}`.
- **Validation failures**: n/a (no inputs).
- **Auth failures**: reachable without a token → still `200` (must not be behind `authMiddleware`).
- **Idempotency / edge cases**: repeated calls return identical `200 {"status":"ok"}`; must resolve before the SPA `*` fallback (i.e. returns JSON, not `index.html`).

### `POST /api/auth/login`
- **Happy path**: `{email:"admin@demo.test", password:<seed pw>}` → `200` with body shape `{token:<non-empty string>, user:{id, email:"admin@demo.test", role:"ADMIN"}}`. Same for the seeded USER → `role:"USER"`. No `passwordHash` in the response.
- **Validation failures**: missing `email` → `400`; missing `password` → `400`; malformed (non-string / non-email `email`) → `400` (zod). Body must never echo a token on a `400`.
- **Auth failures**: unknown email → `401`; correct email + wrong password → `401`. Error message must not disclose which field was wrong.
- **Idempotency / edge cases**: logging in twice yields two independently valid tokens; the returned token verifies against `JWT_SECRET` and carries the user id + role.

### `GET /api/auth/me`
- **Happy path**: valid ADMIN token → `200` `{id, email, role:"ADMIN"}`; valid USER token → `role:"USER"`. No `passwordHash`.
- **Validation failures**: n/a.
- **Auth failures**: no `Authorization` header → `401`; malformed header (not `Bearer <x>`) → `401`; expired/garbage/tampered token → `401`.
- **Idempotency / edge cases**: identity returned matches the token used to log in.

### `GET /api/recipes`
- **Happy path**: authed USER → `200` array of **only that user's** recipes; each item has `{id, title, ingredients, steps, servings, tags, ownerId}` with `ingredients`/`steps`/`tags` returned as **parsed JSON (arrays)**, not raw JSON strings.
- **Validation failures**: n/a.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: a USER with no recipes → `200 []`; USER A's list never contains USER B's recipes.

### `POST /api/recipes`
- **Happy path**: authed USER posts `{title:"Lemon Pasta", ingredients:["pasta","lemon"], steps:["boil","toss"], servings:2, tags:["quick"]}` → `201` (or `200`) with created recipe including a new `id`, `ownerId === req.user.id`, and JSON fields round-tripped as arrays.
- **Validation failures**: missing `title` → `400`; `servings` non-integer / negative → `400`; wrong types for `ingredients`/`steps`/`tags` → `400` (zod).
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: `ownerId` is forced to the authenticated user even if a different `ownerId` is supplied in the body (no owner spoofing).

### `GET /api/recipes/:id`
- **Happy path**: owner requests own recipe → `200` full recipe with parsed JSON fields (supports deep-load of `/recipes/:id`).
- **Validation failures**: non-existent `id` → `404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: USER A requests USER B's recipe → `403` or `404` (must not leak the recipe). ADMIN requests any user's recipe → `200`.

### `PUT /api/recipes/:id`
- **Happy path**: owner updates `{title:"Lemon Pasta (v2)", servings:4}` → `200` with updated fields persisted; `updatedAt` advances.
- **Validation failures**: invalid `servings`/types → `400`; non-existent `id` → `404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: USER A updates USER B's recipe → `403`/`404` and B's recipe is unchanged. ADMIN may update any recipe. Re-sending the same update is safe (no duplicate rows).

### `DELETE /api/recipes/:id`
- **Happy path**: owner deletes own recipe → `200`/`204`; subsequent `GET /:id` → `404`; recipe removed from `GET /api/recipes`.
- **Validation failures**: non-existent `id` → `404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: USER A deletes USER B's recipe → `403`/`404` and B's recipe still exists. ADMIN may delete any. Deleting a recipe referenced by a `PlanEntry` behaves predictably (cascade or blocked — assert no orphaned/500 state).

### `GET /api/planner`
- **Happy path**: authed USER with `?week=2026-W29` → `200` array of that user's entries for that week, each `{id, week:"2026-W29", day, recipeId, ...}`; joined/expandable to the recipe. `day` ∈ {MON,TUE,WED,THU,FRI,SAT,SUN}.
- **Validation failures**: malformed `week` (e.g. `2026-W99`, `garbage`) → `400` (or documented normalization); assert one behavior consistently.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: omitting `?week=` → `200` for the **current ISO week** (computed via `lib/week.ts`); returns only the requesting user's entries, never another user's.

### `POST /api/planner`
- **Happy path**: authed USER posts `{week:"2026-W29", day:"WED", recipeId:<own recipe id>}` → `200`/`201` upserted assignment for that `(user, week, day)`.
- **Validation failures**: missing `week`/`day`/`recipeId` → `400`; invalid `day` (not MON–SUN) → `400`; `recipeId` not owned by the user / non-existent → `403`/`404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: posting the same `(week, day)` again **upserts** (updates in place) rather than creating a duplicate — assert exactly one entry per `(userId, week, day)` afterward. Assignment persists across a fresh `GET` (reload-safe).

### `DELETE /api/planner/:id`
- **Happy path**: owner deletes own plan entry → `200`/`204`; entry gone from subsequent `GET /api/planner?week=`.
- **Validation failures**: non-existent `id` → `404`.
- **Auth failures**: no token → `401`.
- **Idempotency / edge cases**: USER A deletes USER B's plan entry → `403`/`404`, B's entry intact.

### `GET /api/admin/recipes`
- **Happy path**: ADMIN token → `200` all users' recipes **grouped by owner**, each group `{email, recipes:[...]}`; includes recipes from more than one seeded user.
- **Validation failures**: n/a.
- **Auth failures**: no token → `401`; **valid USER token → `403`** (role gate via `requireRole('ADMIN')`).
- **Idempotency / edge cases**: newly created recipe by any user appears in the ADMIN listing.

## UI / journey tests

### Journey: Login
- **Steps**: navigate to `/login`; type seeded email + password; submit.
- **Expected outcomes**: token stored in `localStorage`; redirect to `/recipes` (or intended route); authed nav visible.
- **Negative path**: wrong password → inline error shown, no redirect, no token stored; the form remains usable.

### Journey: Auth guards & role redirects
- **Steps**: while logged out, attempt to visit `/recipes`, `/recipes/:id`, `/planner`, `/admin`.
- **Expected outcomes**: each redirects to `/login` (RequireAuth). After logging in as USER, `/recipes`/`/planner` render.
- **Negative path**: logged-in USER visits `/admin` → blocked by RequireAdmin (redirect to `/login` or a not-authorized view), never renders admin data; ADMIN visits `/admin` → renders.

### Journey: Recipes list & create
- **Steps**: on `/recipes`, submit the create form with title "Lemon Pasta" + ingredients/steps/servings/tags.
- **Expected outcomes**: "Lemon Pasta" appears in the list; the list row links to `/recipes/:id`; loading and empty states are handled (empty list shows an empty-state, not an error).
- **Negative path**: submitting with an empty title shows a validation message; a server `4xx` surfaces an error without losing entered input.

### Journey: Recipe detail / edit / delete (deep-load safe)
- **Steps**: open `/recipes/:id` directly (fresh load / new tab); view full recipe; edit a field and save; then delete.
- **Expected outcomes**: page fetches `/api/recipes/:id` on mount and renders full recipe (no dependence on prior list navigation); edit persists and re-renders; delete returns to `/recipes` and the recipe is gone.
- **Negative path**: opening another user's `/recipes/:id` → shows not-found/forbidden, not the recipe; opening a non-existent id → not-found view.

### Journey: Planner — "This Week's Menu"
- **Steps**: visit `/planner`; confirm heading **"This Week's Menu"** and seven slots MON–SUN; assign "Lemon Pasta" to Wednesday.
- **Expected outcomes**: assignment shows under WED; `POST /api/planner` called; **reloading the page keeps the WED assignment** (persistence). Default view uses the current ISO week and reflects it in the URL.
- **Negative path**: assigning fails on server error → user-visible error, slot not falsely shown as filled.

### Journey: Planner week addressing via URL
- **Steps**: open `/planner?week=2026-W29` directly.
- **Expected outcomes**: renders that specific week's entries derived **from the URL alone** (no prior in-app navigation); changing the week updates the `?week=` param and the displayed entries.
- **Negative path**: an out-of-range/garbage `?week=` value is handled gracefully (falls back to current week or shows a clear message), never a blank page.

### Journey: Admin — all users' recipes
- **Steps**: log in as ADMIN; visit `/admin`.
- **Expected outcomes**: `/api/admin/recipes` fetched; recipes from multiple users listed, grouped by owner email.
- **Negative path**: USER navigating to `/admin` is blocked (guard) and the API returns `403` if called directly.

### Journey: Deep links & SPA fallback (fresh load)
- **Steps**: in a new tab, directly open each of `/recipes/:id`, `/planner?week=2026-W29`, `/admin`, `/login`.
- **Expected outcomes**: server returns `index.html` for non-`/api` paths so each route renders client-side — no blank page, no forced redirect to home; guarded routes fall through to `/login` when unauthenticated (guard-then-login), not a 404.
- **Negative path**: an unknown client path (e.g. `/totally-unknown`) renders the NotFound page; a `/api/*` path is **never** shadowed by the SPA fallback (returns JSON/`4xx`, not `index.html`).

## Data integrity tests
- **Seed contract**: running the seed emits exactly one `SEED_CRED ADMIN admin@demo.test <pw>` line, one `SEED_CRED USER user@demo.test <pw>` line, and one `SEED_CREDS_JSON [...]` line; both emitted credentials successfully log in.
- **Seed idempotency**: running the seed twice does not create duplicate users (upsert); `email` remains unique; no crash on redeploy.
- **Password storage**: `User.passwordHash` is a bcrypt hash, never plaintext; never returned by any API.
- **Recipe ownership invariant**: every `Recipe.ownerId` references an existing `User`; a created recipe's `ownerId` equals the creating user's id.
- **JSON field integrity**: `ingredients`/`steps`/`tags` persist as JSON strings in SQLite and round-trip to arrays via the API without corruption.
- **PlanEntry uniqueness**: at most one `PlanEntry` per `(userId, week, day)` after upserts; `week` matches the `YYYY-Www` format; `day` ∈ MON..SUN; `recipeId` references an existing recipe owned by that user.
- **Referential cleanup**: deleting a recipe leaves no dangling `PlanEntry.recipeId` (cascade or blocked delete — one consistent behavior, no 500s / orphans).
- **ISO-week correctness**: `lib/week.ts` current-week and parse/format `2026-W29` helpers are correct across year boundaries (no off-by-one week).

## Out of scope
- **`POST /api/auth/signup` and `/signup` page** — the approved spec states "seeded accounts only, no public signup"; listed in `tasks.md` only under an unresolved open question. Not tested until the auth-model conflict is resolved.
- **`POST /api/auth/logout` endpoint** — spec treats logout as a client-side token clear; no server endpoint to test (the client `localStorage` clear is exercised implicitly via re-auth).
- **`/admin/settings`, `GET/PATCH /api/admin/settings`, `SystemSetting`, `postgresql`/`minio` config** — not described in the approved spec (spec uses SQLite via `DATABASE_URL` and declares no object storage); flagged as an open question in `tasks.md`.
- **Third-party integrations** — spec declares "None (all self-contained)"; nothing to test.
- **Dockerfile / container runtime & deploy** (`prisma migrate deploy`, static-copy paths, `$PORT` binding) — infrastructure behavior; validated at deploy time, not by this functional test spec, beyond the health check and SPA-fallback assertions above.
- **CORS specifics and dev proxy** (`vite.config.ts` `/api`→`:4000`) — dev tooling, not product behavior.

Wrote .pipeline/test_spec.md (58 cases across 12 endpoints / 8 journeys).
