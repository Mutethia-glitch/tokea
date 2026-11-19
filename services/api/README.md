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

See [notification requirements](../../docs/notifications.md) for the full event matrix and production delivery checklist.

## M5 native-session endpoints (local development only)

All `/v1/*` routes require a real, signature-verified JWT matching `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_JWKS_URL`, an active account, and an actual `age_verified_at` value. The service contains **no demo-login bypass**.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/v1/sessions?category=Muratina` | List open, non-blocked sessions and remaining seats |
| POST | `/v1/sessions` | Create a session, 1–15 guest seats, approved drink and approximate neighbourhood |
| GET | `/v1/sessions/:id` | Session details; server supplies `isHost` |
| POST | `/v1/sessions/:id/requests` | Ask to join; notify host and queue opted-in device pushes |
| GET | `/v1/requests` | Incoming host requests and user's sent requests |
| PATCH | `/v1/requests/:id/cancel` | Cancel your own pending request |
| POST | `/v1/sessions/:id/requests/:id/decision` | Host-only accept/decline; applicant inbox event and push queue |
| GET/POST | `/v1/sessions/:id/messages` | Member-only history and messages; generic new-message alerts |
| GET | `/v1/notifications` | Durable account inbox |

All capacity-changing operations lock the session row transactionally. Messages and notifications are stored in PostgreSQL. **No live realtime sockets, login service, remote push validation or production hosting are configured.**

### Local PostgreSQL option

`docker compose -f services/api/compose.local.yml up -d` starts a developer-only PostgreSQL service bound to **127.0.0.1**. Copy the example environment to your own untracked file; do not paste credentials into chat or commit them.

To run migrations and tests, set `DATABASE_URL` in your local shell, then execute `cd services/api && bun install && bun scripts/migrate.mjs && bun run test`. Running the HTTP API additionally requires a configured real JWT provider. GitHub Actions can test the data layer without this provider using isolated temporary accounts and containers.

## Independent local photo-expiry cleanup

Identity uploads are **disabled by default**. For test-only encrypted files, a separate one-shot job can run even if the HTTP server has stopped:

```powershell
cd C:\Users\promi\tokea\services\api
bun run cleanup:verification
```

When enabled with approved, private environment variables and a working local PostgreSQL connection, it expires documents, deletes completed/obsolete encrypted images, scans orphan files, and reports failed/overdue deletion jobs. Schedule the script independently of the API using your operating system's task scheduler, and monitor failures before enabling any real document collection. A PC that is shut down or sleeping cannot uphold a strict 24-hour deadline; production requires an always-on independently monitored cleanup process.
