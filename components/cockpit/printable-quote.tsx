"use client"

import * as React from "react"

import type { Quote, QuoteTotals } from "@/lib/types"
import { useQuote } from "./quote-provider"

/**
 * Standalone, client-facing quote document used for `window.print()`.
 *
 * Always mounted in the cockpit but `display:none` on screen — only the
 * `@media print` rules in globals.css reveal it (and hide the cockpit
 * chrome) when the operator triggers PDF export.
 *
 * The on-screen Review modal renders its own paper layout for review;
 * this component is intentionally duplicated rather than shared, because
 * the print variant has different concerns: page breaks, no interactive
 * controls, no internal-only toggle, and stricter typography.
 */
export function PrintableQuote() {
  const { quote, totals } = useQuote()

  return (
    <div className="print-only" aria-hidden>
      <PrintDocument quote={quote} totals={totals} />
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)

const formatDateLong = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const formatDateShort = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

const formatDateRange = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  const month = (d: Date) => d.toLocaleString("en-US", { month: "long" })
  return `${month(s)} ${s.getDate()} – ${month(e)} ${e.getDate()}, ${e.getFullYear()}`
}

const arrLabel: Record<string, string> = {
  Single: "Single room",
  Double: "Double room",
  Twin: "Twin room",
  Triple: "Triple room",
  Quad: "Quad room",
  FamilyRoom: "Family room",
  Interconnecting: "Interconnecting rooms",
  TwoRoomsReplacingFamily: "Two interconnecting rooms",
  ExtraBed: "Room with extra bed",
  ChildSharing: "Room with child sharing",
  CustomCampApproved: "Custom arrangement",
}

const boardLabel: Record<string, string> = {
  FB: "full board",
  FI: "fully inclusive",
  BB: "bed & breakfast",
  HB: "half board",
}

const STANDARD_EXCLUSIONS = [
  "International flights to/from Kilimanjaro (JRO)",
  "Travel and medical insurance (mandatory — proof required at check-in)",
  "Tanzania entry visa and yellow-fever certificate",
  "Premium beverages and wine pairings outside fully-inclusive plan",
  "Spa, laundry, and other personal expenses at camps",
  "Gratuities for guides, butlers, and camp staff (guideline provided separately)",
]

function deriveInclusions(quote: Quote): string[] {
  const items: string[] = []

  for (const day of quote.itinerary) {
    if (!day.property || !day.stay) continue
    items.push(
      `${day.stay.nights} night${day.stay.nights === 1 ? "" : "s"} at ${day.property.name} on ${boardLabel[day.stay.boardBasis] ?? day.stay.boardBasis}`
    )
  }

  const charters = quote.itinerary.filter((d) => d.movement?.mode === "Charter")
  if (charters.length > 0) {
    items.push(
      `${charters.length} scheduled charter flight${charters.length === 1 ? "" : "s"} (${charters[0].movement?.operator})`
    )
  }
  const transfers = quote.itinerary.filter((d) => d.movement?.mode === "Road")
  if (transfers.length > 0) {
    items.push(
      "Private road transfers between camps with operator-vetted driver-guide"
    )
  }
  if (quote.costs.some((c) => c.category === "Vehicle")) {
    items.push("Dedicated 4×4 game-drive vehicle with senior driver-guide")
  }
  if (quote.parkVisits.length > 0) {
    items.push(
      "All national park entry fees and conservation-area concession fees"
    )
  }
  const seen = new Set<string>()
  for (const d of quote.itinerary) {
    for (const a of d.activities) seen.add(a)
  }
  for (const a of Array.from(seen).slice(0, 4)) items.push(a)
  items.push("Bottled water on game drives and meet-and-greet at airport")
  return items
}

