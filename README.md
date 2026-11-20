# Team Task & Bug Tracker

A full-stack tracker for logging tasks and bugs, filtering them by status or priority, updating their status inline, and removing resolved items.

**Stack:** MongoDB · Express 5 · React 19 · Node.js · TypeScript (strict) · Zod · TanStack Query · Tailwind CSS 4 · Vitest + Supertest

---

## Project structure

```text
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

```text
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
npm test            # 47 integration tests (Vitest + Supertest)
npm run typecheck
npm run lint
npm run build

cd ../client
npm run typecheck
npm run lint
npm run build
```

Tests run against **mongodb-memory-server**, so no database setup is needed and your real data is never touched. Each test file gets an isolated database. The first run downloads a MongoDB binary; later runs use the cache and finish in a few seconds.

**Coverage includes** every case required by the brief, plus edge cases:

- `POST` → `201` with saved fields and defaults; `400` for missing / short / long / whitespace-only title, long description, invalid enums, malformed JSON
- `PATCH` → status and priority updates; `404` for unknown **and** malformed ids; `400` for empty body or disallowed fields
- `GET` → status, priority and combined filters; newest-first ordering; `400` for invalid filter values
- Pagination → walks every page with no gaps or duplicates (including tasks sharing a `createdAt`), stays stable when tasks are added mid-pagination, applies filters on every page; `400` for bad `limit` or a tampered `cursor`
- Search → case-insensitive partial matches on title or description, regex metacharacters matched literally, combined with filters and pagination; `400` over 100 characters
- `DELETE` → confirmation response; `404` for unknown and malformed ids

---

## API reference

Base URL: `/api`

| Method | Endpoint | Body / Query | Success | Errors |
|---|---|---|---|---|
| `GET` | `/tasks` | `?status=todo\|in_progress\|done` `&priority=low\|medium\|high` `&q=` `&limit=1–100` (default 20) `&cursor=` | `200` | `400` invalid filter, limit or cursor |
| `POST` | `/tasks` | `{ title, description?, status?, priority? }` | `201` + `Location` | `400` validation |
| `PATCH` | `/tasks/:id` | `{ status?, priority? }` (at least one) | `200` | `400` validation · `404` |
| `DELETE` | `/tasks/:id` | — | `200` | `404` |
| `GET` | `/health` | — | `200` | — |

**Task model:** `title` (3–100 chars, required) · `description` (≤ 500 chars) · `status` (default `todo`) · `priority` (default `medium`) · `createdAt` / `updatedAt` (automatic)

**Response contract**

```jsonc
// Success
{ "data": { "id": "…", "title": "…", "status": "todo", "priority": "medium", "createdAt": "…", "updatedAt": "…" } }

// List (one page, newest first). Pass meta.nextCursor back as ?cursor= with the
// same filters for the next page; it is null on the last page.
{ "data": [ /* tasks */ ], "meta": { "nextCursor": "eyJjcmVhdGVkQXQiOi…" } }

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
- **Cursor (keyset) pagination.** Each page continues strictly after the last task of the previous one in `createdAt DESC, _id DESC` order. Unlike `skip`/offset, cost stays constant however deep you page, and tasks created or deleted between requests never cause skipped or repeated items. The cursor is an opaque base64url token, validated on the way in, so a tampered cursor is a `400`, not a crash. The client uses `useInfiniteQuery` with a "Load more" button; optimistic updates and deletes edit every loaded page in place.
- **Substring search.** `?q=` is an escaped, case-insensitive regex over title and description, so partial words match ("logi" finds "login") and user input can never act as a pattern. Input is debounced (300 ms) on the client and stored in the URL with the other filters.
- **Form errors from either side.** The client mirrors the server's Zod rules for instant feedback. If the server still returns `400`, its `details` are mapped onto the matching form fields.
- **Accessibility.** Labelled controls, `aria-invalid` and `aria-describedby` wiring, live regions for status messages, and status and priority shown with text or icons as well as colour.

