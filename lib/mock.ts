// Mock domain data for the SPI cockpit. Not for production.

export type Nationality =
  | "Resident"
  | "East African"
  | "Non-Resident"

export type Guest = {
  id: string
  name: string
  age: number
  nationality: Nationality
  passport?: string
  dietary?: string
}

export type Room = {
  id: string
  type: "King" | "Twin" | "Family" | "Triple"
  occupants: string[] // Guest ids
  notes?: string
}

export type ItineraryDay = {
  day: number
  date: string // YYYY-MM-DD
  title: string
  region: "Nairobi" | "Maasai Mara" | "Serengeti" | "Ngorongoro" | "Transit"
  property?: {
    name: string
    category: "Camp" | "Lodge" | "Hotel" | "Mobile"
    tier: "Premium" | "Luxury" | "Ultra"
  }
  stay?: {
    nights: number
    boardBasis: "FB" | "FI" | "BB" | "HB"
  }
  movement?: {
    mode: "Flight" | "Road" | "Charter"
    from: string
    to: string
    operator: string
  }
  activities: string[]
}

export type PriceLine = {
  id: string
  label: string
  category:
    | "Accommodation"
    | "Park Fees"
    | "Conservancy"
    | "Transfers"
    | "Flights"
    | "Activities"
    | "Other"
  cost: number
  sell: number
  currency: "USD"
  appliesToNights?: number[]
}

export type ProposedAction = {
  id: string
  title: string
  rationale: string
  category: "Substitution" | "Bundle" | "Discount" | "Calculation" | "Risk"
  impact: { direction: "save" | "add" | "neutral"; amount: number }
  confidence: number // 0..1
  affects: string[] // human readable scope tags
  status: "pending" | "approved" | "declined"
}

export type IntelligenceInsight = {
  id: string
  kind: "rate" | "availability" | "fx" | "policy" | "operator"
  title: string
  detail: string
  signal: "positive" | "negative" | "neutral"
}

export type VersionEntry = {
  id: string
  label: string
  author: string
  authoredAt: string // relative
  delta: number // +/- USD vs previous
  note: string
}

export const QUOTE = {
  id: "Q-2841",
  reference: "HEND-MARA-SER-09",
  client: "Henderson Family",
  origin: "London, UK",
  status: "Draft v3" as const,
  validUntil: "2026-05-21",
  agent: { name: "Sarah Müller", initials: "SM", desk: "Europe" },
  operator: { name: "Tamarind Safaris", region: "EA" },
  travel: {
    start: "2026-08-12",
    end: "2026-08-21",
    nights: 9,
    pax: 4,
  },
  currency: "USD" as const,
  fx: { base: "USD", quoted: "USD", rate: 1, asOf: "2026-05-07 09:14 UTC" },
}

export const GUESTS: Guest[] = [
  { id: "g1", name: "James Henderson", age: 47, nationality: "Non-Resident", passport: "GBR" },
  { id: "g2", name: "Priya Henderson", age: 44, nationality: "Non-Resident", passport: "GBR", dietary: "Pescatarian" },
  { id: "g3", name: "Ayla Henderson", age: 14, nationality: "Non-Resident", passport: "GBR" },
  { id: "g4", name: "Theo Henderson", age: 11, nationality: "Non-Resident", passport: "GBR" },
]

export const ROOMS: Room[] = [
  { id: "r1", type: "King", occupants: ["g1", "g2"], notes: "Honeymoon-style turn-down" },
  { id: "r2", type: "Twin", occupants: ["g3", "g4"], notes: "Connecting requested" },
]

