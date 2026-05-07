// Mock intelligence parser. Converts operator language into structured
// ParsedAction objects. The parser never mutates state directly — each
// action carries an `apply(quote) => Quote` function that the cockpit only
// invokes after explicit operator approval.
//
// Real AI is *not* used in V1. Patterns are deterministic regex so the
// parser is testable, predictable, and explainable.

import { suggestPricingCategory } from "./rules"
import { quoteTotals } from "./pricing-engine"
import type {
  Guest,
  GuestType,
  Nationality,
  Quote,
  Region,
  SleepingArrangement,
} from "./types"

export type ParsedActionStatus = "actionable" | "review-only"

export type ParsedActionCategory =
  | "RoomingSubstitution"
  | "VATConfirmation"
  | "VATToggle"
  | "GuestAdd"
  | "GuestRemove"
  | "MarginChange"
  | "ItineraryRemove"
  | "ItineraryAdd"
  | "ItineraryReorder"
  | "Unknown"

export type ReviewHint =
  | { type: "guest"; guestId?: string }
  | { type: "rooming"; roomId?: string }
  | { type: "costs" }

export interface ParsedAction {
  id: string
  /** Short human label used as version note. */
  title: string
  /** Plain-English rationale shown on the card body. */
  explanation: string
  category: ParsedActionCategory
  /** 0..1 — how sure the parser is the segment maps to this action. */
  confidence: number
  affects: string[]
  warnings: string[]
  /** Computed via the deterministic engine — positive adds, negative saves. */
  estimatedImpactUSD?: number
  status: ParsedActionStatus
  /**
   * If actionable, returns the next Quote when invoked with the live one.
   * Should look up live ids inside the function body so it stays correct
   * after intervening edits.
   */
  apply: ((quote: Quote) => Quote) | null
  /** Drawer hint for the Review button. */
  reviewHint?: ReviewHint
  /** The original input segment that produced this action — for audit. */
  source: string
}

export interface ParseResult {
  input: string
  proposals: ParsedAction[]
  unmatchedSegments: string[]
}

// ── public entrypoint ────────────────────────────────────────────────────

export function parseIntelligence(input: string, quote: Quote): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { input: trimmed, proposals: [], unmatchedSegments: [] }
  }

  const segments = splitSegments(trimmed)
  const proposals: ParsedAction[] = []
  const unmatched: string[] = []
  const seenIds = new Set<string>()

  for (const seg of segments) {
    const matched = matchSegment(seg, quote)
    if (matched && !seenIds.has(matched.id)) {
      proposals.push(attachImpact(matched, quote))
      seenIds.add(matched.id)
    } else if (!matched) {
      unmatched.push(seg)
    }
  }

  return { input: trimmed, proposals, unmatchedSegments: unmatched }
}

/** Compute estimatedImpactUSD via the deterministic engine. */
function attachImpact(action: ParsedAction, quote: Quote): ParsedAction {
  if (!action.apply) return action
  try {
    const before = quoteTotals(quote).totalSell
    const after = quoteTotals(action.apply(quote)).totalSell
    return { ...action, estimatedImpactUSD: Math.round(after - before) }
  } catch {
    return action
  }
}

// ── segmentation ─────────────────────────────────────────────────────────

function splitSegments(input: string): string[] {
  return input
    .split(/[,;.\n]|\sand\s|\sthen\s|\salso\s/i)
    .map((s) => s.trim())
    .filter(Boolean)
}

// ── matchers ─────────────────────────────────────────────────────────────

function matchSegment(seg: string, quote: Quote): ParsedAction | null {
  for (const matcher of MATCHERS) {
    const m = matcher(seg, quote)
    if (m) return m
  }
  return null
}

const MATCHERS: Array<(seg: string, quote: Quote) => ParsedAction | null> = [
  matchFamilyRoomToTwoDoubles,
  matchKeepFuelNonVat,
  matchMarginChange,
  matchReducePax,
  matchAddGuest,
  matchRemoveDestination,
  matchAddDestination,
  matchMoveSection,
]

