"use client"

import * as React from "react"
import {
  CheckCircle2,
  CircleAlert,
  Database,
  Gauge,
  GitCommitHorizontal,
  RefreshCw,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useQuote } from "./quote-provider"

const formatAgo = (iso: string, now: number): string => {
  if (!iso) return "—"
  const ms = now - new Date(iso).getTime()
  if (ms < 5_000) return "just now"
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

export function StatusStrip() {
  const { totals, versions, lastSavedAt } = useQuote()

  // Tick once a second so "Xs ago" stays live without re-rendering the whole tree.
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const handle = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(handle)
  }, [])

  const ago = formatAgo(lastSavedAt, now)
  const errorCount = totals.warnings.filter((w) => w.level === "error").length
  const warnCount = totals.warnings.filter((w) => w.level === "warning").length
  const verified = errorCount === 0
  const currentVersion = versions[0]

  return (
    <div
      role="status"
      aria-label="Operational status"
      className="border-border/70 bg-surface-2/30 text-muted-foreground flex h-7 shrink-0 items-center gap-3 border-b px-5 text-[11px]"
    >
      <StatusItem
        icon={<Database className="size-3" />}
        label="Saved locally"
        detail={ago}
        tone="success"
      />

      <Divider />

      <StatusItem
        icon={
          verified ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <CircleAlert className="size-3" />
          )
        }
        label={verified ? "Pricing verified" : "Pricing needs review"}
        detail={`${Math.round(totals.confidence * 100)}% confidence`}
        tone={verified ? "success" : "warning"}
      />

      <Divider />

      <StatusItem
        icon={<RefreshCw className="size-3" />}
        label="Last recalculated"
        detail={ago}
      />

      <Divider />

      <StatusItem
        icon={<GitCommitHorizontal className="size-3" />}
        label={
          currentVersion
            ? currentVersion.label.replace(" · current", "")
            : "v0"
        }
        detail="current"
        tone="default"
      />

      {(warnCount > 0 || errorCount > 0) && (
        <>
          <Divider />
          <StatusItem
            icon={<Gauge className="size-3" />}
            label={`${errorCount + warnCount} flag${errorCount + warnCount === 1 ? "" : "s"}`}
            detail="from validator"
            tone={errorCount > 0 ? "destructive" : "warning"}
          />
        </>
      )}
    </div>
  )
}

function StatusItem({
  icon,
  label,
  detail,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  detail?: string
  tone?: "default" | "success" | "warning" | "destructive"
}) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          tone === "success" &&
            "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]",
          tone === "warning" &&
            "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
          tone === "destructive" &&
            "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]",
          tone === "default" && "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <span className="text-foreground/85 font-medium">{label}</span>
      {detail && (
        <span className="text-muted-foreground/80 font-mono">· {detail}</span>
      )}
    </div>
  )
}

function Divider() {
  return (
    <span aria-hidden className="bg-border/80 hidden h-3 w-px sm:inline-block" />
  )
}
