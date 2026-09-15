# Recipe Adjuster — Claude Connector

**Status:** Draft / pre-build
**Author:** Molly Kessler
**Last updated:** 2026-08-23

---

## 1. Main Idea

A Claude connector that turns any recipe into something you can adjust in conversation.

A user brings in a recipe they already have — a link, a PDF, or pasted text — and needs it
changed. They might be missing an ingredient, want a faster version of the same dish, want to
swap out something they don't like, or need to scale it down to the amount of chicken actually in
the fridge. They ask Claude, and Claude uses the connector's tools to parse the recipe and make
precise, structured edits to it.

The distinguishing idea is that **the recipe is a document, not a chat message.** Claude doesn't
retype a revised recipe into the conversation; it calls tools that modify a structured recipe the
connector holds and renders as an interactive workspace inside the chat. The user sees a real
recipe with real ingredient rows, watches specific parts change, and can undo a change they don't
like.

The arithmetic — unit conversions, rescaling, quantity math — is done by the connector in Python,
not by the model. Language models are unreliable at arithmetic and a library is exact, so the
model decides *what* should change and the connector computes *the numbers*.

### Example Workflow

1. User finds a recipe for chicken fajitas online.
2. In Claude, they paste the link: *"pull this in, I'm missing a couple of things."*
3. Claude calls `import_recipe`. The connector fetches the page and strips it down to the actual
   content; Claude reads that and calls `create_recipe` with the structured result. The recipe
   renders in the conversation as an editable workspace.
4. User: *"I don't have an onion."*
5. Claude asks whether they have onion powder.
6. User confirms they do.
7. Claude calls `replace_ingredient` and `edit_step`. The connector applies both, adjusting for
   the change in liquid and cooking technique, and the workspace updates with the changed parts
   highlighted.
8. User: *"also I only have 300g of chicken, not 500."*
9. Claude calls `rescale` anchored on the chicken. The connector computes a 0.6 factor, applies
   it to every quantity, and flags that the salt and the spice blend don't scale linearly so
   Claude can comment.
10. User: *"how much is 1 medium onion in grams, roughly?"* — `convert_measure` answers without
    changing anything.
11. When they're done, `export_recipe` gives them clean text to save or print.

---

## 2. Why a Connector, and What It Costs

**Inference cost: $0, at any number of users.**

Because this ships as a connector rather than a standalone app, the model doing the reasoning is
the user's own Claude, running on the subscription they already pay for. The connector never
calls a model. It receives tool calls, does deterministic work, and returns results.

That single fact removes most of what makes a public AI product expensive and risky to operate:

- No credentials to protect, because the connector holds none.
- No spending to cap, no per-user token quotas, no usage metering.
- No incentive for anyone to abuse the endpoint — there's nothing expensive behind it to steal.
- No prompt-injection *cost* vector. A malicious recipe page can still try to misbehave, but the
  worst it can do is cause a bad edit to a recipe, not run up a bill.
- Costs don't grow with popularity. A thousand users cost the same as one.

What remains is a small, stateless HTTPS service that fetches web pages, parses them, and does
arithmetic. That runs comfortably on a free hosting tier, and the operational surface is ordinary
web-service concerns rather than AI ones (§9).

The tradeoff, stated honestly: the quality of the *editing judgment* is no longer something this
project controls. It depends on which model the user's client is running and how well the tool
descriptions steer it. §8 covers what can be measured and what can't.

---

## 3. Architecture

```text
   ┌──────────────────┐
   │  User's Claude   │   all inference happens here, on their subscription
   │  web / desktop / │
   │  mobile          │
   └────────┬─────────┘
            │  MCP over Streamable HTTP  (HTTPS /mcp)
   ┌────────▼─────────────────────────────┐
   │  Recipe Adjuster MCP server          │
   │    tool definitions (strict schemas) │
   │    ui:// workspace resource          │
   │    session store (recipe + op log)   │
   └────────┬─────────────────────────────┘
            │
   ┌────────▼─────────────────────────────┐        ┌──────────────┐
   │  recipe-core  (Python library)       │───────►│ Recipe sites │
   │    fetch + boilerplate removal       │        │   (HTML)     │
   │    patch operations + validation     │        └──────────────┘
   │    Pint conversion · rescaling       │
   └──────────────────────────────────────┘
```

