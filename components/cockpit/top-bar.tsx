"use client"

import {
  Bell,
  ChevronRight,
  Compass,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useToast } from "@/components/ui/toast"
import { openCommandPalette } from "./command-palette"
import { openPlaceholder } from "./placeholder-modal"
import { useQuote } from "./quote-provider"

/**
 * Slim 48px top bar — brand, breadcrumb, ⌘K search, account.
 * No more operator dropdown chrome (replaced by the breadcrumb glyph + a
 * placeholder for switching). The visual weight that used to live here moved
 * to the document Cover section and the sticky PriceRibbon.
 */
export function TopBar() {
  const { quote } = useQuote()
  const { toast } = useToast()

  return (
    <header className="border-border/70 bg-surface/90 sticky top-0 z-30 flex h-12 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md">
      {/* Brand */}
      <button
        type="button"
        onClick={() =>
          toast({
            title: "SPI cockpit",
            description: "v3.2 · safari operations",
            tone: "info",
            durationMs: 1800,
          })
        }
        aria-label="SPI home"
        className="flex cursor-pointer items-center gap-2 rounded-md p-0.5 transition-colors outline-none hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <div className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
          <Compass className="size-4" />
        </div>
        <span className="font-display text-foreground text-[16px] leading-none tracking-tight">
          SPI
        </span>
      </button>

      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="text-muted-foreground hidden items-center gap-1.5 text-[12px] md:flex"
      >
        <span className="text-muted-foreground/40">/</span>
        <button
          type="button"
          onClick={() =>
            openPlaceholder({
              title: "Operator switching",
              description:
                "Multi-operator workspaces (jump from Tamarind Safaris to another operator) are queued for V1.",
            })
          }
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          {quote.operator.name}
        </button>
        <ChevronRight className="size-3 opacity-40" />
        <button
          type="button"
          onClick={openCommandPalette}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Quotes
        </button>
        <ChevronRight className="size-3 opacity-40" />
        <span className="text-foreground font-mono">{quote.id}</span>
      </nav>

      {/* Command palette trigger — central */}
      <div className="mx-auto flex w-full max-w-[440px] items-center">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="border-border/70 bg-surface-2/60 hover:bg-surface-2 hover:border-border focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 text-muted-foreground flex h-7 w-full cursor-pointer items-center gap-2 rounded-md border px-2 text-[12px] transition-colors outline-none"
        >
          <Search className="size-3" />
          <span className="truncate">Jump anywhere — quote, camp, action…</span>
          <span className="ml-auto flex items-center gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          onClick={() =>
            openPlaceholder({
              title: "Notifications",
              description:
                "A live feed of supplier confirmations, FX swings, and validator escalations is queued for V1. The price ribbon already surfaces commits and warnings.",
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
          className="ml-0.5 flex cursor-pointer items-center gap-2 rounded-md p-0.5 transition-colors outline-none hover:bg-surface-2/60 focus-visible:bg-surface-2/60 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <div className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--gold)_30%,var(--surface-2))] text-[11px] font-semibold tracking-wide text-[color-mix(in_oklch,var(--gold)_50%,var(--ink))]">
            {quote.agent.initials}
          </div>
        </button>
      </div>
    </header>
  )
}
