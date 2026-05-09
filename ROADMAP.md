# SPI — Roadmap & North Star

_Started: 2026-05-09 · last reviewed: 2026-05-09_

## North Star

**Build the operating system safari operators love using.**

Not the biggest catalog, not the cheapest tool — the one operators reach for
first because it makes them faster, smarter, and more trusted by their clients.
We win on depth, transparency, and intelligence; we lose if we try to win on
breadth or content volume.

Stop framing the product as "alternative to Wetu." Frame it as "what an
operator would build for themselves if they had a serious software team."

---

## Pillars — what makes us hard to replicate

These are stances, not features. Each one is a deliberate bet that compounds
over time and is expensive for incumbents to copy.

| Pillar | What it means | Why it's hard to copy |
|---|---|---|
| **Deterministic pricing as IP** | Engine math lives in pure functions. Every number traceable to inputs. AI proposes; operator approves. Pricing logic published openly | Incumbents have opaque pricing — switching to deterministic requires rebuilding their stack |
| **Operator memory** | System observes every override, recurring decision, VAT confirmation. Junior agents inherit senior intuition. Data compounds inside one operator | Requires architectural commitment from day one — bolted-on later is messy |
| **Cross-operator pattern intelligence** | Anonymized signal: "operators in your tier confirm fuel non-VAT 94% of the time." Network effect _across_ operators | Needs scale and trust before useful — incumbents have customers but not the data model |
| **Property reputation graph** | Every recorded override becomes a data point. Over time SPI knows which camps quietly bend rules, which charter routes have timing issues, which suppliers are unreliable | Emerges only from operator decisions captured at the right granularity. Can't be scraped or bought |
| **Document UX over cockpit UX** | Calm, readable, luxury safari operations — not industrial dashboard. Operators _appreciate_ using it, not endure it | UX is taste plus restraint. Easy to copy a screen, hard to copy a sensibility |
| **Speed of intelligent iteration** | Modern stack, AI-assisted development, small team. Ship in weeks what 200-customer incumbents take quarters to copy | Compounds with team velocity, not headcount |
| **Voice + flow capture** | Operators dictate changes during natural workflow (on a call, in WhatsApp, between meetings). Quote is built from how operators actually work, not how forms expect them to | Requires real LLM hookup + careful intent modelling — cosmetic voice features won't cut it |

**Stickiness model:** value compounds through accumulated memory, version
history, supplier ratings, and pattern data. The longer an operator uses SPI,
the more painful it is to leave — not because of lock-in, because of loss.

**Appreciation model:** operators measure us in (1) time saved per quote,
(2) pricing errors prevented, (3) margin protected, (4) client conversion.
Surfaces that delight emerge from honest helpfulness — autocomplete that
understands safari context, validators that warn before send, recommendations
that quietly save margin.

---

## Phased plan

Each phase ships when its checkboxes are complete. Phase % = checkboxes done /
total. Don't move to the next phase before the current one is real.

### Phase 0 — Prototype (current)

Polished interactive demo. No backend. AI mocked. Single user.

- [x] Deterministic pricing engine in pure TypeScript
- [x] Per-guest pricing categories (Local / EA Resident / International)
- [x] Operator memory primitive (localStorage, observation log)
- [x] Tell-SPI parser (regex-based stub) + proposed-action UI
- [x] Recommendation engine from memory observations
- [x] Document layout with sticky section headers + price ribbon
- [x] Brass + teal palette, category-coloured cost composition
- [x] Drawer system (guests, rooming, costs, warnings, quote details)
- [x] Review & Send modal with paper-style client document
- [x] Browser print → PDF
- [x] Toast system, activity feed, status indicators
- [x] Command palette (⌘K), placeholder modal, share modal, create-quote modal
- [x] Sidebar quote switching (shallow fork)

### Phase 1 — Foundation (target: 4–6 weeks)

Make it survive a refresh and run for one paying operator.

- [ ] Postgres + Drizzle/Prisma schema for Quote, Guest, Room, Cost, Version, Activity, Memory, Operator, User
- [ ] NextAuth with operator-scoped multi-tenancy (operator_id on every row)
- [ ] Persist quotes, versions, activity, memory across refresh
- [ ] Real Claude API hookup for Tell-SPI (replace regex stub)
- [ ] Curated property catalog v1 — ~200 TZ/KE/RW camps with photos, room types, board basis
- [ ] Multi-currency display (USD / EUR / GBP / ZAR) with rate snapshot per quote
- [ ] Error boundaries + Sentry-style telemetry
- [ ] Audit log table (who changed what, signed)
- [ ] Per-operator settings (currency, VAT rules, validator thresholds)
- [ ] CI/CD pipeline + staging environment

### Phase 2 — Design partner alpha (4 weeks after Phase 1)

One or two operators using it daily, sending real quotes to real clients.

