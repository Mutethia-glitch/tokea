# Tokea

## Final product: native mobile app

**Tokea is an iOS and Android application, not a website.** The original Lovable/TanStack web app in `src/` is a **design reference and archived frontend prototype** only. Active production development happens in:

- [`apps/mobile/`](apps/mobile/) — Expo/React Native app with native notification support
- [`services/api/`](services/api/) — standalone Node.js/TypeScript API and PostgreSQL migration

Invitation accepted/declined events must create a durable in-app inbox item, and queue a native phone push for registered/opted-in devices. Production requires external OTP/age assurance, a trusted JWT issuer, deployment, FCM/APNs credentials and a real native build. See individual READMEs.


**Hosted demo:** https://tokea-demo.vercel.app (Vercel sign-in may be required; prototype only, not production). The demo deploys from the GitHub `main` branch.

Approved mobile-first social discovery web prototype for adults in Kenya, preserving the [original Lovable project design](https://lovable.dev/projects/20ff86c9-03b7-4e00-b80f-9560791ddbfb).

## Visual behavior

Discover cards use a consistent 16px vertical grid gap and 20px internal padding. Each session automatically renders a subtle banner based on its drink category. Supported drinks: Beer, Wine, Cocktails, **Muratina**, Whiskey, Vodka, Gin, Rum, Tequila, Brandy, Spirits, Coffee, Soft drinks and Tea. The Host action is inline to avoid covering mobile content. Profile pictures are resized and persisted **only in the local browser** for this demo; no upload service is enabled.

## Local development

```bash
bun install --frozen-lockfile
bun run dev
```

`bun run typecheck` validates TypeScript, `bun run build` builds the app, and `bun run test` runs automated tests. GitHub Actions runs these on pull requests. The project is an interactive frontend-only demo with seeded sessions and local browser storage — no production accounts, real OTP/age verification, GPS, real messaging service or database.

Visual reference: original `src/styles.css` tokens and shared components, Instrument Sans / Instrument Serif, 448px mobile shell, 64px header/navigation, 20px content/card padding, 12px card spacing, 44px+ tap targets.

Production architecture remains separately specified: Expo/React Native + Node.js + PostgreSQL/PostGIS, without Supabase. Kenyan privacy/alcohol law review is required before launch.

## Current local-only milestones

The M6 native workflow in `apps/mobile/app/verification.tsx` supports readable ID/selfie photo instructions, explicit consent, human-review status and browsing while pending. The API has an invite-only staff review workspace, immutable first decisions, encrypted image storage, and background deletion for replaced, expired, reviewed or orphaned photos. See [the draft privacy policy](docs/privacy-policy.md) and [local age-review guidance](docs/manual-age-verification.md).

**There is no app/backend deployment in these branches.** Real ID collection remains disabled pending a verified identity provider, secure staff accounts, a configured mail service, dependable photo-deletion monitoring and Kenyan privacy/legal assessment. Existing browser prototype files are kept **as a design reference**, not imported by the native app or API.