export const ITINERARY: ItineraryDay[] = [
  {
    day: 1,
    date: "2026-08-12",
    title: "Arrive Nairobi",
    region: "Nairobi",
    property: { name: "Hemingways Nairobi", category: "Hotel", tier: "Luxury" },
    stay: { nights: 1, boardBasis: "BB" },
    activities: ["Airport meet & greet", "Briefing pack delivered to room"],
  },
  {
    day: 2,
    date: "2026-08-13",
    title: "Wilson → Maasai Mara",
    region: "Maasai Mara",
    movement: { mode: "Flight", from: "Wilson (WIL)", to: "Olare Motorogi (OLA)", operator: "Safarilink" },
    property: { name: "Mara Plains Camp", category: "Camp", tier: "Ultra" },
    stay: { nights: 2, boardBasis: "FI" },
    activities: ["Afternoon game drive", "Sundowner — Topi Plains"],
  },
  {
    day: 4,
    date: "2026-08-15",
    title: "Mara — Migration crossings",
    region: "Maasai Mara",
    property: { name: "Angama Mara", category: "Lodge", tier: "Ultra" },
    stay: { nights: 2, boardBasis: "FI" },
    activities: ["Mara River crossings", "Hot-air balloon (optional)", "Maasai village visit"],
  },
  {
    day: 6,
    date: "2026-08-17",
    title: "Mara → Serengeti",
    region: "Serengeti",
    movement: { mode: "Charter", from: "OLA", to: "Kogatende (KTD)", operator: "Coastal Aviation" },
    property: { name: "Lemala Kuria Hills", category: "Lodge", tier: "Luxury" },
    stay: { nights: 2, boardBasis: "FI" },
    activities: ["North Serengeti drive", "Kogatende river crossings"],
  },
  {
    day: 8,
    date: "2026-08-19",
    title: "Lamai Wedge",
    region: "Serengeti",
    property: { name: "Sayari Camp", category: "Camp", tier: "Ultra" },
    stay: { nights: 1, boardBasis: "FI" },
    activities: ["Walking safari with armed ranger", "Bush breakfast"],
  },
  {
    day: 9,
    date: "2026-08-20",
    title: "Depart Kilimanjaro",
    region: "Transit",
    movement: { mode: "Flight", from: "KTD", to: "JRO", operator: "Coastal Aviation" },
    activities: ["Day-room at JRO Lounge", "International departure"],
  },
]

export const PRICING: PriceLine[] = [
  { id: "p1", label: "Hemingways Nairobi — 1 night", category: "Accommodation", cost: 720, sell: 880, currency: "USD" },
  { id: "p2", label: "Mara Plains Camp — 2 nights", category: "Accommodation", cost: 7600, sell: 9120, currency: "USD" },
  { id: "p3", label: "Angama Mara — 2 nights", category: "Accommodation", cost: 8400, sell: 10080, currency: "USD" },
  { id: "p4", label: "Lemala Kuria Hills — 2 nights", category: "Accommodation", cost: 5800, sell: 6960, currency: "USD" },
  { id: "p5", label: "Sayari Camp — 1 night", category: "Accommodation", cost: 3450, sell: 4140, currency: "USD" },
  { id: "p6", label: "Mara Conservancy fees", category: "Conservancy", cost: 960, sell: 960, currency: "USD" },
  { id: "p7", label: "Serengeti park fees", category: "Park Fees", cost: 1240, sell: 1240, currency: "USD" },
  { id: "p8", label: "Intra-park transfers", category: "Transfers", cost: 480, sell: 620, currency: "USD" },
  { id: "p9", label: "Safarilink + Coastal flights", category: "Flights", cost: 2880, sell: 3360, currency: "USD" },
  { id: "p10", label: "Hot-air balloon × 4", category: "Activities", cost: 1480, sell: 1840, currency: "USD" },
]

export const INSIGHTS: IntelligenceInsight[] = [
  {
    id: "i1",
    kind: "rate",
    title: "Angama Mara — peak surcharge active",
    detail: "August 12–21 falls inside high migration season. Rack +18% vs shoulder. No discount levers expected.",
    signal: "neutral",
  },
  {
    id: "i2",
    kind: "availability",
    title: "Sayari Camp — 2 tents held",
    detail: "Provisional hold expires in 36h. Auto-release will trigger Friday 09:00 unless confirmed.",
    signal: "negative",
  },
  {
    id: "i3",
    kind: "operator",
    title: "Lemala Kuria Hills — 7-night promo",
    detail: "Stay 7, pay 6 active for August. Quote currently sits at 2 nights — promo not applicable.",
    signal: "neutral",
  },
  {
    id: "i4",
    kind: "policy",
    title: "Non-resident park fees — children",
    detail: "Theo (11) qualifies for child rate at Serengeti. Saving applied automatically: −$120.",
    signal: "positive",
  },
  {
    id: "i5",
    kind: "fx",
    title: "USD/KES stable",
    detail: "FX moved 0.4% against the quote currency in the last 14 days. No re-pricing recommended.",
    signal: "positive",
  },
]

