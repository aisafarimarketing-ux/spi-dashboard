// Mock dataset for the SPI cockpit. Constructs a typed Quote and runs the
// deterministic engine to produce totals — no pricing math lives here.

import { quoteTotals } from "./pricing-engine"
import type {
  CostLine,
  Guest,
  ItineraryDay,
  ParkVisit,
  Quote,
  RoomAssignment,
} from "./types"

// ── Sidebar files (unchanged shape, Tanzania-flavoured copy) ──────────────

export const SIDEBAR_QUOTES = [
  {
    id: "Q-2841",
    title: "Henderson Family",
    sub: "Tanzania classic · 9 nts",
    status: "Draft v3",
    pinned: true,
    updated: "12m",
    accent: "gold" as const,
  },
  {
    id: "Q-2839",
    title: "Okonkwo + 3",
    sub: "Northern circuit · 6 nts",
    status: "Awaiting client",
    pinned: false,
    updated: "2h",
    accent: "muted" as const,
  },
  {
    id: "Q-2837",
    title: "Voss honeymoon",
    sub: "Serengeti + Zanzibar · 11 nts",
    status: "Confirmed",
    pinned: false,
    updated: "yesterday",
    accent: "success" as const,
  },
  {
    id: "Q-2835",
    title: "Patel × 6",
    sub: "Tarangire + Serengeti · 7 nts",
    status: "Draft v1",
    pinned: false,
    updated: "2 days",
    accent: "muted" as const,
  },
  {
    id: "Q-2833",
    title: "Bauer corporate",
    sub: "Arusha + Manyara · 4 nts",
    status: "Hold",
    pinned: false,
    updated: "3 days",
    accent: "warning" as const,
  },
  {
    id: "Q-2831",
    title: "MacGregor anniv.",
    sub: "Ngorongoro + Zanzibar · 10 nts",
    status: "Awaiting deposit",
    pinned: false,
    updated: "5 days",
    accent: "warning" as const,
  },
]

// ── The active quote (Tanzania V1) ────────────────────────────────────────

export const GUESTS: Guest[] = [
  {
    id: "g1",
    name: "James Henderson",
    type: "Adult",
    nationality: "British",
    pricingCategory: "International",
    pricingCategorySource: "operator-confirmed",
    passport: "GBR",
  },
  {
    id: "g2",
    name: "Priya Henderson",
    type: "Adult",
    nationality: "Indian",
    // Lives in Nairobi on a work permit — operator priced as EA Resident.
    pricingCategory: "EastAfricanResident",
    pricingCategorySource: "operator-override",
    passport: "IND",
    residencyDoc: "KE work permit · expires 2027-04",
    dietary: "Pescatarian",
  },
  {
    id: "g3",
    name: "Ayla Henderson",
    type: "Child",
    age: 14,
    nationality: "British",
    pricingCategory: "International",
    pricingCategorySource: "operator-confirmed",
    passport: "GBR",
  },
  {
    id: "g4",
    name: "Theo Henderson",
    type: "Child",
    age: 11,
    nationality: "British",
    pricingCategory: "International",
    pricingCategorySource: "operator-confirmed",
    passport: "GBR",
  },
]

export const ROOMS: RoomAssignment[] = [
  {
    id: "r1",
    arrangement: "Double",
    occupants: ["g1", "g2"],
    policy: {
      source: "camp-policy",
      confidence: "high",
      note: "Standard double room, all camps confirmed.",
    },
    priceImpact: { direction: "neutral", amountUSD: 0 },
    notes: "Honeymoon-style turn-down requested.",
  },
  {
    id: "r2",
    arrangement: "TwoRoomsReplacingFamily",
    occupants: ["g3", "g4"],
    policy: {
      source: "operator-override",
      confidence: "medium",
      note: "Family room unavailable at Lemala Ngorongoro nights 5; camp confirmed two interconnecting twins at child rate.",
    },
    priceImpact: { direction: "add", amountUSD: 180 },
    notes: "Connecting requested at every camp.",
  },
]

