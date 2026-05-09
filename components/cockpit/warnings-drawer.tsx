"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Info, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { QuoteWarning, WarningLevel, WarningScope } from "@/lib/types"
import { useQuote } from "./quote-provider"

const LEVEL_LABEL: Record<WarningLevel, string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
}

const LEVEL_TONE: Record<WarningLevel, string> = {
  error:
    "border-[color-mix(in_oklch,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklch,var(--destructive)_5%,var(--card))]",
  warning:
    "border-[color-mix(in_oklch,var(--warning)_30%,transparent)] bg-[color-mix(in_oklch,var(--warning)_5%,var(--card))]",
  info: "border-border/60 bg-card",
}

const LEVEL_ICON_TINT: Record<WarningLevel, string> = {
  error: "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]",
  warning: "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
  info: "text-[color-mix(in_oklch,var(--info)_55%,var(--ink))]",
}

const LEVEL_ICON: Record<WarningLevel, React.ComponentType<{ className?: string }>> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const SCOPE_DRAWER: Partial<
  Record<WarningScope, "guest" | "rooming" | "costs">
> = {
  guests: "guest",
  rooming: "rooming",
  costs: "costs",
  parks: "costs",
  fx: "costs",
  policy: "costs",
}

export function WarningsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { totals, openDrawer, closeDrawer } = useQuote()
  const warnings = totals.warnings

  const grouped = React.useMemo(() => {
    const map = new Map<WarningLevel, QuoteWarning[]>()
    for (const w of warnings) {
      const arr = map.get(w.level) ?? []
      arr.push(w)
      map.set(w.level, arr)
    }
    // Order: errors → warnings → info
    return (["error", "warning", "info"] as WarningLevel[])
      .map((lvl) => [lvl, map.get(lvl) ?? []] as const)
      .filter(([, arr]) => arr.length > 0)
  }, [warnings])

  const handleJump = (w: QuoteWarning) => {
    const target = SCOPE_DRAWER[w.scope]
    if (!target) return
    onOpenChange(false)
    // Defer drawer open so the warnings sheet finishes closing first.
    window.setTimeout(() => {
      if (target === "costs") openDrawer({ type: "costs" })
      else if (target === "guest") openDrawer({ type: "guest" })
      else if (target === "rooming") openDrawer({ type: "rooming" })
    }, 80)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start gap-2.5">
            <div className="bg-surface-2 grid size-8 shrink-0 place-items-center rounded-md">
              <AlertTriangle className="text-foreground/80 size-4" />
            </div>
            <div className="min-w-0">
              <SheetTitle>Validator flags</SheetTitle>
              <SheetDescription>
                {warnings.length === 0
                  ? "No flags. The pricing engine accepted this quote cleanly."
                  : `${warnings.length} flag${warnings.length === 1 ? "" : "s"} from the deterministic engine. Click to jump to the relevant editor.`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="space-y-4">
          {warnings.length === 0 ? (
            <div className="border-border/60 flex items-center gap-2.5 rounded-md border border-dashed p-4">
              <ShieldCheck
                className="size-4 shrink-0"
                style={{ color: "var(--success)" }}
              />
              <div className="text-[11.5px] leading-snug">
                <div className="text-foreground/85 font-medium">
                  All clear
                </div>
                <p className="text-muted-foreground mt-0.5">
                  Nothing to resolve. Pricing, rooming, and guest categories
                  passed the engine&rsquo;s checks.
                </p>
              </div>
            </div>
          ) : (
            grouped.map(([level, items]) => (
              <section key={level} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-foreground/80 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                    {LEVEL_LABEL[level]}
                  </h3>
                  <Badge variant="muted" size="sm" className="font-mono">
                    {items.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {items.map((w) => {
                    const Icon = LEVEL_ICON[w.level]
                    const target = SCOPE_DRAWER[w.scope]
                    return (
                      <li key={w.id}>
                        <button
                          type="button"
                          disabled={!target}
                          onClick={() => handleJump(w)}
                          className={cn(
                            "border-border/70 group flex w-full items-start gap-2.5 rounded-md border p-2.5 text-left transition-colors",
                            LEVEL_TONE[w.level],
                            target
                              ? "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-3 cursor-pointer outline-none"
                              : "cursor-default"
                          )}
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0",
                              LEVEL_ICON_TINT[w.level]
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground/85 font-mono text-[10px] uppercase tracking-tight">
                                {w.scope}
                              </span>
                            </div>
                            <p className="text-foreground/85 mt-0.5 text-[12px] leading-snug">
                              {w.message}
                            </p>
                            {target && (
                              <span className="text-muted-foreground/70 group-hover:text-muted-foreground mt-1 inline-block text-[10.5px]">
                                Open {target} drawer →
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </SheetBody>

        <SheetFooter>
          <div className="text-muted-foreground text-[11px]">
            Pricing engine confidence ·{" "}
            <span className="text-foreground/85 font-mono">
              {Math.round(totals.confidence * 100)}%
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onOpenChange(false)
              closeDrawer()
            }}
            className="cursor-pointer"
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