**The rule that holds this together: `recipe-core` never imports an LLM SDK.**

Every piece of model reasoning belongs to the host. The library's job is to be correct,
deterministic, and fully testable without a network connection or a model. If a feature seems to
require the library to "ask an AI," that feature belongs in a tool description instead — the host
model is already there and already paid for.

Two practical consequences: the library is unit-testable in CI at zero cost, and the MCP server
is a thin adapter over it rather than the place where the logic lives.

---

## 4. The MCP Surface

### Tool vocabulary

Every tool uses a strict JSON schema (`additionalProperties: false`, explicit `required`) so
arguments validate exactly and the server never has to defensively parse a malformed call.

```text
import_recipe(source)                      → reduced content + Recipe JSON schema
                                             source is a URL, raw text, or an uploaded file.
                                             The host extracts; see §6.
create_recipe(extracted)                   → recipe_id, rendered workspace
                                             validates the host's extraction and opens a session

replace_ingredient(recipe_id, ingredient_id, new_ingredient, reason)
adjust_quantity(recipe_id, ingredient_id, new_quantity, new_unit, reason)
remove_ingredient(recipe_id, ingredient_id, reason)
add_ingredient(recipe_id, position, ingredient, reason)
edit_step(recipe_id, step_id, new_text, reason)

rescale(recipe_id, anchor_ingredient_id, available_quantity, available_unit, reason)
convert_measure(recipe_id, ingredient_id, target_unit, apply)
                                             apply=false answers the question without editing

get_recipe(recipe_id)                      → current state, for re-grounding
undo(recipe_id)                            → reverts the most recent group of operations
export_recipe(recipe_id, format)           → clean text or Markdown
```

Every mutating tool takes a `reason` string. It isn't decoration — it's what the workspace shows
the user when they hover a changed field, and it's the only explanation they get for why an
ingredient moved. Making it required forces the model to have a reason before it acts.

`rescale` and `convert_measure` are the two tools whose arithmetic is entirely the server's: the
model decides that a rescale should happen and what to anchor it on, and Python computes every
resulting number.

### There is deliberately no `ask_user` tool

Clarifying questions are the host's native behavior and it is already good at them. A tool that
returns questions to be rendered would be a worse version of something the conversation gives
away for free. If the model needs to know whether the user has onion powder, it just asks.

### Tool descriptions are the prompt

With no system prompt of its own, this project's entire influence over model behavior lives in
tool names, descriptions, and parameter docs. That makes them worth writing with real care rather
than as an afterthought. Specifically, they should:

- Say when *not* to use a tool. `adjust_quantity` should note that changing an amount to match
  what the user has on hand is `rescale`'s job, not its own.
- Encode the domain warnings. `rescale`'s description should mention that leaveners, salt, and
  bake times don't scale linearly, so the model raises it with the user unprompted.
- Push toward batching. Substituting one ingredient usually means editing the steps that mention
  it; the descriptions should make that expectation explicit so the model doesn't stop halfway.
- Steer toward acting over interrogating. Prefer making a sensible choice and stating the
  assumption in `reason` over asking a question the user probably doesn't care about.

### Session state

`import_recipe` returns a `recipe_id`, and everything else takes it. The server holds the working
recipe plus its operation log; tools mutate a document rather than passing the full recipe back
and forth on every call. That keeps calls small, makes `undo` trivial, and means the recipe can't
drift because the model retyped it slightly differently.

Sessions are in-memory with a TTL to start — losing a working recipe after a period of inactivity
is acceptable at first, and avoiding a database until it's genuinely needed keeps the whole thing
deployable on a free tier. Persistence is build step 7.

---

## 5. The Recipe Workspace (MCP App)

MCP Apps let a server render interactive HTML directly inside the conversation. The UI is stored
as a `ui://` resource on the server and referenced from a tool result via
`_meta.ui.resourceUri`, so the recipe workspace is a real interface rather than a block of text.

What it renders:

- **Structured ingredient rows** — quantity, unit, item, and prep as distinct fields, not a
  paragraph. This is the whole point: the recipe is data the user can see the shape of.