// 1) "family room unavailable, use two doubles"
function matchFamilyRoomToTwoDoubles(
  seg: string,
  quote: Quote
): ParsedAction | null {
  const familyMentioned = /\bfamily\s+room\b/i.test(seg)
  const unavailable = /(unavailable|gone|n\/a|out|not\s+avail|sold\s+out|booked)/i.test(
    seg
  )
  const useTwoDoubles =
    /(use|swap|replace|switch|do|book|take).{0,30}\b(two|2)\b.{0,10}\bdoubles?\b/i.test(
      seg
    )

  if (!familyMentioned && !useTwoDoubles) return null
  if (!unavailable && !useTwoDoubles) return null

  const target =
    quote.rooms.find((r) => r.arrangement === "FamilyRoom") ??
    quote.rooms.find((r) => r.arrangement === "TwoRoomsReplacingFamily")

  const warnings: string[] = []
  if (!target) {
    warnings.push("No family room found in current rooming layout.")
  }

  return {
    id: `parse:family-to-doubles:${stableHash(seg)}`,
    title: "Replace family room with two doubles",
    explanation: target
      ? `Camp policy: family room unavailable. Convert Room ${target.id.replace(
          "r",
          ""
        )} to "2 rooms · family override" with operator-override source and the segment recorded as policy note.`
      : "No family room is currently in the rooming layout. Record this as a policy note for future arrangements; no immediate price change.",
    category: "RoomingSubstitution",
    confidence: target ? 0.88 : 0.55,
    affects: target
      ? [`Room ${target.id.replace("r", "")}`, "Rooming policy"]
      : ["Rooming policy"],
    warnings,
    status: target ? "actionable" : "review-only",
    apply: target
      ? (q) => {
          const live =
            q.rooms.find((r) => r.arrangement === "FamilyRoom") ??
            q.rooms.find((r) => r.arrangement === "TwoRoomsReplacingFamily")
          if (!live) return q
          const arrangement: SleepingArrangement = "TwoRoomsReplacingFamily"
          return {
            ...q,
            rooms: q.rooms.map((r) =>
              r.id === live.id
                ? {
                    ...r,
                    arrangement,
                    policy: {
                      source: "operator-override",
                      confidence: "medium",
                      note: seg,
                    },
                  }
                : r
            ),
          }
        }
      : null,
    reviewHint: target
      ? { type: "rooming", roomId: target.id }
      : { type: "rooming" },
    source: seg,
  }
}

// 2) "keep fuel non-VAT"
function matchKeepFuelNonVat(
  seg: string,
  quote: Quote
): ParsedAction | null {
  const fuel = /\bfuel\b/i.test(seg)
  const nonVat =
    /(non[\s-]?vat(?:able)?|no\s+vat|exclud\w+\s+vat|outside\s+vat|exempt\b)/i.test(
      seg
    )
  const keep = /\b(keep|leave|stay|maintain|hold|lock)\b/i.test(seg)
  if (!fuel || !nonVat) return null

  const fuelLines = quote.costs.filter((c) => c.category === "Fuel")
  const flagged = fuelLines.filter((l) => l.vatable)
  const allCorrect = flagged.length === 0

  return {
    id: `parse:fuel-non-vat:${stableHash(seg)}`,
    title: allCorrect
      ? "Confirm fuel is non-VATable"
      : "Flip fuel to non-VATable",
    explanation: allCorrect
      ? `All ${fuelLines.length} fuel line${
          fuelLines.length === 1 ? "" : "s"
        } already non-VATable per Tanzania rule.${
          keep ? " Confirmation locked in policy notes." : ""
        }`
      : `${flagged.length} fuel line${
          flagged.length === 1 ? "" : "s"
        } currently flagged VATable. Apply to flip them off — Tanzania fuel is exempt.`,
    category: allCorrect ? "VATConfirmation" : "VATToggle",
    confidence: 0.99,
    affects: ["Costs · Fuel"],
    warnings: [],
    status: "actionable",
    apply: (q) => {
      const next = q.costs.map((c) =>
        c.category === "Fuel" ? { ...c, vatable: false } : c
      )
      return { ...q, costs: next }
    },
    reviewHint: { type: "costs" },
    source: seg,
  }
}

