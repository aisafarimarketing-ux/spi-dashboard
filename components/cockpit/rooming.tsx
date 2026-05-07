"use client"

import {
  BedDouble,
  Pencil,
  Plus,
  ShieldCheck,
  UserPlus,
  UsersRound,
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
import type { Confidence, RoomingPolicySource } from "@/lib/types"
import { useQuote } from "./quote-provider"

const arrangementLabel: Record<string, string> = {
  Single: "Single",
  Double: "Double",
  Twin: "Twin",
  Triple: "Triple",
  Quad: "Quad",
  FamilyRoom: "Family room",
  Interconnecting: "Interconnecting",
  TwoRoomsReplacingFamily: "2 rooms · family override",
  ExtraBed: "+ extra bed",
  ChildSharing: "Child sharing",
  CustomCampApproved: "Custom · camp-approved",
}

const arrangementGlyph: Record<string, string> = {
  Single: "▤",
  Double: "⬛",
  Twin: "▦",
  Triple: "▣",
  Quad: "▩",
  FamilyRoom: "▤",
  Interconnecting: "▥",
  TwoRoomsReplacingFamily: "▥",
  ExtraBed: "▤+",
  ChildSharing: "▦",
  CustomCampApproved: "◧",
}

const sourceLabel: Record<RoomingPolicySource, string> = {
  "camp-policy": "Camp policy",
  "operator-override": "Operator override",
  negotiated: "Negotiated",
  "ai-suggested": "SPI suggested",
}

const confidenceTone: Record<Confidence, string> = {
  high: "bg-[color-mix(in_oklch,var(--success)_55%,transparent)]",
  medium: "bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]",
  low: "bg-[color-mix(in_oklch,var(--destructive)_55%,transparent)]",
}

const categoryLabel = {
  Local: "Local",
  EastAfricanResident: "EA Resident",
  International: "Intl",
} as const

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

export function RoomingOverview() {
  const { quote, openDrawer } = useQuote()
  const { guests, rooms } = quote

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersRound className="text-muted-foreground size-3.5" />
          <CardTitle>Rooming & guests</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {rooms.length} arrangements · {guests.length} pax
          </Badge>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => openDrawer({ type: "guest" })}
          >
            <UserPlus />
            Guest
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => openDrawer({ type: "rooming" })}
          >
            <Plus />
            Arrangement
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pt-1">
        {rooms.map((room) => {
          const occupants = room.occupants
            .map((id) => guests.find((g) => g.id === id))
            .filter((g): g is NonNullable<typeof g> => Boolean(g))

          const impactLabel =
            room.priceImpact.direction === "neutral"
              ? "no price impact"
              : `${room.priceImpact.direction === "save" ? "−" : "+"}${formatUSD(
                  room.priceImpact.amountUSD
                )}`

          return (
            <div
              key={room.id}
              className="border-border/70 bg-surface/60 hover:border-border group/room relative rounded-lg border p-2.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <div className="bg-surface-2 grid size-6 shrink-0 place-items-center rounded">
                    <BedDouble className="text-foreground/70 size-3.5" />
                  </div>
                  <div>
                    <div className="text-foreground text-[12.5px] font-medium leading-tight">
                      Room {room.id.replace("r", "")} ·{" "}
                      {arrangementLabel[room.arrangement] ?? room.arrangement}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                      {room.notes ?? "No special requests"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span
                    aria-hidden
                    className="text-muted-foreground/60 mt-0.5 font-mono text-[11px]"
                  >
                    {arrangementGlyph[room.arrangement] ?? ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Edit room ${room.id}`}
                    className="opacity-0 transition-opacity group-hover/room:opacity-100 focus-visible:opacity-100"
                    onClick={() =>
                      openDrawer({ type: "rooming", roomId: room.id })
                    }
                  >
                    <Pencil />
                  </Button>
                </div>
              </div>

              {/* Policy + impact row */}
              <div className="mt-2 flex items-center gap-2">
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
                <span
                  className={cn(
                    "ml-auto font-mono text-[10.5px]",
                    room.priceImpact.direction === "save"
                      ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                      : room.priceImpact.direction === "add"
                        ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
                        : "text-muted-foreground"
                  )}
                >
                  {impactLabel}
                </span>
              </div>

              {/* Occupants — click to edit */}
              <div className="mt-2 flex flex-wrap gap-1">
                {occupants.map((g) => {
                  const initials = g.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        openDrawer({ type: "guest", guestId: g.id })
                      }
                      aria-label={`Edit ${g.name}`}
                      className="border-border/70 bg-surface-2/70 hover:border-border hover:bg-surface-2 inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px] transition-colors"
                    >
                      <span className="bg-[color-mix(in_oklch,var(--gold)_22%,var(--surface-2))] text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))] grid size-4 place-items-center rounded-full text-[9px] font-semibold">
                        {initials}
                      </span>
                      <span className="text-foreground/85">
                        {g.name.split(" ")[0]}
                      </span>
                      {g.age !== undefined && (
                        <span className="text-muted-foreground/80 font-mono text-[10px]">
                          {g.age}
                        </span>
                      )}
                      <Badge size="sm" variant="muted" className="font-medium">
                        {categoryLabel[g.pricingCategory]}
                      </Badge>
                      {g.dietary && (
                        <Badge size="sm" variant="muted" className="font-medium">
                          {g.dietary}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Per-guest pricing logic */}
        <div className="border-border/60 mt-1 flex items-start gap-2 rounded-lg border border-dashed p-2.5">
          <span
            aria-hidden
            className="bg-[color-mix(in_oklch,var(--gold)_30%,transparent)] mt-0.5 size-1.5 shrink-0 rounded-full"
          />
          <div className="text-[11.5px] leading-snug">
            <div className="text-foreground/85 font-medium">
              Per-guest pricing categories
            </div>
            <p className="text-muted-foreground mt-0.5">
              Each guest is priced individually. Click any chip to edit
              nationality, age, pricing category, or residency documentation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
