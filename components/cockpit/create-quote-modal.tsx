"use client"

import * as React from "react"
import { Loader2, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuote } from "./quote-provider"

function todayPlus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function CreateQuoteModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { createQuote } = useQuote()

  const [client, setClient] = React.useState("")
  const [origin, setOrigin] = React.useState("")
  const [start, setStart] = React.useState(() => todayPlus(60))
  const [end, setEnd] = React.useState(() => todayPlus(70))
  const [pax, setPax] = React.useState(2)
  const [saving, setSaving] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setClient("")
      setOrigin("")
      setStart(todayPlus(60))
      setEnd(todayPlus(70))
      setPax(2)
      setSaving(false)
    }
    onOpenChange(next)
  }

  const issues: string[] = []
  if (!client.trim()) issues.push("Client name is required.")
  if (!origin.trim()) issues.push("Origin is required (city or country).")
  if (new Date(end) <= new Date(start))
    issues.push("End date must be after start date.")
  if (pax < 1) issues.push("Party must have at least 1 guest.")

  const canSave = issues.length === 0 && !saving

  const handleSave = () => {
    if (!canSave) return
    setSaving(true)
    window.setTimeout(() => {
      createQuote({ client: client.trim(), origin: origin.trim(), start, end, pax })
      setSaving(false)
      handleOpenChange(false)
    }, 220)
  }

  const computedNights = (() => {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
  })()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-[min(480px,92vw)] !max-h-[unset]">
        <DialogTitle className="sr-only">Create quote</DialogTitle>
        <DialogDescription className="sr-only">
          Start a fresh quote with client name, dates, and party size. You can
          add guests, rooming, and costs after.
        </DialogDescription>

        <div className="px-5 pt-5 pb-3">
          <div className="bg-[color-mix(in_oklch,var(--gold)_18%,var(--surface-2))] grid size-9 place-items-center rounded-md">
            <PlusCircle className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
          </div>
          <h2 className="font-display text-foreground mt-3 text-[20px] leading-tight tracking-tight">
            Create quote
          </h2>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            Start a fresh draft. Add guests, rooming, and costs from the
            workspace once it&rsquo;s open.
          </p>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cq-client">Client</Label>
              <Input
                id="cq-client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Henderson Family"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cq-origin">Origin</Label>
              <Input
                id="cq-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. London, UK"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cq-start">Start date</Label>
                <Input
                  id="cq-start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cq-end">End date</Label>
                <Input
                  id="cq-end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cq-pax">Party size</Label>
                <Input
                  id="cq-pax"
                  type="number"
                  min={1}
                  max={20}
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label>Nights</Label>
                <div className="border-border/60 bg-surface-2/40 text-foreground/85 flex h-8 items-center rounded-md border px-2.5 font-mono text-[12.5px]">
                  {computedNights}
                </div>
              </div>
            </div>
          </div>

          {issues.length > 0 && (
            <ul className="text-muted-foreground mt-3 space-y-0.5 text-[11.5px] leading-snug">
              {issues.map((m, i) => (
                <li key={i}>· {m}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-border/70 bg-surface-2/60 flex items-center justify-end gap-1.5 border-t px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
            className="cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                Creating
              </>
            ) : (
              "Create quote"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
