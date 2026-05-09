"use client"

import * as React from "react"
import { FileEdit, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useToast } from "@/components/ui/toast"
import { useQuote } from "./quote-provider"

export function QuoteDetailsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { quote, applyChanges } = useQuote()
  const { toast } = useToast()

  const [client, setClient] = React.useState(quote.client)
  const [origin, setOrigin] = React.useState(quote.origin)
  const [reference, setReference] = React.useState(quote.reference)
  const [status, setStatus] = React.useState(quote.status)
  const [validUntil, setValidUntil] = React.useState(quote.validUntil)
  const [start, setStart] = React.useState(quote.travel.start)
  const [end, setEnd] = React.useState(quote.travel.end)
  const [pax, setPax] = React.useState(quote.travel.pax)
  const [saving, setSaving] = React.useState(false)

  // Keep the form in sync if the underlying quote changes (e.g. a sidebar switch).
  React.useEffect(() => {
    if (!open) return
    setClient(quote.client)
    setOrigin(quote.origin)
    setReference(quote.reference)
    setStatus(quote.status)
    setValidUntil(quote.validUntil)
    setStart(quote.travel.start)
    setEnd(quote.travel.end)
    setPax(quote.travel.pax)
    // We intentionally re-init when the drawer opens, not on every quote tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, quote.id])

  const computedNights = (() => {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
  })()

  const dirty =
    client !== quote.client ||
    origin !== quote.origin ||
    reference !== quote.reference ||
    status !== quote.status ||
    validUntil !== quote.validUntil ||
    start !== quote.travel.start ||
    end !== quote.travel.end ||
    pax !== quote.travel.pax

  const issues: string[] = []
  if (!client.trim()) issues.push("Client is required.")
  if (!reference.trim()) issues.push("Reference is required.")
  if (new Date(end) <= new Date(start))
    issues.push("End date must be after start date.")

  const canSave = dirty && issues.length === 0 && !saving

  const handleSave = () => {
    if (!canSave) return
    setSaving(true)
    window.setTimeout(() => {
      applyChanges(
        {
          client: client.trim(),
          origin: origin.trim(),
          reference: reference.trim(),
          status,
          validUntil,
          travel: {
            ...quote.travel,
            start,
            end,
            nights: computedNights,
            pax,
          },
        },
        `Updated quote details: ${client.trim()}`
      )
      setSaving(false)
      onOpenChange(false)
    }, 220)
  }

  const handleClose = () => {
    if (saving) return
    if (dirty) {
      toast({
        title: "Discarded unsaved changes",
        tone: "info",
        durationMs: 1800,
      })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start gap-2.5">
            <div className="bg-surface-2 grid size-8 shrink-0 place-items-center rounded-md">
              <FileEdit className="text-foreground/80 size-4" />
            </div>
            <div className="min-w-0">
              <SheetTitle>Quote details</SheetTitle>
              <SheetDescription>
                Client metadata, dates, and party size. Pricing engine
                recomputes on save.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <Section title="Client">
            <Field label="Client" htmlFor="qd-client" span={2}>
              <Input
                id="qd-client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="e.g. Henderson Family"
              />
            </Field>
            <Field label="Origin" htmlFor="qd-origin" span={2}>
              <Input
                id="qd-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. London, UK"
              />
            </Field>
          </Section>

          <Section title="Reference & status">
            <Row>
              <Field label="Reference" htmlFor="qd-ref">
                <Input
                  id="qd-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono"
                />
              </Field>
              <Field label="Status" htmlFor="qd-status">
                <Input
                  id="qd-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Draft v3"
                />
              </Field>
            </Row>
            <Field label="Valid until" htmlFor="qd-valid" span={2}>
              <Input
                id="qd-valid"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Travel window">
            <Row>
              <Field label="Start" htmlFor="qd-start">
                <Input
                  id="qd-start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field label="End" htmlFor="qd-end">
                <Input
                  id="qd-end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
            </Row>
            <Row>
              <Field label="Party size" htmlFor="qd-pax">
                <Input
                  id="qd-pax"
                  type="number"
                  min={1}
                  max={20}
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Nights">
                <div className="border-border/60 bg-surface-2/40 text-foreground/85 flex h-8 items-center rounded-md border px-2.5 font-mono text-[12.5px]">
                  {computedNights}
                </div>
              </Field>
            </Row>
          </Section>

          {issues.length > 0 && (
            <ul className="text-muted-foreground space-y-0.5 text-[11.5px] leading-snug">
              {issues.map((m, i) => (
                <li key={i}>· {m}</li>
              ))}
            </ul>
          )}
        </SheetBody>

        <SheetFooter>
          <div className="text-muted-foreground text-[11px]">
            {dirty ? "Unsaved changes" : "No changes"}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
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
                  Saving
                </>
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

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-foreground/80 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
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
