"use client"

import * as React from "react"

import { CommandPalette } from "./command-palette"
import { DocCosts } from "./doc-costs"
import { DocCover } from "./doc-cover"
import { DocGuestsRooming } from "./doc-guests-rooming"
import { DocItinerary } from "./doc-itinerary"
import { DocReview } from "./doc-review"
import { DrawerRoot } from "./drawers/drawer-root"
import { FilesRail } from "./files-rail"
import { FloatingSummon } from "./floating-summon"
import { IconRail } from "./icon-rail"
import { IntelligenceRail } from "./intelligence-rail"
import { type IntelligenceTab } from "./intelligence-panel"
import { PlaceholderHost } from "./placeholder-modal"
import { PriceRibbon } from "./price-ribbon"
import { PrintableQuote } from "./printable-quote"
import { TopBar } from "./top-bar"

/**
 * Cockpit shell — the new "Document + slide-out rails" layout.
 *
 *   ┌─ TopBar (slim) ────────────────────────────────────────────┐
 *   │ ┌────┬───────────────────────────────────────────────────┐ │
 *   │ │ ◈  │  Quote document (cover, itinerary, guests, ...)  │ │
 *   │ │ ✦• │                                                   │ │
 *   │ │ ⊙  │                                                   │ │
 *   │ │ ⚙  │                                                   │ │
 *   │ └────┴───────────────────────────────────────────────────┘ │
 *   └─ PriceRibbon (sticky bottom) ──────────────────────────────┘
 *                                              [✦ Tell SPI]  floating
 *
 * Files rail and Intelligence rail slide in over the canvas instead of
 * shrinking it — the document stays a comfortable single column.
 */
export function CockpitShell() {
  const [filesOpen, setFilesOpen] = React.useState(false)
  const [intelOpen, setIntelOpen] = React.useState(false)
  const [intelTab, setIntelTab] = React.useState<IntelligenceTab>("pending")

  const openIntel = (tab: IntelligenceTab) => {
    setIntelTab(tab)
    setIntelOpen(true)
  }

  return (
    <div className="bg-background flex h-svh min-h-svh flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <IconRail
          filesOpen={filesOpen}
          intelOpen={intelOpen}
          intelTab={intelTab}
          onOpenFiles={() => setFilesOpen(true)}
          onOpenIntel={openIntel}
        />

        <main className="scrollbar-thin flex min-w-0 flex-1 flex-col overflow-y-auto">
          <article className="mx-auto w-full max-w-[920px]">
            <DocCover />
            <DocItinerary />
            <DocGuestsRooming />
            <DocCosts />
            <DocReview />
          </article>
        </main>
      </div>

      <PriceRibbon />

      {/* Slide-in rails */}
      <FilesRail open={filesOpen} onOpenChange={setFilesOpen} />
      <IntelligenceRail
        open={intelOpen}
        onOpenChange={setIntelOpen}
        tab={intelTab}
        onTabChange={setIntelTab}
      />

      {/* Floating summon — hidden when the intelligence rail is open */}
      <FloatingSummon
        visible={!intelOpen}
        onSummon={() => openIntel("pending")}
      />

      {/* Cross-cutting hosts */}
      <DrawerRoot />
      <CommandPalette />
      <PlaceholderHost />
      <PrintableQuote />
    </div>
  )
}
