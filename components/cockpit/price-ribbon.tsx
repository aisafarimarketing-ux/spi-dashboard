"use client"

import * as React from "react"
import {
  CheckCircle2,
  CloudCheck,
  GitCommitHorizontal,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useQuote } from "./quote-provider"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const formatAgo = (iso: string, now: number): string => {
  if (!iso) return "—"
  const ms = now - new Date(iso).getTime()
  if (ms < 5_000) return "just now"
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

/** Three-segment confidence indicator — fills based on confidence band. */
function ConfidenceBars({ confidence }: { confidence: number }) {
  const pct = confidence * 100
  const filled = pct >= 85 ? 3 : pct >= 60 ? 2 : pct > 0 ? 1 : 0
  const tone =
    filled === 3
      ? "bg-[color-mix(in_oklch,var(--success)_60%,var(--ink))]"
      : filled === 2
        ? "bg-[color-mix(in_oklch,var(--warning)_60%,var(--ink))]"
        : "bg-[color-mix(in_oklch,var(--destructive)_60%,var(--ink))]"
  return (
    <span aria-hidden className="inline-flex items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-sm",
            i < filled ? tone : "bg-border/80",
            i === 0 && "h-[6px]",
            i === 1 && "h-[8px]",
            i === 2 && "h-[10px]"
          )}
        />
      ))}
    </span>
  )
}

export function PriceRibbon() {
  const { totals, versions, lastSavedAt } = useQuote()

  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(handle)
  }, [])

  const ago = formatAgo(lastSavedAt, now)
  const errorCount = totals.warnings.filter((w) => w.level === "error").length
  const warnCount = totals.warnings.filter((w) => w.level === "warning").length
  const flagCount = errorCount + warnCount
  const verified = errorCount === 0
  const currentVersion = versions[0]

  // Margin chip tone — sage if healthy, amber if tight, brick if thin.
  const marginTone =
    totals.marginPct >= 18
      ? "success"
      : totals.marginPct >= 10
        ? "warning"
        : "destructive"

  return (
    <footer
      role="contentinfo"
      aria-label="Quote totals and operational status"
      className="border-border/70 bg-surface-3/90 sticky bottom-0 z-20 flex shrink-0 items-center gap-4 border-t px-5 py-2.5 backdrop-blur-md"
    >
      {/* Operational status — left cluster */}
      <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
        <span
          className="inline-flex items-center gap-1.5"
          title={`Last saved ${ago}`}
        >
          <CloudCheck className="text-[color-mix(in_oklch,var(--success)_55%,var(--ink))] size-3.5" />
          <span className="text-foreground/85 font-medium">Saved</span>
          <span className="text-muted-foreground/80 font-mono">· {ago}</span>
        </span>

        <span className="bg-border/80 hidden h-3 w-px md:block" aria-hidden />

        <span
          className="hidden items-center gap-1.5 md:inline-flex"
          title={`Pricing ${verified ? "verified" : "needs review"}`}
        >
          <ShieldCheck
            className={cn(
              "size-3.5",
              verified
                ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                : "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]"
            )}
          />
          <span className="text-foreground/85 font-medium">
            {verified ? "Verified" : "Needs review"}
          </span>
        </span>

        <span className="bg-border/80 hidden h-3 w-px lg:block" aria-hidden />

        <span
          className="hidden items-center gap-1.5 lg:inline-flex"
          title={`Last recalculated ${ago}`}
        >
          <RefreshCw className="text-muted-foreground size-3" />
          <span className="text-muted-foreground/80 font-mono">{ago}</span>
        </span>

        <span className="bg-border/80 hidden h-3 w-px md:block" aria-hidden />

        <span className="inline-flex items-center gap-1.5">
          <GitCommitHorizontal className="text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))] size-3.5" />
          <span className="text-foreground/85 font-medium">
            {currentVersion?.label.replace(" · current", "") ?? "v0"}
          </span>
        </span>

        {flagCount > 0 && (
          <Badge
            variant={errorCount > 0 ? "destructive" : "warning"}
            size="sm"
            className="font-mono pulse-warning"
          >
            <TriangleAlert className="size-3" />
            {flagCount} flag{flagCount === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {/* Totals — right cluster */}
      <div className="ml-auto flex items-center gap-4">
        <div className="hidden text-right md:block">
          <div className="text-muted-foreground text-[10px] tracking-[0.06em] uppercase">
            Per pax
          </div>
          <div className="text-foreground/85 font-mono text-[12.5px] font-medium">
            {formatUSD(totals.perPax)}
          </div>
        </div>

        <div className="bg-border/80 hidden h-7 w-px md:block" aria-hidden />

        <div className="text-right">
          <div className="text-muted-foreground text-[10px] tracking-[0.06em] uppercase">
            Total
          </div>
          <div className="text-foreground font-display text-[20px] leading-none tracking-tight">
            {formatUSD(totals.totalSell)}
          </div>
        </div>

        <Badge
          variant={marginTone}
          size="sm"
          className="hidden font-mono lg:inline-flex"
        >
          <CheckCircle2 className="size-3" />
          margin {totals.marginPct.toFixed(1)}%
        </Badge>

        <div
          className="hidden items-center gap-1.5 lg:inline-flex"
          title={`Confidence ${Math.round(totals.confidence * 100)}%`}
        >
          <ConfidenceBars confidence={totals.confidence} />
          <span className="text-muted-foreground/85 font-mono text-[11px]">
            {Math.round(totals.confidence * 100)}%
          </span>
        </div>
      </div>
    </footer>
  )
}
