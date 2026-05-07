"use client"

import * as React from "react"

import {
  QUOTE as INITIAL_QUOTE,
  VERSIONS as INITIAL_VERSIONS,
  type VersionEntry,
} from "@/lib/mock"
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

  /**
   * Apply a partial replacement of the quote (e.g., bulk cost-line + margin
   * change from the Costs drawer) and snapshot one version.
   */
  applyChanges: (partial: Partial<Quote>, note: string) => void

  /** Pure preview helper used by drawer footers. */
  preview: (next: Quote) => QuoteTotals
}

const QuoteContext = React.createContext<QuoteContextValue | null>(null)

export function useQuote(): QuoteContextValue {
  const ctx = React.useContext(QuoteContext)
  if (!ctx) {
    throw new Error("useQuote must be used inside <QuoteProvider>")
  }
  return ctx
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quote, setQuote] = React.useState<Quote>(INITIAL_QUOTE)
  const [versions, setVersions] =
    React.useState<VersionEntry[]>(INITIAL_VERSIONS)
  const [drawer, setDrawer] = React.useState<DrawerState>(null)

  const totals = React.useMemo(() => quoteTotals(quote), [quote])

  const openDrawer = React.useCallback(
    (state: DrawerState) => setDrawer(state),
    []
  )
  const closeDrawer = React.useCallback(() => setDrawer(null), [])

  const preview = React.useCallback((next: Quote) => quoteTotals(next), [])

  /** Snapshot the prior totals into a new version, then apply `next`. */
  const commit = React.useCallback(
    (next: Quote, note: string) => {
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
      commit(
        {
          ...quote,
          guests,
          travel: { ...quote.travel, pax: guests.length },
        },
        note
      )
    },
    [commit, quote]
  )

  const removeGuest = React.useCallback(
    (id: string, note: string) => {
      const guests = quote.guests.filter((g) => g.id !== id)
      const rooms = quote.rooms.map((r) => ({
        ...r,
        occupants: r.occupants.filter((oid) => oid !== id),
      }))
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
    [commit, quote]
  )

  const upsertRoom = React.useCallback(
    (room: RoomAssignment, note: string) => {
      const exists = quote.rooms.some((r) => r.id === room.id)
      // If occupants moved into this room, remove them from any other room.
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
      commit({ ...quote, rooms }, note)
    },
    [commit, quote]
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
      commit({ ...quote, ...partial }, note)
    },
    [commit, quote]
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
    preview,
  }

  return (
    <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
  )
}
