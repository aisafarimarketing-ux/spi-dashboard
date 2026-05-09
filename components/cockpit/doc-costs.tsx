"use client"

import * as React from "react"
import { AlertTriangle, Coins } from "lucide-react"

import { aggregateByCategory } from "@/lib/pricing-engine"
import { cn } from "@/lib/utils"
import { DocSectionHeader } from "./doc-section-header"
import { useQuote } from "./quote-provider"
import { WarningsDrawer } from "./warnings-drawer"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

// Roll the engine's per-category breakdown into the document-facing palette.
// Accommodation → brass · Park / Concession → bushveld · Vehicle / Guide /
// Fuel → terracotta · Transfers / Activities → teal · Other → warm gray.
// (Several engine categories collapse into one display row — e.g. Vehicle +
// Guide + Fuel become one terracotta band.)
function rollupForDoc(
  rows: ReturnType<typeof aggregateByCategory>
): Array<{ key: string; label: string; sell: number; share: number }> {
  const map = new Map<string, { label: string; sell: number }>()
  for (const r of rows) {
    const key = (() => {
      if (
        r.category === "Vehicle" ||
        r.category === "Guide" ||
        r.category === "Fuel"
      )
        return "vehicle"
      if (r.category === "Transfers" || r.category === "Activities")
        return "transfers"
      if (r.category === "ParkFees" || r.category === "ConcessionFees")
        return "park"
      if (r.category === "Accommodation") return "accommodation"
      return "other"
    })()
    const existing = map.get(key)
    const label = (() => {
      if (key === "accommodation") return "Accommodation"
      if (key === "park") return "Park & concession"
      if (key === "vehicle") return "Vehicle · Guide · Fuel"
      if (key === "transfers") return "Transfers · Activities"
      return "Other"
    })()
    map.set(key, {
      label,
      sell: (existing?.sell ?? 0) + r.sell,
    })
  }
  const totalSell = Array.from(map.values()).reduce((s, v) => s + v.sell, 0)
  return Array.from(map.entries())
    .map(([key, v]) => ({
      key,
      label: v.label,
      sell: v.sell,
      share: totalSell === 0 ? 0 : v.sell / totalSell,
    }))
    .sort((a, b) => b.sell - a.sell)
}

const KEY_TO_CLASS: Record<string, string> = {
  accommodation: "cat-accommodation",
  park: "cat-park",
  vehicle: "cat-vehicle",
  transfers: "cat-transfers",
  other: "cat-other",
}

