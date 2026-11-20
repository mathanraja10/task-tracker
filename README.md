# Team Task & Bug Tracker

A full-stack tracker for logging tasks and bugs, filtering them by status or priority, updating their status inline, and removing resolved items.

**Stack:** MongoDB · Express 5 · React 19 · Node.js · TypeScript (strict) · Zod · TanStack Query · Tailwind CSS 4 · Vitest + Supertest

---

## Project structure

```
├── server/                 Express REST API
│   └── src/
│       ├── config/         env validation (Zod), DB connection
│       ├── constants/      task enums & limits (single source of truth)
│       ├── models/         Mongoose schema
│       ├── validations/    Zod request schemas
│       ├── middlewares/    validation, ObjectId guard, error handling
│       ├── services/       data access / business logic
│       ├── controllers/    HTTP in/out only
│       ├── routes/         route wiring
│       ├── scripts/        sample-data seeder
│       └── tests/          integration tests (in-memory MongoDB)
│
├── client/                 React + Vite SPA (feature-based)
│   └── src/
│       ├── app/            providers, QueryClient, app shell
│       ├── components/ui/  reusable, feature-agnostic primitives
│       ├── features/tasks/ api hooks, components, schemas, types
│       ├── lib/            typed API client, form-error mapping, utils
│       └── config/         validated client env
│
├── .env.example            all environment variables (both apps)
└── README.md
```

`client/` and `server/` are independent packages, each with its own `package.json`, lockfile and `node_modules`.

---

## Architecture overview

```
Browser (React SPA, :5173)
  │  TanStack Query hooks ──► typed API client ──► Zod-parses every response
  │
  │  /api/*  (Vite dev proxy → :5000)
  ▼
Express app (:5000)
  helmet · cors · json body parser
  │
  ├─ routes/          map URL + method to a handler
  ├─ middlewares/     validate(body|query) with Zod · ObjectId guard (→ 404)
  ├─ controllers/     read the parsed request, shape the HTTP response
  ├─ services/        all data access and business rules
  └─ models/          Mongoose schema (constraints mirror the Zod rules)
  │
  └─ error-handler    one place that turns every error into { error: { message, details } }
  ▼
MongoDB
```

A request travels in one direction: it is validated before any controller runs, controllers never touch the database, and every failure (Zod, Mongoose, unknown id, unexpected exception) ends up in the central error handler, so all errors share one JSON shape.

On the client, server data is kept only in the TanStack Query cache. Active filters live in the URL query string, and each filter combination has its own cache entry. Mutations update the cache optimistically or invalidate it after a successful response.

---

## Prerequisites

- **Node.js 20.19+** (22 LTS recommended) and npm
- **MongoDB**: a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
  *(not needed for the test suite, which uses an in-memory MongoDB)*

> **Windows:** clone into a path **without `&`** (e.g. `C:\dev\team-task-bug-tracker`).
> npm runs scripts through `cmd.exe`, which treats `&` as a command separator, so every `npm run` command fails inside such a folder.

---

## Setup

```bash
git clone <repo-url> team-task-bug-tracker
cd team-task-bug-tracker

# 1. Server
cd server
npm install
cp .env.example .env        # then set MONGODB_URI

# 2. Client (in a second terminal)
cd client
npm install
cp .env.example .env        # defaults work as-is
```

### Environment variables

| File | Variable | Default | Description |
|---|---|---|---|
| `server/.env` | `MONGODB_URI` | — (**required**) | `mongodb://…` or `mongodb+srv://…` connection string |
| | `PORT` | `5000` | API port |
| | `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| | `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `client/.env` | `VITE_API_BASE_URL` | `/api` | API base URL used by the browser |
| | `API_PROXY_TARGET` | `http://localhost:5000` | Where the Vite dev/preview proxy forwards `/api` (must match server `PORT`) |

The server validates its environment at startup and exits with a clear message if anything is missing or malformed.

---

## Running the app

Use two terminals:

```bash
# Terminal 1 — API on http://localhost:5000
cd server
npm run dev

# Terminal 2 — client on http://localhost:5173
cd client
npm run dev
```

Open **http://localhost:5173**. Health check: http://localhost:5000/api/health

### Sample data (optional)

```bash
cd server
npm run seed              # inserts 9 sample tasks, only if the collection is empty
npm run seed -- --reset   # deletes ALL tasks first, then re-seeds
```

The seeder validates its data with the same Zod schema as the API and refuses to run when `NODE_ENV=production`.

### Production build

```bash
cd server && npm run build && npm start          # compiled API from dist/
cd client && npm run build && npm run preview    # static build on :4173 (proxies /api)
```

---

## Testing & quality checks

```bash
cd server
npm test            # 27 integration tests (Vitest + Supertest)
npm run typecheck
npm run lint
npm run build

cd ../client
npm run typecheck
npm run lint
npm run build
```

Tests run against **mongodb-memory-server**, so no database setup is needed and your real data is never touched. Each test file gets an isolated database. The first run downloads a MongoDB binary (several hundred MB on Windows); later runs use the cache and finish in a few seconds.

