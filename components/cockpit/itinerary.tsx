import {
  ArrowRight,
  Binoculars,
  Calendar,
  Map,
  MapPin,
  Plane,
  Tent,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ITINERARY, QUOTE } from "@/lib/mock"

const regionTone: Record<string, string> = {
  Arusha: "text-[color-mix(in_oklch,var(--info)_55%,var(--ink))]",
  Tarangire: "text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]",
  "Lake Manyara": "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]",
  Ngorongoro: "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
  Serengeti: "text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]",
  Zanzibar: "text-[color-mix(in_oklch,var(--info)_55%,var(--ink))]",
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

export function ItineraryTimeline() {
  return (
    <Card className="card-lift overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Map className="text-muted-foreground size-3.5" />
          <CardTitle>Itinerary</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {QUOTE.travel.nights}n · {ITINERARY.length} stops
          </Badge>
        </div>
        <CardAction>
          <Button variant="ghost" size="xs">
            <Calendar />
            Day grid
          </Button>
          <Button variant="ghost" size="xs">
            <Binoculars />
            Map view
          </Button>
        </CardAction>
      </CardHeader>

      <div className="scrollbar-thin overflow-x-auto">
        <ol className="flex min-w-full items-stretch gap-3 px-4 pt-1 pb-4">
          {ITINERARY.map((d, idx) => {
            const next = ITINERARY[idx + 1]
            const Mi = d.movement
              ? movementIcon[d.movement.mode]
              : null
            const date = formatDayDate(d.date)
            const isLast = idx === ITINERARY.length - 1

            return (
              <li
                key={d.day}
                className="relative flex shrink-0 items-stretch gap-3"
                style={{ minWidth: 220 }}
              >
                <div className="border-border/70 bg-surface flex w-[220px] flex-col rounded-lg border p-3 transition-shadow hover:shadow-[0_2px_10px_rgba(60,40,20,0.06)]">
                  {/* Day pill row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-muted-foreground/70 font-mono text-[10px] tracking-tight">
                        D{d.day}
                      </span>
                      <span className="text-foreground font-mono text-[11.5px] font-medium tracking-tight">
                        {date.weekday} {date.month} {date.day}
                      </span>
                    </div>
                    {d.stay?.nights ? (
                      <Badge variant="muted" size="sm" className="font-mono">
                        {d.stay.nights}n · {d.stay.boardBasis}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Region */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <MapPin
                      className={cn("size-3", regionTone[d.region])}
                      strokeWidth={2}
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

                  {/* Title / property */}
                  <div className="mt-1.5 leading-tight">
                    <div className="text-foreground text-[13px] font-medium tracking-tight">
                      {d.property?.name ?? d.title}
                    </div>
                    {d.property ? (
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
                        <Tent className="size-3" strokeWidth={1.75} />
                        <span>{d.property.category}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] tracking-wider">
                          {tierGlyph[d.property.tier]}
                        </span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground mt-0.5 text-[11px] italic">
                        {d.title}
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  <ul className="mt-2.5 space-y-1">
                    {d.activities.slice(0, 2).map((a, i) => (
                      <li
                        key={i}
                        className="text-muted-foreground flex items-start gap-1.5 text-[11px] leading-snug"
                      >
                        <span
                          aria-hidden
                          className="bg-border/80 mt-1.5 size-1 shrink-0 rounded-full"
                        />
                        <span className="line-clamp-1">{a}</span>
                      </li>
                    ))}
                    {d.activities.length > 2 && (
                      <li className="text-muted-foreground/70 pl-3 text-[10.5px]">
                        + {d.activities.length - 2} more
                      </li>
                    )}
                  </ul>

                  {/* Footer */}
                  <div className="border-border/60 mt-auto flex items-center justify-between border-t pt-2 text-[10.5px]">
                    {d.movement ? (
                      <span className="text-muted-foreground inline-flex items-center gap-1">
                        {Mi && <Mi className="size-3" />}
                        {d.movement.from} → {d.movement.to}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">In-camp</span>
                    )}
                    <span className="text-muted-foreground/70 font-mono">
                      {d.movement?.operator ?? d.property?.tier ?? ""}
                    </span>
                  </div>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center px-1">
                    <div className="bg-border/80 h-px w-6" />
                    {next?.movement ? (
                      <span className="text-muted-foreground/70 mt-0.5 text-[9px] uppercase tracking-[0.08em]">
                        {next.movement.mode}
                      </span>
                    ) : null}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}
