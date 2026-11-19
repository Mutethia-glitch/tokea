# Tokea coding and contribution rules

## Product boundary
- **Native installed iOS and Android app only. No public customer-facing website.**
- The **repository's current native design is authoritative**: apps/mobile/src/theme.ts, apps/mobile/src/ui.tsx and established native screens. Preserve brand palette, spacing, shape, touch targets, accessibility and navigation.
- Do not import, synchronize, regenerate or replace the native design with the older Lovable prototype. Root src/ is archived internal test context, not a design authority.
- Production code lives in apps/mobile/ (Expo/React Native) and services/api/ (Node + PostgreSQL/PostGIS when enabled). Do not introduce Supabase.
- Do not imply mock SMS, age, GPS, messages, or push are live. No customer data or secrets in source. The app is for adults 18+; phone OTP alone does not establish age.

## Authentication and notifications
- Use a trusted real JWT issuer with server-side authorization; no bypass tokens.
- Native Discover must never expose precise private locations, unverified hosts or blocked users.
- Requests and messaging are restricted server-side, including seat-capacity checks.
- Acceptance/decline writes a durable in-app record and queues an opt-in OS push; a queued push is not confirmed delivery. Protect notification payloads and verify provider receipts on real devices.
- Keep Africa's Talking, Google, Firebase, Expo and Apple credentials only in provider-managed secret stores or local untracked environments.

## Required progress tracking
For every major feature, provider decision, UX/security change, deployment or milestone:
1. Read PROGRESS.md first.
2. Update status, blockers, next steps and date in PROGRESS.md **in the same commit**.
3. Record CI/real-device evidence honestly. Never declare tests passed if they were not run and confirmed.

## Verification
- Run the API tests, native TypeScript check and Android JS export; use GitHub Actions where local tools are unavailable.
- Preserve the legacy browser tests while it remains in the repository, but never mistake the web demo for the native app.
- Prefer working functionality with an explicit honest setup state to fake demo flows.
