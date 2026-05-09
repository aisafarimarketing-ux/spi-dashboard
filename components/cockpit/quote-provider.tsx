"use client"

import * as React from "react"

import { useToast } from "@/components/ui/toast"
import {
  QUOTE as INITIAL_QUOTE,
  SIDEBAR_QUOTES as INITIAL_SIDEBAR_QUOTES,
  VERSIONS as INITIAL_VERSIONS,
  type SidebarQuote,
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
  Guest,
  Quote,
  QuoteTotals,
  RoomAssignment,
} from "@/lib/types"

// ── Activity feed ─────────────────────────────────────────────────────────

export type ActivityKind =
  | "version"
  | "rooming"
  | "guest-add"
  | "guest-remove"
  | "vat"
  | "margin"
  | "spi-applied"
  | "spi-dismissed"
  | "review"
  | "export"
  | "warning"

export interface ActivityEntry {
  id: string
  at: string
  kind: ActivityKind
  title: string
  detail?: string
  /** Optional money delta vs prior snapshot, in USD. */
  delta?: number
}

const ACTIVITY_CAP = 30

export type DrawerState =
  | { type: "guest"; guestId?: string }
  | { type: "rooming"; roomId?: string }
  | { type: "costs" }
  | null

export interface CreateQuoteInput {
  client: string
  origin: string
  start: string
  end: string
  pax: number
}

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

  // ── Sidebar / multi-quote ─────────────────────────────────────────────
  sidebarQuotes: SidebarQuote[]
  activeQuoteId: string
  switchToSidebarQuote: (id: string) => void
  createQuote: (input: CreateQuoteInput) => void

  // ── Operational state ─────────────────────────────────────────────────
  activity: ActivityEntry[]
  /** Push a custom activity entry. Most flows push automatically. */
  pushActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void
  /** ISO timestamp of the last commit that touched the quote. */
  lastSavedAt: string

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
  const { toast } = useToast()

  const [quote, setQuote] = React.useState<Quote>(INITIAL_QUOTE)
  const [versions, setVersions] =
    React.useState<VersionEntry[]>(INITIAL_VERSIONS)
  const [drawer, setDrawer] = React.useState<DrawerState>(null)
  const [sidebarQuotes, setSidebarQuotes] = React.useState<SidebarQuote[]>(
    INITIAL_SIDEBAR_QUOTES
  )
  const [activeQuoteId, setActiveQuoteId] = React.useState<string>(
    INITIAL_QUOTE.id
  )

  const [activity, setActivity] = React.useState<ActivityEntry[]>([])
  // Lazy init keeps SSR rendering an empty string (no relative-time text)
  // and the client gets a real timestamp on first render — no effect needed.
  const [lastSavedAt, setLastSavedAt] = React.useState<string>(() =>
    typeof window === "undefined" ? "" : new Date().toISOString()
  )

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

  // ── Activity feed ──────────────────────────────────────────────────────
  const pushActivity = React.useCallback(
    (entry: Omit<ActivityEntry, "id" | "at">) => {
      const next: ActivityEntry = {
        ...entry,
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: new Date().toISOString(),
      }
      setActivity((s) => [next, ...s].slice(0, ACTIVITY_CAP))
    },
    []
  )

  // ── Version commit ─────────────────────────────────────────────────────
  const commit = React.useCallback(
    (next: Quote, note: string, via: "spi" | "manual" = "manual") => {
      const prev = quoteTotals(quote)
      const nextTotals = quoteTotals(next)
      const delta = Math.round(nextTotals.totalSell - prev.totalSell)
      const author = quote.agent.name

      // Detect newly-introduced error-level validator flags so the operator
      // sees them immediately rather than discovering them later.
      const prevIds = new Set(prev.warnings.map((w) => w.id))
      const newErrors = nextTotals.warnings.filter(
        (w) => w.level === "error" && !prevIds.has(w.id)
      )
      if (newErrors.length > 0) {
        const headline = newErrors[0].message
        pushActivity({
          kind: "warning",
          title: `Warning detected · ${headline}`,
        })
        toast({
          title:
            newErrors.length === 1
              ? "Warning detected"
              : `${newErrors.length} warnings detected`,
          description: headline,
          tone: "warning",
        })
      }

      let nextVersionNumber = 0
      setVersions((vs) => {
        nextVersionNumber = vs.length + 1
        const promoted = vs.map((v) => ({
          ...v,
          label: v.label.replace(" · current", ""),
        }))
        const newest: VersionEntry = {
          id: `v${nextVersionNumber}-${Date.now()}`,
          label: `v${nextVersionNumber} · current`,
          author,
          authoredAt: "just now",
          delta,
          note,
          via,
        }
        return [newest, ...promoted]
      })
      setQuote(next)
      setLastSavedAt(new Date().toISOString())
      pushActivity({
        kind: "version",
        title: `v${nextVersionNumber} saved`,
        detail: note,
        delta,
      })
    },
    [quote, pushActivity, toast]
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
        pushActivity({
          kind: "guest-add",
          title: `${g.name} added`,
          detail: `${g.type} · ${g.nationality}`,
        })
      }
      const nextV = versions.length + 1
      commit(
        {
          ...quote,
          guests,
          travel: { ...quote.travel, pax: guests.length },
        },
        note
      )
      toast({
        title: exists ? "Guest updated" : "Guest added",
        description: `${g.name} · v${nextV} saved`,
        tone: "success",
      })
    },
    [commit, observe, pushActivity, quote, toast, versions.length]
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
        pushActivity({
          kind: "guest-remove",
          title: `${target.name} removed`,
        })
      }
      const nextV = versions.length + 1
      commit(
        {
          ...quote,
          guests,
          rooms,
          travel: { ...quote.travel, pax: guests.length },
        },
        note
      )
      if (target) {
        toast({
          title: "Guest removed",
          description: `${target.name} · v${nextV} saved`,
          tone: "info",
        })
      }
    },
    [commit, observe, pushActivity, quote, toast, versions.length]
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
      pushActivity({
        kind: "rooming",
        title: exists ? "Rooming updated" : "Room added",
        detail: room.arrangement,
      })
      const nextV = versions.length + 1
      commit({ ...quote, rooms }, note)
      toast({
        title: exists ? "Rooming updated" : "Room added",
        description: `${room.arrangement} · v${nextV} saved`,
        tone: "success",
      })
    },
    [commit, observe, pushActivity, quote, toast, versions.length]
  )

  const removeRoom = React.useCallback(
    (id: string, note: string) => {
      const rooms = quote.rooms.filter((r) => r.id !== id)
      const nextV = versions.length + 1
      commit({ ...quote, rooms }, note)
      toast({
        title: "Room removed",
        description: `v${nextV} saved`,
        tone: "info",
      })
    },
    [commit, quote, toast, versions.length]
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
        pushActivity({
          kind: "margin",
          title: `Margin set to ${(partial.marginPct * 100).toFixed(1)}%`,
          detail: `from ${(quote.marginPct * 100).toFixed(1)}%`,
        })
      }

      // Detect VAT-flag changes.
      if (partial.costs) {
        for (const next of partial.costs) {
          const prev = quote.costs.find((c) => c.id === next.id)
          if (!prev || prev.vatable === next.vatable) continue
          if (next.category === "Fuel" && next.vatable === false) {
            observe("fuel-non-vat-confirmed", { lineId: next.id })
            pushActivity({
              kind: "vat",
              title: "Fuel confirmed non-VAT",
              detail: next.label,
            })
          } else {
            observe("vat-flipped", {
              lineId: next.id,
              category: next.category,
              vatable: next.vatable,
            })
            pushActivity({
              kind: "vat",
              title: `VAT ${next.vatable ? "on" : "off"}: ${next.label}`,
            })
          }
        }
      }

      const nextV = versions.length + 1
      commit({ ...quote, ...partial }, note)
      toast({
        title: "Changes applied",
        description: `${note} · v${nextV} saved`,
        tone: "success",
      })
    },
    [commit, observe, pushActivity, quote, toast, versions.length]
  )

  const applyParsedQuote = React.useCallback(
    (next: Quote, note: string) => {
      observe("parsed-applied", { note })
      pushActivity({
        kind: "spi-applied",
        title: "Proposal applied",
        detail: note,
      })
      const nextV = versions.length + 1
      commit(next, note, "spi")
      toast({
        title: "Proposal applied",
        description: `${note} · v${nextV} saved`,
        tone: "success",
      })
    },
    [commit, observe, pushActivity, toast, versions.length]
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
      // Surface key UI-driven observations on the activity feed and as toasts.
      if (type === "parsed-dismissed") {
        pushActivity({ kind: "spi-dismissed", title: "Proposal dismissed" })
        toast({ title: "Proposal dismissed", tone: "info" })
      } else if (type === "proposal-approved") {
        toast({ title: "Proposal approved", tone: "success" })
      } else if (type === "proposal-declined") {
        toast({ title: "Proposal declined", tone: "info" })
      }
    },
    [observe, pushActivity, toast]
  )

  // ── Sidebar / multi-quote ────────────────────────────────────────────────
  const switchToSidebarQuote = React.useCallback(
    (id: string) => {
      if (id === activeQuoteId) {
        toast({
          title: "Already viewing this quote",
          description: id,
          tone: "info",
          durationMs: 1800,
        })
        return
      }
      const item = sidebarQuotes.find((s) => s.id === id)
      if (!item) return

      // Parse hints from sidebar copy: "× 6" → pax, "9 nts" → nights.
      const paxMatch = item.title.match(/×\s*(\d+)/)
      const nightsMatch = item.sub.match(/(\d+)\s*nt/i)
      const newPax = paxMatch ? Number(paxMatch[1]) : quote.travel.pax
      const newNights = nightsMatch
        ? Number(nightsMatch[1])
        : quote.travel.nights

      const next: Quote = {
        ...quote,
        id: item.id,
        reference: item.id.replace("Q-", "REF-") + "-DRAFT",
        client: item.title,
        status: item.status,
        travel: {
          ...quote.travel,
          pax: newPax,
          nights: newNights,
        },
      }
      setQuote(next)
      setActiveQuoteId(id)
      pushActivity({
        kind: "version",
        title: `Opened ${item.title}`,
        detail: item.id,
      })
      toast({
        title: `Opened ${item.title}`,
        description: `${item.id} · ${item.status}`,
        tone: "success",
      })
    },
    [activeQuoteId, pushActivity, quote, sidebarQuotes, toast]
  )

  const createQuote = React.useCallback(
    (input: CreateQuoteInput) => {
      const startMs = new Date(input.start).getTime()
      const endMs = new Date(input.end).getTime()
      const nights = Math.max(
        1,
        Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))
      )
      // Generate a reasonable next id from existing IDs.
      const numericIds = sidebarQuotes
        .map((s) => Number(s.id.replace(/\D/g, "")))
        .filter((n) => Number.isFinite(n))
      const nextNum = numericIds.length === 0 ? 1000 : Math.max(...numericIds) + 1
      const newId = `Q-${nextNum}`

      const newSidebarItem: SidebarQuote = {
        id: newId,
        title: input.client,
        sub: `New draft · ${nights} nts`,
        status: "Draft v1",
        pinned: false,
        updated: "just now",
        accent: "muted",
      }

      const fresh: Quote = {
        id: newId,
        reference: `${input.client.toUpperCase().replace(/\s+/g, "-")}-DRAFT`,
        client: input.client,
        origin: input.origin,
        status: "Draft v1",
        validUntil: input.end,
        agent: quote.agent,
        operator: quote.operator,
        travel: {
          start: input.start,
          end: input.end,
          nights,
          pax: input.pax,
        },
        currency: "USD",
        fx: { ...quote.fx, asOf: new Date().toISOString() },
        guests: [],
        rooms: [],
        itinerary: [],
        parkVisits: [],
        costs: [],
        marginPct: 0.22,
      }

      setSidebarQuotes((s) => [newSidebarItem, ...s])
      setQuote(fresh)
      setActiveQuoteId(newId)
      // Reset versions so the new quote starts clean.
      setVersions([
        {
          id: `v1-${Date.now()}`,
          label: "v1 · current",
          author: quote.agent.name,
          authoredAt: "just now",
          delta: 0,
          note: "New quote created",
          via: "manual",
        },
      ])
      pushActivity({
        kind: "version",
        title: `Created ${input.client}`,
        detail: `${newId} · ${input.pax} pax · ${nights} nts`,
      })
      toast({
        title: "Quote created",
        description: `${newId} · ${input.client}`,
        tone: "success",
      })
    },
    [pushActivity, quote.agent, quote.fx, quote.operator, sidebarQuotes, toast]
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
    sidebarQuotes,
    activeQuoteId,
    switchToSidebarQuote,
    createQuote,
    activity,
    pushActivity,
    lastSavedAt,
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
