"use client"

import * as React from "react"
import { Check, Copy, Mail, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { useQuote } from "./quote-provider"

export function ShareModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { quote } = useQuote()
  const { toast } = useToast()
  const [copied, setCopied] = React.useState(false)

  // Stub share link — points back at the cockpit, just demonstrates the flow.
  const shareLink = React.useMemo(() => {
    if (typeof window === "undefined") return `${quote.id}`
    const base = window.location.origin
    return `${base}/q/${quote.id}`
  }, [quote.id])

  const handleOpenChange = (next: boolean) => {
    if (!next) setCopied(false)
    onOpenChange(next)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast({
        title: "Link copied",
        description: shareLink,
        tone: "success",
        durationMs: 2400,
      })
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast({
        title: "Couldn't copy link",
        description: "Browser denied clipboard access — copy from the field.",
        tone: "warning",
      })
    }
  }

  const handleEmail = () => {
    toast({
      title: "Email handoff queued",
      description: "Operator email integration is queued for V1.",
      tone: "info",
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-[min(440px,92vw)] !max-h-[unset]">
        <DialogTitle className="sr-only">Share quote</DialogTitle>
        <DialogDescription className="sr-only">
          Share this quote with collaborators via link or email.
        </DialogDescription>

        <div className="px-5 pt-5 pb-3">
          <div className="bg-[color-mix(in_oklch,var(--gold)_18%,var(--surface-2))] grid size-9 place-items-center rounded-md">
            <Share2 className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-4" />
          </div>
          <h2 className="font-display text-foreground mt-3 text-[18px] leading-tight tracking-tight">
            Share quote
          </h2>
          <p className="text-muted-foreground mt-1 text-[12px] leading-snug">
            Internal-only link. Recipients still need cockpit access — this
            isn&rsquo;t the client-facing PDF.
          </p>

          <div className="mt-4">
            <div className="text-muted-foreground text-[10.5px] tracking-[0.06em] uppercase">
              Internal link
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="border-border/70 bg-surface-2/40 text-foreground/85 flex h-8 flex-1 items-center overflow-hidden rounded-md border px-2.5 font-mono text-[11.5px]">
                <span className="truncate">{shareLink}</span>
              </div>
              <Button
                size="sm"
                variant={copied ? "secondary" : "outline"}
                onClick={handleCopy}
                className="cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-border/60 mt-4 rounded-md border border-dashed p-3">
            <div className="flex items-start gap-2">
              <Mail className="text-muted-foreground mt-0.5 size-3.5" />
              <div className="text-[11.5px] leading-snug">
                <div className="text-foreground/85 font-medium">
                  Send to client desk
                </div>
                <p className="text-muted-foreground mt-0.5">
                  Direct email integration through your operator desk inbox is
                  queued for V1.
                </p>
                <Button
                  size="xs"
                  variant="outline"
                  className="mt-2 cursor-pointer"
                  onClick={handleEmail}
                >
                  Notify desk
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-border/70 bg-surface-2/60 flex items-center justify-end gap-1.5 border-t px-5 py-3">
          <Button
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