- **Change highlighting.** After a tool call, the fields that changed are highlighted, with that
  operation's `reason` available on hover. The highlight fades on the next interaction so the
  recipe doesn't accumulate visual noise.
- **Undo.** A persistent control that reverts the last group of operations. Since changes apply
  without an approval step, cheap and obvious undo is what makes that comfortable.
- **Original values preserved.** A converted measurement shows as `≈110 g (1 medium onion)`,
  because the user may be standing in front of an actual onion.

Host support as of April 2026 includes Claude on web and desktop, ChatGPT, VS Code, and Goose —
broader reach than a standalone app would get. The UI itself is plain HTML, CSS, and JavaScript
with no framework required, so it stays small and loads fast.

---

## 6. The Engine

`recipe-core` is where the real work is. It is a plain Python library with no model calls, no web
framework, and no MCP dependency, so it can be developed and tested entirely on its own.

### Parsing: the host model does it

Recipes arrive as web pages, PDFs, photos, and pasted text, and no rule-based approach covers
that range. A model handles all of them through one path — and in this architecture that model
is the user's, which makes the most expensive part of parsing free to operate.

The division of labor:

| Stage | Where it runs |
|---|---|
| 1. Acquire | Connector. Fetch the URL, read the uploaded file, take the pasted text. |
| 2. Reduce | Connector. Strip boilerplate from web pages with [`trafilatura`](https://trafilatura.readthedocs.io/) — nav, ads, comments, the long preamble. `pdfplumber` for text PDFs. This keeps the host's context small, which is a courtesy to the user's token budget rather than a cost saving for us. |
| 3. Extract | **Host model.** `import_recipe` returns the reduced content plus the `Recipe` JSON schema, and the model calls back with structured data. Scanned PDFs and photos go to the host directly, since it reads them natively. |
| 4. Validate | Connector. Pydantic validation plus sanity checks — non-empty ingredients, steps present, quantities parseable, units known to Pint. On failure, return a structured error so the model can correct itself. |

This makes `import_recipe` a two-step tool rather than a one-shot: the connector prepares and
validates, the host does the language work in between. It's slightly more protocol than a single
call, and it's what keeps the expensive half on the user's subscription.

Every input format must emit the *same* validated `Recipe` object. Define it once as a Pydantic
model and make every path produce that type. The seam between "how it was parsed" and "what a
recipe is" is where this codebase will either stay clean or rot.

**Ingredient structure** — turning `"1 medium onion, finely diced"` into fields — should be part
of the same extraction, by asking for structured ingredient fields in the schema rather than a
list of strings. If quantities and units turn out to be the weak spot, the `ingredient-parser`
library (a trained model, runs locally, free) is a drop-in second pass over just that field.

### Patch operations

Each tool maps to an operation applied deterministically to the recipe object. This buys several
things at once:

- **Undo and revision history come free** — the operation log *is* the history. Grouping
  operations by conversational turn gives the user one legible "undo that" rather than a stack of
  micro-steps.
- **The document structure can't be corrupted.** Only a fixed, validated vocabulary of moves is
  available.
- **Change highlighting is trivial** — each operation names the exact field it touched, so
  nothing needs diffing.
- **Untouched text stays byte-identical.** A model asked to rewrite a whole recipe quietly rewords
  steps it wasn't asked to change; patch operations make unrequested drift structurally
  impossible.
- **It's testable.** Each operation is a pure function over the recipe object.

### Unit conversion

Two genuinely different problems behind one idea:

**Exact conversion** (cups → mL, lb → g, °F → °C) is arithmetic. [Pint](https://pint.readthedocs.io/)
handles it exactly, every time, with a real unit registry that catches nonsense like converting
grams to teaspoons.

**Ingredient-dependent conversion** ("1 medium onion → ≈110 g", "1 cup flour → ≈120 g") is not a
unit conversion at all — it needs to know the ingredient, and the answer is inherently
approximate. Answer it locally where possible: a small static density and count table for common
ingredients, built from USDA FoodData Central, which is free and public. Fall back to asking the
host model only on a miss. Always render these with `≈` and keep the original text alongside.

### Anchored rescaling

The user pins one ingredient to what they actually have — the recipe calls for 500 g of chicken,
they have 300 g — and the whole recipe rescales by that factor. `factor = available / required`,
applied to every quantity. Straightforward arithmetic, with three caveats worth encoding:

- Leaveners, salt, and strong spices scale **sublinearly**.
- Bake and rest times barely move.
- A scaled recipe can outgrow the pan the steps assume.

So: scale linearly in Python, then return the list of known-nonlinear ingredients and any
vessel mentioned in the steps as part of the tool result, letting the model adjust or comment.
Reject a factor outside a sane range (roughly 0.1–10) at validation — an extreme factor almost
always means a unit was misread, and it's better to refuse than to produce a recipe calling for
four kilograms of salt.

### Validation and transactional apply

Nothing between the model and the document reviews these changes, so this layer has to be
correct. Before committing anything, check for orphaned ingredient references, negative or zero
quantities, units Pint doesn't recognize, ids that no longer exist, and out-of-range scale
factors. Apply transactionally: a partially applied batch must never reach the workspace.

On validation failure, return a structured error describing what was wrong rather than silently
dropping the operation. The host model is perfectly capable of correcting itself and retrying —
but only if the error tells it what to fix.

---

## 7. Data Model

The recipe object is the contract between the parser, the operations, the workspace UI, and the
tool schemas. Get it right early.

```python
Recipe
  id: str
  title: str
  source_url: str | None
  servings: int | None
  time: {prep_min, cook_min, total_min}
  ingredients: list[Ingredient]   # ordered
  steps: list[Step]
  equipment: list[str]
  notes: list[str]

Ingredient
  id: str                # stable across edits — never key on list position
  quantity: float | None
  unit: str | None       # normalized against Pint's registry
  item: str
  size: str | None       # "medium" — what count-to-weight conversion keys off
  prep: str | None       # "finely diced"
  optional: bool
  substituted_from: str | None   # provenance, shown on the change highlight
  original_text: str | None      # as parsed, before any conversion or rescale;
                                 # lets the UI show "≈110 g (1 medium onion)"
                                 # and makes conversions reversible

Step
  id: str
  text: str
  ingredient_refs: list[str]     # ids, so substitutions propagate into step text
```

Two fields carry more weight than they look like they do:

`ingredient_refs` is what lets a substitution update the steps correctly. Without it, the model
has to find every mention of "onion" in the prose by hand, and it will eventually miss one.

Stable `id`s on ingredients and steps matter because the model issues several operations against
a recipe it read once. If operations were indexed by list position, removing an ingredient would
silently invalidate every subsequent call in the same batch.

---

## 8. Evaluation

Two suites, with very different characters.

**Parser accuracy — deterministic, runs in CI.** A golden set of ~40 recipes spanning different
sites, PDFs, and pasted text, with hand-labeled expected output. Assert exact matches on
ingredient counts, quantities, units, and step counts. Runs offline against saved fixtures, so
it's free, fast, and safe to run on every commit. A separate live suite hits the real sites on a
schedule to catch a site changing its markup — that failure is inevitable and should be caught by
a test rather than by a user.

**Tool-call correctness — the interesting one.** Since the editing model isn't ours, the thing
worth measuring is whether the tool surface *steers a host model correctly*: given a recipe and a
request, does it select the right operations with the right arguments? Build a small harness of
~25 (recipe, request, expected operations) cases and run it against a model directly as a
development-time check. Then, when a tool description changes, there's a number to compare rather
than a vibe.

That harness is also the only real feedback loop available for prompt engineering here, which
makes it more valuable than it would be in a project that owned its own system prompt.

**What can't be measured:** whether the substitution advice is any *good*. That depends on the
user's model, and it will vary between clients and improve over time without any change to this
codebase. Worth accepting rather than fighting.

---

## 9. Operational Concerns

There's no inference behind this service, which removes most of what would normally go here. What
remains is ordinary web-service hygiene:

| Concern | Approach |
|---|---|
| SSRF | The server fetches user-supplied URLs, which is the one genuinely sharp edge. Resolve and validate the host before fetching: block private IP ranges, loopback, link-local, and cloud metadata endpoints. Re-check after redirects, not just on the original URL. |
| Input size caps | Reject early — a maximum page size on fetch, a page limit on PDFs, and a character limit on pasted text. |
| Rate limiting | Per-session and per-IP. Protects bandwidth and keeps the connector from being used as an anonymous scraping proxy. |
| Fetch timeouts | Short, with no retries on slow hosts. A hung fetch shouldn't hold a worker. |
| Untrusted content | Recipe pages are arbitrary web content. It can't cause spending, but it can attempt to influence the host model. The structural defense is the real one: the tool vocabulary does nothing but modify a recipe document, so the worst outcome is a bad edit the user can undo. Sanitize scraped HTML before it reaches the workspace UI. |
| Session hygiene | TTL on in-memory sessions and a cap on total stored recipes, so an abandoned session can't accumulate indefinitely. |

---

## 10. Distribution

Users add the connector by URL from **Settings → Connectors** in Claude, pointing at the HTTPS
`/mcp` endpoint. That works immediately and requires nothing from anyone else — a link is enough
to share it.

Listing in the **Connectors Directory** is a separate matter: submission appears to route through
a Team or Enterprise organization's admin portal, so directory listing may not be available to an
individual developer. Worth confirming before counting on it. It doesn't block anything —
URL sharing reaches anyone who wants it — but it does mean discovery has to happen elsewhere.

Because MCP Apps are supported across several hosts, the same server should work in ChatGPT, VS
Code, and Goose without modification. Worth testing in at least one non-Claude host early, since
cross-host differences are cheaper to find before the UI is finished than after.

---

## 11. Build Order

Each step should be independently demoable.

1. **`Recipe` schema + import pipeline, CLI only.** Takes a URL, PDF, or text file, reduces it to
   clean content, and prints a validated recipe — driving extraction against a model you supply
   yourself at this stage, so the pipeline can be built and measured before the connector exists. Build the golden-set eval suite alongside it. No MCP, no UI.
2. **Patch operations, validation, transactional apply.** Pure Python, thoroughly unit-tested.
   Nothing downstream reviews these changes, so this is the layer that has to be right.
3. **Pint conversion and anchored rescale,** including the density table and the nonlinearity
   flags.
4. **MCP server wrapper.** Tool definitions with strict schemas over `recipe-core`, session
   store, Streamable HTTP endpoint. Test locally with the MCP inspector, then connect it to
   Claude from Settings → Connectors. **This is the first genuinely usable product** — text-only
   results, but fully working.
5. **The MCP App workspace.** `ui://` HTML resource, structured ingredient rows, change
   highlighting, undo.
6. **Use it for real cooking for a few weeks before building anything else.** Steps 7 and 8 are a
   guess at what matters. A few weeks of actual use will replace that guess with evidence and may
   well reorder them or replace them entirely. Keep a running list of what goes wrong.
7. **Persistence** — recipe history and browsable revisions, so a user can recreate any earlier
   version of a recipe. (If they now have an onion, they may want the original back.)
8. **Reassess against what step 6 turned up.** Standing candidates: inferring a user's pantry and
   equipment from their recipes, searching for a similar recipe with a specified difference
   (faster, oven instead of stovetop), and a mid-cooking mode for adjusting partway through.

---

## 12. Open Questions

- **How much recipe context does each tool call need?** Tools take a `recipe_id` and the server
  holds the document, but the model still has to know the current state to choose sensible
  arguments. Returning the full recipe on every call is simple but wasteful of the user's
  context; returning only what changed is leaner but risks the model working from a stale
  picture. `get_recipe` exists as an escape hatch — how often it's actually needed is a real
  question.
- **Does an in-conversation workspace feel as good as a dedicated one?** A recipe is a document
  people return to and scroll through, and chat is a poor container for that. Worth judging
  honestly at step 6 rather than assuming.
- **How much behavior can tool descriptions actually steer?** With no system prompt, they're the
  only lever. The tool-call harness in §8 should answer this empirically, but it's unknown how
  much headroom there is.
- **How long should a session live,** and what should happen when one expires mid-cooking? A TTL
  short enough to keep memory bounded may be shorter than someone's actual cooking session.
- **Recipe copyright.** Ingredient lists aren't copyrightable in the US, but headnotes and step
  prose are. Holding a user's imported recipe transiently in their own session is fine; building
  a shared recipe corpus is not. Good reason to keep the server's storage per-session and
  user-scoped.