export const ITINERARY: ItineraryDay[] = [
  {
    day: 1,
    date: "2026-08-12",
    title: "Arrive Kilimanjaro · Arusha",
    region: "Arusha",
    movement: {
      mode: "Flight",
      from: "London (LHR)",
      to: "Kilimanjaro (JRO)",
      operator: "KLM",
    },
    property: {
      name: "Legendary Lodge",
      category: "Lodge",
      tier: "Luxury",
    },
    stay: { nights: 1, boardBasis: "BB" },
    activities: ["Airport meet & greet", "Plantation lunch on arrival"],
  },
  {
    day: 2,
    date: "2026-08-13",
    title: "Tarangire — baobab country",
    region: "Tarangire",
    movement: {
      mode: "Road",
      from: "Arusha",
      to: "Tarangire",
      operator: "Tamarind Safaris",
    },
    property: {
      name: "Lemala Mpingo Ridge",
      category: "Camp",
      tier: "Ultra",
    },
    stay: { nights: 2, boardBasis: "FI" },
    activities: ["Afternoon game drive", "Sundowner on the ridge"],
  },
  {
    day: 4,
    date: "2026-08-15",
    title: "Lake Manyara",
    region: "Lake Manyara",
    movement: {
      mode: "Road",
      from: "Tarangire",
      to: "Lake Manyara",
      operator: "Tamarind Safaris",
    },
    property: {
      name: "Lake Manyara Tree Lodge",
      category: "Lodge",
      tier: "Ultra",
    },
    stay: { nights: 1, boardBasis: "FI" },
    activities: ["Tree-canopy walk", "Flamingo viewpoint at dusk"],
  },
  {
    day: 5,
    date: "2026-08-16",
    title: "Ngorongoro Crater",
    region: "Ngorongoro",
    movement: {
      mode: "Road",
      from: "Manyara",
      to: "Ngorongoro Rim",
      operator: "Tamarind Safaris",
    },
    property: {
      name: "Lemala Ngorongoro",
      category: "Camp",
      tier: "Luxury",
    },
    stay: { nights: 1, boardBasis: "FI" },
    activities: ["Full-day crater descent", "Picnic on the crater floor"],
  },
  {
    day: 6,
    date: "2026-08-17",
    title: "Central Serengeti",
    region: "Serengeti",
    movement: {
      mode: "Charter",
      from: "Manyara (LKY)",
      to: "Seronera (SEU)",
      operator: "Coastal Aviation",
    },
    property: {
      name: "Sanctuary Kichakani",
      category: "Mobile",
      tier: "Ultra",
    },
    stay: { nights: 3, boardBasis: "FI" },
    activities: [
      "Twice-daily game drives",
      "Migration tracking with senior guide",
      "Bush breakfast",
    ],
  },
  {
    day: 9,
    date: "2026-08-20",
    title: "Lamai · Northern Serengeti",
    region: "Serengeti",
    movement: {
      mode: "Charter",
      from: "Seronera (SEU)",
      to: "Kogatende (KTD)",
      operator: "Coastal Aviation",
    },
    property: {
      name: "Sayari Camp",
      category: "Camp",
      tier: "Ultra",
    },
    stay: { nights: 1, boardBasis: "FI" },
    activities: ["Mara River crossings", "Hot-air balloon at dawn"],
  },
  {
    day: 10,
    date: "2026-08-21",
    title: "Depart Kilimanjaro",
    region: "Transit",
    movement: {
      mode: "Charter",
      from: "Kogatende (KTD)",
      to: "Kilimanjaro (JRO)",
      operator: "Coastal Aviation",
    },
    activities: ["Day-room at JRO Lounge", "International departure"],
  },
]

export const PARK_VISITS: ParkVisit[] = [
  { id: "pv1", park: "TARANGIRE", durationDays: 2, date: "2026-08-13" },
  { id: "pv2", park: "MANYARA", durationDays: 1, date: "2026-08-15" },
  { id: "pv3", park: "NGORONGORO", durationDays: 2, date: "2026-08-16" },
  { id: "pv4", park: "SERENGETI", durationDays: 4, date: "2026-08-17" },
]

