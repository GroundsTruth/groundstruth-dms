# Migrations log — GroundsTruth DMS

One line per migration (newest at the bottom). Apply via the Supabase **SQL Editor**.
Every migration must include **RLS + explicit grants** (CLAUDE.md rule 5) — this
project has "auto-expose new tables" OFF, so nothing is reachable without a grant.

**Naming:** `0001_*` is the bootstrap. From here use **timestamped** names —
`supabase/migrations/YYYYMMDDHHMMSS_<name>.sql` — so Aman & Hardik never collide on
a sequential number (see `COORDINATION.md` § Migrations). Each module migrates only
the tables it owns; core/shared tables (users, roles, auth, config, audit) are
coordinated + PR-reviewed by the other person.

| File | Tables | Applied | By | Notes |
|------|--------|---------|----|-------|
| `0001_skus.sql` | `skus` | 2026-06-25 | Aman | RLS + read policy (`authenticated`) + grants (`service_role` all, `authenticated` select) + `updated_at` trigger. Seeded 46 canonical SKUs via `scripts/seed-skus.ts`. |
