"use client"

import * as React from "react"
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  History,
  Pencil,
  Send,
  Share2,
  Sparkles,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { ExportModal } from "./export-modal"
import { QuoteDetailsDrawer } from "./quote-details-drawer"
import { useQuote } from "./quote-provider"
import { ReviewAndSend } from "./review-send"
import { ShareModal } from "./share-modal"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) => d.toLocaleString("en-US", { month: "short" })
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}, ${e.getFullYear()}`
}

export function QuoteHeader() {
  const { quote, totals, versions } = useQuote()
  const { toast } = useToast()
  const [reviewOpen, setReviewOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [shareOpen, setShareOpen] = React.useState(false)
  const [detailsOpen, setDetailsOpen] = React.useState(false)

  const adultCount = quote.guests.filter((g) => g.type === "Adult").length
  const childCount = quote.guests.filter((g) => g.type === "Child").length
  const infantCount = quote.guests.filter((g) => g.type === "Infant").length

  const guestSummary = [
    adultCount && `${adultCount} adult${adultCount === 1 ? "" : "s"}`,
    childCount && `${childCount} child${childCount === 1 ? "" : "ren"}`,
    infantCount && `${infantCount} infant${infantCount === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <section className="border-border/70 flex items-start justify-between gap-6 border-b px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-[11px] tracking-tight">
            {quote.id} · {quote.reference}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <Badge variant="gold" size="sm">
            {quote.status}
          </Badge>
          <Badge variant="muted" size="sm">
            valid until {quote.validUntil}
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Edit quote details"
            className="cursor-pointer"
            onClick={() => setDetailsOpen(true)}
          >
            <Pencil />
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className="hover:bg-muted/30 -mx-1 mt-0.5 cursor-pointer rounded-md px-1 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          aria-label="Edit quote details"
        >
          <h1 className="font-display flex items-baseline gap-2 text-[28px] leading-[1.05] tracking-tight">
            {quote.client}
            <span className="text-muted-foreground/80 text-[15px] italic">
              — {quote.origin}
            </span>
          </h1>
        </button>

        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
          <span className="text-foreground/85 inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateRange(quote.travel.start, quote.travel.end)}
            <span className="text-muted-foreground">
              · {quote.travel.nights} nights
            </span>
          </span>
          <span className="bg-border/80 h-3 w-px" aria-hidden />
          <span className="text-foreground/85 inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {quote.travel.pax} pax
            {guestSummary && (
              <span className="text-muted-foreground">· {guestSummary}</span>
            )}
          </span>
          <span className="bg-border/80 h-3 w-px" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            Lead agent
            <span className="text-foreground/85 font-medium">
              {quote.agent.name}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-start gap-5">
        <div className="text-right">
          <div className="text-muted-foreground text-[10.5px] tracking-[0.08em] uppercase">
            Total sell
          </div>
          <div className="text-foreground font-display text-[30px] leading-none tracking-tight">
            {formatUSD(totals.totalSell)}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center justify-end gap-2 text-[11.5px]">
            <span>{formatUSD(totals.perPax)} / pax</span>
            <span className="bg-border/80 h-3 w-px" aria-hidden />
            <Badge variant="success" size="sm">
              <ArrowUpRight className="size-3" />
              margin {totals.marginPct.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <div className="bg-border/80 h-12 w-px self-center" aria-hidden />

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Version history"
                className="cursor-pointer"
              >
                <History />
                v{versions.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-3">
              <div className="text-foreground/85 text-[11.5px] font-semibold tracking-[0.06em] uppercase">
                Version history
              </div>
              <ol className="mt-2 space-y-1.5">
                {versions.slice(0, 5).map((v) => (
                  <li
                    key={v.id}
                    className="border-border/60 flex items-center justify-between gap-2 rounded-md border px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="text-foreground/90 flex items-center gap-1.5 text-[12px] font-medium">
                        {v.label}
                        {v.via === "spi" && (
                          <Badge variant="gold" size="sm" className="font-medium">
                            <Sparkles className="size-3" />
                            SPI
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-[10.5px]">
                        {v.author} · {v.authoredAt}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        v.delta < 0
                          ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                          : v.delta > 0
                            ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
                            : "text-muted-foreground"
                      )}
                    >
                      {v.delta === 0
                        ? "—"
                        : `${v.delta > 0 ? "+" : "−"}${formatUSD(Math.abs(v.delta))}`}
                    </span>
                  </li>
                ))}
              </ol>
              {versions.length > 5 && (
                <div className="text-muted-foreground/80 mt-2 text-center text-[10.5px]">
                  + {versions.length - 5} earlier versions in History tab →
                </div>
              )}
              <div className="border-border/60 mt-3 border-t pt-2">
                <Button
                  variant="ghost"
                  size="xs"
                  className="w-full cursor-pointer"
                  onClick={() =>
                    toast({
                      title: "History tab open",
                      description: "Use the right panel · History tab.",
                      tone: "info",
                      durationMs: 1800,
                    })
                  }
                >
                  Full history →
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="cursor-pointer"
          >
            <Share2 />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            className="cursor-pointer"
          >
            <Download />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => setReviewOpen(true)}
            className="cursor-pointer"
          >
            <Send />
            Review & Send
          </Button>
        </div>
      </div>

      <ReviewAndSend open={reviewOpen} onOpenChange={setReviewOpen} />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
      <QuoteDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} />
    </section>
  )
}
