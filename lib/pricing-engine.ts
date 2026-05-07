// Deterministic pricing engine. Pure functions, no UI dependencies.
//
// Rules of the engine:
//   1. Pricing is computed from CostLine, ParkVisit, Guest, and marginPct.
//   2. VAT is computed line-by-line, never as `total × VAT`. Lines with
//      `vatable: false` (e.g. Fuel, Park Fees) contribute zero VAT.
//   3. AI never mutates a Quote silently. The engine accepts a Quote as
//      input and returns totals + warnings. Mutations happen by the
//      operator approving a proposed action that produces a new Quote.
//   4. The engine is the only place pricing math lives. UI never adds,
//      multiplies, or applies VAT to money.

import {
  AGE_BAND_BOUNDS,
  CONCESSION_FEES_PPPN,
  PARK_ENTRY_FEES,
  TZ_VAT_RATE,
  VATABLE_BY_DEFAULT,
  ageBand,
  suggestPricingCategory,
} from "./rules"
import type {
  CostLine,
  Guest,
  ParkVisit,
  PricingCategory,
  Quote,
  QuoteTotals,
  QuoteWarning,
} from "./types"

/** Net cost (pre-VAT) of a single cost line. */
export function lineSubtotal(line: CostLine): number {
  return round2(line.netRate * line.qty)
}

/** VAT on a single line. Zero if the line is not VATable. */
export function vatOnLine(line: CostLine, rate: number = TZ_VAT_RATE): number {
  if (!line.vatable) return 0
  return round2(lineSubtotal(line) * rate)
}

/**
 * Park-entry fees for a single ParkVisit, considering the active guests'
 * pricing categories and age bands.
 *
 * Returns 0 if no fee table is configured for the requested category — this
 * surfaces as a warning in `validateQuote` rather than failing silently.
 */
export function parkFeesForVisit(visit: ParkVisit, guests: Guest[]): number {
  const fees = PARK_ENTRY_FEES[visit.park]
  if (!fees) return 0

  const eligible = visit.guestIds
    ? guests.filter((g) => visit.guestIds!.includes(g.id))
    : guests

  let total = 0
  for (const g of eligible) {
    const band = fees[g.pricingCategory]
    if (!band) continue
    const ageRow = ageBand(g.age, g.type)
    total += band[ageRow] * visit.durationDays
  }
  return round2(total)
}

/** Concession fees for a quote, computed from itinerary nights × pppn rate. */
export function concessionFeesForQuote(quote: Quote): number {
  let total = 0
  for (const day of quote.itinerary) {
    if (!day.stay?.nights) continue
    const code = regionToParkCode(day.region)
    if (!code) continue
    const rate = CONCESSION_FEES_PPPN[code]
    if (!rate) continue
    total += rate * quote.travel.pax * day.stay.nights
  }
  return round2(total)
}

function regionToParkCode(
  region: Quote["itinerary"][number]["region"]
): keyof typeof CONCESSION_FEES_PPPN | null {
  switch (region) {
    case "Tarangire":
      return "TARANGIRE"
    case "Ngorongoro":
      return "NGORONGORO"
    case "Serengeti":
      return "SERENGETI"
    default:
      return null
  }
}

/**
 * Compute totals for a quote.
 *
 *   netCost   = Σ lineSubtotal + Σ parkFeesForVisit
 *   vat       = Σ vatOnLine     (park fees are non-VATable)
 *   totalSell = (netCost + vat) / (1 − marginPct)
 *   margin    = totalSell − (netCost + vat)
 */
