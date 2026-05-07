"use client"

import * as React from "react"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDashed,
  Compass,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import { aggregateByCategory } from "@/lib/pricing-engine"
import { cn } from "@/lib/utils"
import type { Quote, QuoteTotals } from "@/lib/types"
import { printQuote } from "./printable-quote"
import { useQuote } from "./quote-provider"

// ─── Formatting helpers ─────────────────────────────────────────────────────

const formatUSD = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n)

const formatDateLong = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const formatDayShort = (iso: string) => {
  const d = new Date(iso)
  return {
    weekday: d.toLocaleString("en-US", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleString("en-US", { month: "short" }),
  }
}

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) => d.toLocaleString("en-US", { month: "long" })
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}, ${e.getFullYear()}`
}

const guestTypeLabel = (t: string, count: number) => {
  const map: Record<string, [string, string]> = {
    Adult: ["adult", "adults"],
    Child: ["child", "children"],
    Infant: ["infant", "infants"],
  }
  const pair = map[t] ?? [t.toLowerCase(), `${t.toLowerCase()}s`]
  return `${count} ${count === 1 ? pair[0] : pair[1]}`
}

const categoryDisplayName: Record<string, string> = {
  Accommodation: "Accommodation",
  ParkFees: "Park & concession fees",
  ConcessionFees: "Concession",
  Vehicle: "Vehicle",
  Guide: "Guide",
  Fuel: "Fuel",
  Transfers: "Transfers",
  Activities: "Activities",
  Other: "Other",
}

// ─── Validation checklist ───────────────────────────────────────────────────

type ChecklistItem = {
  id: string
  label: string
  detail?: string
  /** Auto-derived from quote state. If undefined, item is manual-only. */
  passed?: boolean
}

function deriveChecklist(quote: Quote, totals: QuoteTotals): ChecklistItem[] {
  // 1. Guest nationality complete — flag any "Other" or missing.
  const missingNat = quote.guests.filter(
    (g) => !g.nationality || g.nationality === "Other"
  )
  // 2. Child ages complete.
  const missingAges = quote.guests.filter(
    (g) => g.type !== "Adult" && g.age === undefined
  )
  // 3. Rooming — every guest in a room.
  const placed = new Set(quote.rooms.flatMap((r) => r.occupants))
  const unroomed = quote.guests.filter((g) => !placed.has(g.id))
  // 4. Park fees applied — at least one park visit and no "no fee row" warning.
  const noParkVisits = quote.parkVisits.length === 0
  const parkFeeWarnings = totals.warnings.filter(
    (w) => w.scope === "parks" && w.level !== "info"
  )
  // 5. VAT logic — no VAT-related warnings.
  const vatWarnings = totals.warnings.filter(
    (w) =>
      (w.scope === "costs" &&
        (w.id.startsWith("fuel-vat-") || w.id.startsWith("parkfee-vat-")))
  )

  return [
    {
      id: "nationality",
      label: "Guest nationality complete",
      detail:
        missingNat.length === 0
          ? `All ${quote.guests.length} guests have a nationality on file.`
          : `${missingNat.length} guest${missingNat.length === 1 ? "" : "s"} need a nationality: ${missingNat.map((g) => g.name).join(", ")}.`,
      passed: missingNat.length === 0,
    },
    {
      id: "child-ages",
      label: "Child ages complete",
      detail:
        missingAges.length === 0
          ? "Every child and infant has an exact age — fee bands resolve cleanly."
          : `${missingAges.length} guest${missingAges.length === 1 ? "" : "s"} missing age: ${missingAges.map((g) => g.name).join(", ")}.`,
      passed: missingAges.length === 0,
    },
    {
      id: "rooming",
      label: "Rooming confirmed",
      detail:
        unroomed.length === 0
          ? `All ${quote.guests.length} pax placed across ${quote.rooms.length} arrangement${quote.rooms.length === 1 ? "" : "s"}.`
          : `${unroomed.length} guest${unroomed.length === 1 ? "" : "s"} not in a room: ${unroomed.map((g) => g.name).join(", ")}.`,
      passed: unroomed.length === 0,
    },
    {
      id: "park-fees",
      label: "Park fees applied",
      detail: noParkVisits
        ? "No park visits — none required for this itinerary."
        : parkFeeWarnings.length > 0
          ? `${parkFeeWarnings.length} fee row${parkFeeWarnings.length === 1 ? "" : "s"} unresolved — check guest pricing categories.`
          : `${quote.parkVisits.length} visits priced. Engine resolved every guest's category band.`,
      // Pass when nothing is unresolved. A park-free itinerary is valid.
      passed: parkFeeWarnings.length === 0,
    },
    {
      id: "vat",
      label: "VAT logic checked",
      detail:
        vatWarnings.length === 0
          ? "Fuel and park fees correctly non-VATable. VAT applied line-by-line on remaining lines."
          : `${vatWarnings.length} VAT mis-flag${vatWarnings.length === 1 ? "" : "s"} on cost lines — open Costs & VAT to correct.`,
      passed: vatWarnings.length === 0,
    },
    {
      id: "warnings",
      label: "Warnings reviewed",
      detail:
        totals.warnings.length === 0
          ? "Validator returned a clean quote."
          : `Validator surfaced ${totals.warnings.length} flag${totals.warnings.length === 1 ? "" : "s"}. Tick once you've reviewed each.`,
      // Manual — operator must acknowledge.
      passed: undefined,
    },
  ]
}

