# AnyRem Backend

NestJS API for Remember Anything: authentication, note memory graph, search, user settings, avatar catalog, and email/Telegram daily recap.

## Start

```powershell
Copy-Item .env.example .env
# Replace secrets; SETTINGS_ENCRYPTION_KEY: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
pnpm install
docker compose up -d postgres redis meilisearch
pnpm prisma:dev --name init
pnpm dev
pnpm dev:worker
```

API root: `http://localhost:3000/api`; health: `GET /api/health`.

## Swagger

Open `http://localhost:3000/api/docs` after starting the API.

1. Run `POST /api/auth/login`.
2. Copy `accessToken` from the response.
3. Click **Authorize** and paste the token.
4. Test protected endpoints directly from Swagger UI.

OpenAPI JSON: `http://localhost:3000/api/docs-json`.

## Avatar catalog

Put downloaded PNG files in `assets/avatars`, add entries to `manifest.json`, then run `pnpm avatars:import`:

```json
[{ "name": "Avatar 01", "file": "avatar-01.png", "style": "lorelei", "seed": "01", "sortOrder": 1 }]
```

Users can list/select catalog avatars. No upload route exists.

## Main routes

- `/api/auth/*`: register, verify, login, refresh, reset, Google OAuth.
- `/api/users/me`, `/api/avatars`, `/api/settings`.
- `/api/notes`, `/api/categories`, `/api/search`, `/api/dashboard`, `/api/graph`.
- `/api/recaps`: today, history, test, delivery status.

## Checks

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm search:reindex
```
