// Operator Memory layer. Local-only. SPI never compares across operators
// or surfaces memory outside the workspace.
//
// Memory holds *observations* — discrete events recorded as the operator
// works. Recommendations are derived from observations on the fly; the
// engine itself stores no opinions.

export type MemoryScope = "off" | "quote-only" | "workspace"

export type ObservationType =
  | "margin-set"
  | "discount-applied"
  | "vat-flipped"
  | "fuel-non-vat-confirmed"
  | "rooming-override"
  | "guest-added"
  | "guest-removed"
  | "proposal-approved"
  | "proposal-declined"
  | "parsed-applied"
  | "parsed-dismissed"
  | "camp-selected"

export interface Observation {
  id: string
  type: ObservationType
  /** ISO timestamp */
  timestamp: string
  /** Quote id this observation came from. null = workspace-level. */
  quoteId: string | null
  context: Record<string, string | number | boolean | undefined>
}

export interface OperatorMemoryState {
  scope: MemoryScope
  observations: Observation[]
}

const STORAGE_KEY = "spi-operator-memory:v1"

/** Load persisted memory. Returns null on server or if unavailable. */
export function loadMemory(): OperatorMemoryState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OperatorMemoryState
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.observations)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function persistMemory(state: OperatorMemoryState): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota exceeded, private browsing — silent */
  }
}

export function defaultMemoryState(): OperatorMemoryState {
  return {
    scope: "workspace",
    observations: seedObservations(),
  }
}

/**
 * Append an observation. Returns the new state.
 * Skipped if scope is "off". Quote-only scope still records (so toggling
 * does not lose data) — what changes is which observations are active for
 * recommendations, see `activeObservations`.
 */
export function recordObservation(
  state: OperatorMemoryState,
  partial: Omit<Observation, "id" | "timestamp">
): OperatorMemoryState {
  if (state.scope === "off") return state

  const obs: Observation = {
    ...partial,
    id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  }

  return { ...state, observations: [...state.observations, obs] }
}

/** Filter observations the engine should currently see. */
export function activeObservations(
  state: OperatorMemoryState,
  currentQuoteId: string
): Observation[] {
  if (state.scope === "off") return []
  if (state.scope === "quote-only") {
    return state.observations.filter((o) => o.quoteId === currentQuoteId)
  }
  return state.observations
}

export function setMemoryScope(
  state: OperatorMemoryState,
  scope: MemoryScope
): OperatorMemoryState {
  return { ...state, scope }
}

/** Clear memory. "all" wipes everything; "session" keeps seed observations. */
export function clearMemory(
  state: OperatorMemoryState,
  kind: "all" | "session" = "all"
): OperatorMemoryState {
  if (kind === "all") {
    return { ...state, observations: [] }
  }
  return {
    ...state,
    observations: state.observations.filter((o) => o.id.startsWith("seed-")),
  }
}

// ── Pattern helpers (pure, derived) ──────────────────────────────────────

export function marginStats(observations: Observation[]) {
  const values = observations
    .filter((o) => o.type === "margin-set" && typeof o.context.pct === "number")
    .map((o) => o.context.pct as number)
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
  }
}

export function fuelNonVatCount(observations: Observation[]): number {
  return observations.filter((o) => o.type === "fuel-non-vat-confirmed").length
}

export function familyToDoublesCount(observations: Observation[]): number {
  return observations.filter(
    (o) =>
      o.type === "rooming-override" &&
      o.context.from === "FamilyRoom" &&
      o.context.to === "TwoRoomsReplacingFamily"
  ).length
}

export function discountStats(observations: Observation[]) {
  const values = observations
    .filter(
      (o) =>
        o.type === "discount-applied" && typeof o.context.pct === "number"
    )
    .map((o) => o.context.pct as number)
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  return { count: values.length, min, max, avg }
}

export function campSelectionFrequency(
  observations: Observation[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const o of observations) {
    if (o.type !== "camp-selected" || typeof o.context.camp !== "string") continue
    map.set(o.context.camp, (map.get(o.context.camp) ?? 0) + 1)
  }
  return map
}

/** A coarse, readable summary for the UI memory chip. */
export function memorySummary(state: OperatorMemoryState): string {
  if (state.scope === "off") return "memory off"
  const scopeLabel =
    state.scope === "quote-only" ? "quote only" : "workspace"
  return `memory · ${scopeLabel} · ${state.observations.length}`
}

// ── Seed (mock historical observations) ──────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function seedObservations(): Observation[] {
  const arr: Observation[] = []

  // Margin history — clustered 22–24%
  ;[0.22, 0.225, 0.235, 0.24, 0.23].forEach((pct, i) =>
    arr.push({
      id: `seed-margin-${i}`,
      type: "margin-set",
      timestamp: daysAgo(7 + i * 4),
      quoteId: `Q-282${i}`,
      context: { pct, region: "Tanzania" },
    })
  )

  // Fuel non-VAT confirmations
  ;[0, 1, 2, 3].forEach((i) =>
    arr.push({
      id: `seed-fuel-${i}`,
      type: "fuel-non-vat-confirmed",
      timestamp: daysAgo(8 + i * 5),
      quoteId: `Q-281${i}`,
      context: {},
    })
  )

  // Family-to-doubles overrides
  ;[0, 1, 2].forEach((i) =>
    arr.push({
      id: `seed-rooming-${i}`,
      type: "rooming-override",
      timestamp: daysAgo(12 + i * 7),
      quoteId: `Q-280${i}`,
      context: { from: "FamilyRoom", to: "TwoRoomsReplacingFamily" },
    })
  )

  // Discount events on closed quotes
  ;[0.04, 0.035, 0.045].forEach((pct, i) =>
    arr.push({
      id: `seed-discount-${i}`,
      type: "discount-applied",
      timestamp: daysAgo(20 + i * 10),
      quoteId: `Q-279${i}`,
      context: { pct },
    })
  )

  // Camp selections — Lemala Mpingo Ridge appears twice (preferred camp signal)
  ;[
    "Lemala Mpingo Ridge",
    "Sayari Camp",
    "Lemala Mpingo Ridge",
    "Sanctuary Kichakani",
    "Lemala Ngorongoro",
  ].forEach((camp, i) =>
    arr.push({
      id: `seed-camp-${i}`,
      type: "camp-selected",
      timestamp: daysAgo(15 + i * 8),
      quoteId: `Q-280${i}`,
      context: { camp },
    })
  )

  return arr
}