// 3) "increase margin to 24%"
function matchMarginChange(seg: string, _quote: Quote): ParsedAction | null {
  const m = seg.match(
    /(?:increase|set|change|raise|drop|reduce|lower|push|move)\s+(?:operator\s+)?margin\s+(?:to\s+|up\s+to\s+|down\s+to\s+|→\s*)?(\d+(?:\.\d+)?)\s*%?/i
  )
  if (!m) return null

  const pct = Number(m[1]) / 100
  if (Number.isNaN(pct) || pct < 0 || pct > 0.95) return null

  const warnings: string[] = []
  if (pct < 0.05) warnings.push("Margin is unusually low for retail.")
  if (pct > 0.4) warnings.push("Margin is well above the operator's typical band.")

  return {
    id: `parse:margin:${pct.toFixed(4)}`,
    title: `Set margin to ${(pct * 100).toFixed(1)}%`,
    explanation: `Re-run pricing with operator margin = ${(pct * 100).toFixed(
      1
    )}%. Engine recomputes total sell deterministically; net cost and VAT unchanged.`,
    category: "MarginChange",
    confidence: 0.95,
    affects: ["Pricing · margin"],
    warnings,
    status: "actionable",
    apply: (q) => ({ ...q, marginPct: pct }),
    reviewHint: { type: "costs" },
    source: seg,
  }
}

// 4) "reduce pax from 6 to 5"
function matchReducePax(seg: string, quote: Quote): ParsedAction | null {
  const m =
    seg.match(
      /(?:reduce|drop|cut|change|lower)\s+(?:pax|guests|party)?\s*(?:from\s+(\d+)\s+)?(?:to\s+|down\s+to\s+|→\s*)(\d+)/i
    ) ?? seg.match(/\bpax\b.*?(\d+)\s*(?:→|to)\s*(\d+)/i)
  if (!m) return null

  const target = Number(m[2] ?? m[1])
  const stated = m[2] ? (m[1] ? Number(m[1]) : null) : null
  if (Number.isNaN(target)) return null

  const currentPax = quote.guests.length
  const warnings: string[] = []
  if (stated !== null && stated !== currentPax) {
    warnings.push(
      `Operator said ‘from ${stated}’ but quote currently has ${currentPax} pax.`
    )
  }

  if (currentPax <= target) {
    return {
      id: `parse:pax-to-${target}:${stableHash(seg)}`,
      title: `Reduce pax to ${target}`,
      explanation: `Quote already has ${currentPax} pax — already at or below ${target}. No-op.`,
      category: "GuestRemove",
      confidence: 0.7,
      affects: ["Guests"],
      warnings,
      status: "actionable",
      apply: (q) => q,
      reviewHint: { type: "guest" },
      source: seg,
    }
  }

  const removeCount = currentPax - target
  // Heuristic: prefer last-added guests (likely the most recent edit).
  const toRemove = quote.guests.slice(-removeCount)

  return {
    id: `parse:pax-to-${target}:${stableHash(seg)}`,
    title: `Remove ${removeCount} guest${removeCount === 1 ? "" : "s"}`,
    explanation: `Reduce pax from ${currentPax} to ${target}. Default removes the last-added: ${toRemove
      .map((g) => g.name || `(${g.type.toLowerCase()})`)
      .join(", ")}. Operator must confirm the right candidate.`,
    category: "GuestRemove",
    confidence: 0.55,
    affects: ["Guests", "Pricing", "Rooming occupants"],
    warnings: [
      ...warnings,
      "Default is last-added — operator should confirm or use the Guest drawer.",
    ],
    status: "actionable",
    apply: (q) => {
      const removeIds = new Set(
        q.guests.slice(-Math.min(removeCount, q.guests.length)).map((g) => g.id)
      )
      const guests = q.guests.filter((g) => !removeIds.has(g.id))
      const rooms = q.rooms.map((r) => ({
        ...r,
        occupants: r.occupants.filter((id) => !removeIds.has(id)),
      }))
      return { ...q, guests, rooms, travel: { ...q.travel, pax: guests.length } }
    },
    reviewHint: { type: "guest" },
    source: seg,
  }
}

