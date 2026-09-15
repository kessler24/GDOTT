# TODO

Tracks what's left after the initial repo scaffold (`web/` frontend + `src/` backend
skeleton, see [proposals/proposal.md](proposals/proposal.md) and
[proposals/repo_organization.md](proposals/repo_organization.md)). Two kinds of item: things
only a human can do (accounts, dashboards, secrets), and things that are code/config we haven't
written yet.

## Manual setup (accounts, dashboards, secrets)

- [ ] Create the Vercel project, connect this repo, and set **Root Directory** to `web` in the
  project settings (monorepo layout — Vercel won't auto-detect this).
- [ ] Get an Anthropic API key and set `ANTHROPIC_API_KEY` — locally in `.env` (backend) and in
  whatever hosts `recipe_api` in production. Never in a `NEXT_PUBLIC_*` var.
- [ ] Set a monthly spend cap and budget alert in the Anthropic Console — proposal §7 wants this
  done *before* the first deploy, not after.
- [ ] Pick backend hosting (Fly.io or Render — still open, see proposal §6) and create the
  account/app.
- [ ] Copy `.env.example` → `.env` (backend) and `web/.env.example` → `web/.env.local`
  (frontend), filling in real values.
- [ ] Run `uv sync` to create the Python venv and generate `uv.lock`.
- [X] Run `npm install` (or your package manager of choice) inside `web/` to generate the
  lockfile.
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` in Vercel's project env vars once the backend has a real
  deployed URL.
- [ ] Decide an auth provider (Supabase Auth vs. Clerk) — needed before accounts, post-MVP.

## Not yet implemented

- [ ] `src/recipe_core/models.py` — the `Recipe`/`Ingredient`/`Step` schema. Per
  `repo_organization.md`'s setup order, this is step 1 of real code, before anything else.
- [ ] `web/app/layout.tsx`, `web/app/page.tsx`, `web/app/globals.css` — no app code exists yet,
  the folders are placeholders.
- [ ] `src/recipe_api` FastAPI app itself (`main.py`, `POST /import`, `POST /edit`, CORS config
  reading `CORS_ALLOWED_ORIGINS`).
- [ ] `tests/` skeleton (`unit/`, `golden/`, `fixtures/`, `live/`) plus one trivial passing test
  to prove the harness works.
- [ ] `evals/` directory (model-dependent, run manually, never in CI).
- [ ] `.github/workflows/ci.yml` — lint + typecheck + offline tests on every push.
- [ ] `.github/workflows/live.yml` — network-dependent tests, scheduled weekly.
- [ ] `.pre-commit-config.yaml` — ruff, a large-file guard, a secret scanner
  (`detect-secrets` or `gitleaks`).
- [ ] Rate limiting and per-user quotas (proposal §7, items 5–6) — needs the backend and, for
  distributed rate limiting, Upstash Redis.
- [ ] Postgres setup (Supabase or Neon) — post-MVP, needed once accounts/history land.
