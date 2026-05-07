// Recommendation engine. Pure derivation — given a quote and the active
// observations, produce a list of advisory recommendations.
//
// Hard rules:
//   1. NEVER mutates the quote.
//   2. NEVER produces an action that auto-applies. Each action either
//      opens a drawer for operator review or pre-fills the parser input.
//   3. NEVER compares across operators. The engine only sees the local
//      operator's observations.
//   4. Phrasing is observational, not authoritative. Use "typically",
//      "often", "worth a check" — never "must" or "always".

import {
  discountStats,
  familyToDoublesCount,
  fuelNonVatCount,
  marginStats,
  type Observation,
} from "./operator-memory"
import type { Quote } from "./types"

export type RecommendationKind =
  | "margin"
  | "rooming"
  | "itinerary"
  | "negotiation"
  | "risk"
  | "anomaly"

export type RecommendationTone =
  | "informational" // calm acknowledgement
  | "advisory" // worth a moment
  | "watch" // potentially blocking, but never urgent-shouty

export type RecommendationAction =
  | {
      kind: "open-drawer"
      label: string
      drawer:
        | { type: "guest"; guestId?: string }
        | { type: "rooming"; roomId?: string }
        | { type: "costs" }
    }
  | { kind: "open-parser"; label: string; prompt: string }

export interface Recommendation {
  id: string
  kind: RecommendationKind
  title: string
  rationale: string
  basis: string
  confidence: number
  tone: RecommendationTone
  primaryAction?: RecommendationAction
  secondaryAction?: RecommendationAction
}

const TONE_ORDER: Record<RecommendationTone, number> = {
  watch: 0,
  advisory: 1,
  informational: 2,
}

const pctF = (n: number) => `${(n * 100).toFixed(1)}%`

