# SPI — Work Plan

_Started: 2026-05-09 · paired with [ROADMAP.md](./ROADMAP.md)_

ROADMAP.md is the strategy (what we're building + why). This is the
execution ledger (what's next, in what order, and what done looks like).
Every unit is small enough to ship in 1–3 work sessions. We finish a unit
before starting the next. We don't open multiple fronts.

## Current focus

> **Next up: Unit 1.0 — Pick the database + hosting stack.**
> One decision (Neon + Drizzle on Vercel _vs_ self-hosted Postgres _vs_
> Supabase) unblocks the entire Phase 1 chain. No code until this is
> chosen.

Last completed: Phase 0 (prototype) shipped 2026-05-09.

---

## How units work

Each unit is `[ ] 1.4 — Verb-first title (effort)`. Effort is **S** (1
session, ≤2 hr), **M** (2–4 hr), **L** (full day). Don't combine units
to "save time." Small units stay reviewable.

Format under each unit:
- **Done when:** the testable condition that proves the unit shipped
- **Unblocks:** which next units become possible
- **Notes:** decisions, risks, links

A unit is `[x]` only after the work is merged + verified live. Half-done
work stays `[ ]`.

---

## Phase 1 — Foundation

_Goal: SPI survives a refresh and runs for one paying operator on staging._
_Target: 4–6 weeks._

### 1.0 — Pick database + hosting stack (S)
- [ ] **Done when:** one decision recorded under "Decisions" in
  ROADMAP.md naming the database, ORM, hosting, and auth provider
- **Unblocks:** every other Phase 1 unit
- **Notes:** Default recommendation is **Neon Postgres + Drizzle ORM +
  Vercel + NextAuth (Auth.js)** — all serverless-friendly, zero ops, free
  tier covers alpha. Decide and lock before writing code.

### 1.1 — Install + configure database tooling (S)
- [ ] **Done when:** `drizzle.config.ts`, connection helper, env var
  documented in `.env.example`, smoke-test script connects to a fresh
  database and creates one row
- **Unblocks:** 1.2–1.5
- **Notes:** No schema yet. This unit is plumbing only.

### 1.2 — Schema: Operator + User (M)
- [ ] **Done when:** Drizzle schema for `operators` and `users` tables
  with operator-scoping foreign keys, migration applied, seed script
  inserts one operator (Tamarind Safaris) + one user (Sarah Müller)
- **Unblocks:** 1.3, 1.7
- **Notes:** Every other table will reference `operator_id`. Get this
  right.

### 1.3 — Schema: Quote root (M)
- [ ] **Done when:** Drizzle schema for `quotes` table with
  client/origin/dates/pax/status/reference/agent/operator FK, seed inserts
  current Henderson quote, smoke test reads it back
- **Unblocks:** 1.4, 1.5
- **Notes:** Don't denormalize totals — engine recomputes from inputs.

### 1.4 — Schema: child tables (L)
- [ ] **Done when:** Drizzle schemas for `guests`, `room_assignments`,
  `itinerary_days`, `park_visits`, `cost_lines` all with quote/operator
  FKs and migration applied; seed loads full Henderson dataset
- **Unblocks:** 1.6, 1.8
- **Notes:** Match `lib/types.ts` exactly so the engine still compiles.

### 1.5 — Schema: history + memory (M)
- [ ] **Done when:** `versions`, `activity_entries`, `memory_observations`
  tables with FKs, indexes on `(quote_id, created_at desc)`,
  `(operator_id, created_at desc)` for fast feed queries
- **Unblocks:** 1.8
- **Notes:** Memory observations are operator-scoped, not quote-scoped —
  they compound across quotes for one operator.

### 1.6 — Property catalog seed (M)
- [ ] **Done when:** `properties` table seeded with ~50 well-curated
  TZ/KE/RW camps (name, region, category, tier, board options, hero
  image URL); seed pulls from a JSON file checked into the repo
- **Unblocks:** Phase 2 itinerary builder
- **Notes:** 50 not 200 for the seed — quality over quantity for the
  alpha. Add more later when an operator asks.

### 1.7 — NextAuth (Auth.js) with operator-scoped sessions (L)
- [ ] **Done when:** sign-in via email magic link works, session contains
  `userId` and `operatorId`, protected routes redirect to sign-in,
  middleware injects `operatorId` into every server action
- **Unblocks:** 1.8 (server actions that filter by operator)
- **Notes:** No password auth. Magic link = simpler + safer for alpha.

### 1.8 — Replace QuoteProvider in-memory state with server actions (L)
- [ ] **Done when:** every mutation in QuoteProvider goes through a
  server action that writes to the DB; refresh preserves state; switching
  sidebar quotes loads real data; create-quote inserts a real row
- **Unblocks:** 2.x (everything that needs persistence)
- **Notes:** This is the big one. Probably 2 sessions. Rip the band-aid.

### 1.9 — Real Claude API hookup for Tell-SPI (M)
- [ ] **Done when:** `parseIntelligence` calls Claude with current quote
  context, returns structured `ParsedAction[]` matching existing shape;
  fallback to regex parser if API down or rate-limited
- **Unblocks:** Phase 3 AI-native units
- **Notes:** Use prompt caching for the quote context. Keep the regex
  parser as a fallback so demos still work offline.

### 1.10 — Multi-currency display (M)
- [ ] **Done when:** quote shows totals in USD/EUR/GBP/ZAR, FX rates
  snapshot at quote creation (not live), per-quote rate stored
- **Unblocks:** Phase 2 international design partners
- **Notes:** Display only. Engine still works in USD internally — convert
  at render.

### 1.11 — Error boundaries + telemetry (S)
- [ ] **Done when:** root error boundary catches React crashes, Sentry
  (or PostHog) configured, one synthetic error reported successfully
- **Unblocks:** confidence to put real users on it
- **Notes:** Don't over-engineer. Sentry SaaS free tier is fine.

### 1.12 — Audit log + per-operator settings (M)
- [ ] **Done when:** `audit_log` table records every mutation with
  user/operator/timestamp/diff; `operator_settings` table holds VAT
  rules, currency preference, validator thresholds
- **Unblocks:** Phase 3 audit-grade signing
- **Notes:** Audit log writes happen inside server actions. Settings
  drive the engine — read at request time.

### 1.13 — CI/CD + staging environment (S)
- [ ] **Done when:** push to `main` triggers CI (type-check, build,
  lint), passing builds auto-deploy to staging at `staging.spi.app` (or
  similar), production deploy is manual
- **Unblocks:** putting the real URL in front of an operator
- **Notes:** GitHub Actions + Vercel preview deploys cover most of this
  out of the box.

**Phase 1 exit criteria:** one operator can sign in, see their persisted
quotes, edit a quote with changes that survive refresh, get real
Claude-parsed Tell-SPI proposals, view in their preferred currency, and
the team can ship updates safely via CI/CD.

---

## Phase 2 — Design partner alpha

_Goal: 1–2 paying operators using SPI daily, sending real quotes._
_Target: 4 weeks after Phase 1._

### 2.1 — Branded client portal route (`/q/{operatorSlug}/{quoteId}`) (L)
- [ ] **Done when:** public route renders the printable quote document
  with operator branding (logo, color, typography overrides); link works
  without auth; rate-limited
- **Unblocks:** "Send" actually meaning something
- **Notes:** Reuse PrintableQuote component. Add a `?token=...` param
  for unguessable links.

### 2.2 — Server-side PDF generation (M)
- [ ] **Done when:** background job renders a quote to a real PDF using
  Puppeteer or @react-pdf, stores in S3-equivalent, "Download PDF" returns
  the file; falls back to browser print if job queue is down
- **Unblocks:** Phase 3 voucher generation
- **Notes:** Async job — Inngest, Trigger.dev, or simple Vercel cron.

### 2.3 — Multi-user inside an operator (L)
- [ ] **Done when:** operator admin can invite team members with roles
  (agent / senior / admin / accounting); role determines what they can
  edit; invite via email
- **Unblocks:** 2.4
- **Notes:** Roles are coarse for V1 — refine after we see real workflows.

### 2.4 — Comment threads + @mentions on a quote (M)
- [ ] **Done when:** any quote section can be commented on,
  `@username` notifies via in-app + email, threads resolve, activity feed
  surfaces them
- **Unblocks:** real collaboration
- **Notes:** Liveblocks or self-roll with Postgres + WebSockets.

### 2.5 — CSV/Excel rate sheet ingestion (L)
- [ ] **Done when:** operator uploads a supplier rate sheet, mapping UI
  matches columns to engine fields, normalized rates write to a
  `supplier_rates` table, override option per line
- **Unblocks:** real cost data, not mocks
- **Notes:** Sheet formats vary wildly — invest in a good mapper UI.

### 2.6 — First supplier portal pull (M)
- [ ] **Done when:** nightly cron pulls rates from one supplier portal
  (start with one we have a relationship with), updates the rates table,
  flags drifts to operators
- **Unblocks:** Phase 3 rate-freshness intelligence
- **Notes:** Pick a supplier with a clean API. Ground-truth one before
  generalizing.

### 2.7 — Voucher generation skeleton (M)
- [ ] **Done when:** confirmed quote produces voucher PDFs per supplier,
  dispatch tracking shows sent/received/confirmed status
- **Unblocks:** booking module (Phase 3+)
- **Notes:** Skeleton only. Voucher correctness is hard — iterate with
  one operator first.

### 2.8 — Transactional email (S)
- [ ] **Done when:** Resend or Postmark configured; magic-link auth,
  invites, comment notifications, voucher dispatches all send
- **Unblocks:** any user-facing communication
- **Notes:** Resend has the cleanest DX.

### 2.9 — Quote conversion analytics (M)
- [ ] **Done when:** dashboard shows quotes sent / won / lost / pending,
  time-to-decide, win rate by tier; data computed from quote status
  transitions
- **Unblocks:** Phase 3 win/loss intelligence
- **Notes:** Read-only V1 — no AI summaries yet.

### 2.10 — Two signed design-partner LOIs (—)
- [ ] **Done when:** two operators have signed letters of intent
  committing to use SPI for at least 90 days, in writing
- **Unblocks:** moral authority to keep building, real usage data
- **Notes:** This is sales work, not engineering. Don't skip it. Without
  this, everything else is speculative.

**Phase 2 exit criteria:** two operators sending real client quotes
through SPI weekly, with vouchers, comments, and analytics being used.

---

## Phase 3 — Differentiation

_Goal: stop being "alternative to Wetu," start being a different category._
_Target: 8–12 weeks after Phase 2 alpha._

### 3.1 — AI-native quote auto-summary (M)
### 3.2 — AI-native "why is this margin low?" explainer (M)
### 3.3 — Voice capture for quote changes (L)
### 3.4 — WhatsApp ingestion (forward client message → SPI proposes itinerary) (L)
### 3.5 — Margin intelligence dashboard (per-quote, per-camp, per-agent trends + erosion alerts) (L)
### 3.6 — Conversion analytics with AI-generated win/loss summaries (M)
### 3.7 — Real-time collaboration (cursors, comments, presence) (L)
### 3.8 — Audit-grade signing (cryptographic per-commit) (M)
### 3.9 — Quote diff/compare view + restore from version (M)
### 3.10 — Sustainability scoring (carbon per itinerary, eco-camp ratings) (L)

**Phase 3 exit criteria:** SPI is no longer asked to "match Wetu's
features." Operators describe it as "different, in a way I now need."

---

## Phase 4 — Network effects

_Goal: pillars start compounding. Switching cost gets serious._
_Target: ongoing after Phase 3._

### 4.1 — Supplier-side portal (camps log in, update rates, accept/decline holds) (L)
### 4.2 — Cross-operator anonymized pattern intelligence (L)
### 4.3 — Property reputation graph surfacing across operators (L)
### 4.4 — Publish engine logic openly (auditability as marketing) (M)
### 4.5 — Open API + Slack/Notion/email integrations (L)
### 4.6 — Multi-language proposals (FR/DE/PT/ES/SW) (M)
### 4.7 — Mobile app for desk agents (capture changes on the move) (XL)
### 4.8 — Mobile app for travelers (offline itinerary) (XL)

**Phase 4 exit criteria:** an operator who tries to leave SPI loses
years of accumulated memory, supplier ratings, and property data. Not
through lock-in — through loss.

---

## Phase 5 — Industry leadership

_Goal: SPI is the operating system. Competition stops being about
features._
_Target: 12+ months after Phase 4 begins._

### 5.1 — Operator-tier benchmarks (anonymized, your conversion vs peers) (L)
### 5.2 — AI senior-agent assistant ("look at this draft, what would you change?") (XL)
### 5.3 — Predictive margin intelligence (forecast next quarter from quote pipeline) (L)
### 5.4 — Marketplace for vetted suppliers (XL)
### 5.5 — White-label for DMC consortia (sell SPI to them, not direct operators) (XL)

**Phase 5 exit criteria:** Wetu is asked "how are you different from
SPI?" instead of the other way around.

---

## Update protocol

After every work session that ships something:
1. Mark unit `[x]` (only if merged + verified)
2. Update **Current focus** at the top with the next unit
3. If the plan changes, append a dated note in ROADMAP.md Decisions

When the user asks "what's next" or "where are we": read this file's
**Current focus**, report the unit ID + title, and the immediate
prerequisite if any.

---

## Sequence summary

The chain is roughly:

```
1.0 (decide stack)
 → 1.1 (plumbing)
  → 1.2-1.5 (schemas)
   → 1.6 (property seed) + 1.7 (auth)
    → 1.8 (replace in-memory state) ◀── biggest unit, gates everything
     → 1.9 (real Claude) + 1.10 (currency) + 1.11 (errors) + 1.12 (audit) + 1.13 (CI/CD)
      → Phase 1 exit
       → Phase 2 (alpha) ── needs design partners in parallel ── 2.10 LOIs
        → Phase 3 (differentiation)
         → Phase 4 (network effects)
          → Phase 5 (leadership)
```

The bottleneck unit is **1.8** — replacing in-memory state with server
actions. Everything before 1.8 is preparation; everything after is
unlock. Plan around it.