- [ ] Branded client portal: `quote.{operator}.com/q/{id}` (white-label)
- [ ] Server-side PDF generation (Puppeteer or @react-pdf) with brand template
- [ ] Multi-user inside an operator (roles: agent / senior / admin / accounting)
- [ ] Comment threads + @mentions on a quote
- [ ] Real supplier rate ingestion: CSV/Excel upload, normalization to engine
- [ ] At least 3 supplier portal pulls (rate refresh nightly)
- [ ] Voucher generation skeleton (PDF, dispatch tracking)
- [ ] Transactional email via Resend/Postmark
- [ ] Quote conversion analytics (sent / won / lost / time-to-decide)
- [ ] At least 2 signed design-partner LOIs

### Phase 3 — Differentiation (8–12 weeks after alpha)

Pull ahead on intelligence and collaboration. This is where we stop being
"alternative to Wetu" and start being a different category.

- [ ] AI-native auto-summary of a quote (3 sentences for client email)
- [ ] AI-native "why is margin low?" line-by-line explanation
- [ ] Voice capture — desk agent dictates change, parser applies
- [ ] WhatsApp ingestion — forward a client message, SPI proposes itinerary
- [ ] Margin intelligence: per-quote, per-camp, per-agent trends + erosion alerts
- [ ] Conversion analytics with AI-generated win/loss summaries
- [ ] Real-time collaboration (cursors, comments, presence)
- [ ] Audit-grade signing (every commit cryptographically signed by user)
- [ ] Quote diff/compare view + restore from version
- [ ] Sustainability scoring (carbon per itinerary, eco-camp ratings)

### Phase 4 — Network effects (ongoing after differentiation)

The pillars start compounding. Switching cost gets serious.

- [ ] Supplier-side portal (camps log in, update rates, accept/decline holds)
- [ ] Cross-operator anonymized pattern intelligence ("operators in your tier...")
- [ ] Property reputation graph surfacing across all operators
- [ ] Publish engine logic openly (not data) — auditability as marketing
- [ ] Open API + Slack / Notion / email integrations
- [ ] Multi-language (FR / DE / PT / ES / SW)
- [ ] Mobile app for desk agents (capture changes on the move)
- [ ] Mobile app for travelers (offline itinerary)

### Phase 5 — Moats deepen (12+ months)

The product becomes the operating system. Competition isn't about features
anymore.

- [ ] Operator-tier benchmarks (anonymized) — your conversion rate vs peers
- [ ] AI senior-agent assistant ("look at this draft, what would you change?")
- [ ] Predictive margin intelligence (forecast next quarter from quote pipeline)
- [ ] Marketplace for vetted suppliers
- [ ] White-label for DMC consortia (sell SPI to them, not direct operators)

---

## Scorecard

_Manually maintained — update after each work session that ships something._

| Phase | Status | % done |
|---|---|---|
| **0 — Prototype** | shipped | **100%** |
| **1 — Foundation** | not started | 0% |
| **2 — Alpha** | blocked on phase 1 | 0% |
| **3 — Differentiation** | blocked on phase 2 | 0% |
| **4 — Network effects** | blocked on phase 3 | 0% |
| **5 — Moats deepen** | blocked on phase 4 | 0% |

**Overall progress to MVP (= Phase 1 + Phase 2 complete):** 0%
**Overall progress to defensible product (= through Phase 3):** ~10%
_(Phase 0 work counts toward Phase 3 surface area but not toward foundation.)_

---

## Pillar health (qualitative)

| Pillar | Current state | What's needed next |
|---|---|---|
| Deterministic pricing as IP | engine works, not yet published | Persistence, then write the public spec |
| Operator memory | observation log working, recommendations basic | Persist server-side, deepen recommendation engine |
| Cross-operator intelligence | not started | Needs Phase 4 — requires scale |
| Property reputation graph | not started | Needs Phase 4 — requires real data |
| Document UX | shipped Phase 0 — strong | Ongoing polish; don't regress |
| Speed of iteration | strong (small team, modern stack) | Maintain; don't add bureaucracy |
| Voice + flow capture | not started | Phase 3; needs real LLM first |

---

## Update protocol

This file is the ledger. Both of us update it after every meaningful
work session.

**When user asks for a status check** (any of: "where are we", "what's the
score", "roadmap status", "/status", "what's left"): assistant reads this
file, reports phase %, last completed checkboxes, what's blocked, what's
next. Keep it under 200 words unless drilling in.

**When a checkbox completes:** assistant proposes the line edit before
making it (so the user can correct interpretation). Only mark `[x]` after
the work is actually merged + verified, not after a single commit.

**When the plan changes:** add a new section dated under "Decisions" at
the bottom of this file. Don't rewrite history.

---

## Decisions

_Append-only log of significant direction changes._

- **2026-05-09 · Foundation laid.** Reframed from "compete with Wetu" to
  "build what operators would build themselves." Defined seven pillars.
  Set Phase 0 as shipped and Phase 1 as next.
