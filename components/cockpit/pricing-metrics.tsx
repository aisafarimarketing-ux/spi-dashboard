"use client"

import * as React from "react"
import {
  AlertTriangle,
  CircleDollarSign,
  Pencil,
  ShieldCheck,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { aggregateByCategory } from "@/lib/pricing-engine"
import { useQuote } from "./quote-provider"
import { WarningsDrawer } from "./warnings-drawer"

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
  const { quote, totals, openDrawer } = useQuote()
  const [warningsOpen, setWarningsOpen] = React.useState(false)
  const breakdown = aggregateByCategory(quote)
  const errorCount = totals.warnings.filter((w) => w.level === "error").length
  const warnCount = totals.warnings.filter((w) => w.level === "warning").length

  return (
    <Card className="card-lift flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CircleDollarSign className="text-muted-foreground size-3.5" />
          <CardTitle>Pricing</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {quote.fx.base} · rate locked
          </Badge>
          <Badge variant="muted" size="sm" className="font-mono">
            VAT 18%
          </Badge>
        </div>
        <CardAction>
          <Button
            variant="outline"
            size="xs"
            onClick={() => openDrawer({ type: "costs" })}
          >
            <Pencil />
            Costs &amp; VAT
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 pt-1">
        <div className="grid grid-cols-3 gap-2">
          <Kpi
            label="Per pax"
            value={formatUSD(totals.perPax)}
            sub={`${quote.travel.pax} pax`}
            onClick={() => openDrawer({ type: "guest" })}
            hint="Open guests"
          />
          <Kpi
            label="Per night"
            value={formatUSD(totals.perNight)}
            sub={`${quote.travel.nights}n`}
            onClick={() => openDrawer({ type: "costs" })}
            hint="Open costs"
          />
          <Kpi
            label="Margin"
            value={`${totals.marginPct.toFixed(1)}%`}
            sub={formatUSD(totals.margin)}
            tone="success"
            onClick={() => openDrawer({ type: "costs" })}
            hint="Edit margin"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Kpi
            label="Net cost"
            value={formatUSD(totals.netCost)}
            sub="pre-VAT"
            onClick={() => openDrawer({ type: "costs" })}
            hint="Open costs"
          />
          <Kpi
            label="VAT"
            value={formatUSD(totals.vat)}
            sub={`on ${formatUSD(totals.vatBreakdown.vatable)}`}
            onClick={() => openDrawer({ type: "costs" })}
            hint="Open costs"
          />
          <KpiPopover
            label="Confidence"
            value={`${Math.round(totals.confidence * 100)}%`}
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
            confidence={totals.confidence}
            errorCount={errorCount}
            warnCount={warnCount}
          />
        </div>

        <div>
          <div className="text-muted-foreground mb-1.5 flex items-center justify-between text-[10.5px] tracking-[0.08em] uppercase">
            <span>Cost composition</span>
            <span className="font-mono normal-case tracking-normal">
              {formatUSD(totals.totalSell)} sell
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

        {(errorCount > 0 || warnCount > 0) && (
          <button
            type="button"
            onClick={() => setWarningsOpen(true)}
            className="border-border/60 bg-[color-mix(in_oklch,var(--warning)_8%,var(--surface))] hover:bg-[color-mix(in_oklch,var(--warning)_14%,var(--surface))] focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 group flex w-full cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-left transition-colors outline-none"
          >
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
                {totals.warnings.slice(0, 2).map((w) => (
                  <li key={w.id} className="line-clamp-1">
                    · {w.message}
                  </li>
                ))}
                {totals.warnings.length > 2 && (
                  <li className="text-muted-foreground/70">
                    + {totals.warnings.length - 2} more
                  </li>
                )}
              </ul>
            </div>
            <span className="text-muted-foreground/70 group-hover:text-foreground/70 self-center text-[10.5px] transition-colors">
              View →
            </span>
          </button>
        )}

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

      <WarningsDrawer open={warningsOpen} onOpenChange={setWarningsOpen} />
    </Card>
  )
}

function Kpi({
  label,
  value,
  sub,
  tone,
  onClick,
  hint,
}: {
  label: string
  value: string
  sub: string
  tone?: "success" | "warning" | "destructive"
  onClick?: () => void
  hint?: string
}) {
  const valueTone =
    tone === "success"
      ? "text-[color-mix(in_oklch,var(--success)_50%,var(--ink))]"
      : tone === "warning"
        ? "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]"
        : tone === "destructive"
          ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
          : ""

  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={hint}
      className={cn(
        "border-border/70 bg-surface/60 group/kpi rounded-lg border px-2.5 py-2 text-left transition-all",
        onClick &&
          "hover:border-border hover:bg-surface focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 cursor-pointer outline-none"
      )}
    >
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
    </Comp>
  )
}

function KpiPopover({
  label,
  value,
  sub,
  tone,
  confidence,
  errorCount,
  warnCount,
}: {
  label: string
  value: string
  sub: string
  tone?: "success" | "warning" | "destructive"
  confidence: number
  errorCount: number
  warnCount: number
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "border-border/70 bg-surface/60 hover:border-border hover:bg-surface focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 group/kpi cursor-pointer rounded-lg border px-2.5 py-2 text-left outline-none transition-all"
          )}
        >
          <div className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
            {label}
          </div>
          <div
            className={cn(
              "font-display text-foreground mt-0.5 text-[20px] leading-none tracking-tight",
              tone === "success" &&
                "text-[color-mix(in_oklch,var(--success)_50%,var(--ink))]",
              tone === "warning" &&
                "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
              tone === "destructive" &&
                "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
            )}
          >
            {value}
          </div>
          <div className="text-muted-foreground/80 mt-1 font-mono text-[10.5px]">
            {sub}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-2">
          <div>
            <h3 className="text-foreground/85 text-[11.5px] font-semibold tracking-[0.06em] uppercase">
              Confidence score
            </h3>
            <p className="text-muted-foreground mt-1 text-[11.5px] leading-snug">
              Engine confidence is a 0–100 score derived from validator flags
              and per-room policy strength. Errors deduct 15pts, warnings 5pts,
              info 1pt. Low room-policy confidence subtracts further.
            </p>
          </div>
          <div className="border-border/60 bg-surface-2/40 rounded-md border px-2.5 py-2 text-[11.5px]">
            <div className="text-muted-foreground/80 font-mono">
              Score: {Math.round(confidence * 100)}%
            </div>
            <div className="text-muted-foreground/80 font-mono">
              Flags: {errorCount} err · {warnCount} warn
            </div>
          </div>
          <p className="text-muted-foreground text-[10.5px] italic leading-snug">
            Click the warnings card below to inspect each flag and jump to the
            right editor.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