export const COSTS: CostLine[] = [
  // Accommodation (VATable)
  {
    id: "c1",
    label: "Legendary Lodge — 1 nt × 4 pax (BB)",
    category: "Accommodation",
    netRate: 260,
    unit: "perPersonPerNight",
    qty: 4,
    vatable: true,
    source: "operator rate sheet · 2026 dry season",
  },
  {
    id: "c2",
    label: "Lemala Mpingo Ridge — 2 nts × 4 pax (FI)",
    category: "Accommodation",
    netRate: 720,
    unit: "perPersonPerNight",
    qty: 8,
    vatable: true,
  },
  {
    id: "c3",
    label: "Lake Manyara Tree Lodge — 1 nt × 4 pax (FI)",
    category: "Accommodation",
    netRate: 620,
    unit: "perPersonPerNight",
    qty: 4,
    vatable: true,
  },
  {
    id: "c4",
    label: "Lemala Ngorongoro — 1 nt × 4 pax (FI)",
    category: "Accommodation",
    netRate: 980,
    unit: "perPersonPerNight",
    qty: 4,
    vatable: true,
  },
  {
    id: "c5",
    label: "Sanctuary Kichakani — 3 nts × 4 pax (FI)",
    category: "Accommodation",
    netRate: 850,
    unit: "perPersonPerNight",
    qty: 12,
    vatable: true,
  },
  {
    id: "c6",
    label: "Sayari Camp — 1 nt × 4 pax (FI)",
    category: "Accommodation",
    netRate: 1100,
    unit: "perPersonPerNight",
    qty: 4,
    vatable: true,
  },
  {
    id: "c7",
    label: "Family-room override surcharge (Ngorongoro)",
    category: "Accommodation",
    netRate: 180,
    unit: "flat",
    qty: 1,
    vatable: true,
    notes: "Two interconnecting twins replace family room.",
  },

  // Vehicle / guide / fuel
  {
    id: "c8",
    label: "Game-drive 4×4 — 8 days",
    category: "Vehicle",
    netRate: 250,
    unit: "perVehiclePerDay",
    qty: 8,
    vatable: true,
  },
  {
    id: "c9",
    label: "Senior driver-guide — 8 days",
    category: "Guide",
    netRate: 80,
    unit: "perVehiclePerDay",
    qty: 8,
    vatable: true,
  },
  {
    id: "c10",
    label: "Fuel — Northern Circuit",
    category: "Fuel",
    netRate: 620,
    unit: "flat",
    qty: 1,
    // Tanzania fuel is non-VATable.
    vatable: false,
    notes: "Locked at non-VAT per operator policy.",
  },

  // Transfers
  {
    id: "c11",
    label: "JRO arrival transfer",
    category: "Transfers",
    netRate: 180,
    unit: "flat",
    qty: 1,
    vatable: true,
  },
  {
    id: "c12",
    label: "Charter Seronera → Kogatende → JRO (4 seats × 2 legs)",
    category: "Transfers",
    netRate: 480,
    unit: "perPersonPerDay",
    qty: 8,
    vatable: true,
  },

  // Activities
  {
    id: "c13",
    label: "Hot-air balloon over Lamai × 4",
    category: "Activities",
    netRate: 620,
    unit: "perPersonPerDay",
    qty: 4,
    vatable: true,
  },

  // Park-related fixed fees that aren't per-guest entry
  {
    id: "c14",
    label: "Ngorongoro Crater service fee (per vehicle descent)",
    category: "ParkFees",
    netRate: 295,
    unit: "perVehicleEntry",
    qty: 1,
    vatable: false,
  },
]

export const QUOTE: Quote = {
  id: "Q-2841",
  reference: "HEND-TZ-CLASSIC-09",
  client: "Henderson Family",
  origin: "London, UK",
  status: "Draft v3",
  validUntil: "2026-05-21",
  agent: { name: "Sarah Müller", initials: "SM", desk: "Europe" },
  operator: { name: "Tamarind Safaris", region: "Tanzania" },
  travel: {
    start: "2026-08-12",
    end: "2026-08-21",
    nights: 9,
    pax: 4,
  },
  currency: "USD",
  fx: { base: "USD", quoted: "USD", rate: 1, asOf: "2026-05-07 09:14 UTC" },
  guests: GUESTS,
  rooms: ROOMS,
  itinerary: ITINERARY,
  parkVisits: PARK_VISITS,
  costs: COSTS,
  marginPct: 0.22,
}

// Engine output. UI components read this rather than performing math.
export const TOTALS = quoteTotals(QUOTE)

// Back-compat alias for components written before the engine landed.
export const PRICING_TOTALS = {
  totalCost: TOTALS.netCost + TOTALS.vat,
  totalSell: TOTALS.totalSell,
  margin: TOTALS.margin,
  marginPct: TOTALS.marginPct,
  perPax: TOTALS.perPax,
  perNight: TOTALS.perNight,
  netCost: TOTALS.netCost,
  vat: TOTALS.vat,
  vatBreakdown: TOTALS.vatBreakdown,
  warnings: TOTALS.warnings,
  confidence: TOTALS.confidence,
}

// ── Right-panel content ───────────────────────────────────────────────────

export type IntelligenceInsight = {
  id: string
  kind: "rate" | "availability" | "fx" | "policy" | "operator"
  title: string
  detail: string
  signal: "positive" | "negative" | "neutral"
}

