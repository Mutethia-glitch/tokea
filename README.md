# Tokea

**Hosted demo:** https://tokea-demo.vercel.app (Vercel sign-in may be required; prototype only, not production). The demo deploys from the GitHub `main` branch.

Approved mobile-first social discovery web prototype for adults in Kenya, preserving the [original Lovable project design](https://lovable.dev/projects/20ff86c9-03b7-4e00-b80f-9560791ddbfb).

## Local development

```bash
bun install --frozen-lockfile
bun run dev
```

`bun run typecheck` validates TypeScript, `bun run build` builds the app, and `bun run test` runs automated tests. GitHub Actions runs these on pull requests. The project is an interactive frontend-only demo with seeded sessions and local browser storage — no production accounts, real OTP/age verification, GPS, real messaging service or database.

Visual reference: original `src/styles.css` tokens and shared components, Instrument Sans / Instrument Serif, 448px mobile shell, 64px header/navigation, 20px content/card padding, 12px card spacing, 44px+ tap targets.

Production architecture remains separately specified: Expo/React Native + Node.js + PostgreSQL/PostGIS, without Supabase. Kenyan privacy/alcohol law review is required before launch.
