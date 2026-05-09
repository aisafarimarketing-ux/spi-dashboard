"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Sticky section header used by all document sections.
 *
 *   ◆ ITINERARY                           9 days   edit ›
 *
 * The diamond glyph is colored per section (brass / teal / terracotta /
 * sage) so the eye can scan from a distance. The optional edit handler
 * shows the right-aligned chevron link.
 */
export type SectionGlyphKey =
  | "itinerary"
  | "guests"
  | "costs"
  | "review"

const GLYPH_COLOR: Record<SectionGlyphKey, string> = {
  itinerary: "section-glyph-itinerary",
  guests: "section-glyph-guests",
  costs: "section-glyph-costs",
  review: "section-glyph-review",
}

export function DocSectionHeader({
  title,
  glyph,
  summary,
  onEdit,
  editLabel = "edit",
  id,
}: {
  title: string
  glyph: SectionGlyphKey
  summary?: string
  onEdit?: () => void
  editLabel?: string
  id?: string
}) {
  return (
    <div
      id={id}
      className="bg-surface/95 sticky top-12 z-10 -mx-6 flex items-baseline gap-2.5 border-b border-border/60 px-6 py-2.5 backdrop-blur-md"
    >
      <span
        aria-hidden
        className={cn("text-[14px] leading-none", GLYPH_COLOR[glyph])}
      >
        ◆
      </span>
      <h2 className="text-foreground/90 text-[11px] font-semibold tracking-[0.14em] uppercase">
        {title}
      </h2>
      {summary && (
        <span className="text-muted-foreground/90 ml-1 font-mono text-[10.5px]">
          {summary}
        </span>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground focus-visible:text-foreground ml-auto inline-flex cursor-pointer items-center gap-0.5 text-[11px] transition-colors outline-none focus-visible:underline"
        >
          {editLabel}
          <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  )
}
