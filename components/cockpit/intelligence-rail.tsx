"use client"

import * as React from "react"

import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  IntelligencePanel,
  type IntelligenceTab,
} from "./intelligence-panel"

export function IntelligenceRail({
  open,
  onOpenChange,
  tab,
  onTabChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tab: IntelligenceTab
  onTabChange: (tab: IntelligenceTab) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-[420px] !p-0"
        showClose
      >
        <IntelligencePanel
          embedded
          activeTab={tab}
          onActiveTabChange={onTabChange}
        />
      </SheetContent>
    </Sheet>
  )
}