export function DocCosts() {
  const { quote, totals, openDrawer } = useQuote()
  const [warningsOpen, setWarningsOpen] = React.useState(false)

  const breakdown = React.useMemo(
    () => rollupForDoc(aggregateByCategory(quote)),
    [quote]
  )

  const errorCount = totals.warnings.filter((w) => w.level === "error").length
  const warnCount = totals.warnings.filter((w) => w.level === "warning").length
  const flagCount = errorCount + warnCount

  return (
    <section className="px-6 pt-6 pb-2">
      <DocSectionHeader
        title="Costs & VAT"
        glyph="costs"
        summary={`${quote.costs.length} lines · ${(quote.marginPct * 100).toFixed(0)}% margin`}
        onEdit={() => openDrawer({ type: "costs" })}
      />

      <div className="mt-4">
        {/* Composition bar — segmented, category-coloured */}
        <div
          role="img"
          aria-label="Cost composition"
          className="border-border/60 bg-surface-2/40 flex h-2.5 w-full overflow-hidden rounded-full border"
        >
          {breakdown.map((b) => (
            <span
              key={b.key}
              title={`${b.label} — ${formatUSD(b.sell)} (${Math.round(b.share * 100)}%)`}
              style={{ width: `${(b.share * 100).toFixed(2)}%` }}
              className={cn(
                "h-full transition-all",
                KEY_TO_CLASS[b.key] ?? "cat-other"
              )}
            />
          ))}
        </div>

        {/* Per-category list */}
        <ul className="mt-3 divide-y divide-border/50">
          {breakdown.map((b) => (
            <li
              key={b.key}
              className="grid grid-cols-[14px_1fr_60px_90px] items-center gap-3 py-1.5"
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-sm",
                  KEY_TO_CLASS[b.key] ?? "cat-other"
                )}
              />
              <span className="text-foreground/90 text-[12.5px] font-medium">
                {b.label}
              </span>
              <span className="text-muted-foreground/85 text-right font-mono text-[11.5px]">
                {Math.round(b.share * 100)}%
              </span>
              <span className="text-foreground text-right font-mono text-[12px] font-medium">
                {formatUSD(b.sell)}
              </span>
            </li>
          ))}
        </ul>

        {/* Margin / VAT inline strip */}
        <div className="border-border/60 bg-surface-2/40 mt-3 grid grid-cols-3 gap-4 rounded-md border px-3 py-2.5 text-[11.5px]">
          <div>
            <div className="text-muted-foreground text-[10px] tracking-[0.06em] uppercase">
              Net cost
            </div>
            <div className="text-foreground mt-0.5 font-mono">
              {formatUSD(totals.netCost)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] tracking-[0.06em] uppercase">
              VAT
            </div>
            <div className="text-foreground mt-0.5 font-mono">
              {formatUSD(totals.vat)}
              <span className="text-muted-foreground/80 ml-1 text-[10.5px]">
                on {formatUSD(totals.vatBreakdown.vatable)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] tracking-[0.06em] uppercase">
              Margin
            </div>
            <div className="text-[color-mix(in_oklch,var(--success)_50%,var(--ink))] mt-0.5 font-mono font-medium">
              {totals.marginPct.toFixed(1)}% · {formatUSD(totals.margin)}
            </div>
          </div>
        </div>

        {/* Warnings — clickable jump to WarningsDrawer */}
        {flagCount > 0 && (
          <button
            type="button"
            onClick={() => setWarningsOpen(true)}
            className="border-border/60 bg-[color-mix(in_oklch,var(--warning)_8%,var(--surface))] hover:bg-[color-mix(in_oklch,var(--warning)_14%,var(--surface))] focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 group mt-3 flex w-full cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors outline-none"
          >
            <AlertTriangle className="text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))] size-3.5 shrink-0" />
            <div className="min-w-0 flex-1 text-[11.5px]">
              <div className="text-foreground/85 font-medium">
                {errorCount > 0 && (
                  <>
                    {errorCount} error{errorCount === 1 ? "" : "s"}
                  </>
                )}
                {errorCount > 0 && warnCount > 0 ? " · " : ""}
                {warnCount > 0 && (
                  <>
                    {warnCount} warning{warnCount === 1 ? "" : "s"}
                  </>
                )}
                <span className="text-muted-foreground"> from validator</span>
              </div>
              <div className="text-muted-foreground/85 mt-0.5 truncate">
                {totals.warnings[0]?.message ?? ""}
              </div>
            </div>
            <span className="text-muted-foreground/80 group-hover:text-foreground text-[11px] transition-colors">
              View →
            </span>
          </button>
        )}

        {/* Trust line */}
        <div className="border-border/60 mt-3 flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5">
          <Coins
            className="size-3.5 shrink-0"
            style={{ color: "color-mix(in oklch, var(--terracotta) 60%, var(--ink))" }}
          />
          <p className="text-muted-foreground text-[11px] leading-tight">
            Pricing computed by{" "}
            <span className="text-foreground/85 font-medium">
              lib/pricing-engine.ts
            </span>
            . AI proposes; operator approves. No silent mutations.
          </p>
        </div>
      </div>

      <WarningsDrawer open={warningsOpen} onOpenChange={setWarningsOpen} />
    </section>
  )
}
