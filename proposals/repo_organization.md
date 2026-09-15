# Repo Organization — Proposal

**Status:** Draft / pre-build
**Author:** Molly Kessler
**Last updated:** 2026-09-02

---

## 1. The Organizing Principle

One rule drives the entire layout:

> **`recipe_core` is a plain Python library. It imports no LLM SDK, no web framework, and
> nothing from any surface package.**

Everything else follows. Patch operations, validation, Pint conversion, and rescaling are pure
functions over a Pydantic document. They are the project. Surfaces — an HTTP API, an MCP server,
a CLI — are thin adapters that translate a request into a call on that library and translate the
result back.

**Parsing is the deliberate exception, and it gets its own package.** Since a model does the
extraction, parsing can't live inside a model-free core. `recipe_parsing` depends on
`recipe_core` and on a model client; `recipe_core` defines a `RecipeParser` protocol and never
imports the implementation. That keeps the dependency pointing one way and means the operations
layer can still be tested with no model, no network, and no keys — which is most of the codebase.

This is worth enforcing rather than merely intending, because it buys three things:

- **Tests run offline, free, and fast.** The bulk of the codebase can be exercised with no
  network and no model, which is what makes a real CI suite affordable.
- **Surfaces are cheap to add.** Both proposals in this directory share build steps 1–3 exactly.
  If the core stays clean, the second surface is a new directory, not a restructure.
- **The logic stays testable as it grows.** The moment parsing logic lives inside a request
  handler, it can only be tested by making a request.

---

## 2. Directory Layout

```text
GDOTT/
├── README.md                    # what it is, how to run it, eval results table
├── pyproject.toml               # one project, uv-managed, surfaces as extras
├── uv.lock
├── .gitignore
├── .env.example                 # every var the app reads, with dummy values
├── .pre-commit-config.yaml
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # lint + typecheck + offline tests, every push
│       └── live.yml             # network-dependent tests, scheduled weekly
│
├── proposals/                   # design docs (this directory)
│
├── src/
│   ├── recipe_core/             # ← the library. no model, no web, no MCP.
│   │   ├── models.py            # Recipe, Ingredient, Step — the contract
│   │   ├── protocols.py         # RecipeParser protocol — the seam parsing plugs into
│   │   ├── operations/
│   │   │   ├── ops.py           # operation definitions + JSON schemas
│   │   │   ├── apply.py         # transactional application
│   │   │   ├── validate.py      # batch validation
│   │   │   └── log.py           # operation log → undo, revision history
│   │   ├── units/
│   │   │   ├── convert.py       # Pint
│   │   │   ├── density.py       # count/volume → weight lookup
│   │   │   ├── rescale.py       # anchored rescaling + nonlinearity flags
│   │   │   └── data/
│   │   │       └── density.csv  # USDA-derived, shipped as package data
│   │   └── export.py
│   │
│   ├── recipe_parsing/          # ← import pipeline. the one package that calls a model.
│   │   ├── fetch.py             # URL fetch, size caps, SSRF guard
│   │   ├── reduce.py            # trafilatura / pdfplumber — boilerplate removal
│   │   ├── extract.py           # structured-output call → validated Recipe
│   │   ├── cache.py             # URL-keyed parse cache
│   │   └── ingredients.py       # optional ingredient-parser second pass
│   │
│   ├── recipe_cli/              # thin CLI over the core — the step-1 deliverable
│   ├── recipe_api/              # HTTP surface          (add at build step 4)
│   └── recipe_mcp/              # MCP surface           (add if/when pursued)
│
├── web/                         # frontend               (add at build step 5)
│
├── tests/
│   ├── unit/                    # mirrors src/recipe_core/ file for file
│   ├── golden/                  # parser accuracy suite — the eval that runs in CI
│   ├── fixtures/
│   │   ├── pages/               # saved HTML, so parser tests never hit the network
│   │   ├── pdfs/
│   │   └── expected/            # hand-labeled Recipe JSON
│   └── live/                    # real network calls; excluded from the default run
│
└── evals/                       # model-dependent, costs money, never in CI
    └── tool_calls/              # does a model pick the right operations?
```

