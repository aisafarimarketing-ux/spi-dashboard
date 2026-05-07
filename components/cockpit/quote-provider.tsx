"use client"

import * as React from "react"

import {
  QUOTE as INITIAL_QUOTE,
  VERSIONS as INITIAL_VERSIONS,
  type VersionEntry,
} from "@/lib/mock"
import {
  defaultMemoryState,
  loadMemory,
  persistMemory,
  recordObservation as recordObservationOn,
  clearMemory as clearMemoryOn,
  setMemoryScope as setMemoryScopeOn,
  type MemoryScope,
  type Observation,
  type ObservationType,
  type OperatorMemoryState,
} from "@/lib/operator-memory"
import { quoteTotals } from "@/lib/pricing-engine"
import type {
  CostLine,
  Guest,
  Quote,
  QuoteTotals,
  RoomAssignment,
} from "@/lib/types"

export type DrawerState =
  | { type: "guest"; guestId?: string }
  | { type: "rooming"; roomId?: string }
  | { type: "costs" }
  | null

interface QuoteContextValue {
  quote: Quote
  totals: QuoteTotals
  versions: VersionEntry[]
  drawer: DrawerState

  openDrawer: (state: DrawerState) => void
  closeDrawer: () => void

  upsertGuest: (g: Guest, note: string) => void
  removeGuest: (id: string, note: string) => void

  upsertRoom: (room: RoomAssignment, note: string) => void
  removeRoom: (id: string, note: string) => void

  applyChanges: (partial: Partial<Quote>, note: string) => void
  applyParsedQuote: (next: Quote, note: string) => void

  preview: (next: Quote) => QuoteTotals

  // ── Memory ────────────────────────────────────────────────────────────
  memory: OperatorMemoryState
  /** True until the provider has hydrated memory from localStorage. */
  memoryReady: boolean
  setMemoryScope: (scope: MemoryScope) => void
  clearMemory: (kind?: "all" | "session") => void
  /**
   * Manually record an observation. Auto-recording also happens inside
   * the provider's mutators — use this for proposal accept/decline events
   * driven from the UI.
   */
  recordObservation: (
    type: ObservationType,
    context?: Observation["context"]
  ) => void
}

const QuoteContext = React.createContext<QuoteContextValue | null>(null)

export function useQuote(): QuoteContextValue {
  const ctx = React.useContext(QuoteContext)
  if (!ctx) {
    throw new Error("useQuote must be used inside <QuoteProvider>")
  }
  return ctx
}

