import { BedDouble, Plus, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GUESTS, ROOMS } from "@/lib/mock"

const roomGlyph: Record<string, string> = {
  King: "⬛",
  Twin: "▦",
  Triple: "▣",
  Family: "▤",
}

export function RoomingOverview() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersRound className="text-muted-foreground size-3.5" />
          <CardTitle>Rooming & guests</CardTitle>
          <Badge variant="muted" size="sm" className="font-mono">
            {ROOMS.length} rooms · {GUESTS.length} pax
          </Badge>
        </div>
        <CardAction>
          <Button variant="ghost" size="xs">
            <Plus />
            Room
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pt-1">
        {ROOMS.map((room) => {
          const guests = room.occupants
            .map((id) => GUESTS.find((g) => g.id === id))
            .filter((g): g is (typeof GUESTS)[number] => Boolean(g))

          return (
            <div
              key={room.id}
              className="border-border/70 bg-surface/60 hover:border-border rounded-lg border p-2.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-surface-2 grid size-6 place-items-center rounded">
                    <BedDouble className="text-foreground/70 size-3.5" />
                  </div>
                  <div>
                    <div className="text-foreground text-[12.5px] font-medium leading-tight">
                      Room {room.id.replace("r", "")} · {room.type}
                    </div>
                    <div className="text-muted-foreground text-[11px] leading-tight">
                      {room.notes ?? "No special requests"}
                    </div>
                  </div>
                </div>
                <span
                  aria-hidden
                  className="text-muted-foreground/60 font-mono text-[10.5px]"
                >
                  {roomGlyph[room.type]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {guests.map((g) => {
                  const initials = g.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                  return (
                    <span
                      key={g.id}
                      className="border-border/70 bg-surface-2/70 inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px]"
                    >
                      <span className="bg-[color-mix(in_oklch,var(--gold)_22%,var(--surface-2))] text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))] grid size-4 place-items-center rounded-full text-[9px] font-semibold">
                        {initials}
                      </span>
                      <span className="text-foreground/85">{g.name.split(" ")[0]}</span>
                      <span className="text-muted-foreground/80 font-mono text-[10px]">
                        {g.age}
                      </span>
                      {g.dietary && (
                        <Badge size="sm" variant="muted" className="font-medium">
                          {g.dietary}
                        </Badge>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Nationality logic */}
        <div className="border-border/60 mt-1 flex items-start gap-2 rounded-lg border border-dashed p-2.5">
          <span
            aria-hidden
            className="bg-[color-mix(in_oklch,var(--gold)_30%,transparent)] mt-0.5 size-1.5 shrink-0 rounded-full"
          />
          <div className="text-[11.5px] leading-snug">
            <div className="text-foreground/85 font-medium">
              Nationality logic — Non-Resident
            </div>
            <p className="text-muted-foreground mt-0.5">
              All 4 guests on GBR passports. Non-resident park &amp; conservancy
              fees applied. Theo (11) qualifies for child band at Serengeti — saving
              <span className="text-foreground/85 font-medium"> $120</span> auto-applied.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
