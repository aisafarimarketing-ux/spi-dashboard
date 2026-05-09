"use client"

import * as React from "react"
import { ArrowRight, MapPin, Plane, Tent } from "lucide-react"

import { cn } from "@/lib/utils"
import { openPlaceholder } from "./placeholder-modal"
import { DocSectionHeader } from "./doc-section-header"
import { useQuote } from "./quote-provider"

const regionTone: Record<string, string> = {
  Arusha: "text-[color-mix(in_oklch,var(--teal)_60%,var(--ink))]",
  Tarangire: "text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))]",
  "Lake Manyara": "text-[color-mix(in_oklch,var(--bushveld)_60%,var(--ink))]",
  Ngorongoro: "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
  Serengeti: "text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))]",
  Zanzibar: "text-[color-mix(in_oklch,var(--teal)_60%,var(--ink))]",
  Transit: "text-muted-foreground",
}

const tierGlyph: Record<string, string> = {
  Premium: "★★",
  Luxury: "★★★",
  Ultra: "★★★★",
}

const movementIcon = {
  Flight: Plane,
  Charter: Plane,
  Road: ArrowRight,
} as const

const formatDayDate = (iso: string) => {
  const d = new Date(iso)
  return {
    weekday: d.toLocaleString("en-US", { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleString("en-US", { month: "short" }),
  }
}

export function DocItinerary() {
  const { quote } = useQuote()
  const itinerary = quote.itinerary

  return (
    <section className="px-6 pt-6 pb-2">
      <DocSectionHeader
        title="Itinerary"
        glyph="itinerary"
        summary={`${quote.travel.nights} days · ${itinerary.length} stops`}
        onEdit={() =>
          openPlaceholder({
            title: "Itinerary builder",
            description:
              "Drag-and-drop day planning is queued for V1. Until then, Tell SPI populates days from natural-language requests.",
          })
        }
      />

      {itinerary.length === 0 ? (
        <div className="border-border/60 text-muted-foreground mt-4 rounded-md border border-dashed px-4 py-6 text-center text-[12px]">
          No itinerary days yet. Open Tell SPI on the right to add days.
        </div>
      ) : (
        <ol className="mt-1 divide-y divide-border/50">
          {itinerary.map((d) => {
            const Mi = d.movement ? movementIcon[d.movement.mode] : null
            const date = formatDayDate(d.date)
            return (
              <li key={d.day}>
                <button
                  type="button"
                  onClick={() =>
                    openPlaceholder({
                      title: `Day ${d.day} · ${d.title}`,
                      description: `Inline editing for ${d.property?.name ?? d.title} (region ${d.region}) is queued for V1. Route changes through Tell SPI on the right.`,
                    })
                  }
                  className="hover:bg-surface-2/40 focus-visible:bg-surface-2/40 focus-visible:ring-ring/40 focus-visible:ring-3 group/day grid w-full cursor-pointer grid-cols-[68px_1fr_auto] items-center gap-3 px-1 py-2.5 text-left transition-colors outline-none"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-foreground/85 font-mono text-[11px] font-semibold tracking-tight">
                      D{d.day}
                    </span>
                    <span className="text-muted-foreground/80 font-mono text-[10px] uppercase tracking-[0.06em]">
                      {date.month} {date.day} · {date.weekday}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin
                        className={cn("size-3 shrink-0", regionTone[d.region])}
                        strokeWidth={2.25}
                      />
                      <span
                        className={cn(
                          "text-[10.5px] font-semibold tracking-[0.06em] uppercase",
                          regionTone[d.region]
                        )}
                      >
                        {d.region}
                      </span>
                    </div>
                    <div className="text-foreground mt-0.5 truncate text-[13px] font-medium tracking-tight">
                      {d.property?.name ?? d.title}
                    </div>
                    {d.property && (
                      <div className="text-muted-foreground mt-0.5 inline-flex items-center gap-1.5 text-[11.5px]">
                        <Tent className="size-3" strokeWidth={1.75} />
                        <span>{d.property.category}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))] tracking-wider">
                          {tierGlyph[d.property.tier]}
                        </span>
                        {d.stay && (
                          <>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="font-mono text-[11px]">
                              {d.stay.nights}n · {d.stay.boardBasis}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-muted-foreground/85 hidden text-right text-[11px] sm:block">
                    {d.movement ? (
                      <span className="inline-flex items-center gap-1">
                        {Mi && <Mi className="size-3" />}
                        <span className="font-mono">{d.movement.from}</span>
                        <ArrowRight className="size-3 opacity-50" />
                        <span className="font-mono">{d.movement.to}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70 italic">
                        In-camp
                      </span>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