// 5) "add child age 10 with Tanzanian passport"
function matchAddGuest(seg: string, _quote: Quote): ParsedAction | null {
  if (!/\badd\b/i.test(seg) && !/\bnew\b/i.test(seg)) return null

  const typeMatch = seg.match(/\b(adult|child|infant|baby|toddler|teen)\b/i)
  const ageMatch =
    seg.match(/\bage[d]?\s+(\d+)/i) ??
    seg.match(/\b(\d{1,2})\s*(?:y\.?o\.?|yr|year[s]?\s*old)/i) ??
    seg.match(/\baged\s+(\d+)/i)
  const nationalityMatch = seg.match(
    /\b(Tanzanian|Kenyan|Ugandan|Rwandan|British|American|German|French|Indian|South\s+African)\b/i
  )

  // At least one guest dimension must be present
  if (!typeMatch && !ageMatch && !nationalityMatch) return null

  // Map fuzzy types
  const rawType = typeMatch?.[1].toLowerCase() ?? ""
  let type: GuestType = "Adult"
  if (rawType === "child" || rawType === "teen") type = "Child"
  else if (rawType === "infant" || rawType === "baby" || rawType === "toddler")
    type = "Infant"

  const age = ageMatch ? Number(ageMatch[1]) : undefined
  // If age is given without type, infer
  if (!typeMatch && age !== undefined) {
    if (age <= 4) type = "Infant"
    else if (age <= 15) type = "Child"
    else type = "Adult"
  }

  const nationality = (nationalityMatch?.[1].replace(/\s+/g, " ") ??
    "British") as Nationality

  const pricingCategory = suggestPricingCategory(nationality, false)

  const warnings: string[] = []
  if ((type === "Child" || type === "Infant") && age === undefined) {
    warnings.push(`${type} requires an age — engine cannot resolve fee band.`)
  }

  const draftId = `g:parsed:${stableHash(seg)}`

  return {
    id: `parse:add-guest:${stableHash(seg)}`,
    title: `Add ${type.toLowerCase()}${age !== undefined ? ` · ${age}` : ""} (${nationality})`,
    explanation: `Adds a ${type.toLowerCase()}${
      age !== undefined ? ` aged ${age}` : ""
    }${
      nationalityMatch ? `, ${nationality} passport` : ""
    }. Engine suggests pricing category ${pricingCategory}; operator can override in the Guest drawer.`,
    category: "GuestAdd",
    confidence:
      typeMatch && (ageMatch || nationalityMatch)
        ? 0.82
        : ageMatch || nationalityMatch
          ? 0.62
          : 0.45,
    affects: ["Guests", "Pricing", "Rooming"],
    warnings: [
      ...warnings,
      "New guest is not roomed yet — assign in the Rooming drawer.",
    ],
    status: warnings.length === 0 ? "actionable" : "review-only",
    apply: (q) => {
      const guest: Guest = {
        id: draftId,
        name: `New ${type.toLowerCase()}`,
        type,
        age,
        nationality,
        pricingCategory,
        pricingCategorySource: "suggested",
      }
      const guests = [...q.guests, guest]
      return { ...q, guests, travel: { ...q.travel, pax: guests.length } }
    },
    reviewHint: { type: "guest" },
    source: seg,
  }
}