export function quoteTotals(quote: Quote): QuoteTotals {
  let netCost = 0
  let vat = 0
  let vatable = 0
  let nonVatable = 0

  for (const line of quote.costs) {
    const sub = lineSubtotal(line)
    netCost += sub
    if (line.vatable) {
      vatable += sub
      vat += vatOnLine(line)
    } else {
      nonVatable += sub
    }
  }

  // Park entry fees — also part of net cost but never VATable.
  for (const visit of quote.parkVisits) {
    const fees = parkFeesForVisit(visit, quote.guests)
    netCost += fees
    nonVatable += fees
  }

  // Concession fees — per-person-per-night at camps inside conservation areas.
  const concession = concessionFeesForQuote(quote)
  netCost += concession
  nonVatable += concession

  const baseForMargin = netCost + vat
  const marginPct = clamp(quote.marginPct, 0, 0.95)
  const totalSell =
    marginPct === 0 ? baseForMargin : baseForMargin / (1 - marginPct)
  const margin = totalSell - baseForMargin

  const warnings = validateQuote(quote)
  const confidence = confidenceScore(quote, warnings)

  return {
    netCost: round2(netCost),
    vat: round2(vat),
    margin: round2(margin),
    marginPct: totalSell === 0 ? 0 : (margin / totalSell) * 100,
    totalSell: round2(totalSell),
    perPax: round2(totalSell / Math.max(1, quote.travel.pax)),
    perNight: round2(totalSell / Math.max(1, quote.travel.nights)),
    vatBreakdown: { vatable: round2(vatable), nonVatable: round2(nonVatable) },
    warnings,
    confidence,
  }
}

/** Surface every condition that should block a confident quote being sent. */
export function validateQuote(quote: Quote): QuoteWarning[] {
  const warnings: QuoteWarning[] = []

  // 1. Children and infants must have an age. Pricing depends on it.
  for (const g of quote.guests) {
    if (g.type !== "Adult" && g.age === undefined) {
      warnings.push({
        id: `missing-age-${g.id}`,
        level: "error",
        scope: "guests",
        message: `${g.name} is a ${g.type} but has no age — cannot resolve fee band.`,
      })
    }
  }

  // 2. Pricing category must be set per guest. Engine can suggest, operator confirms.
  for (const g of quote.guests) {
    if (!g.pricingCategory) {
      warnings.push({
        id: `missing-category-${g.id}`,
        level: "warning",
        scope: "guests",
        message: `${g.name} has no pricing category. Suggested: ${suggestPricingCategory(
          g.nationality,
          Boolean(g.residencyDoc)
        )}.`,
      })
    } else if (g.pricingCategorySource === "suggested") {
      warnings.push({
        id: `unconfirmed-category-${g.id}`,
        level: "info",
        scope: "guests",
        message: `${g.name}'s pricing category (${g.pricingCategory}) is engine-suggested. Operator confirmation recommended.`,
      })
    }
  }

  // 3. EA Resident must have residency documentation.
  for (const g of quote.guests) {
    if (g.pricingCategory === "EastAfricanResident" && !g.residencyDoc) {
      warnings.push({
        id: `missing-residency-${g.id}`,
        level: "warning",
        scope: "guests",
        message: `${g.name} is priced as East African Resident but has no residency doc on file.`,
      })
    }
  }

  // 4. Rooms reference real guests.
  const guestIds = new Set(quote.guests.map((g) => g.id))
  for (const room of quote.rooms) {
    for (const oid of room.occupants) {
      if (!guestIds.has(oid)) {
        warnings.push({
          id: `bad-occupant-${room.id}`,
          level: "error",
          scope: "rooming",
          message: `Room ${room.id} references unknown guest ${oid}.`,
        })
      }
    }
  }

  // 5. Every guest is roomed.
  const placedGuests = new Set(quote.rooms.flatMap((r) => r.occupants))
  for (const g of quote.guests) {
    if (!placedGuests.has(g.id)) {
      warnings.push({
        id: `unroomed-${g.id}`,
        level: "warning",
        scope: "rooming",
        message: `${g.name} is not assigned to a room.`,
      })
    }
  }

  // 6. Fuel must be non-VATable.
  for (const line of quote.costs) {
    if (line.category === "Fuel" && line.vatable) {
      warnings.push({
        id: `fuel-vat-${line.id}`,
        level: "warning",
        scope: "costs",
        message: `"${line.label}" is fuel but flagged VATable. Tanzania fuel is non-VAT.`,
      })
    }
    if (line.category === "ParkFees" && line.vatable) {
      warnings.push({
        id: `parkfee-vat-${line.id}`,
        level: "warning",
        scope: "costs",
        message: `"${line.label}" is a park fee but flagged VATable.`,
      })
    }
  }

  // 7. Park visits must reference a fee table for each guest's category.
  for (const visit of quote.parkVisits) {
    const table = PARK_ENTRY_FEES[visit.park]
    if (!table) continue
    const eligible = visit.guestIds
      ? quote.guests.filter((g) => visit.guestIds!.includes(g.id))
      : quote.guests
    for (const g of eligible) {
      if (!table[g.pricingCategory]) {
        warnings.push({
          id: `no-fee-${visit.id}-${g.id}`,
          level: "warning",
          scope: "parks",
          message: `${visit.park} has no fee row for ${g.name}'s category (${g.pricingCategory}).`,
        })
      }
    }
  }

  // 8. Margin sanity.
  if (quote.marginPct < 0.05) {
    warnings.push({
      id: "low-margin",
      level: "warning",
      scope: "policy",
      message: `Margin is ${(quote.marginPct * 100).toFixed(
        1
      )}% — unusually low for retail.`,
    })
  }
  if (quote.marginPct > 0.4) {
    warnings.push({
      id: "high-margin",
      level: "info",
      scope: "policy",
      message: `Margin is ${(quote.marginPct * 100).toFixed(
        1
      )}% — well above the operator's typical band.`,
    })
  }

  return warnings
}

