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
  CornerDownLeft,
  Eye,
  Gauge,
  Handshake,
  History,
  Lightbulb,
  Map,
  MapPin,
  Package2,
  PencilLine,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  TriangleAlert,
  Users,
  Wallet,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import {
  INSIGHTS,
  PROPOSED_ACTIONS,
  type IntelligenceInsight,
  type ProposedAction,
} from "@/lib/mock"
import {
  parseIntelligence,
  type ParseResult,
  type ParsedAction,
  type ParsedActionCategory,
} from "@/lib/intelligence-parser"
import { activeObservations } from "@/lib/operator-memory"
import {
  recommend,
  type Recommendation,
  type RecommendationKind,
  type RecommendationTone,
} from "@/lib/recommendation-engine"
import { MemoryControls } from "./memory-controls"
import { useQuote } from "./quote-provider"

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const PROPOSAL_ICON = {
  Substitution: ArrowRightLeft,
  Bundle: Package2,
  Discount: TicketPercent,
  Calculation: Calculator,
  Risk: ShieldAlert,
} as const

const PARSED_ICON: Record<ParsedActionCategory, React.ComponentType<{ className?: string }>> = {
  RoomingSubstitution: ArrowRightLeft,
  VATConfirmation: BadgeCheck,
  VATToggle: Wallet,
  GuestAdd: Users,
  GuestRemove: Users,
  MarginChange: Calculator,
  ItineraryRemove: PencilLine,
  ItineraryAdd: PencilLine,
  ItineraryReorder: PencilLine,
  Unknown: Sparkles,
}

const insightTone: Record<IntelligenceInsight["signal"], string> = {
  positive: "bg-[color-mix(in_oklch,var(--success)_60%,transparent)]",
  negative: "bg-[color-mix(in_oklch,var(--destructive)_60%,transparent)]",
  neutral: "bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
}

type ParsedDecision = "pending" | "applied" | "dismissed"
type StaticDecision = "pending" | "approved" | "declined"

const EXAMPLE_INPUTS = [
  "family room unavailable, use two doubles",
  "increase margin to 24%",
  "add child age 10 with Tanzanian passport",
  "keep fuel non-VAT",
]

