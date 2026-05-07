"use client"

import * as React from "react"
import { BedDouble, Loader2, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type {
  Confidence,
  RoomAssignment,
  RoomingPolicySource,
  SleepingArrangement,
} from "@/lib/types"
import { useQuote } from "../quote-provider"
import { ImpactFooterContent } from "./impact"

const ARRANGEMENT_LABEL: Record<SleepingArrangement, string> = {
  Single: "Single",
  Double: "Double",
  Twin: "Twin",
  Triple: "Triple",
  Quad: "Quad",
  FamilyRoom: "Family room",
  Interconnecting: "Interconnecting",
  TwoRoomsReplacingFamily: "2 rooms · family override",
  ExtraBed: "Extra bed",
  ChildSharing: "Child sharing",
  CustomCampApproved: "Custom · camp-approved",
}

const SOURCE_LABEL: Record<RoomingPolicySource, string> = {
  "camp-policy": "Camp policy",
  "operator-override": "Operator override",
  negotiated: "Negotiated",
  "ai-suggested": "SPI suggested",
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}

function blankRoom(): RoomAssignment {
  return {
    id: `r-${Date.now()}`,
    arrangement: "Double",
    occupants: [],
    policy: {
      source: "operator-override",
      confidence: "medium",
      note: "",
    },
    priceImpact: { direction: "neutral", amountUSD: 0 },
    notes: "",
  }
}

export function RoomingDrawer({ roomId }: { roomId?: string }) {
  const { quote, totals, preview, upsertRoom, removeRoom, closeDrawer } =
    useQuote()

  const existing = roomId
    ? quote.rooms.find((r) => r.id === roomId)
    : undefined
  const isNew = !existing

  const [draft, setDraft] = React.useState<RoomAssignment>(
    () => existing ?? blankRoom()
  )

  React.useEffect(() => {
    setDraft(existing ?? blankRoom())
  }, [roomId, existing])

  const set = <K extends keyof RoomAssignment>(
    key: K,
    value: RoomAssignment[K]
  ) => setDraft((d) => ({ ...d, [key]: value }))

  const setPolicy = <K extends keyof RoomAssignment["policy"]>(
    key: K,
    value: RoomAssignment["policy"][K]
  ) =>
    setDraft((d) => ({
      ...d,
      policy: { ...d.policy, [key]: value },
    }))

  const toggleOccupant = (id: string) => {
    setDraft((d) => ({
      ...d,
      occupants: d.occupants.includes(id)
        ? d.occupants.filter((x) => x !== id)
        : [...d.occupants, id],
    }))
  }

  // Candidate quote with this room replaced/added — for impact preview.
  const candidate = React.useMemo(() => {
    const others = quote.rooms.map((r) =>
      r.id === draft.id
        ? r
        : {
            ...r,
            occupants: r.occupants.filter(
              (oid) => !draft.occupants.includes(oid)
            ),
          }
    )
    const exists = quote.rooms.some((r) => r.id === draft.id)
    const rooms = exists
      ? others.map((r) => (r.id === draft.id ? draft : r))
      : [...others, draft]
    return { ...quote, rooms }
  }, [draft, quote])

  const candidateTotals = React.useMemo(() => preview(candidate), [
    candidate,
    preview,
  ])

  const [saving, setSaving] = React.useState(false)

  const handleApply = () => {
    setSaving(true)
    window.setTimeout(() => {
      upsertRoom(
        draft,
        isNew
          ? `Added arrangement: ${ARRANGEMENT_LABEL[draft.arrangement]}`
          : `Updated room ${draft.id.replace("r", "")}: ${
              ARRANGEMENT_LABEL[draft.arrangement]
            } · ${SOURCE_LABEL[draft.policy.source]}`
      )
      setSaving(false)
      closeDrawer()
    }, 220)
  }

  const handleDelete = () => {
    if (!existing) return
    removeRoom(existing.id, `Removed room ${existing.id.replace("r", "")}`)
    closeDrawer()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start gap-2.5">
            <div className="bg-surface-2 grid size-8 shrink-0 place-items-center rounded-md">
              {isNew ? (
                <Plus className="text-foreground/80 size-4" />
              ) : (
                <BedDouble className="text-foreground/80 size-4" />
              )}
            </div>
            <div className="min-w-0">
              <SheetTitle>
                {isNew
                  ? "Add arrangement"
                  : `Room ${existing?.id.replace("r", "")} · ${
                      ARRANGEMENT_LABEL[draft.arrangement]
                    }`}
              </SheetTitle>
              <SheetDescription>
                Sleeping arrangements, not rigid room types. Operator overrides
                and camp policies are tracked separately.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {/* Arrangement */}
          <FormSection title="Arrangement">
            <Field label="Type">
              <Select
                value={draft.arrangement}
                onValueChange={(v) =>
                  set("arrangement", v as SleepingArrangement)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ARRANGEMENT_LABEL) as SleepingArrangement[]).map(
                    (a) => (
                      <SelectItem key={a} value={a}>
                        {ARRANGEMENT_LABEL[a]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </Field>
          </FormSection>

          {/* Occupants */}
          <FormSection
            title="Occupants"
            aside={
              <Badge variant="muted" size="sm" className="font-mono">
                {draft.occupants.length} placed
              </Badge>
            }
          >
            <div className="grid grid-cols-2 gap-1.5">
              {quote.guests.map((g) => {
                const checked = draft.occupants.includes(g.id)
                const inOtherRoom = quote.rooms.some(
                  (r) => r.id !== draft.id && r.occupants.includes(g.id)
                )
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleOccupant(g.id)}
                    aria-pressed={checked}
                    className={cn(
                      "border-border/70 bg-surface flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors",
                      "hover:border-border hover:bg-surface-2/60",
                      checked &&
                        "border-[color-mix(in_oklch,var(--gold)_45%,var(--border))] bg-[color-mix(in_oklch,var(--gold)_8%,var(--surface))]"
                    )}
                  >
                    <span
                      className={cn(
                        "border-border grid size-3.5 place-items-center rounded-[3px] border",
                        checked &&
                          "border-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] bg-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]"
                      )}
                      aria-hidden
                    >
                      {checked && (
                        <span className="size-1.5 rounded-[1px] bg-card" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-foreground/90 truncate text-[12px] leading-tight">
                        {g.name || "(unnamed)"}
                      </div>
                      <div className="text-muted-foreground text-[10.5px] leading-tight">
                        {g.type}
                        {g.age !== undefined ? ` · ${g.age}` : ""}
                        {inOtherRoom && !checked ? " · in another room" : ""}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {draft.occupants.length === 0 && (
              <p className="text-muted-foreground text-[11px]">
                No guests placed yet — pick at least one.
              </p>
            )}
          </FormSection>

          {/* Policy */}
          <FormSection title="Policy & confidence">
            <FormRow>
              <Field label="Source">
                <Select
                  value={draft.policy.source}
                  onValueChange={(v) =>
                    setPolicy("source", v as RoomingPolicySource)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOURCE_LABEL) as RoomingPolicySource[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {SOURCE_LABEL[s]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Confidence">
                <Select
                  value={draft.policy.confidence}
                  onValueChange={(v) =>
                    setPolicy("confidence", v as Confidence)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {CONFIDENCE_LABEL[c]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>
            <Field label="Override reason / policy note" htmlFor="r-note">
              <Textarea
                id="r-note"
                rows={2}
                value={draft.policy.note ?? ""}
                onChange={(e) =>
                  setPolicy("note", e.target.value || undefined)
                }
                placeholder="e.g. Family room unavailable; camp confirmed two interconnecting twins at child rate."
              />
            </Field>
          </FormSection>

          {/* Price impact */}
          <FormSection title="Price impact">
            <FormRow>
              <Field label="Direction">
                <Select
                  value={draft.priceImpact.direction}
                  onValueChange={(v) =>
                    set("priceImpact", {
                      ...draft.priceImpact,
                      direction: v as RoomAssignment["priceImpact"]["direction"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">No change</SelectItem>
                    <SelectItem value="add">Adds</SelectItem>
                    <SelectItem value="save">Saves</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (USD)" htmlFor="r-impact">
                <Input
                  id="r-impact"
                  type="number"
                  min={0}
                  value={draft.priceImpact.amountUSD}
                  onChange={(e) =>
                    set("priceImpact", {
                      ...draft.priceImpact,
                      amountUSD: Number(e.target.value) || 0,
                    })
                  }
                  disabled={draft.priceImpact.direction === "neutral"}
                />
              </Field>
            </FormRow>
            <p className="text-muted-foreground text-[11px] leading-snug">
              This impact is recorded for audit. Actual price change comes from
              the cost lines tied to the affected nights — edit those in the
              Costs &amp; VAT drawer.
            </p>
          </FormSection>

          {/* Free notes */}
          <FormSection title="Internal notes">
            <Field label="Note" htmlFor="r-int-note">
              <Textarea
                id="r-int-note"
                rows={2}
                value={draft.notes ?? ""}
                onChange={(e) => set("notes", e.target.value || undefined)}
                placeholder="optional"
              />
            </Field>
          </FormSection>
        </SheetBody>

        <SheetFooter>
          <ImpactFooterContent
            current={totals.totalSell}
            next={candidateTotals.totalSell}
            confidence={candidateTotals.confidence}
          />
          <div className="flex items-center gap-1">
            {!isNew && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                aria-label="Remove room"
              >
                <Trash2 />
                Remove
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={closeDrawer}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving
                </>
              ) : isNew ? (
                "Add arrangement"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FormSection({
  title,
  aside,
  children,
}: {
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-foreground/80 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
          {title}
        </h3>
        {aside}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
