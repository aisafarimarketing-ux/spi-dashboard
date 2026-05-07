"use client"

import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

export function ImpactFooterContent({
  current,
  next,
  confidence,
}: {
  current: number
  next: number
  confidence?: number
}) {
  const delta = Math.round(next - current)
  const dir =
    delta < 0 ? "save" : delta > 0 ? "add" : "neutral"

  return (
    <div className="flex flex-1 items-center gap-3">
      <div className="text-muted-foreground/90 text-[10.5px] tracking-[0.06em] uppercase">
        Impact preview
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-muted-foreground/80 font-mono text-[11px]">
          {formatUSD(current)}
        </span>
        <ArrowRight className="text-muted-foreground/60 size-3" />
        <span className="text-foreground font-mono text-[12.5px] font-medium">
          {formatUSD(next)}
        </span>
      </div>
      <span
        className={cn(
          "font-mono text-[11.5px]",
          dir === "save" &&
            "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]",
          dir === "add" &&
            "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]",
          dir === "neutral" && "text-muted-foreground"
        )}
      >
        {delta === 0
          ? "no change"
          : `${delta > 0 ? "+" : "−"}${formatUSD(Math.abs(delta))}`}
      </span>
      {confidence !== undefined && (
        <Badge variant="muted" size="sm" className="ml-auto font-mono">
          conf {Math.round(confidence * 100)}%
        </Badge>
      )}
    </div>
  )
}
