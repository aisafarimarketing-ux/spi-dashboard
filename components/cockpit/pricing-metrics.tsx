import {
  AlertTriangle,
  CircleDollarSign,
  ShieldCheck,
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
import { QUOTE, TOTALS } from "@/lib/mock"
import { aggregateByCategory } from "@/lib/pricing-engine"

const formatUSD = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n)

const categoryTone: Record<string, string> = {
  Accommodation: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
  ParkFees: "bg-[color-mix(in_oklch,var(--success)_55%,transparent)]",
  ConcessionFees: "bg-[color-mix(in_oklch,var(--success)_40%,transparent)]",
  Vehicle: "bg-[color-mix(in_oklch,var(--info)_55%,transparent)]",
  Guide: "bg-[color-mix(in_oklch,var(--info)_40%,transparent)]",
  Fuel: "bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]",
  Transfers: "bg-[color-mix(in_oklch,var(--ink-soft)_55%,transparent)]",
  Activities: "bg-[color-mix(in_oklch,var(--destructive)_45%,transparent)]",
  Other: "bg-border",
}

const categoryDisplayName: Record<string, string> = {
  Accommodation: "Accommodation",
  ParkFees: "Park & concession",
  ConcessionFees: "Concession",
  Vehicle: "Vehicle",
  Guide: "Guide",
  Fuel: "Fuel",
  Transfers: "Transfers",
  Activities: "Activities",
  Other: "Other",
}

export function PricingMetrics() {
  const breakdown = aggregateByCategory(QUOTE)
  const errorCount = TOTALS.warnings.filter((w) => w.level === "error").length
  const warnCount = TOTALS.warnings.filter((w) => w.level === "warning").length

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CircleDollarSign className="text-muted-foreground size-3.5" />
          <CardTitle>Pricing</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {QUOTE.fx.base} · rate locked
          </Badge>
          <Badge variant="muted" size="sm" className="font-mono">
            VAT 18%
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
        {/* KPI grid — two rows */}
        <div className="grid grid-cols-3 gap-2">
          <Kpi
            label="Per pax"
            value={formatUSD(TOTALS.perPax)}
            sub={`${QUOTE.travel.pax} pax`}
          />
          <Kpi
            label="Per night"
            value={formatUSD(TOTALS.perNight)}
            sub={`${QUOTE.travel.nights}n`}
          />
          <Kpi
            label="Margin"
            value={`${TOTALS.marginPct.toFixed(1)}%`}
            sub={formatUSD(TOTALS.margin)}
            tone="success"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Kpi
            label="Net cost"
            value={formatUSD(TOTALS.netCost)}
            sub="pre-VAT"
          />
          <Kpi
            label="VAT"
            value={formatUSD(TOTALS.vat)}
            sub={`on ${formatUSD(TOTALS.vatBreakdown.vatable)}`}
          />
          <Kpi
            label="Confidence"
            value={`${Math.round(TOTALS.confidence * 100)}%`}
            sub={
              warnCount + errorCount === 0
                ? "no flags"
                : `${errorCount} err · ${warnCount} warn`
            }
            tone={
              errorCount > 0
                ? "destructive"
                : warnCount > 0
                  ? "warning"
                  : "success"
            }
          />
        </div>

        {/* Stacked bar */}
        <div>
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10.5px] tracking-[0.08em] uppercase">
            <span>Cost composition</span>
            <span className="font-mono normal-case tracking-normal">
              {formatUSD(TOTALS.totalSell)} sell
            </span>
          </div>
          <div className="border-border/60 bg-surface-2/40 flex h-2 w-full overflow-hidden rounded-full border">
            {breakdown.map((b) => (
              <span
                key={b.category}
                className={cn(
                  "h-full",
                  categoryTone[b.category] ?? categoryTone.Other
                )}
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
                    categoryTone[b.category] ?? categoryTone.Other
                  )}
                />
                <span className="text-foreground/85">
                  {categoryDisplayName[b.category] ?? b.category}
                </span>
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

        {/* Warnings strip */}
        {(errorCount > 0 || warnCount > 0) && (
          <div className="border-border/60 bg-[color-mix(in_oklch,var(--warning)_8%,var(--surface))] flex items-start gap-2 rounded-md border px-2.5 py-2">
            <AlertTriangle className="text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))] mt-0.5 size-3.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-foreground/85 text-[11.5px] font-medium leading-tight">
                {errorCount > 0
                  ? `${errorCount} error${errorCount === 1 ? "" : "s"}`
                  : ""}
                {errorCount > 0 && warnCount > 0 ? " · " : ""}
                {warnCount > 0
                  ? `${warnCount} warning${warnCount === 1 ? "" : "s"} from validator`
                  : ""}
              </div>
              <ul className="text-muted-foreground mt-0.5 space-y-0.5 text-[11px] leading-snug">
                {TOTALS.warnings.slice(0, 2).map((w) => (
                  <li key={w.id} className="line-clamp-1">
                    · {w.message}
                  </li>
                ))}
                {TOTALS.warnings.length > 2 && (
                  <li className="text-muted-foreground/70">
                    + {TOTALS.warnings.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Engine reminder */}
        <div className="border-border/60 mt-auto flex items-center gap-2 rounded-md border border-dashed px-2.5 py-1.5">
          <ShieldCheck
            className="size-3.5 shrink-0"
            style={{ color: "var(--success)" }}
          />
          <p className="text-muted-foreground text-[11px] leading-tight">
            Pricing computed by{" "}
            <span className="text-foreground/85 font-medium">
              lib/pricing-engine.ts
            </span>
            . AI proposes; operator approves. No silent mutations.
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
  tone?: "success" | "warning" | "destructive"
}) {
  const valueTone =
    tone === "success"
      ? "text-[color-mix(in_oklch,var(--success)_50%,var(--ink))]"
      : tone === "warning"
        ? "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]"
        : tone === "destructive"
          ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
          : ""

  return (
    <div className="border-border/70 bg-surface/60 rounded-lg border px-2.5 py-2">
      <div className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-foreground mt-0.5 text-[20px] leading-none tracking-tight",
          valueTone
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
