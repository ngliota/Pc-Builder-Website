<!-- .github/copilot-instructions.md -->
# Repository-specific instructions for AI coding agents

This file contains concise, actionable guidance to help an AI agent become productive in this repository.

- **Big picture:** Frontend is a Vite + React app in the repository root (`src/`). Backend is an Express + Sequelize MySQL service under `backend/`. The frontend communicates with the backend over JSON REST endpoints under `/api/*` (see `backend/config/server.js`).

- **Start / dev commands:**
  - Frontend dev: run `npm install` at repo root then `npm run dev` (runs `vite`).
  - Backend dev (Windows PowerShell): `cd backend; npm install; npm run dev` (runs `node config/server.js`).
  - Production backend: on PowerShell set env then run: `$env:NODE_ENV='production'; node config/server.js` (the `start` script in `backend/package.json` uses POSIX env syntax which does not work on Windows shells).
  - Useful seeding scripts (root `package.json`): `npm run seed:products`, `npm run seed:products:wide`, `npm run clean:products:synthetic` — these execute `backend/scripts/*.js`.

- **Environment files:** Backend loads env files from several candidate locations in this order: `./.env.local`, `./.env`, `backend/.env.local`, `backend/.env`. See `backend/config/server.js` and `backend/config/database.js`. Important env vars:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — required for DB connection (server exits if missing).
  - `DB_SYNC`, `DB_FORCE_SYNC` — when `DB_SYNC=true` Sequelize will sync models; `DB_FORCE_SYNC=true` forces drop+recreate.
  - `JWT_SECRET` — used by authentication middleware in `backend/middleware/AuthMiddleware.js`.
  - `RECS_USE_LLM`, `LLM_ENDPOINT`, `LLM_MODEL` — recommendation engine LLM integration configuration (see `backend/controllers/recommendationController.js`).

- **Architecture and patterns:**
  - Routes are defined under `backend/routes/*.js` and import controller functions from `backend/controllers/*.js` (example: `productRoutes.js` -> `productController.js`). Follow the function-per-action pattern used there.
  - Models live in `backend/models/` and are Sequelize models. `backend/config/database.js` exports the configured `Sequelize` instance.
  - Middleware such as JWT verification lives in `backend/middleware/` and is applied per-route (e.g., `verifyAdminToken`).
  - Uploads are served via a helper `serveStaticUploads` from `backend/middleware/UploadMiddleware.js`; uploaded files are under `backend/uploads/` and `public/` for static assets.

- **Logging & request handling:** Server logs each request and trims string fields on incoming JSON bodies (see `backend/config/server.js`). Keep patches minimal when changing middleware order.

- **Code style / conventions:**
  - Project uses ESM modules (`type: "module"` in `package.json`). Use `import`/`export` instead of `require`/`module.exports`.
  - Keep controllers thin: perform request parsing/validation in controllers or express-validator, business logic in services/models.
  - Avoid changing global CORS origins; frontend dev uses `http://localhost:5173` (whitelisted in `server.js`). If adding a new dev host, update CORS list.

- **Testing & CI notes:** There are no unit tests present. Do not add a test harness unless requested — focus on local dev scripts and seeding scripts first.

- **Integration points to watch:**
  - MySQL via Sequelize (`mysql2`), configured in `backend/config/database.js`.
  - JWT auth across `middleware/AuthMiddleware.js` and routes that require `verifyAdminToken` or `verifyUserToken`.
  - Recommendation engine can call an LLM via `LLM_ENDPOINT` when `RECS_USE_LLM=true`.

- **When modifying server start or env handling:**
  - Note the repo intentionally looks for `.env.local` in root then `backend/` — prefer editing the root `.env.local` (exists in workspace) for dev overrides.
  - Be conservative with `DB_SYNC=true` in development; use `DB_FORCE_SYNC` only when intentionally resetting schema.

If anything above is unclear or you want more examples (specific controllers, route flows, or a recommended PR checklist), tell me which area to expand and I will update this file.
