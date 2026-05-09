"use client"

import * as React from "react"
import { CheckCircle2, CircleDashed, Download, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { DocSectionHeader } from "./doc-section-header"
import { ExportModal } from "./export-modal"
import { useQuote } from "./quote-provider"
import { ReviewAndSend } from "./review-send"

/**
 * Inline checklist mirrors the one inside the Review modal — operators see
 * the same checks at the bottom of the document so they know whether to
 * proceed without opening the modal first.
 */
function deriveChecklist(quote: ReturnType<typeof useQuote>["quote"], totals: ReturnType<typeof useQuote>["totals"]) {
  const missingNat = quote.guests.filter(
    (g) => !g.nationality || g.nationality === "Other"
  )
  const missingAges = quote.guests.filter(
    (g) => g.type !== "Adult" && g.age === undefined
  )
  const placed = new Set(quote.rooms.flatMap((r) => r.occupants))
  const unroomed = quote.guests.filter((g) => !placed.has(g.id))
  const parkFeeWarnings = totals.warnings.filter(
    (w) => w.scope === "parks" && w.level !== "info"
  )
  const vatWarnings = totals.warnings.filter(
    (w) =>
      w.scope === "costs" &&
      (w.id.startsWith("fuel-vat-") || w.id.startsWith("parkfee-vat-"))
  )
  return [
    {
      id: "nationality",
      label: "Guest nationality complete",
      passed: missingNat.length === 0,
    },
    {
      id: "child-ages",
      label: "Child ages complete",
      passed: missingAges.length === 0,
    },
    {
      id: "rooming",
      label: "Rooming confirmed",
      passed: unroomed.length === 0,
    },
    {
      id: "park-fees",
      label: "Park fees applied",
      passed: parkFeeWarnings.length === 0,
    },
    {
      id: "vat",
      label: "VAT logic checked",
      passed: vatWarnings.length === 0,
    },
    {
      id: "warnings",
      label: "Warnings reviewed",
      passed: totals.warnings.length === 0,
    },
  ]
}

export function DocReview() {
  const { quote, totals } = useQuote()
  const { toast } = useToast()

  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)

  const checklist = React.useMemo(
    () => deriveChecklist(quote, totals),
    [quote, totals]
  )
  const passedCount = checklist.filter((i) => i.passed).length
  const total = checklist.length

  return (
    <section className="px-6 pt-6 pb-8">
      <DocSectionHeader
        title="Ready to review?"
        glyph="review"
        summary={`${passedCount} of ${total} checks`}
      />

      <div className="border-border/70 bg-[color-mix(in_oklch,var(--success)_3%,var(--surface))] mt-4 rounded-lg border p-4">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 text-[12px]"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full",
                  item.passed
                    ? "bg-[color-mix(in_oklch,var(--success)_18%,transparent)] text-[color-mix(in_oklch,var(--success)_60%,var(--ink))]"
                    : "bg-[color-mix(in_oklch,var(--warning)_15%,transparent)] text-[color-mix(in_oklch,var(--warning)_60%,var(--ink))]"
                )}
              >
                {item.passed ? (
                  <CheckCircle2 className="size-3" strokeWidth={2.5} />
                ) : (
                  <CircleDashed className="size-2.5" />
                )}
              </span>
              <span
                className={cn(
                  item.passed ? "text-foreground/90" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-border/60 mt-4 flex flex-col items-stretch gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-[11.5px] leading-snug">
            {passedCount === total
              ? "All checks cleared — open Review to send the quote."
              : "Open Review to acknowledge remaining items and send."}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Opening export",
                  description: "Choose “Save as PDF” in the print dialog.",
                  tone: "info",
                  durationMs: 1800,
                })
                setExportOpen(true)
              }}
            >
              <Download />
              Export PDF
            </Button>
            <Button size="sm" onClick={() => setReviewOpen(true)}>
              <Send />
              Review &amp; Send
            </Button>
          </div>
        </div>
      </div>

      <ReviewAndSend open={reviewOpen} onOpenChange={setReviewOpen} />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </section>
  )
}