export const INSIGHTS: IntelligenceInsight[] = [
  {
    id: "i1",
    kind: "policy",
    title: "Priya Henderson — EA Resident pricing applied",
    detail:
      "Indian passport, Kenya work permit on file. Operator confirmed EA Resident category — saves $477 in park fees vs International.",
    signal: "positive",
  },
  {
    id: "i2",
    kind: "availability",
    title: "Sayari Camp — 2 tents on hold",
    detail:
      "Provisional hold expires Friday 09:00. Auto-release will trigger unless deposit confirmed.",
    signal: "negative",
  },
  {
    id: "i3",
    kind: "operator",
    title: "Lemala Ngorongoro — family room unavailable",
    detail:
      "Camp confirmed two interconnecting twins at child rate. Operator override recorded; +$180 surcharge.",
    signal: "neutral",
  },
  {
    id: "i4",
    kind: "policy",
    title: "Fuel locked at non-VAT",
    detail:
      "Tanzania VAT does not apply to fuel. Engine has it set non-VATable; flagged green by validator.",
    signal: "positive",
  },
  {
    id: "i5",
    kind: "fx",
    title: "USD/TZS stable",
    detail:
      "Quote currency is USD; FX moved 0.4% in 14 days. No re-pricing recommended.",
    signal: "positive",
  },
]

export type ProposedAction = {
  id: string
  title: string
  rationale: string
  category: "Substitution" | "Bundle" | "Discount" | "Calculation" | "Risk"
  impact: { direction: "save" | "add" | "neutral"; amount: number }
  confidence: number
  affects: string[]
  status: "pending" | "approved" | "declined"
}

export const PROPOSED_ACTIONS: ProposedAction[] = [
  {
    id: "a1",
    title: "Swap Sanctuary Kichakani → Namiri Plains (nights 6–8)",
    rationale:
      "Same Ultra tier, deeper into the central Serengeti, big-cat focus matches the family's photo brief. Net rate is $640 lower for the same room class.",
    category: "Substitution",
    impact: { direction: "save", amount: 640 },
    confidence: 0.82,
    affects: ["Itinerary D6–D8", "Pricing −$640", "Rooming unchanged"],
    status: "pending",
  },
  {
    id: "a2",
    title: "Bundle Coastal charters as single ticketed segment",
    rationale:
      "LKY → SEU → KTD → JRO across one PNR cuts handling fees and unlocks one luggage upgrade per pax. Net cost −$210; sell unchanged.",
    category: "Bundle",
    impact: { direction: "save", amount: 210 },
    confidence: 0.74,
    affects: ["Pricing − cost only", "Margin +0.5pp"],
    status: "pending",
  },
  {
    id: "a3",
    title: "Apply early-confirmation discount (8%)",
    rationale:
      "Confirming Lemala Mpingo Ridge and Sayari more than 90 days before arrival qualifies for the operator's early-bird tier. Action requires 30% deposit by 2026-05-14.",
    category: "Discount",
    impact: { direction: "save", amount: 1538 },
    confidence: 0.92,
    affects: ["Accommodation −$1,538", "Deposit deadline 2026-05-14"],
    status: "pending",
  },
  {
    id: "a4",
    title: "Re-run park fees with Theo's child band",
    rationale:
      "Validator flagged Theo (11) as Child band at all parks — already correct in current totals. This re-runs the engine to refresh the breakdown with explanatory rows for the proposal PDF.",
    category: "Calculation",
    impact: { direction: "neutral", amount: 0 },
    confidence: 0.99,
    affects: ["Park Fees breakdown", "No price change"],
    status: "pending",
  },
]

export type VersionEntry = {
  id: string
  label: string
  author: string
  authoredAt: string
  delta: number
  note: string
}

export const VERSIONS: VersionEntry[] = [
  {
    id: "v3",
    label: "v3 · current",
    author: "Sarah Müller",
    authoredAt: "12 min ago",
    delta: -640,
    note: "Replaced Lemala Kuria Hills with Sayari for Lamai night, operator override applied.",
  },
  {
    id: "v2",
    label: "v2",
    author: "Sarah Müller",
    authoredAt: "yesterday",
    delta: 1240,
    note: "Upgraded Mpingo Ridge from standard to ridge-view tent.",
  },
  {
    id: "v1",
    label: "v1 · sent",
    author: "Aisha O.",
    authoredAt: "3 days ago",
    delta: 0,
    note: "Initial Tanzania classic itinerary shared with client.",
  },
]
