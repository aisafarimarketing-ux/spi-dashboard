"use client"

import * as React from "react"
import {
  AlertTriangle,
  CircleDollarSign,
  Fuel,
  ShieldCheck,
  TreePine,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  concessionFeesForQuote,
  lineSubtotal,
  parkFeesForVisit,
  vatOnLine,
} from "@/lib/pricing-engine"
import { CONCESSION_FEES_PPPN } from "@/lib/rules"
import type { CostCategory, CostLine, Quote } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useQuote } from "../quote-provider"
import { ImpactFooterContent } from "./impact"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const CATEGORY_ORDER: CostCategory[] = [
  "Accommodation",
  "Vehicle",
  "Guide",
  "Fuel",
  "Transfers",
  "Activities",
  "ParkFees",
  "ConcessionFees",
  "Other",
]

const CATEGORY_LABEL: Record<CostCategory, string> = {
  Accommodation: "Accommodation",
  Vehicle: "Vehicle",
  Guide: "Guide",
  Fuel: "Fuel",
  Transfers: "Transfers",
  Activities: "Activities",
  ParkFees: "Park fees",
  ConcessionFees: "Concession fees",
  Other: "Other",
}

export function CostsDrawer() {
  const { quote, totals, preview, applyChanges, closeDrawer } = useQuote()

  // Draft state mirrors the quote's costs and margin.
  const [draftCosts, setDraftCosts] = React.useState<CostLine[]>(
    () => quote.costs
  )
  const [draftMarginPct, setDraftMarginPct] = React.useState<number>(
    () => quote.marginPct
  )

  // Re-init when quote changes externally (e.g. via another drawer).
  React.useEffect(() => {
    setDraftCosts(quote.costs)
    setDraftMarginPct(quote.marginPct)
  }, [quote.costs, quote.marginPct])

  const updateLine = (id: string, patch: Partial<CostLine>) => {
    setDraftCosts((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const candidate: Quote = React.useMemo(
    () => ({
      ...quote,
      costs: draftCosts,
      marginPct: draftMarginPct,
    }),
    [draftCosts, draftMarginPct, quote]
  )

  const candidateTotals = React.useMemo(() => preview(candidate), [
    candidate,
    preview,
  ])

  // Group lines by category.
  const grouped = React.useMemo(() => {
    const map = new Map<CostCategory, CostLine[]>()
    for (const line of draftCosts) {
      const arr = map.get(line.category) ?? []
      arr.push(line)
      map.set(line.category, arr)
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      lines: map.get(c)!,
    }))
  }, [draftCosts])

  // Park entry fees — read-only, derived deterministically.
  const parkRows = React.useMemo(() => {
    return quote.parkVisits.map((v) => ({
      visit: v,
      total: parkFeesForVisit(v, quote.guests),
    }))
  }, [quote.parkVisits, quote.guests])
  const parkTotal = parkRows.reduce((s, r) => s + r.total, 0)

  // Concession fees — derived from itinerary regions.
  const concessionTotal = React.useMemo(
    () => concessionFeesForQuote(quote),
    [quote]
  )

  // Fuel quick-toggle: flips every Fuel line at once.
  const fuelLines = draftCosts.filter((c) => c.category === "Fuel")
  const fuelAllNonVat = fuelLines.every((l) => !l.vatable)
  const flipFuelVat = (nextVatable: boolean) => {
    setDraftCosts((cs) =>
      cs.map((c) => (c.category === "Fuel" ? { ...c, vatable: nextVatable } : c))
    )
  }

  // Park fees lines (cost-line representations of fees, e.g. crater service).
  const parkLines = draftCosts.filter((c) => c.category === "ParkFees")
  const parkLineVATFlagged = parkLines.some((l) => l.vatable)

  const dirty =
    JSON.stringify(draftCosts) !== JSON.stringify(quote.costs) ||
    draftMarginPct !== quote.marginPct

  const handleApply = () => {
    applyChanges(
      { costs: draftCosts, marginPct: draftMarginPct },
      buildChangeNote(quote, draftCosts, draftMarginPct)
    )
    closeDrawer()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start gap-2.5">
            <div className="bg-surface-2 grid size-8 shrink-0 place-items-center rounded-md">
              <CircleDollarSign className="text-foreground/80 size-4" />
            </div>
            <div className="min-w-0">
              <SheetTitle>Costs & VAT</SheetTitle>
              <SheetDescription>
                Margin, line-by-line VATable flags, fuel rule, and engine-derived
                park &amp; concession fees. Pricing is deterministic — apply
                creates a versioned snapshot.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {/* Margin */}
          <FormSection title="Operator margin">
            <div className="border-border/70 bg-surface flex items-center gap-3 rounded-md border px-3 py-2.5">
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-foreground text-[24px] leading-none tracking-tight">
                    {(draftMarginPct * 100).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    of total sell
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={45}
                  step={0.5}
                  value={(draftMarginPct * 100).toFixed(1)}
                  onChange={(e) =>
                    setDraftMarginPct(Number(e.target.value) / 100)
                  }
                  className="mt-2 w-full accent-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]"
                  aria-label="Operator margin percentage"
                />
                <div className="text-muted-foreground/70 mt-1 flex justify-between font-mono text-[10px]">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                  <span>45%</span>
                </div>
              </div>
              <div className="border-border/60 ml-2 border-l pl-3 text-right">
                <div className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
                  Margin
                </div>
                <div className="text-foreground font-mono text-[14px] font-medium">
                  {formatUSD(candidateTotals.margin)}
                </div>
              </div>
            </div>
          </FormSection>

          {/* Quick toggles */}
          <FormSection title="Rules">
            <div className="grid gap-2">
              <RuleRow
                icon={Fuel}
                title="Fuel — non-VATable"
                detail="Tanzania VAT does not apply to fuel. Toggling flips every Fuel cost line."
                checked={fuelAllNonVat}
                onCheckedChange={(c) => flipFuelVat(!c)}
              />
              <RuleRow
                icon={TreePine}
                title="Park fees — non-VATable"
                detail="Government park & concession fees are exempt. Toggling unflags every ParkFees line."
                checked={!parkLineVATFlagged}
                onCheckedChange={(c) => {
                  setDraftCosts((cs) =>
                    cs.map((cl) =>
                      cl.category === "ParkFees" ? { ...cl, vatable: !c } : cl
                    )
                  )
                }}
              />
            </div>
          </FormSection>

          {/* Cost lines grouped by category */}
          <FormSection
            title="Cost lines"
            aside={
              <Badge variant="muted" size="sm" className="font-mono">
                {draftCosts.length} lines
              </Badge>
            }
          >
            <div className="space-y-3">
              {grouped.map(({ category, lines }) => {
                const categorySubtotal = lines.reduce(
                  (s, l) => s + lineSubtotal(l) + vatOnLine(l),
                  0
                )
                return (
                  <div
                    key={category}
                    className="border-border/70 rounded-md border"
                  >
                    <div className="border-border/60 bg-surface-2/40 flex items-center justify-between border-b px-2.5 py-1.5">
                      <span className="text-foreground/80 text-[11px] font-semibold tracking-[0.06em] uppercase">
                        {CATEGORY_LABEL[category]}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {formatUSD(categorySubtotal)}
                      </span>
                    </div>
                    <ul>
                      {lines.map((line, idx) => {
                        const sub = lineSubtotal(line)
                        const vat = vatOnLine(line)
                        const isLast = idx === lines.length - 1
                        return (
                          <li
                            key={line.id}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-2",
                              !isLast && "border-border/60 border-b"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-foreground/90 truncate text-[12px] leading-tight">
                                {line.label}
                              </div>
                              <div className="text-muted-foreground/80 mt-0.5 flex items-center gap-1.5 text-[10.5px]">
                                <span className="font-mono">
                                  ×{line.qty}
                                </span>
                                <span>· {line.unit.replace(/per/g, "/")}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                value={line.netRate}
                                onChange={(e) =>
                                  updateLine(line.id, {
                                    netRate: Number(e.target.value) || 0,
                                  })
                                }
                                aria-label={`${line.label} net rate`}
                                className="h-7 w-20 px-1.5 text-right font-mono text-[11.5px]"
                              />
                              <span className="text-muted-foreground/70 font-mono text-[10.5px]">
                                =
                              </span>
                              <span className="text-foreground/85 w-16 text-right font-mono text-[11.5px]">
                                {formatUSD(sub)}
                              </span>
                            </div>
                            <div
                              className="flex w-[58px] shrink-0 items-center gap-1.5"
                              title={
                                line.vatable
                                  ? `+VAT ${formatUSD(vat)}`
                                  : "non-VAT"
                              }
                            >
                              <Switch
                                checked={line.vatable}
                                onCheckedChange={(checked) =>
                                  updateLine(line.id, { vatable: checked })
                                }
                                aria-label={`${line.label} VATable`}
                              />
                              <span
                                className={cn(
                                  "font-mono text-[10px]",
                                  line.vatable
                                    ? "text-foreground/70"
                                    : "text-muted-foreground/70"
                                )}
                              >
                                {line.vatable ? "VAT" : "no"}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </FormSection>

          {/* Park fees — read-only engine output */}
          <FormSection
            title="Park entry fees"
            aside={
              <span className="text-muted-foreground font-mono text-[11px]">
                {formatUSD(parkTotal)}
              </span>
            }
          >
            <div className="border-border/70 bg-surface rounded-md border">
              {parkRows.map((r, idx) => (
                <div
                  key={r.visit.id}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 text-[11.5px]",
                    idx !== parkRows.length - 1 && "border-border/60 border-b"
                  )}
                >
                  <span className="text-foreground/85 flex-1">
                    {r.visit.park}{" "}
                    <span className="text-muted-foreground/80">
                      · {r.visit.durationDays}d
                    </span>
                  </span>
                  <span className="text-muted-foreground/70 font-mono text-[10.5px]">
                    {quote.travel.pax} pax
                  </span>
                  <span className="text-foreground font-mono">
                    {formatUSD(r.total)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-[11px] leading-snug">
              Park fees are computed from the deterministic engine using each
              guest's pricing category × age band. Not VATable.
            </p>
          </FormSection>

          {/* Concession fees — read-only */}
          <FormSection
            title="Concession fees"
            aside={
              <span className="text-muted-foreground font-mono text-[11px]">
                {formatUSD(concessionTotal)}
              </span>
            }
          >
            <ul className="border-border/70 bg-surface divide-border/60 rounded-md border divide-y">
              {Object.entries(CONCESSION_FEES_PPPN).map(([code, rate]) => {
                if (!rate) return null
                const nights = quote.itinerary.reduce((sum, day) => {
                  const codeFromRegion =
                    day.region === "Tarangire"
                      ? "TARANGIRE"
                      : day.region === "Ngorongoro"
                        ? "NGORONGORO"
                        : day.region === "Serengeti"
                          ? "SERENGETI"
                          : null
                  return codeFromRegion === code
                    ? sum + (day.stay?.nights ?? 0)
                    : sum
                }, 0)
                if (nights === 0) return null
                const sub = rate * quote.travel.pax * nights
                return (
                  <li
                    key={code}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-[11.5px]"
                  >
                    <span className="text-foreground/85 flex-1">{code}</span>
                    <span className="text-muted-foreground/70 font-mono text-[10.5px]">
                      ${rate} · {nights}n · {quote.travel.pax} pax
                    </span>
                    <span className="text-foreground font-mono">
                      {formatUSD(sub)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </FormSection>

          {/* Validator-style note */}
          {candidateTotals.warnings.filter((w) => w.scope === "costs").length >
            0 && (
            <div className="border-border/60 bg-[color-mix(in_oklch,var(--warning)_8%,var(--surface))] flex items-start gap-2 rounded-md border px-2.5 py-2">
              <AlertTriangle className="text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))] mt-0.5 size-3.5 shrink-0" />
              <ul className="text-muted-foreground space-y-0.5 text-[11.5px] leading-snug">
                {candidateTotals.warnings
                  .filter((w) => w.scope === "costs")
                  .map((w) => (
                    <li key={w.id}>· {w.message}</li>
                  ))}
              </ul>
            </div>
          )}

          {/* Reminder */}
          <div className="border-border/60 flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5">
            <ShieldCheck
              className="size-3.5 shrink-0"
              style={{ color: "var(--success)" }}
            />
            <p className="text-muted-foreground text-[11px] leading-tight">
              Engine recomputes line-by-line. VAT only applies to flagged lines —
              never <span className="text-foreground/85 font-medium">total ×
              VAT</span>.
            </p>
          </div>
        </SheetBody>

        <SheetFooter>
          <ImpactFooterContent
            current={totals.totalSell}
            next={candidateTotals.totalSell}
            confidence={candidateTotals.confidence}
          />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!dirty}>
              Apply
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function buildChangeNote(
  quote: Quote,
  nextCosts: CostLine[],
  nextMarginPct: number
): string {
  const bits: string[] = []
  if (nextMarginPct !== quote.marginPct) {
    bits.push(
      `margin ${(quote.marginPct * 100).toFixed(1)}% → ${(
        nextMarginPct * 100
      ).toFixed(1)}%`
    )
  }
  let vatChanged = 0
  let rateChanged = 0
  for (const next of nextCosts) {
    const prev = quote.costs.find((c) => c.id === next.id)
    if (!prev) continue
    if (prev.vatable !== next.vatable) vatChanged++
    if (prev.netRate !== next.netRate) rateChanged++
  }
  if (vatChanged > 0)
    bits.push(`${vatChanged} VAT flag${vatChanged === 1 ? "" : "s"} flipped`)
  if (rateChanged > 0)
    bits.push(`${rateChanged} rate${rateChanged === 1 ? "" : "s"} edited`)
  return bits.length > 0
    ? `Costs & VAT — ${bits.join(", ")}`
    : "Costs & VAT — no-op"
}

function FormSection({
  title,
  aside,
  children,
}: {
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground/80 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
          {title}
        </h3>
        {aside}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function RuleRow({
  icon: Icon,
  title,
  detail,
  checked,
  onCheckedChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <div className="border-border/70 bg-surface flex items-start gap-2 rounded-md border px-2.5 py-2">
      <div className="bg-surface-2 mt-0.5 grid size-6 shrink-0 place-items-center rounded">
        <Icon className="text-foreground/70 size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground text-[12.5px] font-medium leading-tight">
          {title}
        </div>
        <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
          {detail}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
        aria-label={title}
      />
    </div>
  )
}