function PrintDocument({
  quote,
  totals,
}: {
  quote: Quote
  totals: QuoteTotals
}) {
  const inclusions = deriveInclusions(quote)
  const adultCount = quote.guests.filter((g) => g.type === "Adult").length
  const childCount = quote.guests.filter((g) => g.type === "Child").length
  const infantCount = quote.guests.filter((g) => g.type === "Infant").length

  const partyParts = [
    adultCount && `${adultCount} adult${adultCount === 1 ? "" : "s"}`,
    childCount && `${childCount} child${childCount === 1 ? "" : "ren"}`,
    infantCount && `${infantCount} infant${infantCount === 1 ? "" : "s"}`,
  ].filter(Boolean)

  return (
    <article className="print-paper">
      {/* Cover */}
      <header className="print-cover">
        <div className="print-eyebrow">
          {quote.operator.name} · {quote.operator.region}
        </div>
        <h1 className="print-h1">A safari for the {quote.client}</h1>
        <p className="print-lede">
          {quote.travel.nights} nights across the Northern Circuit · prepared
          for {quote.origin}
        </p>
        <dl className="print-cover-meta">
          <div>
            <dt>Dates</dt>
            <dd>{formatDateRange(quote.travel.start, quote.travel.end)}</dd>
          </div>
          <div>
            <dt>Party</dt>
            <dd>
              {quote.travel.pax} guests · {partyParts.join(" · ")}
            </dd>
          </div>
          <div>
            <dt>Begins</dt>
            <dd>{formatDateLong(quote.travel.start)}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd className="print-mono">{quote.reference}</dd>
          </div>
        </dl>
      </header>

      {/* Itinerary */}
      <section className="print-section">
        <div className="print-section-eyebrow">Your journey</div>
        <h2 className="print-h2">Day by day</h2>
        <ol className="print-itinerary">
          {quote.itinerary.map((d) => (
            <li key={d.day}>
              <div className="print-itinerary-day">
                <span className="print-day-num">{d.day}</span>
                <span className="print-day-date">{formatDateShort(d.date)}</span>
              </div>
              <div className="print-itinerary-body">
                <div className="print-itinerary-title">{d.title}</div>
                {d.property && (
                  <div className="print-itinerary-property">
                    {d.property.name} · {d.property.category}
                    {d.stay
                      ? ` · ${d.stay.nights} night${d.stay.nights === 1 ? "" : "s"}`
                      : ""}
                  </div>
                )}
                {d.activities.length > 0 && (
                  <ul className="print-activities">
                    {d.activities.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
                {d.movement && (
                  <div className="print-itinerary-move">
                    {d.movement.mode} · {d.movement.from} → {d.movement.to}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Guests */}
      <section className="print-section">
        <div className="print-section-eyebrow">Your party</div>
        <h2 className="print-h2">Travelling guests</h2>
        <ul className="print-guests">
          {quote.guests.map((g) => (
            <li key={g.id}>
              <div className="print-guest-name">{g.name}</div>
              <div className="print-guest-meta">
                {g.type}
                {g.age !== undefined ? ` · age ${g.age}` : ""} · {g.nationality}
                {g.dietary ? ` · ${g.dietary}` : ""}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Rooming */}
      <section className="print-section">
        <div className="print-section-eyebrow">Where you sleep</div>
        <h2 className="print-h2">Room arrangements</h2>
        <ul className="print-rooms">
          {quote.rooms.map((r) => {
            const occupants = r.occupants
              .map((id) => quote.guests.find((g) => g.id === id))
              .filter((g): g is NonNullable<typeof g> => Boolean(g))
            return (
              <li key={r.id}>
                <div className="print-room-arr">
                  {arrLabel[r.arrangement] ?? r.arrangement}
                </div>
                <div className="print-room-occupants">
                  {occupants.map((g) => g.name.split(" ")[0]).join(" & ")}
                </div>
                {r.notes && <div className="print-room-note">{r.notes}</div>}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Inclusions */}
      <section className="print-section print-section-tight">
        <div className="print-section-eyebrow">Your safari covers</div>
        <h2 className="print-h2">What&rsquo;s included</h2>
        <ul className="print-list-check">
          {inclusions.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </section>

      {/* Exclusions */}
      <section className="print-section print-section-tight">
        <div className="print-section-eyebrow">Please budget separately</div>
        <h2 className="print-h2">What&rsquo;s not included</h2>
        <ul className="print-list-bullet">
          {STANDARD_EXCLUSIONS.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      </section>

      {/* Total — kept on a single page near the end */}
      <section className="print-total" aria-label="Total price">
        <div className="print-total-eyebrow">Total price · all-inclusive</div>
        <div className="print-total-amount">{formatUSD(totals.totalSell)}</div>
        <div className="print-total-sub">
          {formatUSD(totals.perPax)} per guest · {formatUSD(totals.perNight)}{" "}
          per night
        </div>
        <div className="print-total-meta">
          Quoted in {quote.currency} · rate locked · valid until{" "}
          {quote.validUntil}
        </div>
      </section>

      {/* Closing */}
      <footer className="print-footer">
        <div>
          Prepared by {quote.agent.name} · {quote.agent.desk} desk
        </div>
        <div className="print-mono">
          {quote.id} · {quote.reference}
        </div>
      </footer>
    </article>
  )
}

// ─── Imperative trigger ───────────────────────────────────────────────────

/**
 * Tell the browser to print the cockpit. Print CSS in globals.css hides
 * everything except the .print-only document, so the user gets the
 * client-facing quote with the OS "Save as PDF" option.
 */
export function printQuote() {
  if (typeof window === "undefined") return
  // Defer one tick so the trigger button has time to settle into a non-active
  // state — otherwise the print snapshot can capture the click ripple.
  window.setTimeout(() => window.print(), 50)
}