export function recommend(
  quote: Quote,
  observations: Observation[]
): Recommendation[] {
  const recs: Recommendation[] = []

  // 1. Margin band
  const margin = marginStats(observations)
  if (margin && margin.count >= 3) {
    const cur = quote.marginPct
    if (cur >= margin.min && cur <= margin.max) {
      recs.push({
        id: "rec:margin:in-band",
        kind: "margin",
        title: "Margin sits in your usual band",
        rationale: `Your last ${margin.count} margin decisions ranged ${pctF(
          margin.min
        )}–${pctF(margin.max)}. Current ${pctF(
          cur
        )} is comfortably inside — no change suggested.`,
        basis: `${margin.count} prior margin commits`,
        confidence: 0.85,
        tone: "informational",
      })
    } else {
      const direction = cur < margin.min ? "below" : "above"
      recs.push({
        id: "rec:margin:out-band",
        kind: "margin",
        title: `Margin is ${direction} your usual band`,
        rationale: `Recent margins ranged ${pctF(margin.min)}–${pctF(
          margin.max
        )}. Current ${pctF(
          cur
        )} sits ${direction} that band — worth a moment to confirm.`,
        basis: `${margin.count} prior margin commits`,
        confidence: 0.78,
        tone: "advisory",
        primaryAction: {
          kind: "open-drawer",
          label: "Open Costs",
          drawer: { type: "costs" },
        },
      })
    }
  }

  // 2. Rooming override pattern
  const familyOverrides = familyToDoublesCount(observations)
  if (familyOverrides >= 2) {
    const hasFamilyRoom = quote.rooms.some((r) => r.arrangement === "FamilyRoom")
    const hasOverride = quote.rooms.some(
      (r) => r.arrangement === "TwoRoomsReplacingFamily"
    )
    if (hasFamilyRoom) {
      recs.push({
        id: "rec:rooming:family-pending",
        kind: "rooming",
        title: "Family rooms have shifted in your recent quotes",
        rationale: `In ${familyOverrides} of your recent overrides, family rooms moved to two doubles. Worth a quick check with the camp before sending.`,
        basis: `${familyOverrides} prior overrides`,
        confidence: 0.72,
        tone: "advisory",
        primaryAction: {
          kind: "open-parser",
          label: "Run as proposal",
          prompt: "family room unavailable, use two doubles",
        },
        secondaryAction: {
          kind: "open-drawer",
          label: "Open rooming",
          drawer: { type: "rooming" },
        },
      })
    } else if (hasOverride) {
      recs.push({
        id: "rec:rooming:family-confirmed",
        kind: "rooming",
        title: "Rooming matches your usual family override",
        rationale: `${familyOverrides} of your recent quotes followed the family-room → two-doubles pattern. Current quote already uses it — pattern confirmed.`,
        basis: `${familyOverrides} prior overrides`,
        confidence: 0.85,
        tone: "informational",
      })
    }
  }

  // 3. Fuel / VAT consistency
  const fuelCount = fuelNonVatCount(observations)
  if (fuelCount >= 2) {
    const fuelLines = quote.costs.filter((c) => c.category === "Fuel")
    const flagged = fuelLines.filter((l) => l.vatable)
    if (flagged.length === 0 && fuelLines.length > 0) {
      recs.push({
        id: "rec:fuel:matches",
        kind: "anomaly",
        title: "Fuel non-VAT matches your usual",
        rationale: `You typically keep fuel non-VATable — current quote already reflects that on ${
          fuelLines.length
        } line${fuelLines.length === 1 ? "" : "s"}. Nothing to do.`,
        basis: `${fuelCount} prior confirmations`,
        confidence: 0.9,
        tone: "informational",
      })
    } else if (flagged.length > 0) {
      recs.push({
        id: "rec:fuel:regression",
        kind: "anomaly",
        title: "Fuel currently flagged VATable",
        rationale: `You've kept fuel non-VAT on ${fuelCount} prior quotes. ${flagged.length} fuel line${
          flagged.length === 1 ? "" : "s"
        } flagged on this one — possibly a regression.`,
        basis: `${fuelCount} prior confirmations`,
        confidence: 0.85,
        tone: "watch",
        primaryAction: {
          kind: "open-parser",
          label: "Run as proposal",
          prompt: "keep fuel non-VAT",
        },
        secondaryAction: {
          kind: "open-drawer",
          label: "Open Costs",
          drawer: { type: "costs" },
        },
      })
    }
  }

  // 4. Negotiation / discount pattern
  const dStats = discountStats(observations)
  if (dStats && dStats.count >= 2) {
    recs.push({
      id: "rec:negotiation:discount",
      kind: "negotiation",
      title: "Recent quotes were typically discounted before approval",
      rationale: `On ${dStats.count} prior approvals, you applied ${pctF(
        dStats.min
      )}–${pctF(dStats.max)} discounts (avg ${pctF(
        dStats.avg
      )}). Holding initial margin is reasonable — clients often counter.`,
      basis: `${dStats.count} prior discounts`,
      confidence: 0.65,
      tone: "advisory",
    })
  }

  // 5. Itinerary optimisation
  const regions = new Set(quote.itinerary.map((d) => d.region))
  if (regions.has("Tarangire") && regions.has("Lake Manyara")) {
    recs.push({
      id: "rec:itinerary:tarangire-manyara",
      kind: "itinerary",
      title: "Tarangire + Manyara often combine on one day",
      rationale: `Many operators merge an afternoon Tarangire game drive with a Manyara stop, saving one night and concession fees per pax. Worth considering if the pace allows.`,
      basis: "operational pattern · Tanzania northern circuit",
      confidence: 0.6,
      tone: "advisory",
    })
  }

  // 6. Risk — unconfirmed rooming
  const lessThanHigh = quote.rooms.filter((r) => r.policy.confidence !== "high")
  if (lessThanHigh.length > 0) {
    const lowest = lessThanHigh[0]
    recs.push({
      id: "rec:risk:rooming-confidence",
      kind: "risk",
      title: "Some rooms have unconfirmed policy",
      rationale: `${lessThanHigh.length} room${
        lessThanHigh.length === 1 ? "" : "s"
      } flagged ${
        lessThanHigh.length === 1 ? lowest.policy.confidence : "below high"
      } confidence. Worth re-confirming with the camp before client sign-off.`,
      basis: "current quote validator",
      confidence: 0.75,
      tone: "watch",
      primaryAction: {
        kind: "open-drawer",
        label: "Open rooming",
        drawer: { type: "rooming", roomId: lowest.id },
      },
    })
  }

  // 7. Anomaly — outlier accommodation rate
  const accom = quote.costs.filter(
    (c) => c.category === "Accommodation" && c.unit === "perPersonPerNight"
  )
  if (accom.length >= 3) {
    const rates = accom.map((l) => l.netRate)
    const max = Math.max(...rates)
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length
    const outlier = accom.find((l) => l.netRate === max)
    if (outlier && max > avg * 1.35) {
      recs.push({
        id: `rec:anomaly:${outlier.id}`,
        kind: "anomaly",
        title: `${outlier.label.split(" — ")[0]} sits above the trip average`,
        rationale: `Net rate $${
          outlier.netRate
        } is roughly ${Math.round(
          (max / avg - 1) * 100
        )}% above the mean accommodation rate ($${Math.round(
          avg
        )}) on this quote. Worth a re-check with the supplier rate sheet.`,
        basis: "in-quote anomaly",
        confidence: 0.65,
        tone: "watch",
        primaryAction: {
          kind: "open-drawer",
          label: "Open Costs",
          drawer: { type: "costs" },
        },
      })
    }
  }

  return recs.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone])
}
