// Prisma 7 top-level config. Replaces the `url = env(...)` line that used
// to live in `prisma/schema.prisma`. The migrations CLI reads DATABASE_URL
// from this config; the runtime client (lib/db.ts) builds its own driver
// adapter from the same env var.
//
// We read process.env directly (not Prisma's `env()` helper) because `env()`
// throws at config-load time — that breaks `prisma generate` for any
// developer who hasn't set DATABASE_URL yet. The placeholder lets generate
// run; real commands like `prisma migrate dev` will fail explicitly when
// they try to connect.

import { defineConfig } from "prisma/config"

const PLACEHOLDER = "postgresql://placeholder:placeholder@localhost:5432/placeholder"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER,
  },
})
