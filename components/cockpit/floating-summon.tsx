"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { useQuote } from "./quote-provider"

/**
 * Bottom-right floating button to summon Tell SPI when the right rail is
 * collapsed. Sits above the price ribbon. Brass tint, calm shadow.
 *
 * Pending dot lights up when SPI has fresh activity not yet seen.
 */
export function FloatingSummon({
  visible,
  onSummon,
}: {
  visible: boolean
  onSummon: () => void
}) {
  const { activity } = useQuote()
  const hasRecentActivity = activity.length > 0

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onSummon}
      aria-label="Open Tell SPI"
      title="Tell SPI (⌘K opens command palette)"
      className={cn(
        "fixed right-5 bottom-16 z-30 flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[12.5px] font-medium transition-all outline-none",
        "bg-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] text-primary-foreground",
        "shadow-[0_8px_22px_-10px_rgba(60,40,20,0.45)]",
        "hover:translate-y-[-1px] hover:shadow-[0_12px_28px_-10px_rgba(60,40,20,0.55)]",
        "focus-visible:ring-3 focus-visible:ring-ring/40"
      )}
    >
      <Sparkles className="size-4" />
      <span>Tell SPI</span>
      {hasRecentActivity && (
        <span
          aria-hidden
          className="bg-card absolute top-1.5 right-1.5 size-2 rounded-full"
        />
      )}
    </button>
  )
}
