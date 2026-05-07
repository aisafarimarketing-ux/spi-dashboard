"use client"

import * as React from "react"
import { Brain, Eraser, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { MemoryScope } from "@/lib/operator-memory"
import { useQuote } from "./quote-provider"

const SCOPE_LABEL_SHORT: Record<MemoryScope, string> = {
  off: "off",
  "quote-only": "quote",
  workspace: "workspace",
}

export function MemoryControls() {
  const { memory, setMemoryScope, clearMemory } = useQuote()
  const enabled = memory.scope !== "off"
  const previousScopeRef = React.useRef<MemoryScope>("workspace")

  const handleEnabledChange = (next: boolean) => {
    if (next) {
      setMemoryScope(previousScopeRef.current ?? "workspace")
    } else {
      previousScopeRef.current = memory.scope
      setMemoryScope("off")
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "border-border/70 bg-surface-2/50 hover:bg-surface-2 inline-flex h-6 items-center gap-1.5 rounded-md border px-1.5 text-[10.5px] transition-colors",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          )}
          aria-label="Operator memory settings"
        >
          <Brain
            className={cn(
              "size-3 transition-colors",
              enabled
                ? "text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))]"
                : "text-muted-foreground/60"
            )}
            strokeWidth={2}
          />
          <span className="text-muted-foreground/90">
            memory · {SCOPE_LABEL_SHORT[memory.scope]}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div>
            <h3 className="text-foreground text-[12.5px] font-medium tracking-tight">
              Operator memory
            </h3>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
              Local-only. SPI never compares across operators or surfaces
              memory outside this workspace.
            </p>
          </div>

          <div className="border-border/60 flex items-center justify-between rounded-md border px-2.5 py-1.5">
            <div className="text-foreground/85 text-[12px]">Enabled</div>
            <Switch
              checked={enabled}
              onCheckedChange={handleEnabledChange}
              aria-label="Toggle operator memory"
            />
          </div>

          <div className="space-y-1">
            <label className="text-muted-foreground text-[10.5px] font-medium tracking-[0.06em] uppercase">
              Scope
            </label>
            <Select
              value={memory.scope === "off" ? "workspace" : memory.scope}
              onValueChange={(v) => setMemoryScope(v as MemoryScope)}
              disabled={!enabled}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quote-only">
                  Quote-only learning
                </SelectItem>
                <SelectItem value="workspace">Workspace learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-border/60 flex items-center justify-between border-t pt-2.5">
            <div className="text-muted-foreground/80 font-mono text-[10.5px]">
              {memory.observations.length} observations
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => clearMemory("all")}
              disabled={memory.observations.length === 0}
            >
              <Eraser />
              Clear
            </Button>
          </div>

          <div className="border-border/60 flex items-start gap-1.5 rounded-md border border-dashed px-2 py-1.5">
            <ShieldCheck
              className="mt-0.5 size-3 shrink-0"
              style={{ color: "var(--success)" }}
            />
            <p className="text-muted-foreground text-[10.5px] leading-snug">
              SPI may suggest, never auto-apply. Margins, discounts, and quote
              data stay private to you.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
