"use client"

import {
  Bell,
  ChevronDown,
  ChevronRight,
  Compass,
  Globe2,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { openCommandPalette } from "./command-palette"

export function TopNav() {
  return (
    <header className="border-border/70 bg-surface/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
          <Compass className="size-4" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[20px] leading-none tracking-tight">
            SPI
          </span>
          <span className="text-muted-foreground font-display text-[12px] italic leading-none">
            cockpit
          </span>
        </div>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Operator switcher */}
      <button
        type="button"
        className="text-foreground/85 hover:bg-muted flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] font-medium transition-colors"
        aria-label="Switch operator"
      >
        <Globe2 className="text-muted-foreground size-3.5" />
        Tamarind Safaris
        <ChevronDown className="text-muted-foreground size-3.5" />
      </button>

      <Separator orientation="vertical" className="mx-0.5 h-4" />

      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="text-muted-foreground hidden items-center gap-1.5 text-[12.5px] md:flex"
      >
        <a className="hover:text-foreground transition-colors" href="#">
          Operations
        </a>
        <ChevronRight className="size-3.5 opacity-50" />
        <a className="hover:text-foreground transition-colors" href="#">
          Quotes
        </a>
        <ChevronRight className="size-3.5 opacity-50" />
        <span className="text-foreground font-medium">Q-2841</span>
      </nav>

      {/* Command palette trigger */}
      <div className="mx-auto flex w-full max-w-[420px] items-center">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="border-border/70 bg-surface-2/60 hover:bg-surface-2 hover:border-border focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 text-muted-foreground flex h-8 w-full items-center gap-2 rounded-lg border px-2.5 text-[12.5px] transition-colors outline-none"
        >
          <Search className="size-3.5" />
          <span className="truncate">
            Ask SPI or jump to a quote, camp, client…
          </span>
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <Badge
          variant="gold"
          className="hidden h-6 px-2 lg:inline-flex"
          aria-label="AI ready"
        >
          <Sparkles className="size-3" />
          SPI v3.2 · ready
        </Badge>

        <Button variant="ghost" size="icon-sm" aria-label="Settings">
          <Settings2 />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>

        <div className="ml-1 flex items-center gap-2 pl-1">
          <div className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--gold)_30%,var(--surface-2))] text-[11px] font-semibold tracking-wide text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))]">
            SM
          </div>
        </div>
      </div>
    </header>
  )
}