// Empty placeholder until the client-side load runs. SSR renders this.
const EMPTY_MEMORY: OperatorMemoryState = { scope: "workspace", observations: [] }

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quote, setQuote] = React.useState<Quote>(INITIAL_QUOTE)
  const [versions, setVersions] =
    React.useState<VersionEntry[]>(INITIAL_VERSIONS)
  const [drawer, setDrawer] = React.useState<DrawerState>(null)

  const [memory, setMemory] = React.useState<OperatorMemoryState>(EMPTY_MEMORY)
  const [memoryReady, setMemoryReady] = React.useState(false)

  // Hydrate memory from localStorage (or seed) after mount.
  React.useEffect(() => {
    const loaded = loadMemory() ?? defaultMemoryState()
    setMemory(loaded)
    setMemoryReady(true)
  }, [])

  // Persist on change, but skip the initial empty state.
  React.useEffect(() => {
    if (!memoryReady) return
    persistMemory(memory)
  }, [memory, memoryReady])

  const totals = React.useMemo(() => quoteTotals(quote), [quote])

  const openDrawer = React.useCallback(
    (state: DrawerState) => setDrawer(state),
    []
  )
  const closeDrawer = React.useCallback(() => setDrawer(null), [])

  const preview = React.useCallback((next: Quote) => quoteTotals(next), [])

  // ── Observation helpers ────────────────────────────────────────────────
  const observe = React.useCallback(
    (type: ObservationType, context: Observation["context"] = {}) => {
      setMemory((m) =>
        recordObservationOn(m, { type, quoteId: quote.id, context })
      )
    },
    [quote.id]
  )

  // ── Version commit ─────────────────────────────────────────────────────
  const commit = React.useCallback(
    (next: Quote, note: string, via: "spi" | "manual" = "manual") => {
      const prevTotal = quoteTotals(quote).totalSell
      const nextTotal = quoteTotals(next).totalSell
      const delta = Math.round(nextTotal - prevTotal)
      const author = quote.agent.name

      setVersions((vs) => {
        const nextNumber = vs.length + 1
        const promoted = vs.map((v) => ({
          ...v,
          label: v.label.replace(" · current", ""),
        }))
        const newest: VersionEntry = {
          id: `v${nextNumber}-${Date.now()}`,
          label: `v${nextNumber} · current`,
          author,
          authoredAt: "just now",
          delta,
          note,
          via,
        }
        return [newest, ...promoted]
      })
      setQuote(next)
    },
    [quote]
  )

  const upsertGuest = React.useCallback(
    (g: Guest, note: string) => {
      const exists = quote.guests.some((x) => x.id === g.id)
      const guests = exists
        ? quote.guests.map((x) => (x.id === g.id ? g : x))
        : [...quote.guests, g]
      if (!exists) {
        observe("guest-added", {
          type: g.type,
          nationality: g.nationality,
          age: g.age,
          pricingCategory: g.pricingCategory,
        })
      }
      commit(
        {
          ...quote,
          guests,
          travel: { ...quote.travel, pax: guests.length },
        },
        note
      )
    },
    [commit, observe, quote]
  )

  const removeGuest = React.useCallback(
    (id: string, note: string) => {
      const target = quote.guests.find((g) => g.id === id)
      const guests = quote.guests.filter((g) => g.id !== id)
      const rooms = quote.rooms.map((r) => ({
        ...r,
        occupants: r.occupants.filter((oid) => oid !== id),
      }))
      if (target) {
        observe("guest-removed", {
          type: target.type,
          nationality: target.nationality,
        })
      }
      commit(
        {
          ...quote,
          guests,
          rooms,
          travel: { ...quote.travel, pax: guests.length },
        },
        note
      )
    },
    [commit, observe, quote]
  )

  const upsertRoom = React.useCallback(
    (room: RoomAssignment, note: string) => {
      const exists = quote.rooms.some((r) => r.id === room.id)
      const cleansedOthers = quote.rooms.map((r) =>
        r.id === room.id
          ? r
          : {
              ...r,
              occupants: r.occupants.filter(
                (oid) => !room.occupants.includes(oid)
              ),
            }
      )
      const rooms = exists
        ? cleansedOthers.map((r) => (r.id === room.id ? room : r))
        : [...cleansedOthers, room]
      const previous = quote.rooms.find((r) => r.id === room.id)
      if (room.policy.source === "operator-override") {
        observe("rooming-override", {
          from: previous?.arrangement ?? "new",
          to: room.arrangement,
          confidence: room.policy.confidence,
        })
      }
      commit({ ...quote, rooms }, note)
    },
    [commit, observe, quote]
  )

  const removeRoom = React.useCallback(
    (id: string, note: string) => {
      const rooms = quote.rooms.filter((r) => r.id !== id)
      commit({ ...quote, rooms }, note)
    },
    [commit, quote]
  )

  const applyChanges = React.useCallback(
    (partial: Partial<Quote>, note: string) => {
      // Detect margin change → record margin-set, possibly discount-applied.
      if (
        partial.marginPct !== undefined &&
        partial.marginPct !== quote.marginPct
      ) {
        observe("margin-set", {
          pct: partial.marginPct,
          prevPct: quote.marginPct,
        })
        if (partial.marginPct < quote.marginPct) {
          observe("discount-applied", {
            pct: quote.marginPct - partial.marginPct,
            from: quote.marginPct,
            to: partial.marginPct,
          })
        }
      }

      // Detect VAT-flag changes.
      if (partial.costs) {
        for (const next of partial.costs) {
          const prev = quote.costs.find((c) => c.id === next.id)
          if (!prev || prev.vatable === next.vatable) continue
          if (next.category === "Fuel" && next.vatable === false) {
            observe("fuel-non-vat-confirmed", { lineId: next.id })
          } else {
            observe("vat-flipped", {
              lineId: next.id,
              category: next.category,
              vatable: next.vatable,
            })
          }
        }
      }

      commit({ ...quote, ...partial }, note)
    },
    [commit, observe, quote]
  )

  const applyParsedQuote = React.useCallback(
    (next: Quote, note: string) => {
      observe("parsed-applied", { note })
      commit(next, note, "spi")
    },
    [commit, observe]
  )

  const setMemoryScope = React.useCallback((scope: MemoryScope) => {
    setMemory((m) => setMemoryScopeOn(m, scope))
  }, [])

  const clearMemory = React.useCallback(
    (kind: "all" | "session" = "all") => {
      setMemory((m) => clearMemoryOn(m, kind))
    },
    []
  )

  const recordObservation = React.useCallback(
    (type: ObservationType, context: Observation["context"] = {}) => {
      observe(type, context)
    },
    [observe]
  )

  const value: QuoteContextValue = {
    quote,
    totals,
    versions,
    drawer,
    openDrawer,
    closeDrawer,
    upsertGuest,
    removeGuest,
    upsertRoom,
    removeRoom,
    applyChanges,
    applyParsedQuote,
    preview,
    memory,
    memoryReady,
    setMemoryScope,
    clearMemory,
    recordObservation,
  }

  return (
    <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
  )
}