// ─── Inclusion / exclusion derivation ───────────────────────────────────────

function deriveInclusions(quote: Quote): string[] {
  const items: string[] = []

  // Stays
  for (const day of quote.itinerary) {
    if (!day.property || !day.stay) continue
    const board: Record<string, string> = {
      FB: "full board",
      FI: "fully inclusive",
      BB: "bed & breakfast",
      HB: "half board",
    }
    items.push(
      `${day.stay.nights} night${day.stay.nights === 1 ? "" : "s"} at ${day.property.name} on ${board[day.stay.boardBasis] ?? day.stay.boardBasis}`
    )
  }

  // Movement
  const charters = quote.itinerary.filter((d) => d.movement?.mode === "Charter")
  if (charters.length > 0) {
    items.push(
      `${charters.length} scheduled charter flight${charters.length === 1 ? "" : "s"} (${charters[0].movement?.operator})`
    )
  }
  const transfers = quote.itinerary.filter((d) => d.movement?.mode === "Road")
  if (transfers.length > 0) {
    items.push(
      `Private road transfers between camps with operator-vetted driver-guide`
    )
  }

  // Game-drive vehicle/guide if costed
  const hasVehicle = quote.costs.some((c) => c.category === "Vehicle")
  if (hasVehicle) {
    items.push("Dedicated 4×4 game-drive vehicle with senior driver-guide")
  }

  // Park & concession fees
  if (quote.parkVisits.length > 0) {
    items.push(
      "All national park entry fees and conservation-area concession fees"
    )
  }

  // Activities — collect uniques across the itinerary
  const seen = new Set<string>()
  for (const d of quote.itinerary) {
    for (const a of d.activities) {
      if (!seen.has(a)) {
        seen.add(a)
      }
    }
  }
  // Take a curated handful so the inclusions list reads cleanly client-side.
  const curated = Array.from(seen).slice(0, 4)
  for (const a of curated) {
    items.push(a)
  }

  // Bottled water + standard
  items.push("Bottled water on game drives and meet-and-greet at airport")

  return items
}

const STANDARD_EXCLUSIONS = [
  "International flights to/from Kilimanjaro (JRO)",
  "Travel and medical insurance (mandatory — proof required at check-in)",
  "Tanzania entry visa and yellow-fever certificate",
  "Premium beverages and wine pairings outside fully-inclusive plan",
  "Spa, laundry, and other personal expenses at camps",
  "Gratuities for guides, butlers, and camp staff (guideline provided separately)",
]

// ─── Main component ────────────────────────────────────────────────────────

