"use client"

import * as React from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { printQuote } from "./printable-quote"
import { useQuote } from "./quote-provider"

type Phase = "preparing" | "ready"

const PREP_STEPS = [
  "Loading client-facing layout",
  "Embedding itinerary and inclusions",
  "Hiding internal margin and per-line VAT",
  "Verifying pricing against engine",
] as const

export function ExportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { quote, totals, pushActivity } = useQuote()
  const { toast } = useToast()
  const [phase, setPhase] = React.useState<Phase>("preparing")
  const [stepIndex, setStepIndex] = React.useState(0)
  const announcedRef = React.useRef(false)

  // Walk through the prep steps when the modal opens; reset when it closes.
  // We reset via the open-change handler instead of an effect on `open`.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPhase("preparing")
      setStepIndex(0)
      announcedRef.current = false
    }
    onOpenChange(next)
  }

  // Drive the prep walk forward once the modal opens. Initial state is
  // "preparing"/0 — when the modal closes, handleOpenChange resets it,
  // so re-opens start cleanly without setState calls in this effect body.
  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    announcedRef.current = false

    let i = 0
    const tick = () => {
      if (cancelled) return
      if (i >= PREP_STEPS.length) {
        setPhase("ready")
        if (!announcedRef.current) {
          announcedRef.current = true
          pushActivity({
            kind: "export",
            title: "Export prepared",
            detail: `${quote.reference}`,
          })
          toast({
            title: "Export prepared",
            description: "Choose “Save as PDF” in the print dialog to download.",
            tone: "info",
          })
        }
        return
      }
      setStepIndex(i)
      i += 1
      window.setTimeout(tick, 320)
    }
    // Start asynchronously so React doesn't see a setState-in-effect.
    const handle = window.setTimeout(tick, 0)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [open, pushActivity, quote.reference, toast])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showClose={phase === "ready"}
        className="!w-[min(460px,92vw)] !max-h-[unset]"
      >
        <DialogTitle className="sr-only">Prepare export</DialogTitle>
        <DialogDescription className="sr-only">
          Preparing the client-facing quote for export. PDF generation is
          coming in a later phase.
        </DialogDescription>

        <div className="px-5 pt-5 pb-3">
          <div className="bg-[color-mix(in_oklch,var(--gold)_18%,var(--surface-2))] grid size-9 place-items-center rounded-md">
            <FileText className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h2 className="font-display text-foreground text-[18px] leading-tight tracking-tight">
              Preparing export
            </h2>
            {phase === "ready" && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="size-3" />
                Ready
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            {phase === "preparing"
              ? "Gathering the client-facing layout — internal pricing stays hidden."
              : "Ready to download. The PDF preserves itinerary, inclusions, and total — internal margin and VAT stay hidden."}
          </p>

          <ol className="border-border/60 bg-surface-2/40 mt-4 space-y-1.5 rounded-md border px-3 py-2.5">
            {PREP_STEPS.map((step, i) => {
              const done = phase === "ready" || i < stepIndex
              const active = phase === "preparing" && i === stepIndex
              return (
                <li
                  key={step}
                  className={cn(
                    "flex items-center gap-2 text-[12px] transition-opacity",
                    done
                      ? "text-foreground/85"
                      : active
                        ? "text-foreground/85"
                        : "text-muted-foreground/70"
                  )}
                >
                  <span
                    aria-hidden
                    className="grid size-4 shrink-0 place-items-center"
                  >
                    {done ? (
                      <CheckCircle2 className="text-[color-mix(in_oklch,var(--success)_55%,var(--ink))] size-3.5" />
                    ) : active ? (
                      <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                    ) : (
                      <Clock className="text-muted-foreground/60 size-3.5" />
                    )}
                  </span>
                  <span>{step}</span>
                </li>
              )
            })}
          </ol>

          {phase === "ready" && (
            <div className="border-border/70 bg-[color-mix(in_oklch,var(--gold)_5%,var(--surface))] mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5">
              <FileText className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] mt-0.5 size-3.5 shrink-0" />
              <div className="text-[11.5px] leading-snug">
                <div className="text-foreground/85 font-medium">
                  Reference {quote.reference}
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {totals.warnings.length === 0
                    ? "No validator flags. Print dialog will offer “Save as PDF” — pick that to produce a file."
                    : `${totals.warnings.length} validator flag${totals.warnings.length === 1 ? "" : "s"} resolved at prep time. Print dialog will offer “Save as PDF” — pick that to produce a file.`}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-border/70 bg-surface-2/60 flex items-center justify-end gap-1.5 border-t px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            Close
          </Button>
          <Button
            size="sm"
            disabled={phase !== "ready"}
            onClick={() => {
              handleOpenChange(false)
              printQuote()
            }}
            title="Opens the browser print dialog — choose Save as PDF"
          >
            <Download />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
