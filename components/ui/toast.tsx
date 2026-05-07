"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Check,
  Info,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type ToastTone = "default" | "success" | "info" | "warning" | "destructive"

export interface ToastOptions {
  id?: string
  title: string
  description?: string
  tone?: ToastTone
  /** Auto-dismiss after N ms. Defaults to 4000. Pass 0 to keep until dismissed. */
  durationMs?: number
  /** Optional inline action — typically "Undo" or "View". */
  action?: {
    label: string
    onClick: () => void
  }
}

interface InternalToast extends Required<Omit<ToastOptions, "action" | "description">> {
  description?: string
  action?: ToastOptions["action"]
  createdAt: number
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>")
  }
  return ctx
}

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  default: Sparkles,
  success: Check,
  info: Info,
  warning: TriangleAlert,
  destructive: AlertTriangle,
}

// Per-tone left rail colour. Kept as soft tints — no saturated colour.
const TONE_RAIL: Record<ToastTone, string> = {
  default: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
  success: "bg-[color-mix(in_oklch,var(--success)_60%,transparent)]",
  info: "bg-[color-mix(in_oklch,var(--info)_60%,transparent)]",
  warning: "bg-[color-mix(in_oklch,var(--warning)_60%,transparent)]",
  destructive: "bg-[color-mix(in_oklch,var(--destructive)_60%,transparent)]",
}

const TONE_ICON_TINT: Record<ToastTone, string> = {
  default: "text-[color-mix(in_oklch,var(--gold)_55%,var(--ink))]",
  success: "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]",
  info: "text-[color-mix(in_oklch,var(--info)_55%,var(--ink))]",
  warning: "text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))]",
  destructive: "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<InternalToast[]>([])
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  )

  const dismiss = React.useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setItems((s) => s.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id =
        opts.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const next: InternalToast = {
        id,
        title: opts.title,
        description: opts.description,
        tone: opts.tone ?? "default",
        durationMs: opts.durationMs ?? 4000,
        action: opts.action,
        createdAt: Date.now(),
      }
      setItems((s) => [...s.filter((t) => t.id !== id), next])
      if (next.durationMs > 0) {
        const handle = setTimeout(() => dismiss(id), next.durationMs)
        timers.current.set(id, handle)
      }
      return id
    },
    [dismiss]
  )

  React.useEffect(() => {
    const map = timers.current
    return () => {
      for (const handle of map.values()) clearTimeout(handle)
      map.clear()
    }
  }, [])

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastHost({
  items,
  onDismiss,
}: {
  items: InternalToast[]
  onDismiss: (id: string) => void
}) {
  // Lazy init keeps SSR rendering nothing and clients rendering the portal
  // immediately on first paint — no effect needed.
  const [mounted] = React.useState(() => typeof document !== "undefined")
  if (!mounted) return null

  return createPortal(
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: InternalToast
  onDismiss: (id: string) => void
}) {
  const Icon = TONE_ICON[t.tone]

  // Calm enter animation: 4px lift + fade. No spring/bounce.
  const [entered, setEntered] = React.useState(false)
  React.useEffect(() => {
    const handle = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(handle)
  }, [])

  return (
    <div
      role="status"
      data-tone={t.tone}
      className={cn(
        "border-border/70 bg-card text-card-foreground pointer-events-auto relative flex items-start gap-2.5 overflow-hidden rounded-lg border py-2.5 pr-2 pl-3 shadow-[0_8px_28px_-12px_rgba(40,28,18,0.25)] transition-all duration-200 ease-out",
        entered
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-1 opacity-0"
      )}
    >
      {/* Tone-tinted left rail */}
      <span
        aria-hidden
        className={cn(
          "absolute top-2 bottom-2 left-0 w-[2px] rounded-full",
          TONE_RAIL[t.tone]
        )}
      />

      <Icon
        className={cn("mt-0.5 size-3.5 shrink-0", TONE_ICON_TINT[t.tone])}
      />

      <div className="min-w-0 flex-1">
        <div className="text-foreground text-[12.5px] font-medium leading-tight tracking-tight">
          {t.title}
        </div>
        {t.description && (
          <div className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
            {t.description}
          </div>
        )}
        {t.action && (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick()
              onDismiss(t.id)
            }}
            className="text-foreground/85 hover:text-foreground mt-1.5 text-[11px] font-medium underline-offset-4 hover:underline"
          >
            {t.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 -mt-0.5 grid size-6 shrink-0 place-items-center rounded-md transition-colors"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
