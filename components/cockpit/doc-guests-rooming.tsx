"use client"

import * as React from "react"
import { BedDouble, Pencil, ShieldCheck, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Confidence, RoomingPolicySource } from "@/lib/types"
import { DocSectionHeader } from "./doc-section-header"
import { useQuote } from "./quote-provider"

const arrLabel: Record<string, string> = {
  Single: "Single",
  Double: "Double",
  Twin: "Twin",
  Triple: "Triple",
  Quad: "Quad",
  FamilyRoom: "Family room",
  Interconnecting: "Interconnecting",
  TwoRoomsReplacingFamily: "Two interconnecting · family override",
  ExtraBed: "+ extra bed",
  ChildSharing: "Child sharing",
  CustomCampApproved: "Custom · camp-approved",
}

const sourceLabel: Record<RoomingPolicySource, string> = {
  "camp-policy": "Camp policy",
  "operator-override": "Operator override",
  negotiated: "Negotiated",
  "ai-suggested": "SPI suggested",
}

const confidenceTone: Record<Confidence, string> = {
  high: "bg-[color-mix(in_oklch,var(--success)_60%,transparent)]",
  medium: "bg-[color-mix(in_oklch,var(--warning)_60%,transparent)]",
  low: "bg-[color-mix(in_oklch,var(--destructive)_60%,transparent)]",
}

const categoryLabel = {
  Local: "Local",
  EastAfricanResident: "EA Resident",
  International: "Intl",
} as const

export function DocGuestsRooming() {
  const { quote, openDrawer } = useQuote()
  const { guests, rooms } = quote

  return (
    <section className="px-6 pt-6 pb-2">
      <DocSectionHeader
        title="Guests & rooming"
        glyph="guests"
        summary={`${guests.length} pax · ${rooms.length} room${rooms.length === 1 ? "" : "s"}`}
        onEdit={() => openDrawer({ type: "guest" })}
      />

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
        {/* Guests column */}
        <div>
          <div className="text-muted-foreground/85 mb-1.5 flex items-center justify-between text-[10.5px] tracking-[0.06em] uppercase">
            <span>Travelling guests</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => openDrawer({ type: "guest" })}
              aria-label="Add guest"
            >
              <UserPlus />
              Add
            </Button>
          </div>

          {guests.length === 0 ? (
            <div className="border-border/60 text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center text-[11.5px]">
              No guests yet — add one to start pricing.
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {guests.map((g) => {
                const initials = g.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() =>
                        openDrawer({ type: "guest", guestId: g.id })
                      }
                      className="hover:bg-surface-2/40 focus-visible:bg-surface-2/40 focus-visible:ring-ring/40 focus-visible:ring-3 group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors outline-none"
                    >
                      <span className="bg-[color-mix(in_oklch,var(--gold)_22%,var(--surface-2))] text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))] grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold">
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground truncate text-[12.5px] font-medium leading-tight">
                          {g.name}
                        </div>
                        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] leading-tight">
                          <span>{g.type}</span>
                          {g.age !== undefined && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="font-mono">age {g.age}</span>
                            </>
                          )}
                          <span className="text-muted-foreground/40">·</span>
                          <span>{g.nationality}</span>
                        </div>
                      </div>
                      <Badge variant="muted" size="sm" className="font-medium">
                        {categoryLabel[g.pricingCategory]}
                      </Badge>
                      {g.dietary && (
                        <Badge variant="muted" size="sm" className="font-medium">
                          {g.dietary}
                        </Badge>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Rooming column */}
        <div>
          <div className="text-muted-foreground/85 mb-1.5 flex items-center justify-between text-[10.5px] tracking-[0.06em] uppercase">
            <span>Sleeping arrangements</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => openDrawer({ type: "rooming" })}
              aria-label="Add arrangement"
            >
              <BedDouble />
              Arrange
            </Button>
          </div>

          {rooms.length === 0 ? (
            <div className="border-border/60 text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center text-[11.5px]">
              No rooms yet — assign guests to camps and rooms.
            </div>
          ) : (
            <ul className="space-y-2">
              {rooms.map((room) => {
                const occupants = room.occupants
                  .map((id) => guests.find((g) => g.id === id))
                  .filter((g): g is NonNullable<typeof g> => Boolean(g))

                return (
                  <li
                    key={room.id}
                    className="border-border/60 bg-card hover:border-border focus-within:border-ring group rounded-md border px-2.5 py-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-foreground text-[12px] font-medium leading-tight">
                          Room {room.id.replace("r", "")} ·{" "}
                          {arrLabel[room.arrangement] ?? room.arrangement}
                        </div>
                        <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
                          {occupants.map((g) => g.name.split(" ")[0]).join(" & ")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Edit room ${room.id}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() =>
                          openDrawer({ type: "rooming", roomId: room.id })
                        }
                      >
                        <Pencil />
                      </Button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="outline" size="sm" className="font-normal">
                        <ShieldCheck className="size-3" />
                        {sourceLabel[room.policy.source]}
                      </Badge>
                      <span
                        className="border-border/60 bg-surface-2/60 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10.5px]"
                        title={`Confidence: ${room.policy.confidence}`}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 rounded-full",
                            confidenceTone[room.policy.confidence]
                          )}
                        />
                        <span className="text-muted-foreground/90 capitalize">
                          {room.policy.confidence}
                        </span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
