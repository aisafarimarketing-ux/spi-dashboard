// Tanzania pricing rules — illustrative. Real operators must confirm fees
// each season; the engine reads from this file only and the values can be
// overridden by uploaded supplier rates in later phases.

import type {
  CostCategory,
  GuestType,
  Nationality,
  ParkCode,
  PricingCategory,
} from "./types"

export const TZ_VAT_RATE = 0.18 // VAT applied to VATable categories only

/** Categories that VAT applies to by default. Operator may override per-line. */
export const VATABLE_BY_DEFAULT: Record<CostCategory, boolean> = {
  Accommodation: true,
  Activities: true,
  Transfers: true,
  Vehicle: true,
  Guide: true,
  // Fuel is non-VATable in Tanzania — common operator gotcha.
  Fuel: false,
  // Government park & concession fees are not VATable.
  ParkFees: false,
  ConcessionFees: false,
  Other: true,
}

type FeeBand = { adult: number; child: number; infant: number }

/**
 * Park entry fees per person per 24h, USD.
 * Indicative figures — engine will use them deterministically; supplier portal
 * (Phase 3) will replace these with rated values.
 */
export const PARK_ENTRY_FEES: Record<
  ParkCode,
  Partial<Record<PricingCategory, FeeBand>>
> = {
  ARUSHA: {
    International: { adult: 59, child: 18, infant: 0 },
    EastAfricanResident: { adult: 12, child: 6, infant: 0 },
    Local: { adult: 6, child: 2, infant: 0 },
  },
  TARANGIRE: {
    International: { adult: 65, child: 24, infant: 0 },
    EastAfricanResident: { adult: 18, child: 12, infant: 0 },
    Local: { adult: 6, child: 2, infant: 0 },
  },
  MANYARA: {
    International: { adult: 59, child: 18, infant: 0 },
    EastAfricanResident: { adult: 12, child: 6, infant: 0 },
    Local: { adult: 6, child: 2, infant: 0 },
  },
  NGORONGORO: {
    International: { adult: 82, child: 24, infant: 0 },
    EastAfricanResident: { adult: 30, child: 12, infant: 0 },
    Local: { adult: 12, child: 4, infant: 0 },
  },
  SERENGETI: {
    International: { adult: 82, child: 28, infant: 0 },
    EastAfricanResident: { adult: 24, child: 12, infant: 0 },
    Local: { adult: 12, child: 4, infant: 0 },
  },
  ZANZIBAR: {
    // Infrastructure tax, applied per international visitor.
    International: { adult: 17, child: 0, infant: 0 },
    EastAfricanResident: { adult: 0, child: 0, infant: 0 },
    Local: { adult: 0, child: 0, infant: 0 },
  },
}

/** Ngorongoro Crater service fee per vehicle per descent, USD. */
export const NGORONGORO_CRATER_SERVICE_FEE = 295

/** Concession fees per person per night for camps inside conservation areas. */
export const CONCESSION_FEES_PPPN: Partial<Record<ParkCode, number>> = {
  NGORONGORO: 60,
  SERENGETI: 70,
  TARANGIRE: 50,
}

/** Nationality → suggested pricing category. Operator can always override. */
const EAST_AFRICAN: Nationality[] = [
  "Tanzanian",
  "Kenyan",
  "Ugandan",
  "Rwandan",
]

export function suggestPricingCategory(
  nationality: Nationality,
  hasResidencyDoc: boolean
): PricingCategory {
  if (nationality === "Tanzanian") return "Local"
  if (EAST_AFRICAN.includes(nationality)) return "EastAfricanResident"
  if (hasResidencyDoc) return "EastAfricanResident"
  return "International"
}

/** Default age bands. Camps may negotiate; operator override wins. */
export const AGE_BAND_BOUNDS = {
  infantMaxAge: 4, // 0–4 inclusive
  childMaxAge: 15, // 5–15 inclusive
}

export function ageBand(
  age: number | undefined,
  type: GuestType
): "adult" | "child" | "infant" {
  if (type === "Adult") return "adult"
  if (type === "Infant") return "infant"
  if (age !== undefined && age <= AGE_BAND_BOUNDS.infantMaxAge) return "infant"
  return "child"
}
