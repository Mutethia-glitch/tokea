# Tokea — native Android & iOS app

Tokea is an **18+ Kenyan social discovery application for iOS and Android**. It helps people discover nearby casual drink meet-ups in public places. Tokea is not a dating app, alcohol marketplace, payment processor or website.

**The design checked into this GitHub repository is the source of truth.** Build new native screens with the existing app's styling in apps/mobile/src/theme.ts, apps/mobile/src/ui.tsx and the approved native screen code. Do not replace it with Lovable output. The historical root web/React prototype remains archived for development context only; it is **not** the product or an approved public website. The protected Vercel URL, if retained, is only an internal legacy demo and must not be presented as the customer app.

## Active implementation

- [apps/mobile](apps/mobile) — Expo / React Native / Expo Router, Android and iOS native application
- [services/api](services/api) — separate secure Node.js TypeScript API and PostgreSQL schema, no Supabase
- [PROGRESS.md](PROGRESS.md) — factual milestone status and test evidence; update in each substantive change
- [docs/account-setup.md](docs/account-setup.md) — owner-operated provider provisioning, business email and credentials checklist
- [docs/notifications.md](docs/notifications.md) — in-app and OS push notification design and verification checklist

## M5: connecting real Discover

The API has an authenticated **GET /v1/sessions** read endpoint exposing only safe public session fields, excluding blocked users and full sessions except for approved participants/hosts. The native Discover view fetches this data, filters drink categories and gives an accurate unauthenticated/unconfigured state. Hosting/join submissions, onboarding, chats, moderation and other production services are **not yet available**.

Real usage requires trusted JWT-based authentication and independently verified age (18+), a deployed PostgreSQL database and API, plus the selected SMS/identity provider. Native push requires Expo EAS and FCM/APNs configuration and physical-device testing.

## Copyright

© 2026 Tokea. All rights reserved. The notice applies only to Tokea-owned original material; third-party dependencies and trademarks retain their own rights. Naming/trademark clearance is still pending.

## Legacy web prototype (development only)

The root src/ and Vite/TanStack project are legacy/internal code and CI regression coverage. They are not an intended customer-facing website or the design authority for the native product.
