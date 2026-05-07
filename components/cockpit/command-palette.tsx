"use client"

import * as React from "react"
import {
  ArrowRight,
  BedDouble,
  Brain,
  CornerDownLeft,
  Download,
  FileText,
  Send,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useQuote } from "./quote-provider"

/**
 * Other components dispatch this to open the palette without sharing state.
 *
 *   window.dispatchEvent(new CustomEvent("spi:command-palette"))
 */
const PALETTE_EVENT = "spi:command-palette"

interface Command {
  id: string
  label: string
  hint?: string
  group: "Navigate" | "Quote" | "Pricing" | "AI"
  icon: React.ComponentType<{ className?: string }>
  /** Free-text keywords merged into the search index. */
  keywords?: string[]
  run: () => void
}

export function CommandPalette() {
  const { openDrawer } = useQuote()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Global Cmd/Ctrl+K + custom event opener.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"
      if (isModK) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onCustom = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(PALETTE_EVENT, onCustom)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(PALETTE_EVENT, onCustom)
    }
  }, [])

  // Reset query/cursor on close.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("")
      setActiveIndex(0)
    }
    setOpen(next)
  }

  const focusParser = () => {
    const el = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Tell SPI what changed"]'
    )
    el?.focus()
  }

  const triggerHeaderButton = (label: string) => {
    const buttons = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[]
    const target = buttons.find(
      (b) => b.textContent?.trim().toLowerCase() === label.toLowerCase()
    )
    target?.click()
  }

  const commands: Command[] = React.useMemo(
    () => [
      {
        id: "review-send",
        label: "Review & send quote",
        hint: "Open the client-facing review modal",
        group: "Quote",
        icon: Send,
        keywords: ["send", "review", "client"],
        run: () => triggerHeaderButton("Review & Send"),
      },
      {
        id: "export",
        label: "Export quote",
        hint: "Prepare client-facing layout",
        group: "Quote",
        icon: Download,
        keywords: ["pdf", "export", "share"],
        run: () => triggerHeaderButton("Export"),
      },
      {
        id: "tell-spi",
        label: "Tell SPI what changed",
        hint: "Focus the parser input",
        group: "AI",
        icon: Sparkles,
        keywords: ["parser", "ai", "intelligence"],
        run: focusParser,
      },
      {
        id: "add-guest",
        label: "Add guest",
        group: "Quote",
        icon: UserPlus,
        keywords: ["pax", "passenger", "person"],
        run: () => openDrawer({ type: "guest" }),
      },
      {
        id: "add-room",
        label: "Add room arrangement",
        group: "Quote",
        icon: BedDouble,
        keywords: ["rooming", "bed"],
        run: () => openDrawer({ type: "rooming" }),
      },
      {
        id: "edit-costs",
        label: "Edit costs & VAT",
        group: "Pricing",
        icon: Wallet,
        keywords: ["margin", "tax", "vat", "costs"],
        run: () => openDrawer({ type: "costs" }),
      },
      {
        id: "open-history",
        label: "Open version history",
        group: "Navigate",
        icon: FileText,
        keywords: ["versions", "log", "audit"],
        run: () => triggerHeaderButton("Version history"),
      },
      {
        id: "intelligence",
        label: "Focus pricing intelligence",
        group: "AI",
        icon: Brain,
        keywords: ["panel", "right"],
        run: focusParser,
      },
    ],
    [openDrawer]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => {
      const hay = [c.label, c.hint, c.group, ...(c.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [commands, query])

  // Keep the cursor inside bounds without storing a clamped value — derive it.
  const safeIndex = filtered.length === 0
    ? 0
    : Math.min(activeIndex, filtered.length - 1)

  // Focus the input shortly after opening.
  React.useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(handle)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const cmd = filtered[safeIndex]
      if (cmd) {
        cmd.run()
        handleOpenChange(false)
      }
    }
  }

  const grouped = React.useMemo(() => {
    const map = new Map<string, Command[]>()
    for (const c of filtered) {
      const arr = map.get(c.group) ?? []
      arr.push(c)
      map.set(c.group, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showClose={false}
        className="!w-[min(540px,92vw)] !max-h-[unset] !top-[18%] !translate-y-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search across quote actions, AI tools, and navigation. Use arrow keys
          and Enter to run a command.
        </DialogDescription>

        <div className="border-border/70 flex items-center gap-2 border-b px-3 py-2">
          <Sparkles className="text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))] size-3.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a quote action, drawer, or AI tool…"
            className="placeholder:text-muted-foreground/80 text-foreground h-7 w-full bg-transparent text-[12.5px] outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="scrollbar-thin max-h-[360px] overflow-y-auto px-1.5 py-2">
          {filtered.length === 0 ? (
            <div className="text-muted-foreground px-3 py-6 text-center text-[12px]">
              No commands match{query ? ` "${query}"` : ""}.
            </div>
          ) : (
            grouped.map(([group, cmds]) => (
              <div key={group} className="px-1.5 py-1">
                <div className="text-muted-foreground/80 px-2 pt-1 pb-1 text-[10px] tracking-[0.08em] uppercase">
                  {group}
                </div>
                <ul>
                  {cmds.map((cmd) => {
                    const idx = filtered.indexOf(cmd)
                    const isActive = idx === safeIndex
                    const Icon = cmd.icon
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          data-active={isActive ? "" : undefined}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => {
                            cmd.run()
                            handleOpenChange(false)
                          }}
                          className={cn(
                            "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                            "hover:bg-muted",
                            "data-[active]:bg-muted"
                          )}
                        >
                          <span className="border-border/70 bg-surface-2 text-foreground/85 grid size-6 shrink-0 place-items-center rounded-md border">
                            <Icon className="size-3" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-foreground/90 text-[12.5px] leading-tight">
                              {cmd.label}
                            </div>
                            {cmd.hint && (
                              <div className="text-muted-foreground mt-0.5 text-[10.5px] leading-tight">
                                {cmd.hint}
                              </div>
                            )}
                          </div>
                          {isActive && (
                            <span className="text-muted-foreground/80 inline-flex items-center gap-1 font-mono text-[10px]">
                              <CornerDownLeft className="size-2.5" />
                              run
                            </span>
                          )}
                          {!isActive && (
                            <ArrowRight className="text-muted-foreground/0 group-hover:text-muted-foreground/60 size-3 transition-colors" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="border-border/70 bg-surface-2/60 text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-1.5 text-[10.5px]">
          <div className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>navigate</span>
            <span className="text-muted-foreground/40">·</span>
            <Kbd>↵</Kbd>
            <span>run</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Programmatic opener for buttons / nav triggers. */
export function openCommandPalette() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT))
}
