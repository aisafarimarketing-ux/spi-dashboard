"use client"

import * as React from "react"
import {
  ArrowRightLeft,
  BadgeCheck,
  Brain,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  History,
  Lightbulb,
  Package2,
  Plus,
  ShieldAlert,
  Sparkles,
  TicketPercent,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  INSIGHTS,
  PROPOSED_ACTIONS,
  type IntelligenceInsight,
  type ProposedAction,
} from "@/lib/mock"
import { useQuote } from "./quote-provider"

const categoryIcon = {
  Substitution: ArrowRightLeft,
  Bundle: Package2,
  Discount: TicketPercent,
  Calculation: Calculator,
  Risk: ShieldAlert,
} as const

const insightTone: Record<IntelligenceInsight["signal"], string> = {
  positive: "bg-[color-mix(in_oklch,var(--success)_60%,transparent)]",
  negative: "bg-[color-mix(in_oklch,var(--destructive)_60%,transparent)]",
  neutral: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

type Decision = "pending" | "approved" | "declined"

export function IntelligencePanel() {
  const { versions } = useQuote()
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>(
    () =>
      Object.fromEntries(
        PROPOSED_ACTIONS.map((a) => [a.id, a.status as Decision])
      )
  )
  const [activeTab, setActiveTab] = React.useState<
    "insights" | "actions" | "history"
  >("actions")

  const pendingCount = Object.values(decisions).filter(
    (d) => d === "pending"
  ).length
  const totalSavings = PROPOSED_ACTIONS.filter(
    (a) =>
      decisions[a.id] === "pending" && a.impact.direction === "save"
  ).reduce((s, a) => s + a.impact.amount, 0)

  return (
    <aside className="bg-surface border-border/70 flex h-full w-[400px] shrink-0 flex-col border-l">
      {/* Header */}
      <div className="border-border/70 flex items-start justify-between gap-2 border-b px-4 pt-3.5 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="text-[color-mix(in_oklch,var(--gold)_60%,var(--ink))] size-3.5" />
            <span className="font-display text-[15px] tracking-tight">
              Price Intelligence
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11.5px] leading-snug">
            AI-proposed actions for{" "}
            <span className="text-foreground/85 font-medium">
              Henderson Family
            </span>
            . Nothing changes until you approve.
          </p>
        </div>
        <Badge variant="gold" size="sm" className="shrink-0 font-mono">
          <BadgeCheck className="size-3" />
          {pendingCount} pending
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-border/70 flex items-stretch gap-0 border-b px-2 pt-1">
        {(
          [
            ["actions", "Actions", PROPOSED_ACTIONS.length],
            ["insights", "Insights", INSIGHTS.length],
            ["history", "History", versions.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            data-active={activeTab === key ? "" : undefined}
            className={cn(
              "text-muted-foreground hover:text-foreground relative flex items-center gap-1.5 px-2.5 py-2 text-[12px] font-medium transition-colors",
              "data-[active]:text-foreground"
            )}
          >
            {label}
            <span className="text-muted-foreground/60 font-mono text-[10.5px]">
              {count}
            </span>
            <span
              aria-hidden
              className={cn(
                "bg-[color-mix(in_oklch,var(--gold)_70%,var(--ink))] absolute inset-x-2 -bottom-px h-px scale-x-0 transition-transform",
                activeTab === key && "scale-x-100"
              )}
            />
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1 pr-1">
          <Button variant="ghost" size="icon-xs" aria-label="Add custom rule">
            <Plus />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {activeTab === "actions" && (
          <div className="space-y-2 px-3 py-3">
            {PROPOSED_ACTIONS.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                decision={decisions[action.id]}
                onDecide={(decision) =>
                  setDecisions((d) => ({ ...d, [action.id]: decision }))
                }
              />
            ))}
          </div>
        )}

        {activeTab === "insights" && (
          <ul className="px-3 py-3 space-y-2">
            {INSIGHTS.map((i) => (
              <li
                key={i.id}
                className="border-border/70 bg-card flex items-start gap-2.5 rounded-lg border p-2.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    insightTone[i.signal]
                  )}
                />
                <div className="min-w-0">
                  <div className="text-foreground text-[12.5px] font-medium leading-tight">
                    {i.title}
                  </div>
                  <p className="text-muted-foreground mt-1 text-[11.5px] leading-snug">
                    {i.detail}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant="muted" size="sm">
                      <Lightbulb className="size-3" />
                      {i.kind}
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "history" && (
          <ol className="relative px-4 py-3">
            <span
              aria-hidden
              className="bg-border/80 absolute top-3 bottom-3 left-[19px] w-px"
            />
            {versions.map((v, idx) => (
              <li key={v.id} className="relative pb-3 pl-7 last:pb-0">
                <span
                  aria-hidden
                  className={cn(
                    "border-border bg-surface absolute top-1 left-3 size-2.5 rounded-full border-2",
                    idx === 0 &&
                      "border-[color-mix(in_oklch,var(--gold)_70%,var(--ink))]"
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-[12.5px] font-medium tracking-tight">
                    {v.label}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      v.delta < 0
                        ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                        : v.delta > 0
                          ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
                          : "text-muted-foreground"
                    )}
                  >
                    {v.delta === 0
                      ? "—"
                      : `${v.delta > 0 ? "+" : ""}${formatUSD(v.delta)}`}
                  </span>
                </div>
                <div className="text-muted-foreground mt-0.5 text-[11px]">
                  {v.author} · {v.authoredAt}
                </div>
                <p className="text-muted-foreground/90 mt-1 text-[11.5px] leading-snug">
                  {v.note}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Footer summary */}
      <div className="border-border/70 bg-surface-2/40 flex items-center justify-between gap-2 border-t px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="text-muted-foreground size-3.5" />
          <div className="text-[11.5px] leading-tight">
            <div className="text-foreground/85 font-medium">
              {formatUSD(totalSavings)} potential savings
            </div>
            <div className="text-muted-foreground text-[10.5px]">
              across {pendingCount} pending action{pendingCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline">
          Review all
          <ChevronRight />
        </Button>
      </div>
    </aside>
  )
}

function ActionCard({
  action,
  decision,
  onDecide,
}: {
  action: ProposedAction
  decision: Decision
  onDecide: (d: Decision) => void
}) {
  const Icon = categoryIcon[action.category]
  const impactPositive = action.impact.direction === "save"
  const isApproved = decision === "approved"
  const isDeclined = decision === "declined"

  return (
    <article
      data-state={decision}
      className={cn(
        "border-border/70 bg-card relative rounded-lg border p-3 transition-colors",
        isApproved &&
          "border-[color-mix(in_oklch,var(--success)_30%,var(--border))] bg-[color-mix(in_oklch,var(--success)_4%,var(--card))]",
        isDeclined && "opacity-55"
      )}
    >
      <header className="flex items-start gap-2.5">
        <div
          className={cn(
            "border-border/70 bg-surface-2 grid size-7 shrink-0 place-items-center rounded-md border",
            "text-foreground/80"
          )}
        >
          <Icon className="size-3.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Badge size="sm" variant="muted">
              {action.category}
            </Badge>
            <span className="text-muted-foreground/80 font-mono text-[10px]">
              · conf {Math.round(action.confidence * 100)}%
            </span>
          </div>
          <h3 className="text-foreground mt-1 text-[13px] font-medium leading-snug tracking-tight">
            {action.title}
          </h3>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "font-mono text-[12px] font-medium",
              impactPositive
                ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                : action.impact.direction === "add"
                  ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
                  : "text-muted-foreground"
            )}
          >
            {impactPositive ? "−" : action.impact.direction === "add" ? "+" : ""}
            {formatUSD(action.impact.amount)}
          </div>
          <div className="text-muted-foreground/80 mt-0.5 text-[10px] uppercase tracking-[0.08em]">
            impact
          </div>
        </div>
      </header>

      <p className="text-muted-foreground mt-2 text-[11.5px] leading-snug">
        {action.rationale}
      </p>

      <ul className="mt-2 flex flex-wrap gap-1">
        {action.affects.map((tag) => (
          <li key={tag}>
            <Badge variant="outline" size="sm" className="font-normal">
              {tag}
            </Badge>
          </li>
        ))}
      </ul>

      <footer className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5">
        <div className="text-muted-foreground inline-flex items-center gap-1 text-[10.5px]">
          <Clock className="size-3" />
          <span>generated 4 min ago</span>
        </div>
        <div className="flex items-center gap-1">
          {decision === "pending" ? (
            <>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onDecide("declined")}
              >
                <X />
                Decline
              </Button>
              <Button size="xs" onClick={() => onDecide("approved")}>
                <Check />
                Approve
              </Button>
            </>
          ) : (
            <>
              <Badge
                size="sm"
                variant={isApproved ? "success" : "muted"}
                className="font-medium"
              >
                {isApproved ? (
                  <>
                    <Check className="size-3" />
                    Approved · queued for build
                  </>
                ) : (
                  "Declined"
                )}
              </Badge>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onDecide("pending")}
              >
                Undo
              </Button>
            </>
          )}
        </div>
      </footer>
    </article>
  )
}