**Add directories when you reach them, not now.** An empty `web/` committed in week one is
noise. The step-1 repo is `recipe_core/models.py`, `parsing/`, `recipe_cli/`, `tests/`, and CI.

---

## 3. Package Boundaries

One `pyproject.toml`, several importable packages under `src/`. This gives real import
boundaries without monorepo tooling, which would be overhead for a solo project.

Surfaces go in optional dependency groups so each deployment installs only what it needs:

```toml
[project]
dependencies = ["pydantic", "pint"]          # recipe_core only — the shared floor

[project.optional-dependencies]
parsing = ["anthropic", "trafilatura", "pdfplumber", "httpx", "ingredient-parser"]
api     = ["fastapi", "uvicorn"]
mcp     = ["mcp"]
dev     = ["pytest", "ruff", "mypy", "import-linter"]
```

Note how small the base list is: the document model and unit handling, nothing else. `anthropic`
lives in `parsing`, not in the floor. If it ever needs to be in the base list, something has
leaked into the core.

**Enforce the dependency direction in CI.** `import-linter` expresses this as a contract:

```toml
[[tool.importlinter.contracts]]
name = "core stays independent"
type = "forbidden"
source_modules = ["recipe_core"]
forbidden_modules = [
  "recipe_parsing", "recipe_api", "recipe_mcp", "recipe_cli",
  "anthropic", "fastapi", "mcp", "httpx",
]
```

That's a five-line config that makes the project's single most important architectural rule
impossible to violate by accident at 11pm. Worth having on day one.

---

## 4. Testing Layout

Three tiers, separated by what they cost to run:

| Tier | Location | Runs | Needs |
|---|---|---|---|
| Unit — core operations, units, validation | `tests/unit/` | Every push | Nothing |
| Golden-set parser eval, **replaying recorded model responses** | `tests/golden/` | Every push | Saved fixtures |
| Golden-set parser eval, live re-record | `tests/golden/` | Manual | Network + a model |
| Live integration | `tests/live/` | Weekly + manual | Network |
| Model evals | `evals/` | Manual only | A model, and money |

**Record and replay is what keeps parser tests in CI.** Save each fixture's model response
alongside its input; the default run replays them, so CI is free, fast, and deterministic while
still exercising every line of code around the call. A manual `--record` run refreshes the
responses against the real model and reports the true accuracy number. Without this, the parser —
now the highest-risk component — would have no test coverage on a normal push.

Mark the network-dependent tests and deselect them by default:

```toml
[tool.pytest.ini_options]
addopts = "-m 'not live'"
markers = ["live: hits the real network; excluded from the default run"]
```

`pytest` is then free and offline by default, and `pytest -m live` is the deliberate act. The
weekly live run exists to catch a recipe site changing its markup — that failure is inevitable,
and it should be caught by a scheduled job rather than by a user.

`tests/unit/` mirrors `src/recipe_core/` file for file. `test_rescale.py` next to `rescale.py`
means never wondering where a test lives.

### Fixtures in a public repo

The repo is public, and record-and-replay makes this sharper than it first looks. Two kinds of
copyrighted text end up on disk: the reduced page content going *into* the model, and the model's
recorded response coming *out* — which is the full recipe, step prose included. Committing those
publishes complete recipes from sites that own their instruction text. Ingredient lists aren't
copyrightable in the US; headnotes and step prose are.

Three practical rules that keep the suite honest without republishing anyone's work:

1. **Assert on structure, not prose.** Check ingredient count, quantities, units, and step count —
   not the exact wording of step 4. This is also the better test: step wording varies between
   model runs, and asserting on it would produce flaky failures that say nothing about parser
   quality.
2. **Store truncated fixtures.** Keep the first ~80 characters of each step, enough to verify
   alignment and ordering, and drop the rest. Expected-output files hold the structured fields the
   assertions actually read.
3. **Prefer permissively licensed sources where a fixture needs to be complete.** Government
   nutrition sites, Wikibooks Cookbook, and out-of-copyright cookbooks give a handful of fully
   redistributable end-to-end cases.

