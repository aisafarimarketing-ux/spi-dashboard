import {
  ArrowUpRight,
  CalendarDays,
  Copy,
  History,
  Pencil,
  Send,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QUOTE, PRICING_TOTALS } from "@/lib/mock"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) =>
    d.toLocaleString("en-US", { month: "short" })
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}, ${e.getFullYear()}`
}

export function QuoteHeader() {
  return (
    <section className="border-border/70 flex items-start justify-between gap-6 border-b px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-[11px] tracking-tight">
            {QUOTE.id} · {QUOTE.reference}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <Badge variant="gold" size="sm">
            {QUOTE.status}
          </Badge>
          <Badge variant="muted" size="sm">
            valid until {QUOTE.validUntil}
          </Badge>
        </div>

        <h1 className="font-display mt-1 flex items-baseline gap-2 text-[28px] leading-[1.05] tracking-tight">
          {QUOTE.client}
          <span className="text-muted-foreground/80 text-[15px] italic">
            — {QUOTE.origin}
          </span>
        </h1>

        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
          <span className="text-foreground/85 inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDateRange(QUOTE.travel.start, QUOTE.travel.end)}
            <span className="text-muted-foreground">
              · {QUOTE.travel.nights} nights
            </span>
          </span>
          <span className="bg-border/80 h-3 w-px" aria-hidden />
          <span className="text-foreground/85 inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {QUOTE.travel.pax} pax
            <span className="text-muted-foreground">
              · 2 adults · 2 children
            </span>
          </span>
          <span className="bg-border/80 h-3 w-px" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            Lead agent
            <span className="text-foreground/85 font-medium">
              {QUOTE.agent.name}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-start gap-5">
        {/* Hero KPI */}
        <div className="text-right">
          <div className="text-muted-foreground text-[10.5px] tracking-[0.08em] uppercase">
            Total sell
          </div>
          <div className="text-foreground font-display text-[30px] leading-none tracking-tight">
            {formatUSD(PRICING_TOTALS.totalSell)}
          </div>
          <div className="text-muted-foreground mt-1 flex items-center justify-end gap-2 text-[11.5px]">
            <span>{formatUSD(PRICING_TOTALS.perPax)} / pax</span>
            <span className="bg-border/80 h-3 w-px" aria-hidden />
            <Badge variant="success" size="sm">
              <ArrowUpRight className="size-3" />
              margin {PRICING_TOTALS.marginPct.toFixed(1)}%
            </Badge>
          </div>
        </div>

        <div className="bg-border/80 h-12 w-px self-center" aria-hidden />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">
            <History />
            v3
          </Button>
          <Button variant="outline" size="sm">
            <Copy />
            Duplicate
          </Button>
          <Button variant="outline" size="sm">
            <Pencil />
            Edit
          </Button>
          <Button size="sm">
            <Send />
            Send to client
          </Button>
        </div>
      </div>
    </section>
  )
}
