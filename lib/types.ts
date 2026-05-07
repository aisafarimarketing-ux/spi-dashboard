// SPI domain types. Pricing math lives in lib/pricing-engine.ts and
// supplier/jurisdiction constants in lib/rules.ts. UI components import
// from here only — they do not perform price math.

export type Nationality =
  | "Tanzanian"
  | "Kenyan"
  | "Ugandan"
  | "Rwandan"
  | "British"
  | "American"
  | "German"
  | "French"
  | "Indian"
  | "South African"
  | "Other"

export type PricingCategory =
  | "Local" // Tanzanian citizen
  | "EastAfricanResident" // EA citizen or resident with permit
  | "International"

export type GuestType = "Adult" | "Child" | "Infant"

export interface Guest {
  id: string
  name: string
  type: GuestType
  /** Required for Child and Infant. Optional for Adult (most camps don't ask). */
  age?: number
  nationality: Nationality
  /** Operator-confirmed pricing category. The engine can suggest one but never silently changes it. */
  pricingCategory: PricingCategory
  pricingCategorySource: "suggested" | "operator-confirmed" | "operator-override"
  passport?: string
  /** Optional residency / work-permit reference for EA resident pricing. */
  residencyDoc?: string
  dietary?: string
  notes?: string
}

export type SleepingArrangement =
  | "Single"
  | "Double"
  | "Twin"
  | "Triple"
  | "Quad"
  | "FamilyRoom"
  | "Interconnecting"
  | "TwoRoomsReplacingFamily"
  | "ExtraBed"
  | "ChildSharing"
  | "CustomCampApproved"

export type Confidence = "high" | "medium" | "low"

export type RoomingPolicySource =
  | "camp-policy"
  | "operator-override"
  | "negotiated"
  | "ai-suggested"

export interface RoomAssignment {
  id: string
  arrangement: SleepingArrangement
  /** Guest ids in the order they sleep here. */
  occupants: string[]
  policy: {
    source: RoomingPolicySource
    confidence: Confidence
    note?: string
  }
  /** Net price impact of this arrangement vs the rack/baseline arrangement, in USD. */
  priceImpact: {
    direction: "save" | "add" | "neutral"
    amountUSD: number
  }
  notes?: string
}

export type ParkCode =
  | "ARUSHA"
  | "TARANGIRE"
  | "MANYARA"
  | "NGORONGORO"
  | "SERENGETI"
  | "ZANZIBAR" // not a park; carries its own infrastructure tax

export interface ParkVisit {
  id: string
  park: ParkCode
  /** Inclusive number of 24h periods the entry fee applies for. */
  durationDays: number
  date: string // YYYY-MM-DD
  /** Optional override list — defaults to all guests. */
  guestIds?: string[]
}

export type CostCategory =
  | "Accommodation"
  | "ParkFees"
  | "ConcessionFees"
  | "Vehicle"
  | "Guide"
  | "Fuel"
  | "Transfers"
  | "Activities"
  | "Other"

export type CostUnit =
  | "perPersonPerNight"
  | "perPersonPerDay"
  | "perRoomPerNight"
  | "perVehiclePerDay"
  | "perVehicleEntry"
  | "flat"

export interface CostLine {
  id: string
  label: string
  category: CostCategory
  /** Net supplier rate before margin and VAT. */
  netRate: number
  unit: CostUnit
  /** Multiplier — nights, days, pax, vehicles, rooms — depending on unit. */
  qty: number
  /** Whether VAT applies to this line. Defaults set in lib/rules.ts. Operator can override. */
  vatable: boolean
  /** Free-text source/citation, for confidence reporting. */
  source?: string
  /** Optional guest scoping — empty/undefined means "applies to whole party". */
  appliesToGuestIds?: string[]
  notes?: string
}

export type Region =
  | "Arusha"
  | "Tarangire"
  | "Lake Manyara"
  | "Ngorongoro"
  | "Serengeti"
  | "Zanzibar"
  | "Transit"

export interface ItineraryDay {
  day: number
  date: string // YYYY-MM-DD
  title: string
  region: Region
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

export interface QuoteFx {
  base: string
  quoted: string
  rate: number
  asOf: string
}

export interface Quote {
  id: string
  reference: string
  client: string
  origin: string
  status: string
  validUntil: string
  agent: { name: string; initials: string; desk: string }
  operator: { name: string; region: string }
  travel: {
    start: string
    end: string
    nights: number
    pax: number
  }
  currency: "USD"
  fx: QuoteFx
  guests: Guest[]
  rooms: RoomAssignment[]
  itinerary: ItineraryDay[]
  parkVisits: ParkVisit[]
  costs: CostLine[]
  /** Margin as a decimal — 0.20 means margin is 20% of total sell. */
  marginPct: number
}

export type WarningLevel = "info" | "warning" | "error"
export type WarningScope = "guests" | "rooming" | "costs" | "parks" | "fx" | "policy"

export interface QuoteWarning {
  id: string
  level: WarningLevel
  scope: WarningScope
  message: string
}

export interface QuoteTotals {
  /** Sum of net supplier costs (before VAT and margin). */
  netCost: number
  /** Sum of VAT across VATable lines. Computed line-by-line — never as totalNetCost × VAT. */
  vat: number
  /** Margin in USD. */
  margin: number
  /** Effective margin pct realised (margin / totalSell). */
  marginPct: number
  /** Final price quoted to the client. */
  totalSell: number
  perPax: number
  perNight: number
  vatBreakdown: { vatable: number; nonVatable: number }
  warnings: QuoteWarning[]
  /** Overall confidence in the priced quote, 0..1. */
  confidence: number
}
