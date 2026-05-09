"use client"

import * as React from "react"
import { Activity, FolderOpen, Settings2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { openPlaceholder } from "./placeholder-modal"
import { useQuote } from "./quote-provider"

export type IntelligenceTab = "pending" | "insights" | "activity" | "history"

interface IconRailProps {
  filesOpen: boolean
  intelOpen: boolean
  intelTab: IntelligenceTab
  onOpenFiles: () => void
  onOpenIntel: (tab: IntelligenceTab) => void
}

interface RailIconProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  pending?: boolean
  onClick: () => void
}

function RailIcon({
  icon: Icon,
  label,
  active,
  pending = false,
  onClick,
}: RailIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "group relative grid size-10 cursor-pointer place-items-center rounded-md transition-colors outline-none",
        "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-3 focus-visible:ring-ring/40",
        active && "bg-surface-2"
      )}
    >
      <Icon
        className={cn(
          "size-4 transition-colors",
          active
            ? "text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))]"
            : "text-muted-foreground group-hover:text-foreground/85"
        )}
      />
      {pending && (
        <span
          aria-hidden
          className="bg-[color-mix(in_oklch,var(--gold)_70%,var(--ink))] absolute top-1.5 right-1.5 size-1.5 rounded-full"
        />
      )}
      {active && (
        <span
          aria-hidden
          className="bg-[color-mix(in_oklch,var(--gold)_60%,var(--ink))] absolute top-1.5 bottom-1.5 left-0 w-[2px] rounded-full"
        />
      )}
    </button>
  )
}

export function IconRail({
  filesOpen,
  intelOpen,
  intelTab,
  onOpenFiles,
  onOpenIntel,
}: IconRailProps) {
  const { activity } = useQuote()

  // The "pending" dot lights up when SPI has fresh activity not yet seen.
  // For now, a quote with any recent activity counts — visual cue, not gating.
  const hasRecentActivity = activity.length > 0

  return (
    <aside
      aria-label="Cockpit rail"
      className="bg-surface border-border/70 flex w-14 shrink-0 flex-col items-center gap-1 border-r py-3"
    >
      <RailIcon
        icon={FolderOpen}
        label="Quote files"
        active={filesOpen}
        onClick={onOpenFiles}
      />
      <RailIcon
        icon={Sparkles}
        label="Tell SPI"
        active={intelOpen && intelTab === "pending"}
        pending={hasRecentActivity && !intelOpen}
        onClick={() => onOpenIntel("pending")}
      />
      <RailIcon
        icon={Activity}
        label="Activity"
        active={intelOpen && intelTab === "activity"}
        onClick={() => onOpenIntel("activity")}
      />

      <div className="flex-1" />

      <RailIcon
        icon={Settings2}
        label="Settings"
        active={false}
        onClick={() =>
          openPlaceholder({
            title: "Cockpit settings",
            description:
              "Workspace settings — desks, time zones, currency formatting, validator thresholds — are queued for V1.",
          })
        }
      />
    </aside>
  )
}