export function IntelligencePanel() {
  const {
    quote,
    versions,
    memory,
    memoryReady,
    recordObservation,
    applyParsedQuote,
    openDrawer,
  } = useQuote()

  const [activeTab, setActiveTab] = React.useState<
    "pending" | "insights" | "history"
  >("pending")

  // Parser state
  const [input, setInput] = React.useState("")
  const [parseResult, setParseResult] = React.useState<ParseResult | null>(null)
  const [parsedDecisions, setParsedDecisions] = React.useState<
    Record<string, ParsedDecision>
  >({})
  const [parsedAppliedAt, setParsedAppliedAt] = React.useState<
    Record<string, string>
  >({})
  const [examplesOpen, setExamplesOpen] = React.useState(false)

  // Static proposals (shipped with the cockpit)
  const [staticDecisions, setStaticDecisions] = React.useState<
    Record<string, StaticDecision>
  >(() =>
    Object.fromEntries(
      PROPOSED_ACTIONS.map((a) => [a.id, a.status as StaticDecision])
    )
  )

  // Recommendations (memory-derived)
  const [dismissedRecs, setDismissedRecs] = React.useState<
    Record<string, true>
  >({})

  const recommendations = React.useMemo(() => {
    if (!memoryReady) return []
    const obs = activeObservations(memory, quote.id)
    return recommend(quote, obs).filter((r) => !dismissedRecs[r.id])
  }, [memory, memoryReady, quote, dismissedRecs])

  const runParser = React.useCallback(
    (forcedInput?: string) => {
      const text = forcedInput ?? input
      if (forcedInput !== undefined) setInput(forcedInput)
      const result = parseIntelligence(text, quote)
      setParseResult(result)
      setParsedDecisions((prev) => {
        const next = { ...prev }
        for (const a of result.proposals) {
          if (!next[a.id]) next[a.id] = "pending"
        }
        return next
      })
    },
    [input, quote]
  )

  const triggerRecommendationAction = (
    rec: Recommendation,
    which: "primary" | "secondary"
  ) => {
    const action =
      which === "primary" ? rec.primaryAction : rec.secondaryAction
    if (!action) return
    if (action.kind === "open-drawer") {
      openDrawer(action.drawer)
    } else if (action.kind === "open-parser") {
      runParser(action.prompt)
    }
  }

  // ── Apply / Dismiss / Review handlers ────────────────────────────────
  const applyParsed = (action: ParsedAction) => {
    if (!action.apply) return
    const nextQuote = action.apply(quote)
    applyParsedQuote(nextQuote, `SPI: ${action.title}`)
    setParsedDecisions((d) => ({ ...d, [action.id]: "applied" }))
    setParsedAppliedAt((d) => ({
      ...d,
      [action.id]: new Date().toISOString(),
    }))
  }

  const dismissParsed = (id: string) => {
    setParsedDecisions((d) => ({ ...d, [id]: "dismissed" }))
    recordObservation("parsed-dismissed", { actionId: id })
  }

  const reviewParsed = (action: ParsedAction) => {
    if (action.reviewHint) openDrawer(action.reviewHint)
  }

  const setStatic = (id: string, dec: StaticDecision) => {
    setStaticDecisions((d) => ({ ...d, [id]: dec }))
    if (dec === "approved")
      recordObservation("proposal-approved", { proposalId: id })
    else if (dec === "declined")
      recordObservation("proposal-declined", { proposalId: id })
  }

  // ── Derived counts ───────────────────────────────────────────────────
  const parsedProposals = parseResult?.proposals ?? []
  const pendingParsed = parsedProposals.filter(
    (p) => parsedDecisions[p.id] === "pending"
  )
  const appliedParsed = parsedProposals.filter(
    (p) => parsedDecisions[p.id] === "applied"
  )
  const pendingStatic = PROPOSED_ACTIONS.filter(
    (a) => staticDecisions[a.id] === "pending"
  )
  const totalPending = pendingParsed.length + pendingStatic.length

  const totalSavings = pendingStatic
    .filter((a) => a.impact.direction === "save")
    .reduce((s, a) => s + a.impact.amount, 0)

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
            Operator describes a change. SPI proposes — operator approves.
            Nothing mutates silently.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MemoryControls />
          <Badge variant="gold" size="sm" className="font-mono">
            <BadgeCheck className="size-3" />
            {totalPending} pending
          </Badge>
        </div>
      </div>

      {/* Parser input */}
      <ParserInput
        value={input}
        onChange={setInput}
        onSubmit={runParser}
        onClear={() => {
          setInput("")
          setParseResult(null)
        }}
        examplesOpen={examplesOpen}
        setExamplesOpen={setExamplesOpen}
        result={parseResult}
      />

      {/* Tabs */}
      <div className="border-border/70 flex items-stretch gap-0 border-b px-2">
        {(
          [
            ["pending", "Pending", totalPending],
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
      </div>

      {/* Tab content */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {activeTab === "pending" && (
          <div className="space-y-4 px-3 py-3">
            {/* Recommendations — calm, observational, never auto-applied */}
            {recommendations.length > 0 && (
              <Section
                title="Recommendations"
                count={recommendations.length}
                aside={
                  <span className="text-muted-foreground/70 text-[10.5px]">
                    based on your patterns
                  </span>
                }
              >
                <div className="space-y-1.5">
                  {recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onAction={(which) =>
                        triggerRecommendationAction(rec, which)
                      }
                      onDismiss={() =>
                        setDismissedRecs((d) => ({ ...d, [rec.id]: true }))
                      }
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Recently applied — parser receipts */}
            {appliedParsed.length > 0 && (
              <Section title="Recently applied" count={appliedParsed.length}>
                <div className="space-y-1.5">
                  {appliedParsed.map((p) => (
                    <AppliedReceipt
                      key={p.id}
                      action={p}
                      appliedAt={parsedAppliedAt[p.id]}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Parsed proposals */}
            {parsedProposals.length > 0 && (
              <Section
                title="From your message"
                count={pendingParsed.length}
                aside={
                  <button
                    type="button"
                    onClick={() => {
                      setInput("")
                      setParseResult(null)
                    }}
                    className="text-muted-foreground/80 hover:text-foreground text-[10.5px]"
                  >
                    Clear
                  </button>
                }
              >
                <div className="space-y-2">
                  {parsedProposals.map((p) => (
                    <ParsedActionCard
                      key={p.id}
                      action={p}
                      decision={parsedDecisions[p.id] ?? "pending"}
                      onApply={() => applyParsed(p)}
                      onDismiss={() => dismissParsed(p.id)}
                      onReview={() => reviewParsed(p)}
                      onUndo={() =>
                        setParsedDecisions((d) => ({
                          ...d,
                          [p.id]: "pending",
                        }))
                      }
                    />
                  ))}
                </div>
                {parseResult?.unmatchedSegments &&
                  parseResult.unmatchedSegments.length > 0 && (
                    <UnmatchedHint segments={parseResult.unmatchedSegments} />
                  )}
              </Section>
            )}

            {/* Static proposals */}
            <Section
              title="Standing proposals"
              count={pendingStatic.length}
              aside={
                totalSavings > 0 ? (
                  <span className="text-muted-foreground font-mono text-[10.5px]">
                    {formatUSD(totalSavings)} potential
                  </span>
                ) : null
              }
            >
              <div className="space-y-2">
                {PROPOSED_ACTIONS.map((action) => (
                  <StaticActionCard
                    key={action.id}
                    action={action}
                    decision={staticDecisions[action.id]}
                    onDecide={(dec) => setStatic(action.id, dec)}
                  />
                ))}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "insights" && (
          <ul className="space-y-2 px-3 py-3">
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-[12.5px] font-medium tracking-tight">
                      {v.label}
                    </span>
                    {v.via === "spi" && (
                      <Badge variant="gold" size="sm" className="font-medium">
                        <Sparkles className="size-3" />
                        via SPI
                      </Badge>
                    )}
                  </div>
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
              across {pendingStatic.length} standing proposal
              {pendingStatic.length === 1 ? "" : "s"}
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

// ── Parser input ─────────────────────────────────────────────────────────

function ParserInput({
  value,
  onChange,
  onSubmit,
  onClear,
  examplesOpen,
  setExamplesOpen,
  result,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onClear: () => void
  examplesOpen: boolean
  setExamplesOpen: (b: boolean) => void
  result: ParseResult | null
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea up to a sensible cap.
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(120, el.scrollHeight)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
    if (e.key === "Escape") {
      onClear()
    }
  }

  const matched = result?.proposals.length ?? 0
  const unmatched = result?.unmatchedSegments.length ?? 0

  return (
    <div className="border-border/70 bg-surface px-3 py-2.5">
      <div
        className={cn(
          "border-border/70 bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40 rounded-lg border transition-shadow"
        )}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setExamplesOpen(true)}
          placeholder="Tell SPI what changed…"
          rows={1}
          className={cn(
            "placeholder:text-muted-foreground/70 text-foreground w-full resize-none bg-transparent px-3 pt-2 pb-1 text-[12.5px] leading-snug outline-none",
            "scrollbar-thin"
          )}
          aria-label="Tell SPI what changed"
        />
        <div className="flex items-center justify-between gap-2 px-2 pt-0.5 pb-1.5">
          <div className="text-muted-foreground/80 text-[10.5px]">
            {result === null && "SPI proposes — operator approves."}
            {result !== null &&
              (matched === 0
                ? "Nothing matched — try the examples."
                : `${matched} action${matched === 1 ? "" : "s"} parsed${
                    unmatched ? ` · ${unmatched} unmatched` : ""
                  }`)}
          </div>
          <div className="flex items-center gap-1.5">
            {value && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onClear}
                aria-label="Clear input"
              >
                Clear
              </Button>
            )}
            <Button
              size="xs"
              onClick={onSubmit}
              disabled={!value.trim()}
              aria-label="Run analysis"
            >
              Analyze
              <Kbd className="ml-1 border-transparent bg-transparent">
                <CornerDownLeft className="size-2.5" />
              </Kbd>
            </Button>
          </div>
        </div>
      </div>

      {examplesOpen && !value && (
        <div className="mt-2 flex flex-wrap gap-1">
          {EXAMPLE_INPUTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                onChange(ex)
                setTimeout(() => ref.current?.focus(), 0)
              }}
              className="border-border/70 bg-card hover:bg-surface-2 text-muted-foreground hover:text-foreground rounded-full border px-2 py-0.5 text-[10.5px] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Parsed action card ───────────────────────────────────────────────────

function ParsedActionCard({
  action,
  decision,
  onApply,
  onDismiss,
  onReview,
  onUndo,
}: {
  action: ParsedAction
  decision: ParsedDecision
  onApply: () => void
  onDismiss: () => void
  onReview: () => void
  onUndo: () => void
}) {
  const Icon = PARSED_ICON[action.category]
  const isApplied = decision === "applied"
  const isDismissed = decision === "dismissed"
  const reviewOnly = action.status === "review-only"

  const impact = action.estimatedImpactUSD ?? 0
  const impactDir =
    impact < 0 ? "save" : impact > 0 ? "add" : "neutral"

  if (isApplied) {
    return (
      <article className="border-border/70 bg-[color-mix(in_oklch,var(--success)_4%,var(--card))] flex items-center gap-2.5 rounded-lg border px-3 py-2">
        <div className="bg-[color-mix(in_oklch,var(--success)_30%,transparent)] grid size-6 shrink-0 place-items-center rounded-md">
          <Check className="text-[color-mix(in_oklch,var(--success)_60%,var(--ink))] size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-foreground text-[12.5px] font-medium leading-tight">
            {action.title}
          </div>
          <div className="text-muted-foreground mt-0.5 text-[10.5px]">
            Applied · version snapshot recorded
          </div>
        </div>
        <Button size="xs" variant="ghost" onClick={onUndo}>
          Undo
        </Button>
      </article>
    )
  }

  return (
    <article
      data-state={decision}
      className={cn(
        "border-border/70 bg-card relative rounded-lg border p-3 transition-colors",
        reviewOnly &&
          "bg-[color-mix(in_oklch,var(--warning)_5%,var(--card))]",
        isDismissed && "opacity-50"
      )}
    >
      <header className="flex items-start gap-2.5">
        <div className="border-border/70 bg-surface-2 grid size-7 shrink-0 place-items-center rounded-md border text-foreground/80">
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="sm" variant="muted">
              {humanCategory(action.category)}
            </Badge>
            {reviewOnly && (
              <Badge size="sm" variant="warning">
                Review only
              </Badge>
            )}
            <span className="text-muted-foreground/80 font-mono text-[10px]">
              · conf {Math.round(action.confidence * 100)}%
            </span>
          </div>
          <h3 className="text-foreground mt-1 text-[13px] font-medium leading-snug tracking-tight">
            {action.title}
          </h3>
        </div>
        {action.estimatedImpactUSD !== undefined && (
          <div className="text-right">
            <div
              className={cn(
                "font-mono text-[12px] font-medium",
                impactDir === "save"
                  ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
                  : impactDir === "add"
                    ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
                    : "text-muted-foreground"
              )}
            >
              {impact === 0
                ? "no Δ"
                : `${impact < 0 ? "−" : "+"}${formatUSD(Math.abs(impact))}`}
            </div>
            <div className="text-muted-foreground/80 mt-0.5 text-[10px] uppercase tracking-[0.08em]">
              impact
            </div>
          </div>
        )}
      </header>

      <p className="text-muted-foreground mt-2 text-[11.5px] leading-snug">
        {action.explanation}
      </p>

      {action.affects.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {action.affects.map((tag) => (
            <li key={tag}>
              <Badge variant="outline" size="sm" className="font-normal">
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {action.warnings.length > 0 && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-[color-mix(in_oklch,var(--warning)_8%,var(--surface))] px-2 py-1.5">
          <TriangleAlert className="text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))] mt-0.5 size-3 shrink-0" />
          <ul className="text-muted-foreground space-y-0.5 text-[10.5px] leading-snug">
            {action.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="border-border/60 mt-3 flex items-center justify-between border-t pt-2.5">
        <div className="text-muted-foreground inline-flex items-center gap-1 text-[10.5px]">
          <Clock className="size-3" />
          <span className="line-clamp-1 italic" title={action.source}>
            “{action.source}”
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isDismissed ? (
            <Button size="xs" variant="ghost" onClick={onUndo}>
              Restore
            </Button>
          ) : (
            <>
              <Button size="xs" variant="ghost" onClick={onDismiss}>
                <X />
                Dismiss
              </Button>
              {action.reviewHint && (
                <Button size="xs" variant="outline" onClick={onReview}>
                  <Eye />
                  Review
                </Button>
              )}
              {!reviewOnly && (
                <Button size="xs" onClick={onApply}>
                  <Check />
                  Apply
                </Button>
              )}
            </>
          )}
        </div>
      </footer>
    </article>
  )
}

function AppliedReceipt({
  action,
  appliedAt,
}: {
  action: ParsedAction
  appliedAt?: string
}) {
  const time = appliedAt
    ? new Date(appliedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "just now"

  const impact = action.estimatedImpactUSD ?? 0
  return (
    <div className="border-border/70 bg-card hover:bg-surface-2/40 group flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors">
      <div className="bg-[color-mix(in_oklch,var(--success)_25%,transparent)] grid size-5 shrink-0 place-items-center rounded">
        <Check className="text-[color-mix(in_oklch,var(--success)_60%,var(--ink))] size-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground/90 truncate text-[11.5px] leading-tight">
          {action.title}
        </div>
        <div className="text-muted-foreground/80 text-[10px] leading-tight">
          via SPI · {time}
        </div>
      </div>
      <span
        className={cn(
          "font-mono text-[10.5px]",
          impact < 0
            ? "text-[color-mix(in_oklch,var(--success)_55%,var(--ink))]"
            : impact > 0
              ? "text-[color-mix(in_oklch,var(--destructive)_55%,var(--ink))]"
              : "text-muted-foreground/70"
        )}
      >
        {impact === 0
          ? "—"
          : `${impact < 0 ? "−" : "+"}${formatUSD(Math.abs(impact))}`}
      </span>
    </div>
  )
}

function UnmatchedHint({ segments }: { segments: string[] }) {
  return (
    <div className="border-border/60 mt-2 rounded-md border border-dashed bg-[color-mix(in_oklch,var(--warning)_4%,var(--surface))] px-2.5 py-1.5">
      <div className="flex items-start gap-1.5">
        <TriangleAlert className="text-[color-mix(in_oklch,var(--warning)_55%,var(--ink))] mt-0.5 size-3 shrink-0" />
        <div className="text-[11px] leading-snug">
          <span className="text-foreground/85 font-medium">
            Couldn't parse:
          </span>{" "}
          <span className="text-muted-foreground italic">
            {segments.map((s) => `“${s}”`).join(" · ")}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Static action card (existing standing proposals) ────────────────────

function StaticActionCard({
  action,
  decision,
  onDecide,
}: {
  action: ProposedAction
  decision: StaticDecision
  onDecide: (d: StaticDecision) => void
}) {
  const Icon = PROPOSAL_ICON[action.category as keyof typeof PROPOSAL_ICON]
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
        <div className="border-border/70 bg-surface-2 grid size-7 shrink-0 place-items-center rounded-md border text-foreground/80">
          {Icon ? <Icon className="size-3.5" strokeWidth={1.75} /> : <Sparkles className="size-3.5" />}
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

// ── Section header ──────────────────────────────────────────────────────

function Section({
  title,
  count,
  aside,
  children,
}: {
  title: string
  count: number
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-foreground/80 text-[10.5px] font-semibold tracking-[0.08em] uppercase">
            {title}
          </h3>
          <span className="text-muted-foreground/70 font-mono text-[10.5px]">
            {count}
          </span>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

// ── Recommendation card ─────────────────────────────────────────────────

const RECOMMENDATION_ICON: Record<RecommendationKind, React.ComponentType<{ className?: string }>> = {
  margin: Gauge,
  rooming: Users,
  itinerary: Map,
  negotiation: Handshake,
  risk: ShieldAlert,
  anomaly: Radar,
}

const TONE_LEFT_BORDER: Record<RecommendationTone, string> = {
  watch:
    "before:bg-[color-mix(in_oklch,var(--warning)_55%,transparent)]",
  advisory:
    "before:bg-[color-mix(in_oklch,var(--gold)_55%,transparent)]",
  informational:
    "before:bg-[color-mix(in_oklch,var(--success)_55%,transparent)]",
}

const TONE_LABEL: Record<RecommendationTone, string> = {
  watch: "Watch",
  advisory: "Advisory",
  informational: "Confirmed",
}

function RecommendationCard({
  rec,
  onAction,
  onDismiss,
}: {
  rec: Recommendation
  onAction: (which: "primary" | "secondary") => void
  onDismiss: () => void
}) {
  const Icon = RECOMMENDATION_ICON[rec.kind] ?? Sparkles
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-md border border-border/70 bg-card pl-3 pr-2.5 py-2 transition-colors",
        // tone-tinted left bar
        "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full",
        TONE_LEFT_BORDER[rec.tone]
      )}
    >
      <div className="flex items-start gap-2">
        <div className="bg-surface-2 text-foreground/80 mt-0.5 grid size-5 shrink-0 place-items-center rounded">
          <Icon className="size-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <h4 className="text-foreground text-[12px] font-medium leading-tight">
              {rec.title}
            </h4>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
            {rec.rationale}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="muted" size="sm" className="font-medium">
              {TONE_LABEL[rec.tone]}
            </Badge>
            <span className="text-muted-foreground/70 text-[10px]">
              {rec.basis}
            </span>
            <span className="text-muted-foreground/40 text-[10px]">·</span>
            <span className="text-muted-foreground/70 font-mono text-[10px]">
              conf {Math.round(rec.confidence * 100)}%
            </span>
            <div className="ml-auto flex items-center gap-1">
              {rec.secondaryAction && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onAction("secondary")}
                >
                  {rec.secondaryAction.label}
                </Button>
              )}
              {rec.primaryAction && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onAction("primary")}
                >
                  {rec.primaryAction.kind === "open-drawer" ? (
                    <Eye />
                  ) : (
                    <Sparkles />
                  )}
                  {rec.primaryAction.label}
                </Button>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={onDismiss}
                aria-label="Dismiss recommendation"
              >
                <X />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function humanCategory(c: ParsedActionCategory): string {
  switch (c) {
    case "RoomingSubstitution":
      return "Rooming"
    case "VATConfirmation":
      return "VAT confirm"
    case "VATToggle":
      return "VAT toggle"
    case "GuestAdd":
      return "Guest +"
    case "GuestRemove":
      return "Guest −"
    case "MarginChange":
      return "Margin"
    case "ItineraryRemove":
      return "Itinerary −"
    case "ItineraryAdd":
      return "Itinerary +"
    case "ItineraryReorder":
      return "Reorder"
    default:
      return "Action"
  }
}
