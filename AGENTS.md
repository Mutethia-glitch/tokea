# Tokea contributor and coding-agent instructions

## Product and architecture
- The **final product is a native iOS/Android app**, not a responsive website or WebView. `apps/mobile` is the active Expo/React Native app; `services/api` is the independent Node.js + PostgreSQL API. The root web prototype is retained only as an approved visual design reference.
- Preserve the approved clean Lovable design tokens, colors, Instrument fonts, shared components, mobile spacing and rounded card styles.
- The production blueprint proposes a separate Expo/React Native application, Node.js API and PostgreSQL/PostGIS database; do **not** enable Supabase or production infrastructure in this demo.
- Native notification requirement: accepted/declined requests must create persistent in-app inbox entries and opt-in device OS pushes. Never represent an enqueue as confirmed handset delivery; verify credentials, device builds, Expo tickets and receipts.
- Do not claim simulated OTP, chat, age checks, geolocation, moderation or phone push as live services.

## Required progress tracking
On **every major feature, UX change, architectural decision, meaningful bug fix, security/privacy change, deployment or milestone**:
1. Read `PROGRESS.md` before starting.
2. Update `PROGRESS.md` **in the same commit** as the change: change last-updated date, affected status rows, next steps, blockers, and add a dated changelog entry.
3. Document verification evidence. Do not mark a test passed unless it actually ran and passed.
4. Keep the file factual and concise so the next contributor can resume where work stopped.

## Before merging
- Run `bun run typecheck`, `bun run build` and `bun run test` where available, or clearly record why they could not run.
- Check that mobile screens share the original Lovable spacing, header and bottom-nav dimensions, and that interactions have no dead controls.
- Keep request-to-chat authorization and capacity rules in mind. Demo client-side enforcement is **not** adequate for production.
