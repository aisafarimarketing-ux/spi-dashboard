"use client"

import {
  ArrowUpRight,
  CalendarDays,
  Download,
  History,
  Send,
  Share2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuote } from "./quote-provider"

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
        </div>

        <h1 className="font-display mt-1 flex items-baseline gap-2 text-[28px] leading-[1.05] tracking-tight">
          {quote.client}
          <span className="text-muted-foreground/80 text-[15px] italic">
            — {quote.origin}
          </span>
        </h1>

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
          <Button variant="outline" size="sm" aria-label="Version history">
            <History />
            v{versions.length}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download />
            Export
          </Button>
          <Button size="sm">
            <Send />
            Review & Send
          </Button>
        </div>
      </div>
    </section>
  )
}
