import {
  CircleDollarSign,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PRICING, PRICING_TOTALS, QUOTE } from "@/lib/mock"

const formatUSD = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n)

type Cat = (typeof PRICING)[number]["category"]

const categoryTone: Record<Cat, string> = {
  Accommodation: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
  "Park Fees": "bg-[color-mix(in_oklch,var(--success)_55%,transparent)]",
  Conservancy: "bg-[color-mix(in_oklch,var(--info)_55%,transparent)]",
  Transfers: "bg-[color-mix(in_oklch,var(--ink-soft)_55%,transparent)]",
  Flights: "bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]",
  Activities: "bg-[color-mix(in_oklch,var(--destructive)_45%,transparent)]",
  Other: "bg-border",
}

function aggregateByCategory() {
  const map = new Map<Cat, { cost: number; sell: number }>()
  for (const line of PRICING) {
    const m = map.get(line.category) ?? { cost: 0, sell: 0 }
    m.cost += line.cost
    m.sell += line.sell
    map.set(line.category, m)
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      ...v,
      share: v.sell / PRICING_TOTALS.totalSell,
    }))
    .sort((a, b) => b.sell - a.sell)
}

export function PricingMetrics() {
  const breakdown = aggregateByCategory()

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CircleDollarSign className="text-muted-foreground size-3.5" />
          <CardTitle>Pricing</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {QUOTE.fx.base} · rate locked
          </Badge>
        </div>
        <CardAction>
          <Button variant="ghost" size="xs">
            <TrendingUp />
            Margin curve
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-1">
        {/* KPI grid */}
        <div className="grid grid-cols-3 gap-2">
          <Kpi
            label="Per pax"
            value={formatUSD(PRICING_TOTALS.perPax)}
            sub={`${QUOTE.travel.pax} pax`}
          />
          <Kpi
            label="Per night"
            value={formatUSD(PRICING_TOTALS.perNight)}
            sub={`${QUOTE.travel.nights}n`}
          />
          <Kpi
            label="Margin"
            value={`${PRICING_TOTALS.marginPct.toFixed(1)}%`}
            sub={formatUSD(PRICING_TOTALS.margin)}
            tone="success"
          />
        </div>

        {/* Stacked bar */}
        <div>
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10.5px] tracking-[0.08em] uppercase">
            <span>Cost composition</span>
            <span className="font-mono normal-case tracking-normal">
              {formatUSD(PRICING_TOTALS.totalSell)} sell
            </span>
          </div>
          <div className="border-border/60 bg-surface-2/40 flex h-2 w-full overflow-hidden rounded-full border">
            {breakdown.map((b) => (
              <span
                key={b.category}
                className={cn("h-full", categoryTone[b.category])}
                style={{ width: `${(b.share * 100).toFixed(2)}%` }}
                title={`${b.category} — ${formatUSD(b.sell)}`}
              />
            ))}
          </div>

          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {breakdown.map((b) => (
              <li
                key={b.category}
                className="flex items-center gap-1.5 text-[11px]"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    categoryTone[b.category]
                  )}
                />
                <span className="text-foreground/85">{b.category}</span>
                <span className="text-muted-foreground/70 font-mono">
                  {Math.round(b.share * 100)}%
                </span>
                <span className="text-muted-foreground ml-auto font-mono text-[10.5px]">
                  {formatUSD(b.sell)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: deterministic engine note */}
        <div className="border-border/60 mt-auto flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5">
          <span
            aria-hidden
            className="bg-success/70 size-1.5 rounded-full"
            style={{ background: "var(--success)" }}
          />
          <p className="text-muted-foreground text-[11px] leading-tight">
            Pricing engine is{" "}
            <span className="text-foreground/85 font-medium">deterministic</span>.
            AI proposes; operator approves. No silent mutations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Kpi({
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
    <div className="border-border/70 bg-surface/60 rounded-lg border px-2.5 py-2">
      <div className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-foreground mt-0.5 text-[20px] leading-none tracking-tight",
          tone === "success" &&
            "text-[color-mix(in_oklch,var(--success)_50%,var(--ink))]"
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
