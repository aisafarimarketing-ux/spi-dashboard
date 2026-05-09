// Prisma client singleton.
//
// Next.js dev-mode hot reload would otherwise create a new PrismaClient on
// every reload, exhausting Postgres connections. Pin one instance to a
// global so the same client survives reloads.
//
// Prisma 7 uses driver adapters at runtime — we pass an adapter built from
// DATABASE_URL into the client constructor. Same env var that the migrations
// CLI consumes via prisma.config.ts.

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined
}

function buildClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add the Railway Postgres connection string."
    )
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })
}

export const db: PrismaClient = global.__prismaClient ?? buildClient()

if (process.env.NODE_ENV !== "production") {
  global.__prismaClient = db
}
