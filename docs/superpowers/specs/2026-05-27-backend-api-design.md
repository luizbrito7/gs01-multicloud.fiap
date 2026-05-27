# Task 2 — Backend API Design

Refinement of the Task 2 section of `SPEC.md`. Use this doc as the source of truth for implementation; `SPEC.md` Task 2 is the higher-level brief.

## Goal

Single Node.js/Express service deployable to both EKS and AKS. Exposes a CRUD API for "subjects" backed by CockroachDB Serverless. Returns the cloud it's running on (`aws` | `azure`) in every response, so the frontend can show which backend served the request.

## Architecture

Single process. One Express app. One Postgres connection pool. No abstractions beyond what the SPEC mandates.

```
HTTP request
  ↓
Express + cors
  ↓
Route handler (try/catch)
  ↓
pg Pool → CockroachDB
  ↓
JSON response { data, cloud }
```

Two files for application logic plus standard packaging files:

- `server.js` — Express setup, routes inline, startup, graceful shutdown
- `db.js` — exports `pool` (pg Pool with SSL) and `seed()` (idempotent)
- `package.json`, `Dockerfile`, `README.md`

## Endpoints

All responses include `cloud: process.env.CLOUD_NAME || "unknown"`.

| Method | Path                  | Status (success) | Body validation | Notes |
|--------|-----------------------|------------------|------------------|-------|
| GET    | `/health`             | 200              | —                | `{ ok: true, cloud }` for k8s probes |
| GET    | `/api/subjects`       | 200              | —                | Ordered by `created_at ASC` |
| POST   | `/api/subjects`       | 201              | `name`: non-empty string after trim | Returns inserted row |
| PATCH  | `/api/subjects/:id`   | 200              | `:id` must exist | Toggles `completed` (`UPDATE ... SET completed = NOT completed`) |
| DELETE | `/api/subjects/:id`   | 200              | `:id` must exist | Returns `{ cloud }` only |

### Error responses

| Code | Trigger | Body |
|------|---------|------|
| 400  | `POST` with missing/empty `name` | `{ error: "name is required", cloud }` |
| 404  | `PATCH`/`DELETE` with id not found (rowCount === 0) | `{ error: "not found", cloud }` |
| 500  | DB failure caught by handler | `{ error: "internal error", cloud }` (log full error via `console.error`) |

No central error middleware — each handler wraps its body in try/catch.

## Schema and seed (`db.js`)

```sql
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

`seed()` runs once at startup:

1. `SELECT COUNT(*) FROM subjects`
2. If `0`, `INSERT` the 8 subjects from SPEC in order.
3. Log `[db] seeded N rows` or `[db] table already populated`.

Pool config:

```js
new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
})
```

## Startup sequence (`server.js`)

1. Validate `DATABASE_URL` is set; otherwise `console.error` and `process.exit(1)`.
2. Apply CORS: `cors({ origin: process.env.FRONTEND_ORIGIN || "*" })`.
3. Apply `express.json()`.
4. Register routes.
5. Run `await ensureSchema()` then `await seed()`.
6. `app.listen(PORT)` and log `[server] listening on :PORT cloud=CLOUD_NAME`.

## Graceful shutdown

On `SIGTERM` (k8s eviction):

1. Stop accepting new connections (`server.close()`).
2. `await pool.end()`.
3. `process.exit(0)`.

Timeout: 10s hard exit if shutdown hangs.

## Env vars

| Name             | Default     | Required | Purpose |
|------------------|-------------|----------|---------|
| `DATABASE_URL`   | —           | yes      | CockroachDB connection string |
| `CLOUD_NAME`     | `"unknown"` | no       | Echoed in every response |
| `FRONTEND_ORIGIN`| `"*"`       | no       | CORS origin |
| `PORT`           | `3000`      | no       | Listen port |

## Dockerfile

Per SPEC. Node 20 alpine, `npm ci --only=production`, copy source, `CMD ["node", "server.js"]`.

## Testing

Out of scope per user decision. Manual validation via `curl` after deploy:

```bash
curl https://api-rm562192.<zone>/health
curl https://api-rm562192.<zone>/api/subjects
curl -X POST -H 'content-type: application/json' -d '{"name":"Test"}' .../api/subjects
```

## README content (`app/backend/README.md`)

- Run local: `npm install`, set env vars, `node server.js`
- Build image: `docker build -t ghcr.io/luizbrito7/gs01-multicloud.fiap/gs01-api:v1 .`
- Endpoint table (copy from this doc)
- Env vars table (copy from this doc)

## Out of scope

- Authentication / authorization
- Rate limiting
- Request logging beyond `console.log`/`console.error`
- Migrations beyond `CREATE TABLE IF NOT EXISTS`
- Metrics, tracing
- Automated tests
