# Tokea API — backend foundation (M4)

Native-app backend scaffold. M5 adds Africa's Talking sandbox phone verification and an authenticated read-only GET /v1/sessions endpoint that filters blocked/inactive/unverified hosts, hides filled sessions unless the viewer is an approved member or host, and returns only safe display fields. API and PostgreSQL are not yet deployed. The existing Lovable/Vercel frontend is **design reference only** and is not the target native app.

## Sandbox phone verification (M5, not signup)

- `POST /v1/auth/phone/start` with JSON `{ "phone": "+2547XXXXXXXX" }` returns HTTP 202 `{ "challengeId": "...", "expiresInSeconds": 300 }`.
- `POST /v1/auth/phone/verify` with JSON `{ "challengeId": "...", "code": "123456" }` verifies **one time**, max 5 attempts, and returns `{ "phoneVerified": true, "authenticated": false, "ageVerified": false }`. This is **not a login**, session token or age proof.
- A six-digit code is generated with cryptographic randomness and is held only as an HMAC digest using `OTP_HMAC_SECRET`. The database only stores HMACs of the phone and network requester; no raw OTP or phone number is persisted.
- PostgreSQL enforces 5-minute expiry, one-minute per-number cooldown, maximum 5 codes/number/hour and 12 codes/request-source/hour; the delivery adapter sends via Africa's Talking **sandbox only**.
- Access is intentionally unauthenticated for first-contact verification. Production requires a trusted reverse-proxy IP configuration, fraud controls/CAPTCHA, account linking, a real JWT issuer, and separate age assurance before opening signup. Do not treat a verified phone response as an authenticated identity.
- Owner must set `AFRICASTALKING_ENV=sandbox`, `AFRICASTALKING_USERNAME=sandbox`, `AFRICASTALKING_API_KEY` and unique `OTP_HMAC_SECRET` **only in server secrets**, not in the mobile bundle/GitHub.
- The publicly reachable API and real physical handset delivery **have not been tested**. A developer manually verified a sandbox SMS reaches Africa's Talking's simulator on November 20, 2026.
- Tests mock Africa's Talking transport and use isolated PostgreSQL records; there are no live provider calls in CI.
- Retention cleanup for expired challenges and production-grade signup abuse controls remain deployment tasks.

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
- SMS sandbox OTP **challenge endpoints are implemented**; real account identity/JWT session issuance and **age assurance are not integrated**. There is no public signup or fake production authentication.
- Migration is a foundation, not yet applied to a live database.
- Expo project ID, APNs and FCM credentials, real device tokens and push access token are not provisioned.
- Push receipts, failure telemetry, rate limits, support/report moderation and device end-to-end verification remain pending.
- APIs are **not deployed** and native app is **not ready for production**.
- This server is independent of Supabase; database must be a managed PostgreSQL instance selected for deployment.

## Transaction integration test

GitHub Actions starts an isolated PostgreSQL 17 container, applies `db/0001_initial.sql` and `db/0002_phone_otp.sql`, and exercises concurrent approvals. The test asserts that only one of two competing requests can fill the last seat, then verifies accepted/declined inbox messages, push-delivery queue records and read state. This is integration coverage **without** real Expo/APNs/FCM delivery.

See [notification requirements](../../docs/notifications.md) for the full event matrix and production delivery checklist.
