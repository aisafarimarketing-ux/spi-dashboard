"use client"

import * as React from "react"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Single modal used wherever a workflow is queued for a later release.
 * Imperatively driven via `openPlaceholder({...})` so individual buttons
 * don't need to thread state — they just call the function with copy.
 *
 * The component itself mounts once at the cockpit root and listens to a
 * window CustomEvent. This keeps the UI honest: every dead button gets
 * a polished, branded "queued" message instead of doing nothing.
 */

const EVENT = "spi:placeholder"

interface PlaceholderPayload {
  title: string
  description?: string
  /** Optional CTA shown above Close. e.g. "Continue costing". Default Close-only. */
  ctaLabel?: string
}

export function openPlaceholder(payload: PlaceholderPayload) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<PlaceholderPayload>(EVENT, { detail: payload })
  )
}

export function PlaceholderHost() {
  const [payload, setPayload] = React.useState<PlaceholderPayload | null>(null)

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PlaceholderPayload>).detail
      setPayload(detail)
    }
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  return (
    <Dialog
      open={payload !== null}
      onOpenChange={(o) => !o && setPayload(null)}
    >
      <DialogContent className="!w-[min(440px,92vw)] !max-h-[unset]">
        <DialogTitle className="sr-only">
          {payload?.title ?? "Queued for V1"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {payload?.description ??
            "This workflow is queued for the next SPI release."}
        </DialogDescription>

        <div className="px-5 pt-5 pb-3">
          <div className="bg-[color-mix(in_oklch,var(--gold)_18%,var(--surface-2))] grid size-9 place-items-center rounded-md">
            <Compass className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
          </div>
          <h2 className="font-display text-foreground mt-3 text-[18px] leading-tight tracking-tight">
            {payload?.title}
          </h2>
          <p className="text-muted-foreground mt-1 text-[12.5px] leading-snug">
            {payload?.description ??
              "This workflow is queued for V1. You can still continue costing."}
          </p>

          <div className="border-border/60 bg-surface-2/40 mt-4 rounded-md border px-3 py-2.5">
            <div className="text-muted-foreground text-[10.5px] tracking-[0.06em] uppercase">
              On the roadmap
            </div>
            <p className="text-foreground/85 mt-1 text-[11.5px] leading-snug">
              SPI ships in operational waves. Pricing, rooming, intelligence,
              and the review flow are live today. Adjacent workflows like this
              one land as the V1 footprint expands.
            </p>
          </div>
        </div>

        <div className="border-border/70 bg-surface-2/60 flex items-center justify-end gap-1.5 border-t px-5 py-3">
          <Button
            size="sm"
            onClick={() => setPayload(null)}
            variant={payload?.ctaLabel ? "outline" : "default"}
          >
            Close
          </Button>
          {payload?.ctaLabel && (
            <Button size="sm" onClick={() => setPayload(null)}>
              {payload.ctaLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