/** Confidence score 0..1 derived from warnings + data completeness. */
export function confidenceScore(
  quote: Quote,
  warnings: QuoteWarning[] = validateQuote(quote)
): number {
  let score = 1
  for (const w of warnings) {
    if (w.level === "error") score -= 0.15
    else if (w.level === "warning") score -= 0.05
    else score -= 0.01
  }

  // Room policy confidence influences overall score.
  for (const r of quote.rooms) {
    if (r.policy.confidence === "low") score -= 0.05
    else if (r.policy.confidence === "medium") score -= 0.02
  }

  return clamp(score, 0, 1)
}

/** Aggregate cost lines for cockpit visualisation. */
export function aggregateByCategory(quote: Quote) {
  type Row = { category: string; netCost: number; sell: number; share: number }
  const totals = quoteTotals(quote)
  const map = new Map<string, { netCost: number }>()

  for (const line of quote.costs) {
    const row = map.get(line.category) ?? { netCost: 0 }
    row.netCost += lineSubtotal(line) + vatOnLine(line)
    map.set(line.category, row)
  }

  // Park entry fees + concession fees collapsed into one ParkFees bucket
  // so the cost-composition bar reads naturally.
  let parkAndConcession = 0
  for (const visit of quote.parkVisits) {
    parkAndConcession += parkFeesForVisit(visit, quote.guests)
  }
  parkAndConcession += concessionFeesForQuote(quote)
  if (parkAndConcession > 0) {
    map.set("ParkFees", {
      netCost: (map.get("ParkFees")?.netCost ?? 0) + parkAndConcession,
    })
  }

  const rows: Row[] = Array.from(map.entries()).map(([category, v]) => {
    const sell =
      totals.totalSell === 0
        ? 0
        : v.netCost * (totals.totalSell / (totals.netCost + totals.vat))
    return {
      category,
      netCost: round2(v.netCost),
      sell: round2(sell),
      share: totals.totalSell === 0 ? 0 : sell / totals.totalSell,
    }
  })

  rows.sort((a, b) => b.sell - a.sell)
  return rows
}

// ── helpers ───────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Re-exported for UI labels.
export { AGE_BAND_BOUNDS, suggestPricingCategory }