**Coverage includes** every case required by the brief, plus edge cases:

- `POST` → `201` with saved fields and defaults; `400` for missing / short / long / whitespace-only title, long description, invalid enums, malformed JSON
- `PATCH` → status and priority updates; `404` for unknown **and** malformed ids; `400` for empty body or disallowed fields
- `GET` → status, priority and combined filters; newest-first ordering; `400` for invalid filter values
- `DELETE` → confirmation response; `404` for unknown and malformed ids

There is no root `package.json`, so run each command inside `server/` or `client/`.

---

## Debugging in VS Code

`.vscode/launch.json` contains ready-made configurations (Run and Debug panel, <kbd>F5</kbd>):

- **Server: dev (watch)**: debugs `npm run dev` and re-attaches after every hot restart
- **Server: test current file** / **Server: test all**: debugs Vitest with the timeout raised so breakpoints don't fail tests
- **Server: seed**: debugs the seeder
- **Client: Chrome / Edge**: starts Vite, then opens the browser with breakpoints mapped to `client/src`
- **Full stack (server + Chrome)**: starts both together and stops them together

---

## API reference

Base URL: `/api`

| Method | Endpoint | Body / Query | Success | Errors |
|---|---|---|---|---|
| `GET` | `/tasks` | `?status=todo\|in_progress\|done` `&priority=low\|medium\|high` | `200` | `400` invalid filter |
| `POST` | `/tasks` | `{ title, description?, status?, priority? }` | `201` + `Location` | `400` validation |
| `PATCH` | `/tasks/:id` | `{ status?, priority? }` (at least one) | `200` | `400` validation · `404` |
| `DELETE` | `/tasks/:id` | — | `200` | `404` |
| `GET` | `/health` | — | `200` | — |

**Task model:** `title` (3–100 chars, required) · `description` (≤ 500 chars) · `status` (default `todo`) · `priority` (default `medium`) · `createdAt` / `updatedAt` (automatic)

**Response contract**

```jsonc
// Success
{ "data": { "id": "…", "title": "…", "status": "todo", "priority": "medium", "createdAt": "…", "updatedAt": "…" } }

// Delete
{ "message": "Task deleted successfully", "data": { "id": "…" } }

// Error
{ "error": { "message": "Validation failed", "details": [{ "field": "title", "message": "Title must be at least 3 characters" }] } }
```

---

## Key design decisions

- **Layered backend.** Routes → controllers → services → models; controllers deal only with HTTP and services only with data.
- **Validation at the boundary.** Zod parses every body and query string before it reaches a controller, and parsed values replace the raw input (trimmed, with defaults applied). Mongoose constraints mirror the Zod rules as a second line of defence.
- **Malformed ObjectIds return `404`, not `400`**, as the brief requires. A route guard rejects them before they reach the database.
- **End-to-end type safety.** Strict TypeScript and zero `any` (enforced by ESLint `no-explicit-any`). The client validates every API response with Zod at runtime, so a contract mismatch shows up as a clear error instead of `undefined` in the UI.
- **Server state via TanStack Query.** Filters are sent to the server and stored in the URL, so filtered views can be shared and survive a reload. Status changes are **optimistic** and roll back on failure. Deletes are confirmed with the server before the card disappears, so any error appears on the card itself.
- **Form errors from either side.** The client mirrors the server's Zod rules for instant feedback. If the server still returns `400`, its `details` are mapped onto the matching form fields.
- **Accessibility.** Labelled controls, `aria-invalid` and `aria-describedby` wiring, live regions for status messages, and status and priority shown with text or icons as well as colour.

---

## Trade-offs (3-hour time box)

1. **Types are duplicated instead of shared.** The task enums, limits and types are defined in both `server/` and `client/` rather than in a shared package. This keeps the two packages independent and the tooling simple, but the definitions can drift apart. That risk is reduced, but not removed, by the client's runtime Zod validation of API responses, which fails loudly on any mismatch. With more time I would publish a shared `@tracker/contracts` package, or generate the client types from an OpenAPI spec.
2. **No pagination, authentication or client tests.** `GET /tasks` returns every matching task, which is fine at team scale but would need cursor pagination for large datasets. There are no users or authentication, as the brief doesn't define them. Automated tests cover the API thoroughly; the UI was verified manually in a browser, and component tests (Vitest + Testing Library) would be the next addition.
3. **Two independent packages with no root orchestrator.** The client and server each have their own install, lockfile and scripts, and there is no root `npm run dev` or `npm test`. This avoids npm-workspace hoisting problems and lets each side be deployed on its own. The cost is two `npm install`s and two terminals during development. A small root script (or Docker Compose) to start both would be the first convenience to add.

---

## Possible next steps

- Cursor-based pagination and text search
- Authentication, task assignees and an activity history
- Client component and end-to-end tests (Testing Library, Playwright)
- Docker Compose for one-command local setup; CI running typecheck, lint and tests
