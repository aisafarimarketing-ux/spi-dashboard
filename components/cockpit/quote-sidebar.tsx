"use client"

import * as React from "react"
import { Filter, Pin, Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { CreateQuoteModal } from "./create-quote-modal"
import { openPlaceholder } from "./placeholder-modal"
import { useQuote } from "./quote-provider"

const accentTint = {
  gold: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
  success: "bg-[color-mix(in_oklch,var(--success)_55%,transparent)]",
  warning: "bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]",
  muted: "bg-border",
} as const

export function QuoteSidebar() {
  const { sidebarQuotes, activeQuoteId, switchToSidebarQuote } = useQuote()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [filter, setFilter] = React.useState("")

  const visible = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return sidebarQuotes
    return sidebarQuotes.filter((s) =>
      [s.title, s.id, s.sub, s.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [sidebarQuotes, filter])

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-border/70 flex h-full w-[260px] shrink-0 flex-col border-r">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-foreground/80 text-[12px] font-semibold tracking-tight">
            Quote files
          </span>
          <Badge variant="muted" size="sm" className="font-mono">
            {sidebarQuotes.length}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Filter quotes"
            className="cursor-pointer"
            onClick={() =>
              openPlaceholder({
                title: "Quote filters",
                description:
                  "Faceted filtering by status, region, agent, and value band is queued for V1. Use the search field for quick text matches.",
              })
            }
          >
            <Filter />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="New quote"
            className="cursor-pointer"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="border-border/70 bg-surface-2/40 hover:border-border focus-within:border-ring text-muted-foreground flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors">
          <Search className="size-3.5" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter quotes…"
            className="placeholder:text-muted-foreground/80 text-foreground w-full bg-transparent outline-none"
          />
          <Kbd className="ml-auto">/</Kbd>
        </div>
      </div>

      {/* Section labels */}
      <div className="text-muted-foreground/80 flex items-center justify-between px-3 pt-1.5 pb-1 text-[10.5px] font-medium tracking-[0.08em] uppercase">
        <span>Active</span>
        <span className="font-mono normal-case tracking-normal">
          {visible.length}
        </span>
      </div>

      {/* List */}
      <ul className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        {visible.length === 0 ? (
          <li className="border-border/60 text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-[11.5px]">
            No quotes match &ldquo;{filter}&rdquo;
          </li>
        ) : (
          visible.map((q) => {
            const isActive = q.id === activeQuoteId
            return (
              <li key={q.id}>
                <button
                  type="button"
                  data-active={isActive ? true : undefined}
                  onClick={() => switchToSidebarQuote(q.id)}
                  className={cn(
                    "group/item relative flex w-full cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 pl-3 text-left transition-colors",
                    "hover:bg-sidebar-accent",
                    "focus-visible:bg-sidebar-accent focus-visible:ring-ring/40 focus-visible:ring-3 outline-none",
                    "data-[active=true]:bg-sidebar-accent",
                    // Gold left rail on the active row — calm operational accent.
                    "before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-transparent before:transition-colors",
                    "data-[active=true]:before:bg-[color-mix(in_oklch,var(--gold)_60%,var(--ink))]"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      accentTint[q.accent]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground/90 truncate text-[12.5px] font-medium leading-tight">
                        {q.title}
                      </span>
                      {q.pinned && (
                        <Pin
                          className="text-muted-foreground/70 size-3 shrink-0"
                          strokeWidth={1.75}
                        />
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight">
                      <span className="truncate">{q.sub}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-muted-foreground/90 text-[10.5px] tracking-tight">
                        {q.status}
                      </span>
                      <span className="text-muted-foreground/40 text-[10.5px]">
                        ·
                      </span>
                      <span className="text-muted-foreground/80 font-mono text-[10.5px]">
                        {q.updated}
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground/60 group-hover/item:text-foreground/70 mt-0.5 font-mono text-[10px] tracking-tight transition-colors">
                    {q.id}
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>

      {/* Footer */}
      <div className="border-border/70 text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-2 text-[11px]">
        <span>Sarah Müller · Europe desk</span>
        <span className="font-mono">9:14</span>
      </div>

      <CreateQuoteModal open={createOpen} onOpenChange={setCreateOpen} />
    </aside>
  )
}
