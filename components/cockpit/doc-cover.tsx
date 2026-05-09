"use client"

import * as React from "react"
import {
  CalendarDays,
  Pencil,
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
import { QuoteDetailsDrawer } from "./quote-details-drawer"
import { useQuote } from "./quote-provider"
import { ShareModal } from "./share-modal"

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) => d.toLocaleString("en-US", { month: "short" })
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}, ${e.getFullYear()}`
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

export function DocCover() {
  const { quote, versions } = useQuote()
  const { toast } = useToast()
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
    <section className="px-6 pt-6 pb-5">
      {/* Reference strip */}
      <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-mono">
        <span className="tracking-tight">{quote.id}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="tracking-tight">{quote.reference}</span>
        <span className="text-muted-foreground/40">·</span>
        <Badge variant="gold" size="sm">
          {quote.status}
        </Badge>
        <Badge variant="muted" size="sm">
          valid until {quote.validUntil}
        </Badge>

        <div className="ml-auto flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                aria-label="Version history"
              >
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
                  className="w-full"
                  onClick={() =>
                    toast({
                      title: "History tab",
                      description: "Open Tell SPI · History tab from the rail.",
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
            variant="ghost"
            size="xs"
            onClick={() => setShareOpen(true)}
            aria-label="Share quote"
          >
            <Share2 />
            Share
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setDetailsOpen(true)}
            aria-label="Edit quote details"
          >
            <Pencil />
          </Button>
        </div>
      </div>

      {/* Title */}
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        aria-label="Edit quote details"
        className="hover:bg-surface-2/40 -mx-2 mt-2 cursor-pointer rounded-md px-2 py-0.5 text-left transition-colors outline-none focus-visible:bg-surface-2/40 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <h1 className="font-display text-foreground flex items-baseline gap-2 text-[30px] leading-[1.05] tracking-tight">
          {quote.client}
          <span className="text-muted-foreground/80 text-[15px] italic">
            — {quote.origin}
          </span>
        </h1>
      </button>

      {/* Meta row */}
      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
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
          Lead
          <span className="text-foreground/85 font-medium">
            {quote.agent.name}
          </span>
        </span>
      </div>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
      <QuoteDetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} />
    </section>
  )
}