Add `--record` output to review before committing, rather than letting a re-record silently drop
a full recipe into a public commit. Once it's in git history, removing it means a rewrite.

---

## 5. Conventions

| Area | Choice |
|---|---|
| Package manager | `uv` — fast, lockfile-based, one tool for envs and deps |
| Lint + format | `ruff` — replaces black, isort, and flake8 with one dependency |
| Types | `mypy` on `recipe_core` and `recipe_parsing`. Those are where type errors are worth catching; surfaces get theirs from Pydantic at runtime |
| Docstrings | On public functions in `recipe_core`. Skip them on obvious private helpers |
| Pre-commit | ruff, a large-file guard, and a secret scanner (`detect-secrets` or gitleaks). Keep the hook fast, or it gets bypassed |
| Config | `pydantic-settings`, read from env. `.env` gitignored, `.env.example` committed and current |
| Secrets | Never committed. `.gitignore` covers `.env*` except `.env.example`. **Public repo — a leaked key is scraped within minutes, so treat any accidental commit as compromised: rotate first, rewrite history second** |
| Frontend tooling | Entirely separate. `web/` gets its own `package.json` and its own CI job; no attempt to unify Python and JS tooling |

**Branching.** Short-lived branches merged by PR, even solo. Two reasons that outweigh the
ceremony: CI gates the merge, and the PR history is a visible artifact for anyone reviewing the
repo. Squash on merge to keep `main` linear.

**Commits.** Imperative subject lines. Conventional Commits (`feat:`, `fix:`, `test:`) if it
comes naturally — useful, but not worth fighting.

---

## 6. README

The README is the first thing a reader sees, and for a portfolio repo that reader may be
deciding whether to keep reading. Keep it to:

1. One paragraph on what it does, with a screenshot or terminal capture once one exists.
2. Quickstart — `uv sync && uv run pytest`, then how to run the CLI.
3. The architecture diagram from `proposals/proposal.md`.
4. **Eval results as a table**, kept current. Parser accuracy across the golden set is a concrete
   number most projects can't show.
5. A link to `proposals/` for the design reasoning.

---

## 7. Setup Order

Roughly one sitting, before writing feature code:

1. `.gitignore` (Python + `.env` + `web/node_modules`), `README.md` skeleton, `.env.example`.
   The repo is already public, so `.gitignore` and the secret scanner go in **before** the first
   file that reads a key — not after.
2. `pyproject.toml` with `uv`, base dependencies, and the `dev` extra.
3. `src/recipe_core/models.py` — the `Recipe` schema. Everything depends on it, so it goes first.
4. `tests/` skeleton with pytest markers configured, plus one trivial passing test to prove the
   harness works.
5. `.github/workflows/ci.yml` — ruff, mypy, import-linter, `pytest`. Green before any real code
   exists, so the first failure is a real one.
6. `.pre-commit-config.yaml`.

Then build step 1 from the proposal.

---

## 8. Decisions

| Question | Decision | Consequence |
|---|---|---|
| Public or private? | **Public**, from the first commit | Actions minutes are free. Fixture handling follows §4's rules. Everything committed is permanent — assume any secret that lands in history is compromised. |
| Package naming | **`recipe_core`**, `recipe_parsing`, `recipe_api`, `recipe_mcp` | Descriptive, reads well in imports, and independent of the repo name — which matters, since the repo name is a placeholder. |
| Frontend tooling | **Separate.** `web/` owns its `package.json` and CI job | No shared tooling layer. The two ecosystems don't reward integration. |

**On the name.** GDOTT is a placeholder, and the package names are deliberately decoupled from
it, so renaming the repo later costs almost nothing — GitHub redirects the old URL and only the
remote needs updating. Two things follow: don't put `gdott` in any module path or import, and
write the README so it explains what the project is without relying on the name meaning anything,
since a visitor to a public repo has no other context.

Worth renaming before the repo gets any attention rather than after, but it isn't blocking, and
it shouldn't hold up the first commit.