export function ReviewAndSend({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { quote, totals, pushActivity } = useQuote()
  const { toast } = useToast()
  const [internalView, setInternalView] = React.useState(false)
  const [acknowledged, setAcknowledged] = React.useState<Record<string, boolean>>(
    {}
  )
  const [confirmSend, setConfirmSend] = React.useState(false)
  const [sending, setSending] = React.useState(false)

  // Reset state when the modal closes — kept on the close path rather than
  // an effect so we don't trigger a cascading render on open.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setInternalView(false)
      setAcknowledged({})
      setConfirmSend(false)
      setSending(false)
    }
    onOpenChange(next)
  }

  const handleSend = () => {
    setSending(true)
    // Simulate the round-trip — keeps Send feeling like a deliberate action.
    window.setTimeout(() => {
      setSending(false)
      setConfirmSend(false)
      onOpenChange(false)
      pushActivity({
        kind: "review",
        title: "Quote sent to client",
        detail: quote.client,
      })
      toast({
        title: "Review passed — quote sent",
        description: `${quote.reference} delivered to ${quote.client}`,
        tone: "success",
      })
    }, 700)
  }

  const checklist = React.useMemo(
    () => deriveChecklist(quote, totals),
    [quote, totals]
  )
  const inclusions = React.useMemo(() => deriveInclusions(quote), [quote])
  const breakdown = React.useMemo(() => aggregateByCategory(quote), [quote])

  const allPassed = checklist.every((item) =>
    item.passed === undefined ? acknowledged[item.id] === true : item.passed
  )

  const guestSummary = (() => {
    const adult = quote.guests.filter((g) => g.type === "Adult").length
    const child = quote.guests.filter((g) => g.type === "Child").length
    const infant = quote.guests.filter((g) => g.type === "Infant").length
    const parts = [
      adult && guestTypeLabel("Adult", adult),
      child && guestTypeLabel("Child", child),
      infant && guestTypeLabel("Infant", infant),
    ].filter(Boolean)
    return parts.join(" · ")
  })()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogDescription className="sr-only">
          Final review of the client-facing quote before sending. Includes
          itinerary, guests, rooms, inclusions, exclusions and total price.
        </DialogDescription>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="border-border/70 bg-surface/80 flex shrink-0 items-center justify-between gap-4 border-b px-5 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-[color-mix(in_oklch,var(--gold)_20%,var(--surface-2))] grid size-8 place-items-center rounded-md">
              <FileText className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
            </div>
            <div>
              <DialogTitle className="font-display text-foreground text-[15px] leading-tight tracking-tight">
                Review &amp; send
              </DialogTitle>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 font-mono text-[10.5px]">
                <span>{quote.id}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>{quote.reference}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>valid until {quote.validUntil}</span>
              </div>
            </div>
          </div>

          <div className="mr-9 flex items-center gap-2">
            <span
              className={cn(
                "text-[10.5px] tracking-[0.06em] uppercase transition-colors",
                internalView ? "text-foreground/85" : "text-muted-foreground/70"
              )}
            >
              {internalView ? (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3" />
                  Internal view
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="size-3" />
                  Client view
                </span>
              )}
            </span>
            <Switch
              checked={internalView}
              onCheckedChange={setInternalView}
              aria-label="Toggle internal-only costing breakdown"
            />
          </div>
        </div>

        {/* ── Body: paper + sidebar ───────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_340px]">
          {/* LEFT: paper-like client document */}
          <div className="scrollbar-thin bg-[color-mix(in_oklch,var(--gold)_3%,var(--surface))] min-h-0 overflow-y-auto p-6">
            <article className="border-border/70 bg-card mx-auto max-w-[760px] rounded-lg border px-8 py-8 shadow-[0_2px_18px_-6px_rgba(60,40,20,0.10)]">
              {/* Cover */}
              <header className="border-border/60 border-b pb-5">
                <div className="text-muted-foreground flex items-center gap-1.5 font-mono text-[10.5px] tracking-tight uppercase">
                  <Compass className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-3" />
                  {quote.operator.name} · {quote.operator.region}
                </div>
                <h2 className="font-display text-foreground mt-2 text-[28px] leading-[1.05] tracking-tight">
                  A safari for the {quote.client}
                </h2>
                <p className="text-muted-foreground mt-1 text-[12.5px] italic">
                  {quote.travel.nights} nights across the Northern Circuit ·
                  prepared for {quote.origin}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-x-6 gap-y-3">
                  <PaperField
                    icon={<CalendarDays className="size-3" />}
                    label="Dates"
                    value={formatDateRange(quote.travel.start, quote.travel.end)}
                  />
                  <PaperField
                    icon={<Users className="size-3" />}
                    label="Party"
                    value={`${quote.travel.pax} guests · ${guestSummary}`}
                  />
                  <PaperField
                    icon={<MapPin className="size-3" />}
                    label="Begins"
                    value={formatDateLong(quote.travel.start)}
                  />
                </dl>
              </header>

              {/* Itinerary */}
              <PaperSection title="Day by day" subtitle="Your journey">
                <ol className="space-y-4">
                  {quote.itinerary.map((d) => {
                    const date = formatDayShort(d.date)
                    return (
                      <li
                        key={d.day}
                        className="border-border/50 grid grid-cols-[60px_1fr] gap-4 border-l-2 pl-4"
                      >
                        <div className="text-muted-foreground/90 -ml-[27px] grid h-fit shrink-0 place-items-center font-mono text-[10px] tracking-tight">
                          <span className="border-border/60 bg-card text-foreground/80 mb-0.5 grid size-6 place-items-center rounded-full border text-[10.5px] font-semibold">
                            {d.day}
                          </span>
                          <span className="font-mono text-[9.5px] uppercase">
                            {date.month} {date.day}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-foreground text-[13.5px] font-medium leading-tight">
                            {d.title}
                          </div>
                          {d.property ? (
                            <div className="text-muted-foreground/90 mt-0.5 text-[12px] italic">
                              {d.property.name} · {d.property.category}
                              {d.stay
                                ? ` · ${d.stay.nights} night${d.stay.nights === 1 ? "" : "s"}`
                                : ""}
                            </div>
                          ) : null}
                          {d.activities.length > 0 && (
                            <ul className="text-muted-foreground mt-1.5 space-y-0.5 text-[11.5px] leading-snug">
                              {d.activities.map((a, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span
                                    aria-hidden
                                    className="bg-[color-mix(in_oklch,var(--gold)_45%,transparent)] mt-1.5 size-1 shrink-0 rounded-full"
                                  />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          )}
                          {d.movement && (
                            <div className="text-muted-foreground/80 mt-1.5 inline-flex items-center gap-1 font-mono text-[10.5px]">
                              <ArrowRight className="size-3" />
                              {d.movement.mode} · {d.movement.from} →{" "}
                              {d.movement.to}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </PaperSection>

              {/* Guests */}
              <PaperSection title="Travelling guests" subtitle="Your party">
                <ul className="grid grid-cols-2 gap-2.5">
                  {quote.guests.map((g) => (
                    <li
                      key={g.id}
                      className="border-border/60 bg-surface/40 rounded-md border px-3 py-2"
                    >
                      <div className="text-foreground text-[12.5px] font-medium leading-tight">
                        {g.name}
                      </div>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                        <span>{g.type}</span>
                        {g.age !== undefined && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="font-mono">age {g.age}</span>
                          </>
                        )}
                        <span className="text-muted-foreground/40">·</span>
                        <span>{g.nationality}</span>
                        {g.dietary && (
                          <Badge variant="muted" size="sm" className="font-medium">
                            {g.dietary}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </PaperSection>

              {/* Rooming */}
              <PaperSection title="Room arrangements" subtitle="Where you sleep">
                <ul className="space-y-2">
                  {quote.rooms.map((r) => {
                    const occupants = r.occupants
                      .map((id) => quote.guests.find((g) => g.id === id))
                      .filter((g): g is NonNullable<typeof g> => Boolean(g))
                    const arrLabel: Record<string, string> = {
                      Single: "Single room",
                      Double: "Double room",
                      Twin: "Twin room",
                      Triple: "Triple room",
                      Quad: "Quad room",
                      FamilyRoom: "Family room",
                      Interconnecting: "Interconnecting rooms",
                      TwoRoomsReplacingFamily: "Two interconnecting rooms",
                      ExtraBed: "Room with extra bed",
                      ChildSharing: "Room with child sharing",
                      CustomCampApproved: "Custom arrangement",
                    }
                    return (
                      <li
                        key={r.id}
                        className="border-border/60 flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground text-[12.5px] font-medium leading-tight">
                            {arrLabel[r.arrangement] ?? r.arrangement}
                          </div>
                          <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
                            {occupants.map((g) => g.name.split(" ")[0]).join(" & ")}
                          </div>
                        </div>
                        {r.notes && (
                          <span className="text-muted-foreground/85 max-w-[200px] truncate text-right text-[10.5px] italic">
                            {r.notes}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </PaperSection>

              {/* Inclusions */}
              <PaperSection title="What's included" subtitle="Your safari covers">
                <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                  {inclusions.map((it, i) => (
                    <li
                      key={i}
                      className="text-foreground/90 flex items-start gap-1.5 text-[12px] leading-snug"
                    >
                      <Check
                        className="text-[color-mix(in_oklch,var(--success)_55%,var(--ink))] mt-0.5 size-3 shrink-0"
                        strokeWidth={2.5}
                      />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </PaperSection>

              {/* Exclusions */}
              <PaperSection
                title="What's not included"
                subtitle="Please budget separately"
              >
                <ul className="grid grid-cols-2 gap-x-5 gap-y-1.5">
                  {STANDARD_EXCLUSIONS.map((it, i) => (
                    <li
                      key={i}
                      className="text-muted-foreground flex items-start gap-1.5 text-[12px] leading-snug"
                    >
                      <span
                        aria-hidden
                        className="bg-muted-foreground/40 mt-1.5 size-1 shrink-0 rounded-full"
                      />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </PaperSection>

              {/* Total */}
              <section className="mt-7">
                <div className="border-[color-mix(in_oklch,var(--gold)_30%,var(--border))] bg-[color-mix(in_oklch,var(--gold)_6%,var(--surface))] flex items-end justify-between gap-4 rounded-lg border px-5 py-4">
                  <div>
                    <div className="text-muted-foreground text-[10.5px] tracking-[0.08em] uppercase">
                      Total price · all-inclusive
                    </div>
                    <div className="font-display text-foreground mt-1 text-[34px] leading-none tracking-tight">
                      {formatUSD(totals.totalSell)}
                    </div>
                    <div className="text-muted-foreground mt-1.5 font-mono text-[11px]">
                      {formatUSD(totals.perPax)} per guest ·{" "}
                      {formatUSD(totals.perNight)} per night
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-[10.5px] tracking-[0.08em] uppercase">
                      Quoted in
                    </div>
                    <div className="text-foreground mt-1 font-mono text-[15px] tracking-tight">
                      {quote.currency}
                    </div>
                    <div className="text-muted-foreground/85 mt-1.5 text-[10.5px]">
                      Rate locked · valid until {quote.validUntil}
                    </div>
                  </div>
                </div>

                {/* Internal-only costing breakdown */}
                {internalView && (
                  <div className="border-border/70 bg-[color-mix(in_oklch,var(--ink)_3%,var(--surface-2))] mt-4 rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Lock className="text-muted-foreground size-3.5" />
                      <span className="text-foreground/85 text-[11px] font-semibold tracking-[0.06em] uppercase">
                        Internal · costing breakdown
                      </span>
                      <Badge variant="muted" size="sm" className="font-mono">
                        not visible to client
                      </Badge>
                    </div>

                    <dl className="grid grid-cols-4 gap-3">
                      <InternalKpi
                        label="Net cost"
                        value={formatUSD(totals.netCost)}
                        sub="pre-VAT"
                      />
                      <InternalKpi
                        label="VAT"
                        value={formatUSD(totals.vat)}
                        sub={`on ${formatUSD(totals.vatBreakdown.vatable)}`}
                      />
                      <InternalKpi
                        label="Margin"
                        value={formatUSD(totals.margin)}
                        sub={`${totals.marginPct.toFixed(1)}%`}
                        tone="success"
                      />
                      <InternalKpi
                        label="Confidence"
                        value={`${Math.round(totals.confidence * 100)}%`}
                        sub={
                          totals.warnings.length === 0
                            ? "clean"
                            : `${totals.warnings.length} flag${totals.warnings.length === 1 ? "" : "s"}`
                        }
                      />
                    </dl>

                    <div className="border-border/60 mt-4 border-t pt-3">
                      <div className="text-muted-foreground mb-2 text-[10.5px] tracking-[0.06em] uppercase">
                        By category
                      </div>
                      <ul className="space-y-1">
                        {breakdown.map((b) => (
                          <li
                            key={b.category}
                            className="flex items-center gap-2 text-[11.5px]"
                          >
                            <span className="text-foreground/85 min-w-[120px]">
                              {categoryDisplayName[b.category] ?? b.category}
                            </span>
                            <div className="bg-surface-2/60 relative h-1.5 flex-1 overflow-hidden rounded-full">
                              <span
                                className="bg-[color-mix(in_oklch,var(--gold)_45%,transparent)] absolute inset-y-0 left-0 rounded-full"
                                style={{ width: `${(b.share * 100).toFixed(2)}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground/80 w-12 text-right font-mono text-[10.5px]">
                              {Math.round(b.share * 100)}%
                            </span>
                            <span className="text-foreground/85 w-20 text-right font-mono text-[11px]">
                              {formatUSD(b.sell)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-muted-foreground/85 mt-3 flex items-start gap-1.5 text-[10.5px] leading-snug italic">
                      <ShieldCheck
                        className="mt-0.5 size-3 shrink-0"
                        style={{ color: "var(--success)" }}
                      />
                      Computed by lib/pricing-engine.ts. Margin and per-line VAT
                      never appear in the client-facing document.
                    </p>
                  </div>
                )}
              </section>

              {/* Closing */}
              <footer className="border-border/60 mt-7 flex items-center justify-between border-t pt-4">
                <div className="text-muted-foreground text-[11px] italic">
                  Prepared by {quote.agent.name} · {quote.agent.desk} desk
                </div>
                <div className="text-muted-foreground/80 font-mono text-[10.5px]">
                  {quote.id} · {quote.reference}
                </div>
              </footer>
            </article>
          </div>

          {/* RIGHT: validation rail */}
          <aside className="border-border/70 bg-surface-2/40 flex min-h-0 flex-col border-l">
            <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-3.5" />
                <h3 className="text-foreground/85 text-[11px] font-semibold tracking-[0.08em] uppercase">
                  Pre-send checklist
                </h3>
              </div>
              <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
                Everything below must clear before this quote can be sent.
              </p>

              <ul className="mt-3 space-y-1.5">
                {checklist.map((item) => {
                  const isManual = item.passed === undefined
                  const ok = isManual ? acknowledged[item.id] === true : item.passed
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "border-border/60 rounded-md border p-2.5 transition-colors",
                        ok
                          ? "bg-[color-mix(in_oklch,var(--success)_5%,var(--card))]"
                          : "bg-card"
                      )}
                    >
                      <button
                        type="button"
                        disabled={!isManual}
                        onClick={() =>
                          isManual &&
                          setAcknowledged((s) => ({
                            ...s,
                            [item.id]: !s[item.id],
                          }))
                        }
                        className={cn(
                          "group flex w-full items-start gap-2 text-left",
                          isManual ? "cursor-pointer" : "cursor-default"
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full transition-colors",
                            ok
                              ? "bg-[color-mix(in_oklch,var(--success)_18%,transparent)] text-[color-mix(in_oklch,var(--success)_60%,var(--ink))]"
                              : isManual
                                ? "border-border bg-card group-hover:border-foreground/40 border pulse-warning"
                                : "bg-[color-mix(in_oklch,var(--destructive)_15%,transparent)] text-[color-mix(in_oklch,var(--destructive)_60%,var(--ink))] pulse-warning"
                          )}
                        >
                          {ok ? (
                            <CheckCircle2 className="size-3" strokeWidth={2.5} />
                          ) : isManual ? (
                            <CircleDashed className="size-3" />
                          ) : (
                            <AlertTriangle className="size-2.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground/90 text-[12px] font-medium leading-tight">
                            {item.label}
                            {isManual && !ok && (
                              <span className="text-muted-foreground/80 ml-1.5 text-[10.5px] font-normal italic">
                                tap to confirm
                              </span>
                            )}
                          </div>
                          {item.detail && (
                            <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
                              {item.detail}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {/* Validator-surfaced warnings (read-only) */}
              {totals.warnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-muted-foreground text-[10.5px] tracking-[0.06em] uppercase">
                    Validator flags · {totals.warnings.length}
                  </h4>
                  <ul className="border-border/60 bg-card mt-1.5 max-h-[180px] overflow-y-auto rounded-md border">
                    {totals.warnings.map((w) => (
                      <li
                        key={w.id}
                        className="border-border/50 not-last:border-b px-2.5 py-1.5"
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            aria-hidden
                            className={cn(
                              "mt-1 size-1.5 shrink-0 rounded-full",
                              w.level === "error"
                                ? "bg-[color-mix(in_oklch,var(--destructive)_55%,transparent)]"
                                : w.level === "warning"
                                  ? "bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]"
                                  : "bg-[color-mix(in_oklch,var(--info)_55%,transparent)]"
                            )}
                          />
                          <div className="text-muted-foreground/95 text-[10.5px] leading-snug">
                            <span className="text-foreground/80 font-mono text-[9.5px] uppercase tracking-tight">
                              {w.scope}
                            </span>{" "}
                            · {w.message}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="border-border/70 bg-surface-2/60 flex shrink-0 items-center justify-between gap-3 border-t px-5 py-3">
          <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <ShieldCheck
              className="size-3.5 shrink-0"
              style={{ color: "var(--success)" }}
            />
            {allPassed ? (
              <span className="text-foreground/85">
                All checks cleared — ready to send.
              </span>
            ) : (
              <span>
                {checklist.filter((i) =>
                  i.passed === undefined ? acknowledged[i.id] : i.passed
                ).length}{" "}
                of {checklist.length} cleared. Resolve remaining items before
                sending.
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                pushActivity({
                  kind: "export",
                  title: "Export prepared",
                  detail: quote.reference,
                })
                toast({
                  title: "Opening print dialog",
                  description: "Choose “Save as PDF” to download.",
                  tone: "info",
                })
                printQuote()
              }}
              title="Opens the browser print dialog — choose Save as PDF"
            >
              <Download />
              Export PDF
            </Button>
            <Button
              size="sm"
              disabled={!allPassed}
              onClick={() => setConfirmSend(true)}
            >
              <Send />
              Send to client
            </Button>
          </div>
        </div>

        {/* Send confirmation — nested inside the review modal */}
        <SendConfirmation
          open={confirmSend}
          onOpenChange={(o) => !sending && setConfirmSend(o)}
          quote={quote}
          totalSell={totals.totalSell}
          sending={sending}
          onConfirm={handleSend}
        />
      </DialogContent>
    </Dialog>
  )
}

// ─── Send confirmation modal ───────────────────────────────────────────────

function SendConfirmation({
  open,
  onOpenChange,
  quote,
  totalSell,
  sending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote
  totalSell: number
  sending: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={!sending}
        className="!w-[min(440px,92vw)] !max-h-[unset]"
      >
        <DialogTitle className="sr-only">Confirm sending quote</DialogTitle>
        <DialogDescription className="sr-only">
          Final confirmation before this quote is sent to the client.
        </DialogDescription>

        <div className="px-5 pt-5 pb-3">
          <div className="bg-[color-mix(in_oklch,var(--gold)_18%,var(--surface-2))] grid size-9 place-items-center rounded-md">
            <Mail className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
          </div>
          <h2 className="font-display text-foreground mt-3 text-[18px] leading-tight tracking-tight">
            Send quote to {quote.client}?
          </h2>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            This delivers the client-facing quote — itinerary, inclusions, and
            total — to the address on file. Internal costing stays internal.
          </p>

          <dl className="border-border/60 bg-surface-2/40 mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border px-3 py-2.5">
            <div>
              <dt className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
                Reference
              </dt>
              <dd className="text-foreground/85 mt-0.5 font-mono text-[11.5px]">
                {quote.reference}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
                Total
              </dt>
              <dd className="font-display text-foreground mt-0.5 text-[14px]">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(totalSell)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
                Valid until
              </dt>
              <dd className="text-foreground/85 mt-0.5 font-mono text-[11.5px]">
                {quote.validUntil}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
                Party
              </dt>
              <dd className="text-foreground/85 mt-0.5 font-mono text-[11.5px]">
                {quote.travel.pax} pax · {quote.travel.nights} nts
              </dd>
            </div>
          </dl>
        </div>

        <div className="border-border/70 bg-surface-2/60 flex items-center justify-end gap-1.5 border-t px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={sending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button size="sm" disabled={sending} onClick={onConfirm}>
            {sending ? (
              <>
                <Loader2 className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send />
                Confirm &amp; send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Internal small components ─────────────────────────────────────────────

function PaperSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-3">
        {subtitle && (
          <div className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] font-mono text-[10px] tracking-[0.12em] uppercase">
            {subtitle}
          </div>
        )}
        <h3 className="font-display text-foreground mt-0.5 text-[18px] leading-tight tracking-tight">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

function PaperField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="text-muted-foreground inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase">
        {icon}
        {label}
      </dt>
      <dd className="text-foreground mt-0.5 text-[12.5px] leading-snug">
        {value}
      </dd>
    </div>
  )
}

function InternalKpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone?: "success"
}) {
  return (
    <div className="border-border/60 bg-card rounded-md border px-2.5 py-2">
      <div className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-foreground mt-0.5 text-[18px] leading-none tracking-tight",
          tone === "success" &&
            "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
        )}
      >
        {value}
      </div>
      <div className="text-muted-foreground/80 mt-1 font-mono text-[10.5px]">
        {sub}
      </div>
    </div>
  )
}
