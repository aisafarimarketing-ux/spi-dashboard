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
import { useToast } from "@/components/ui/toast"
import { openCommandPalette } from "./command-palette"
import { openPlaceholder } from "./placeholder-modal"
import { useQuote } from "./quote-provider"

export function TopNav() {
  const { quote } = useQuote()
  const { toast } = useToast()

  return (
    <header className="border-border/70 bg-surface/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md">
      {/* Brand */}
      <button
        type="button"
        className="hover:bg-muted/40 flex cursor-pointer items-center gap-2.5 rounded-md p-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        onClick={() =>
          toast({
            title: "SPI cockpit",
            description: "v3.2 · safari operations",
            tone: "info",
            durationMs: 1800,
          })
        }
        aria-label="SPI home"
      >
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
      </button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Operator switcher */}
      <button
        type="button"
        onClick={() =>
          openPlaceholder({
            title: "Operator switching",
            description:
              "Multi-operator workspaces (jump from Tamarind Safaris to another operator's cockpit) are queued for V1. The current quote stays scoped to Tamarind.",
          })
        }
        className="text-foreground/85 hover:bg-muted flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        aria-label="Switch operator"
      >
        <Globe2 className="text-muted-foreground size-3.5" />
        {quote.operator.name}
        <ChevronDown className="text-muted-foreground size-3.5" />
      </button>

      <Separator orientation="vertical" className="mx-0.5 h-4" />

      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="text-muted-foreground hidden items-center gap-1.5 text-[12.5px] md:flex"
      >
        <button
          type="button"
          onClick={() =>
            toast({
              title: "Operations workspace",
              description: "Cockpit is the only workspace in V1.",
              tone: "info",
              durationMs: 2000,
            })
          }
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Operations
        </button>
        <ChevronRight className="size-3.5 opacity-50" />
        <button
          type="button"
          onClick={openCommandPalette}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Quotes
        </button>
        <ChevronRight className="size-3.5 opacity-50" />
        <span className="text-foreground font-medium">{quote.id}</span>
      </nav>

      {/* Command palette trigger */}
      <div className="mx-auto flex w-full max-w-[420px] items-center">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="border-border/70 bg-surface-2/60 hover:bg-surface-2 hover:border-border focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 text-muted-foreground flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-[12.5px] transition-colors outline-none"
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

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Settings"
          className="cursor-pointer"
          onClick={() =>
            openPlaceholder({
              title: "Cockpit settings",
              description:
                "Workspace settings — desks, time zones, currency formatting, and validator thresholds — are queued for V1.",
            })
          }
        >
          <Settings2 />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="cursor-pointer"
          onClick={() =>
            openPlaceholder({
              title: "Notifications",
              description:
                "A live feed of supplier confirmations, FX swings, and validator escalations is queued for V1. The status strip already surfaces commits and warnings.",
            })
          }
        >
          <Bell />
        </Button>

        <button
          type="button"
          onClick={() =>
            openPlaceholder({
              title: `${quote.agent.name} · ${quote.agent.desk} desk`,
              description:
                "Profile, desk preferences, and operator handover are queued for V1.",
            })
          }
          aria-label={`${quote.agent.name} profile`}
          className="hover:bg-muted/40 ml-1 flex cursor-pointer items-center gap-2 rounded-md p-1 pl-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--gold)_30%,var(--surface-2))] text-[11px] font-semibold tracking-wide text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))]">
            {quote.agent.initials}
          </div>
        </button>
      </div>
    </header>
  )
}
