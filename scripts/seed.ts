// Database seed.
//
// Idempotent — safe to run multiple times. Each entity uses upsert keyed on
// a stable identifier (Clerk org id, Clerk user id) so the seed never
// duplicates rows and works against both an empty DB and an existing one.
//
// Usage: `npm run db:seed`
// Requires: DATABASE_URL set; migrations applied (`npm run db:migrate`).
//
// Seeds added unit by unit:
//   - 1.2  Tamarind Safaris operator + Sarah Müller user
//   - 1.3  Henderson quote root row
//   - 1.4  Henderson guests, rooms, itinerary, costs, park visits
//   - 1.5  Initial version + activity entries
//   - 1.6  ~50 property catalog entries

import { db } from "../lib/db"

// Stable Clerk-shaped placeholder ids for seed rows. Real Clerk ids will
// replace these once auth is wired up; until then these let the seed run
// without depending on a Clerk session.
const SEED_CLERK_ORG_ID = "org_seed_tamarind"
const SEED_CLERK_USER_ID = "user_seed_sarah"

async function main() {
  console.log("[seed] starting…")

  const operator = await db.operator.upsert({
    where: { clerkOrgId: SEED_CLERK_ORG_ID },
    create: {
      clerkOrgId: SEED_CLERK_ORG_ID,
      name: "Tamarind Safaris",
      slug: "tamarind",
      region: "Tanzania",
    },
    update: {
      name: "Tamarind Safaris",
      region: "Tanzania",
    },
  })
  console.log(`[seed] operator: ${operator.name} (${operator.id})`)

  const user = await db.user.upsert({
    where: { clerkUserId: SEED_CLERK_USER_ID },
    create: {
      clerkUserId: SEED_CLERK_USER_ID,
      name: "Sarah Müller",
      email: "sarah@tamarindsafaris.com",
      role: "senior",
      operatorId: operator.id,
    },
    update: {
      name: "Sarah Müller",
      email: "sarah@tamarindsafaris.com",
      role: "senior",
      operatorId: operator.id,
    },
  })
  console.log(`[seed] user: ${user.name} (${user.id}) · ${user.role}`)

  console.log("[seed] done.")
}

main()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error("[seed] FAILED:", err)
    await db.$disconnect().catch(() => {})
    process.exit(1)
  })