// 6) "remove Zanzibar"
function matchRemoveDestination(
  seg: string,
  quote: Quote
): ParsedAction | null {
  const m = seg.match(
    /(?:remove|drop|skip|cut|cancel)\s+(arusha|tarangire|manyara|ngorongoro|serengeti|zanzibar)/i
  )
  if (!m) return null

  const region = capitalize(m[1].toLowerCase()) as Region
  const days = quote.itinerary.filter((d) =>
    d.region.toLowerCase().includes(region.toLowerCase())
  )

  if (days.length === 0) {
    return {
      id: `parse:remove-${region}:${stableHash(seg)}`,
      title: `Remove ${region}`,
      explanation: `${region} is not currently in this itinerary — nothing to remove.`,
      category: "ItineraryRemove",
      confidence: 0.95,
      affects: ["Itinerary"],
      warnings: [`${region} not present in current itinerary.`],
      status: "review-only",
      apply: null,
      source: seg,
    }
  }

  return {
    id: `parse:remove-${region}:${stableHash(seg)}`,
    title: `Remove ${region} (${days.length} day${days.length === 1 ? "" : "s"})`,
    explanation: `Drops ${days.length} itinerary day${
      days.length === 1 ? "" : "s"
    } in ${region}, plus associated park visits and concession lines. Itinerary editing isn't wired in V1 — open Review to edit manually.`,
    category: "ItineraryRemove",
    confidence: 0.65,
    affects: ["Itinerary", "Park fees", "Concession", "Pricing"],
    warnings: ["Itinerary edits require manual review in V1."],
    status: "review-only",
    apply: null,
    reviewHint: { type: "costs" },
    source: seg,
  }
}

// 7) "add Zanzibar with no park fees"
function matchAddDestination(seg: string, _quote: Quote): ParsedAction | null {
  const m = seg.match(
    /(?:add|append|extend|include)\s+(arusha|tarangire|manyara|ngorongoro|serengeti|zanzibar)/i
  )
  if (!m) return null

  const region = capitalize(m[1].toLowerCase()) as Region
  const noParkFees = /no\s+park\s+fees|without\s+park\s+fees/i.test(seg)

  return {
    id: `parse:add-${region}:${stableHash(seg)}`,
    title: `Add ${region}${noParkFees ? " · no park fees" : ""}`,
    explanation: `Extends the itinerary with ${region}${
      noParkFees
        ? ". Park-fee suppression noted — apply Costs drawer to lock fee lines off."
        : "."
    } Itinerary editing isn't wired in V1 — open Review to add manually.`,
    category: "ItineraryAdd",
    confidence: 0.6,
    affects: ["Itinerary", "Costs"],
    warnings: ["Itinerary edits require manual review in V1."],
    status: "review-only",
    apply: null,
    reviewHint: { type: "costs" },
    source: seg,
  }
}

// 8) "move family to Serengeti first"
function matchMoveSection(seg: string, _quote: Quote): ParsedAction | null {
  if (!/\b(move|reorder|swap|shift|put|start with)\b/i.test(seg)) return null
  const region = seg.match(
    /\b(arusha|tarangire|manyara|ngorongoro|serengeti|zanzibar)\b/i
  )
  if (!region) return null

  const first = /\b(first|begin|start)\b/i.test(seg)
  const last = /\b(last|end|final)\b/i.test(seg)

  return {
    id: `parse:move:${stableHash(seg)}`,
    title: `Reorder itinerary — ${capitalize(region[1].toLowerCase())} ${
      first ? "first" : last ? "last" : "moved"
    }`,
    explanation: `Reorder request detected. Itinerary reordering recomputes park-visit dates and may shift charter routing — operator must rebuild manually in V1.`,
    category: "ItineraryReorder",
    confidence: 0.5,
    affects: ["Itinerary", "Charters", "Park visits"],
    warnings: ["Reordering requires manual review in V1."],
    status: "review-only",
    apply: null,
    source: seg,
  }
}

// ── helpers ──────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function stableHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

// Re-exports for parser-internal helpers if a test ever needs them.
export { splitSegments }
