"use client"

import * as React from "react"
import {
  AlertCircle,
  Loader2,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react"

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
import { suggestPricingCategory } from "@/lib/pricing-engine"
import type {
  Guest,
  GuestType,
  Nationality,
  PricingCategory,
} from "@/lib/types"
import { useQuote } from "../quote-provider"
import { ImpactFooterContent } from "./impact"

const NATIONALITIES: Nationality[] = [
  "Tanzanian",
  "Kenyan",
  "Ugandan",
  "Rwandan",
  "British",
  "American",
  "German",
  "French",
  "Indian",
  "South African",
  "Other",
]

const CATEGORY_LABEL: Record<PricingCategory, string> = {
  Local: "Local · Tanzanian citizen",
  EastAfricanResident: "East African Resident",
  International: "International",
}

const SOURCE_LABEL: Record<Guest["pricingCategorySource"], string> = {
  suggested: "Engine suggested",
  "operator-confirmed": "Operator confirmed",
  "operator-override": "Operator override",
}

function blankGuest(): Guest {
  return {
    id: `g-${Date.now()}`,
    name: "",
    type: "Adult",
    nationality: "British",
    pricingCategory: "International",
    pricingCategorySource: "operator-confirmed",
  }
}

export function GuestDrawer({ guestId }: { guestId?: string }) {
  const { quote, totals, preview, upsertGuest, removeGuest, closeDrawer } =
    useQuote()

  const existing = guestId
    ? quote.guests.find((g) => g.id === guestId)
    : undefined
  const isNew = !existing

  const [draft, setDraft] = React.useState<Guest>(() => existing ?? blankGuest())

  // If the user navigates between guests without remounting, sync draft.
  React.useEffect(() => {
    setDraft(existing ?? blankGuest())
  }, [guestId, existing])

  const set = <K extends keyof Guest>(key: K, value: Guest[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // ── Derived: candidate quote for live preview ─────────────────────────
  const candidate = React.useMemo(() => {
    const guests = isNew
      ? [...quote.guests, draft]
      : quote.guests.map((g) => (g.id === draft.id ? draft : g))
    return {
      ...quote,
      guests,
      travel: { ...quote.travel, pax: guests.length },
    }
  }, [draft, isNew, quote])

  const candidateTotals = React.useMemo(() => preview(candidate), [
    candidate,
    preview,
  ])

  const suggested = suggestPricingCategory(
    draft.nationality,
    Boolean(draft.residencyDoc)
  )
  const categoryDiffersFromSuggestion = suggested !== draft.pricingCategory

  // ── Validation ────────────────────────────────────────────────────────
  const issues: string[] = []
  if (!draft.name.trim()) issues.push("Name is required.")
  if (
    (draft.type === "Child" || draft.type === "Infant") &&
    (draft.age === undefined || draft.age < 0)
  ) {
    issues.push(`Age is mandatory for ${draft.type.toLowerCase()}s.`)
  }
  if (
    draft.pricingCategory === "EastAfricanResident" &&
    !draft.residencyDoc
  ) {
    issues.push("EA Resident pricing requires a residency document.")
  }

  const canApply = issues.length === 0
  const [saving, setSaving] = React.useState(false)

  const handleApply = () => {
    if (!canApply || saving) return
    setSaving(true)
    window.setTimeout(() => {
      upsertGuest(
        draft,
        isNew ? `Added guest: ${draft.name}` : `Updated guest: ${draft.name}`
      )
      setSaving(false)
      closeDrawer()
    }, 220)
  }

  const handleDelete = () => {
    if (!existing) return
    removeGuest(existing.id, `Removed guest: ${existing.name}`)
    closeDrawer()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start gap-2.5">
            <div className="bg-surface-2 grid size-8 shrink-0 place-items-center rounded-md">
              {isNew ? (
                <UserPlus className="text-foreground/80 size-4" />
              ) : (
                <UserRound className="text-foreground/80 size-4" />
              )}
            </div>
            <div className="min-w-0">
              <SheetTitle>
                {isNew ? "Add guest" : draft.name || "Edit guest"}
              </SheetTitle>
              <SheetDescription>
                Each guest is priced individually. Children require an exact
                age — pricing depends on it.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {/* Identity */}
          <FormSection title="Identity">
            <FormRow>
              <Field label="Full name" htmlFor="g-name" span={2}>
                <Input
                  id="g-name"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Priya Henderson"
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field label="Guest type">
                <Select
                  value={draft.type}
                  onValueChange={(v) => set("type", v as GuestType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Child">Child</SelectItem>
                    <SelectItem value="Infant">Infant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label={
                  draft.type === "Adult"
                    ? "Age (optional)"
                    : "Age (required)"
                }
                htmlFor="g-age"
              >
                <Input
                  id="g-age"
                  type="number"
                  min={0}
                  max={120}
                  value={draft.age ?? ""}
                  onChange={(e) =>
                    set(
                      "age",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                  placeholder={draft.type === "Adult" ? "—" : "exact age"}
                />
              </Field>
            </FormRow>
          </FormSection>

          {/* Travel docs */}
          <FormSection title="Travel & residency">
            <FormRow>
              <Field label="Nationality">
                <Select
                  value={draft.nationality}
                  onValueChange={(v) => set("nationality", v as Nationality)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Passport" htmlFor="g-passport">
                <Input
                  id="g-passport"
                  value={draft.passport ?? ""}
                  onChange={(e) => set("passport", e.target.value || undefined)}
                  placeholder="GBR, IND…"
                />
              </Field>
            </FormRow>
            <FormRow>
              <Field
                label="Residency / work-permit doc"
                htmlFor="g-residency"
                span={2}
              >
                <Input
                  id="g-residency"
                  value={draft.residencyDoc ?? ""}
                  onChange={(e) =>
                    set("residencyDoc", e.target.value || undefined)
                  }
                  placeholder="e.g. KE work permit · expires 2027-04"
                />
              </Field>
            </FormRow>
          </FormSection>

          {/* Pricing category */}
          <FormSection
            title="Pricing"
            aside={
              <Badge
                variant="muted"
                size="sm"
                className="font-mono"
              >
                <Sparkles className="size-3" />
                Suggests {suggested.replace(/([A-Z])/g, " $1").trim()}
              </Badge>
            }
          >
            <FormRow>
              <Field label="Category">
                <Select
                  value={draft.pricingCategory}
                  onValueChange={(v) =>
                    set("pricingCategory", v as PricingCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABEL) as PricingCategory[]).map(
                      (cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABEL[cat]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Source">
                <Select
                  value={draft.pricingCategorySource}
                  onValueChange={(v) =>
                    set(
                      "pricingCategorySource",
                      v as Guest["pricingCategorySource"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SOURCE_LABEL) as Guest["pricingCategorySource"][]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {SOURCE_LABEL[s]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </FormRow>

            {categoryDiffersFromSuggestion && (
              <p className="text-muted-foreground bg-[color-mix(in_oklch,var(--gold)_8%,var(--surface-2))] border-border/60 rounded-md border px-2.5 py-1.5 text-[11px] leading-snug">
                Engine suggests{" "}
                <span className="text-foreground/85 font-medium">
                  {CATEGORY_LABEL[suggested]}
                </span>{" "}
                based on nationality
                {draft.residencyDoc ? " and residency doc" : ""}. Operator
                override will be recorded.
              </p>
            )}
          </FormSection>

          {/* Misc */}
          <FormSection title="Notes & dietary">
            <FormRow>
              <Field label="Dietary" htmlFor="g-diet">
                <Input
                  id="g-diet"
                  value={draft.dietary ?? ""}
                  onChange={(e) => set("dietary", e.target.value || undefined)}
                  placeholder="e.g. Pescatarian"
                />
              </Field>
              <Field label="Internal note" htmlFor="g-note">
                <Input
                  id="g-note"
                  value={draft.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value || undefined)}
                  placeholder="optional"
                />
              </Field>
            </FormRow>
          </FormSection>

          {/* Validation block */}
          {issues.length > 0 && (
            <div className="border-border/60 bg-[color-mix(in_oklch,var(--destructive)_6%,var(--card))] flex items-start gap-2 rounded-md border px-2.5 py-2">
              <AlertCircle className="text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))] mt-0.5 size-3.5 shrink-0" />
              <ul className="text-muted-foreground space-y-0.5 text-[11.5px] leading-snug">
                {issues.map((m, i) => (
                  <li key={i}>· {m}</li>
                ))}
              </ul>
            </div>
          )}
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
                aria-label="Remove guest"
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
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!canApply || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving
                </>
              ) : isNew ? (
                "Add guest"
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

// ── Internal layout helpers ─────────────────────────────────────────────

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
  span = 1,
  children,
}: {
  label: string
  htmlFor?: string
  span?: 1 | 2
  children: React.ReactNode
}) {
  return (
    <div className={span === 2 ? "col-span-2 space-y-1" : "space-y-1"}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
