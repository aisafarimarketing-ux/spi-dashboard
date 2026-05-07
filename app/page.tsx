import { CommandPalette } from "@/components/cockpit/command-palette"
import { DrawerRoot } from "@/components/cockpit/drawers/drawer-root"
import { IntelligencePanel } from "@/components/cockpit/intelligence-panel"
import { ItineraryTimeline } from "@/components/cockpit/itinerary"
import { PricingMetrics } from "@/components/cockpit/pricing-metrics"
import { QuoteHeader } from "@/components/cockpit/quote-header"
import { QuoteProvider } from "@/components/cockpit/quote-provider"
import { QuoteSidebar } from "@/components/cockpit/quote-sidebar"
import { RoomingOverview } from "@/components/cockpit/rooming"
import { StatusStrip } from "@/components/cockpit/status-strip"
import { TopNav } from "@/components/cockpit/top-nav"

export default function CockpitPage() {
  return (
    <div className="bg-background flex h-svh min-h-svh flex-col">
      <TopNav />
      <QuoteProvider>
        <div className="flex min-h-0 flex-1">
          <QuoteSidebar />

          <main className="scrollbar-thin flex min-w-0 flex-1 flex-col overflow-y-auto">
            <QuoteHeader />
            <StatusStrip />

            <div className="flex flex-1 flex-col gap-3 p-4">
              <ItineraryTimeline />

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <RoomingOverview />
                </div>
                <div className="lg:col-span-2">
                  <PricingMetrics />
                </div>
              </div>
            </div>
          </main>

          <IntelligencePanel />
        </div>
        <DrawerRoot />
        <CommandPalette />
      </QuoteProvider>
    </div>
  )
}
