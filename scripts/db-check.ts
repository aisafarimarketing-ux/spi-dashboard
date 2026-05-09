// Smoke test for the Prisma + Railway Postgres connection.
//
// Usage: `npm run db:check` (after DATABASE_URL is set in .env.local and
// at least one migration has been applied — `npm run db:migrate`).
//
// What it does: connects, runs `SELECT 1`, prints the Prisma + Postgres
// versions. Doesn't require any models to exist yet — meant as the first
// confirmation that wiring works before we add tables.

import { db } from "../lib/db"

async function main() {
  console.log("[db-check] connecting…")

  const result = await db.$queryRawUnsafe<{ ok: number; pg: string }[]>(
    "SELECT 1 as ok, version() as pg"
  )

  if (!result?.[0] || result[0].ok !== 1) {
    throw new Error("Connection succeeded but SELECT 1 did not return 1")
  }

  const pg = result[0].pg.split("\n")[0]
  console.log("[db-check] ok ·", pg)
  console.log("[db-check] Prisma client at @prisma/client is reachable.")
}

main()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error("[db-check] FAILED:", err.message ?? err)
    if (
      typeof err.message === "string" &&
      err.message.includes("DATABASE_URL")
    ) {
      console.error(
        "[db-check] Make sure DATABASE_URL is set in .env.local — see .env.example."
      )
    }
    await db.$disconnect().catch(() => {})
    process.exit(1)
  })
