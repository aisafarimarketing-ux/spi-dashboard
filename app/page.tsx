import { CockpitShell } from "@/components/cockpit/cockpit-shell"
import { QuoteProvider } from "@/components/cockpit/quote-provider"

export default function CockpitPage() {
  return (
    <QuoteProvider>
      <CockpitShell />
    </QuoteProvider>
  )
}
