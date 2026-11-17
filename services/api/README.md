# Tokea API — backend foundation (M4)

Native-app backend scaffold. The existing Lovable/Vercel frontend is **design reference only** and is not the target native app.

## Planned production flow

1. A real OTP/age-assurance service issues a verifiable user identity; API validates its access JWT against configured JWKS, issuer and audience.
2. Authenticated verified adults create/request sessions. Only the host may decide a pending request.
3. Acceptance/decline happens **in a PostgreSQL transaction** under a session row lock (prevents simultaneous overbooking).
4. The decision creates a persistent recipient inbox record and per-device push delivery rows **in the same transaction**.
5. Worker dispatches to opted-in Expo device tokens; user sees OS notification when permissions/platform delivery allow, and the saved in-app notification is available even with notifications disabled.
6. App opens an allowlisted route when user taps a notification; no exact user location or private message content is placed in push payloads.

## Setup

Requires Node 22+, PostgreSQL 16+ and a trusted JWT provider.

```bash
cd services/api
bun install
bun scripts/migrate.mjs
bun run typecheck && bun run build && bun run test
bun run dev
```

Copy `.env.example` to a locally controlled secrets environment. API intentionally fails closed when JWT configuration or database credentials are absent.

### Important current limitations
- User identity/OTP and **real age assurance are not integrated**; there is no public signup or fake production authentication.
- Migration is a foundation, not yet applied to a live database.
- Expo project ID, APNs and FCM credentials, real device tokens and push access token are not provisioned.
- Push receipts, failure telemetry, rate limits, support/report moderation and device end-to-end verification remain pending.
- APIs are **not deployed** and native app is **not ready for production**.
- This server is independent of Supabase; database must be a managed PostgreSQL instance selected for deployment.

## Transaction integration test

GitHub Actions starts an isolated PostgreSQL 17 container, applies `db/0001_initial.sql`, and exercises concurrent approvals. The test asserts that only one of two competing requests can fill the last seat, then verifies accepted/declined inbox messages, push-delivery queue records and read state. This is integration coverage **without** real Expo/APNs/FCM delivery.