export const PROPOSED_ACTIONS: ProposedAction[] = [
  {
    id: "a1",
    title: "Swap Lemala Kuria Hills → Lamai Serengeti (nights 6–7)",
    rationale:
      "Same operator tier, closer to Kogatende crossings (current focus of migration), and net rate is $640 lower for the same room class. Sarah has previously preferred Lamai for August north-Serengeti programs.",
    category: "Substitution",
    impact: { direction: "save", amount: 640 },
    confidence: 0.86,
    affects: ["Itinerary D6–D7", "Pricing −$640", "Rooming unchanged"],
    status: "pending",
  },
  {
    id: "a2",
    title: "Bundle Safarilink + Coastal as single ticketed segment",
    rationale:
      "Both legs share PNR-eligible operators. Bundling cuts handling fee and unlocks $1 luggage upgrade per pax. Net effect: −$210 on cost, −$0 on sell — margin moves from 22.4% → 23.5%.",
    category: "Bundle",
    impact: { direction: "save", amount: 210 },
    confidence: 0.74,
    affects: ["Pricing − cost only", "Margin +1.1pp"],
    status: "pending",
  },
  {
    id: "a3",
    title: "Apply early-confirmation discount (8%)",
    rationale:
      "Confirming Mara Plains and Angama Mara more than 90 days before arrival qualifies for the operator's early-bird tier. Action requires deposit of 30% by 2026-05-14.",
    category: "Discount",
    impact: { direction: "save", amount: 1538 },
    confidence: 0.92,
    affects: ["Accommodation −$1,538", "Deposit deadline 2026-05-14"],
    status: "pending",
  },
  {
    id: "a4",
    title: "Recompute park fees with mixed-age rule",
    rationale:
      "Current line uses adult rates flat. Re-running the deterministic fee engine with Theo's (11) child band reduces Serengeti fees by $120 and adds a $0 conservancy line for clarity.",
    category: "Calculation",
    impact: { direction: "save", amount: 120 },
    confidence: 0.99,
    affects: ["Park Fees −$120", "Adds explanatory line"],
    status: "pending",
  },
]

export const VERSIONS: VersionEntry[] = [
  {
    id: "v3",
    label: "v3 · current",
    author: "Sarah Müller",
    authoredAt: "12 min ago",
    delta: -640,
    note: "Replaced Naboisho leg with Angama Mara per client photo brief.",
  },
  {
    id: "v2",
    label: "v2",
    author: "Sarah Müller",
    authoredAt: "yesterday",
    delta: 1240,
    note: "Upgraded Mara Plains from standard to riverside tent.",
  },
  {
    id: "v1",
    label: "v1 · sent",
    author: "Aisha O.",
    authoredAt: "3 days ago",
    delta: 0,
    note: "Initial quote shared with client.",
  },
]

export const PRICING_TOTALS = (() => {
  const totalCost = PRICING.reduce((s, p) => s + p.cost, 0)
  const totalSell = PRICING.reduce((s, p) => s + p.sell, 0)
  const margin = totalSell - totalCost
  const marginPct = totalSell === 0 ? 0 : (margin / totalSell) * 100
  return {
    totalCost,
    totalSell,
    margin,
    marginPct,
    perPax: totalSell / QUOTE.travel.pax,
    perNight: totalSell / QUOTE.travel.nights,
  }
})()

export const SIDEBAR_QUOTES = [
  {
    id: "Q-2841",
    title: "Henderson Family",
    sub: "Mara + Serengeti · 9 nts",
    status: "Draft v3",
    pinned: true,
    updated: "12m",
    accent: "gold" as const,
  },
  {
    id: "Q-2839",
    title: "Okonkwo + 3",
    sub: "Ngorongoro · 6 nts",
    status: "Awaiting client",
    pinned: false,
    updated: "2h",
    accent: "muted" as const,
  },
  {
    id: "Q-2837",
    title: "Voss honeymoon",
    sub: "Lamu + Mara · 11 nts",
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
    sub: "Laikipia · 4 nts",
    status: "Hold",
    pinned: false,
    updated: "3 days",
    accent: "warning" as const,
  },
  {
    id: "Q-2831",
    title: "MacGregor anniv.",
    sub: "Selous + Zanzibar · 10 nts",
    status: "Awaiting deposit",
    pinned: false,
    updated: "5 days",
    accent: "warning" as const,
  },
]
