# Tokea — Development Progress

**Project:** Tokea (formerly named Explore in early blueprint)  
**Last updated:** 2026-11-19  
**Current milestone:** M6 — manual age review and no-fallback photo cleanup source verified in CI (not hosted; real accounts pending)  
**Repository:** https://github.com/Mutethia-glitch/tokea  
**Design source:** https://lovable.dev/projects/20ff86c9-03b7-4e00-b80f-9560791ddbfb

## Working agreement

**Update this file as part of every major feature, architectural change, milestone, deployment, security/privacy decision, or significant bug fix.** Update its date, status, checklist, outstanding blockers, and a dated changelog entry in the *same commit* as the change. Do not claim features tested unless they actually passed.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| Blueprint and scope | Reviewed | Adults-only Kenya social discovery; no dating, alcohol commerce, payments, or AI matching |
| Visual design | Approved | Preserve original Lovable tokens, fonts, 448px mobile canvas, 64px nav/header, 20px card padding, 12px card gap |
| Discover + filters | **M3 verified** | 14 drink categories including Muratina and spirits; grouped hosting/filter controls, themed card banners and mobile browser checks passed |
| Onboarding + profile | **M6 source in review** | Native ID+selfie verification form, detailed clear-photo guidance, consent and status; needs real OTP provider and physical-device tests |
| Host/create session | **M5 native + API source tested** | Real signed-JWT host endpoint and native form; account provider not yet configured |
| Join requests | **M5 native + API source tested** | Authenticated requests and server-only host decisions, durable inbox events; no live users yet |
| Session chats | **M5 native + API source tested** | PostgreSQL messages restricted to accepted members; live realtime and phone notifications pending |
| Profile + appearance | **M2 photo UX verified** | Browser-local cropped profile photo choose/change/remove, photo persistence and avatar rendering; no server upload |
| Safety | **M6 source in review** | Signed-in unverified accounts can browse, but server blocks hosting, joining and chats; ID+selfie encrypted at rest and deletions attempted on review/expiry |
| React web build | **Verified in CI** | Bun install, TypeScript, Vite/Nitro production build and 16 Vitest tests passed in GitHub Actions run #8 (2026-11-17) |
| Hosted web demo | **Vercel deployment READY** | https://tokea-demo.vercel.app · SSO protection enabled · browser routes not yet independently smoke-tested |
| Production backend | **M6 local-only tests green** | PostgreSQL migrations, signed-JWT routes, staff age reviews, photo deletion and invite access; 24 tests passed before final audit additions. No hosting. |
| Native push notifications | **M4 code verified, delivery unverified** | Explicit opt-in and Expo token registration, in-app inbox and native notification tap handling; push needs EAS ID, APNs/FCM credentials, real authentication and device testing |
| Native iOS/Android | **Typecheck + Android JS export passed** | Expo SDK 58 / React Native 0.88 / Expo Router shell in `apps/mobile`; not an installed native build or complete feature UI |
| Kenya legal review | **Pre-launch blocker** | Updated draft privacy notice for ID/selfie, restricted admin review, metadata and deletion; mandatory DPIA/ODPC legal review and 24h deletion assurance before live collection |

## Immediate next steps

- [x] Verify Bun dependency install, TypeScript check, production build and automated tests in CI (16/16 tests passed).
- [x] Verify TanStack Router routes (`/requests`, `/chats`, `/chats/$id`, `/profile`) with smoke tests.
- [x] Perform Chromium E2E checks for onboarding, navigation, chat, profile and hosting; passed on 2026-11-17 (CI run #14).
- [x] Verify Discover has 16px card gaps, stable widths, uncluttered metadata, no floating Host CTA and responsive category backgrounds (Chromium CI #18 passed).
- [x] Publish a limited-scope hosted web demo through Vercel; deployment reached READY state (original merged commit `bbf0a6e`).
- [x] Chromium successfully checked the integrated React app at 320, 390, 448 and 768px without page-level horizontal overflow.
- [ ] Check the protected Vercel domain directly in a browser; CI E2E verified a local dev server, not the deployed URL.
- [ ] Decide photo storage, consent/moderation and deletion for production accounts; demo photos remain on the user's browser only.
- [x] Add regression tests for capacity, approval restrictions, blocking and private chat access.
- [ ] Confirm hosting/managed PostgreSQL provider, production URLs, OTP/age assurance vendor and EAS project/Apple/Google developer accounts before deployment.
- [ ] Provision and migrate a private PostgreSQL database; deploy the independent API with a trusted JWT issuer.
- [ ] Integrate trusted OTP sign-in with verified identity claims. Manual ID+selfie review is being implemented locally; no real uploads until privacy/legal/security readiness.
- [ ] Configure an owner reviewer identity and SMTP invitation provider securely, test email invitations and one-decision-only protection.
- [ ] Before any live ID collection: test production-independent 24h deletion including downtime, storage backup exclusion, monitoring, incident handling, human reviewer staffing and Kenya ODPC compliance.
- [ ] Replace short-interval chat refresh with authenticated realtime transport and controls.
- [ ] Configure FCM/APNs credentials, build/install Tokea on Android and iOS devices, and verify accepted/declined requests generate OS + in-app notifications.
- [ ] Implement push receipt checks, delivery monitoring, preferences, user blocking, moderation and safe sign-out/device revocation.

## Important architectural decisions

- The checked-in web project is **only an editable prototype**, not a shipped native app.
- Planned production architecture: **React Native + Expo + TypeScript**, independent **Node.js/TypeScript** API, **PostgreSQL/PostGIS** and appropriately selected storage/notifications.
- **Do not enable Supabase as backend/database.**
- No real age, phone, identity, or location verification exists in this prototype. Never imply otherwise.
- Original Lovable styles and shared UI components are the design source of truth.
- Draft privacy and terms effective date: **November 16, 2026**; no public support email yet.

## Changelog

### 2026-11-19 — M7 Kenya SMS OTP provider foundation (CI pending)
- Selected Africa's Talking SMS API with explicit sandbox/live modes. Added Kenya E.164 phone validation, random six-digit OTP, five-minute expiry, HMAC hashing (no plaintext code storage), throttling, capped attempts, and encrypted/signed first-party JWT access tokens.
- Added revocable, rotating 30-day refresh sessions and /v1/auth code-request/verify/refresh/sign-out endpoints. A verified phone does **not** mark the person age-verified; ID+selfie review remains separate.
- RSA signing keys and SMS secrets are local-only and must not be committed. OTP login fails closed when credentials are missing; sandbox messages are not live handset delivery.
- Added local owner bootstrap command, verified-Google-ID-token staff exchange with PKCE and nonce, and the account/profile photo API. Profile photos are stored separately from 24-hour identity documents; signed-in users can view public-in-app avatars when profile storage is enabled. Native sign-in and photo screens are next. No hosting.


### 2026-11-19 — M6 verification and cleanup implementation checkpoint
- **All three CI jobs passed** at https://github.com/Mutethia-glitch/tokea/actions/runs/44432147253: 25/25 backend tests, migration and local cleanup command smoke, native TS check/Android JS export, no legacy runtime-import audit, and existing reference browser checks.
- Review access is role-limited, final decisions cannot be overturned, admin invitations are bound to verified email and single-use, and review/expiry triggers durable in-app notifications.
- Superseded encrypted photo references and successful deletion tombstones are removed; failed deletion jobs remain only while required for retry. The native app clears temporary app-cache photo copies without touching the original gallery.
- An independent cleanup command supports a separately scheduled job. A reliable **24-hour deletion guarantee**, five-minute review staffing, provider-backed sign-in/email and actual phone push delivery are **NOT operational** without additional configuration and monitoring.
- **No API/mobile hosting or deployment.** M6 remains a draft PR stacked on M5; root web prototype is retained as approved design reference only.


### 2026-11-19 — Keep current photo valid even if old-file cleanup fails (CI verified)
- Upload expiry now begins when photo intake starts, not after image processing finishes.
- Upload transactions separate the committed **current** photo from the best-effort cleanup of obsolete files. If deletion fails, the new active photo remains valid and a retry job persists; it cannot accidentally be removed as a fallback.
- Admin verification decisions similarly remain final/successful even if immediate file deletion fails; cleanup errors are logged for retry.
- No hosting; no real identity documents accepted.


### 2026-11-19 — Independent identity-photo cleanup command (CI verified)
- Added `bun run cleanup:verification`, a separate one-shot local task to expire pending/draft ID and selfie files and clear orphaned encrypted files even when the HTTP server is stopped.
- Reports overdue deletion jobs so an operating-system scheduler can detect failures. This still cannot guarantee deletion while the computer is off; no real user ID uploads are authorized without 24-hour operational controls.
- **Verified:** independent cleanup command smoke ran in GitHub Actions with uploads disabled; encrypted photo replacement/expiry/deletion logic was tested with synthetic images and PostgreSQL.


### 2026-11-19 — Obsolete-file and staff-invitation cleanup (CI verified)
- Replaced ID/selfie references are cleared and previous encrypted bytes deleted; stale expired drafts clear both former file IDs before any new upload. An orphan-file sweep handles interrupted writes while protecting in-flight uploads.
- Finalized reviews retain decisions/reviewer audit data but never active photo references. Successful file deletions remove their own queue records, so there is no fallback to old image UUIDs.
- Added `0006_remove_old_photo_refs.sql` to remove any legacy references on finalized cases and `0007_remove_deleted_file_tombstones.sql` to delete historical successful-job rows.
- Native phone app cleans temporary selected images on replacement, successful submission and screen exit, without deleting the user's original gallery pictures.
- Admin review UI invalidates image previews after another reviewer completes the case. Consumed and expired admin email invitations are purged periodically.
- Expanded automated tests to assert superseded images cannot be read, stale drafts are reset without previous IDs, orphan images are removed, and invite tokens are single-use and email-bound.
- **Verified:** 25/25 backend tests across six files, including eight age-review/deletion/admin tests and a staff access HTTP test. Native Android JS export, native TypeScript, active-code no-legacy-fallback audit and design reference smoke all passed in GitHub Actions #44432147253.
- **Not hosted; real ID processing and external email/push are disabled pending credentials, privacy/security verification and legal review.**


### 2026-11-19 — M6 manual age assurance and reviewer workspace (source in progress)
- Added native ID and selfie capture/selection screen with clear-photo instructions, explicit consent and account status; Profile links to review and updated privacy notice.
- Signed-in but unverified people can browse public sessions, profile and notifications. All host/join/request/chat operations remain server-side restricted until age-verified in the database.
- Added PostgreSQL case records, immutable final reviews, owner/reviewer membership, limited email invites and extended notification kinds; final approved cases set `users.age_verified_at` immediately.
- Added a local **staff-only** admin workspace with reviewer queue, secure ID/selfie comparison and explicit Verify/Decline controls. Final decisions cannot be overwritten, including by other reviewers.
- Added server-side image validation and re-encoding (removes EXIF/GPS), private AES-256-GCM storage, 24h case expiry and cleanup timer, plus immediate deletion attempt on review. **Not yet a production 24h deletion guarantee**: independent cleanup monitoring, process uptime and backups must be verified before enabling real uploads.
- Added invite-by-email code requiring verified email identity and SMTP provider configuration; cannot send emails without provider. Only owner role can invite reviewers; invite token expires in 48 hours and is single-use.
- Added draft Privacy Policy explaining personal ID/selfie collection, retention, human review, restricted access and review response *target* (5 minutes during staffed hours, not guaranteed). Consent is required before either photo is uploaded; the API records the consent timestamp and requires consent on final submission.
- **No hosting/deployment, email delivery, real identity signup, physical device notification or real ID processing enabled.**
- First CI revealed Expo SDK 58 naming mismatch for Image Picker/File System packages and an old test assumption that unverified users could not browse. Corrected SDK-aligned package versions, revised HTTP authorization test to check browse succeeds and host/requests fail, and added explicit consent enforcement at submission endpoint.
- Automated M6 review tests initially found that final/expired cases retained opaque image references even after file deletion; corrected the database transition to clear image references and queue durable deletion jobs. Restored server-side staff OAuth/PKCE endpoints in the same fix. Retesting.
- **Pending:** CI rerun, deletion reliability under downtime, DPIA/legal review and physical Android/iOS validation.


### 2026-11-19 — Developer's local Windows backend environment verified
- User successfully installed Docker Desktop and Bun 1.4.4 on Windows.
- Started developer-only PostgreSQL 17 in Docker; changed local host port to `127.0.0.1:5433` after Windows denied binding on port 5432. Container PostgreSQL remains on 5432.
- On the local machine, ran `bun install`, `bun scripts/migrate.mjs`, `bun run typecheck`, `bun run build`, `bun run test`. Both `0001_initial.sql` and `0002_messages.sql` were applied successfully.
- **Verified from supplied PowerShell output:** 4 test files passed, **12/12 tests passed**, TypeScript check and compilation passed. Integration tests ran against local PostgreSQL.
- **No service has been deployed or hosted.** Authenticated API requests still require a real JWKS identity provider and verified-adult account. Phone notifications and native physical builds are not live.
- Restricted the API server's listening interface to `127.0.0.1` for local-only development, so starting it does not expose the HTTP port to the LAN. The PostgreSQL Compose port is also loopback-bound.
- **Verified from supplied PowerShell health-check output:** local `GET http://127.0.0.1:4400/healthz` returned `ok=True`, `service=tokea-api`.
- Added signed-JWT HTTP-route regression coverage with ephemeral loopback-only JWKS and API servers and isolated PostgreSQL test accounts. This tests real signature validation, adult account gate, session creation, joining, host approvals, inbox and member-only chat without adding any production auth bypass.
- **Regression resolved:** a documentation/tree update inadvertently omitted M5 app/API files, yielding HTTP 404s. Restored complete M5 source from commit `70c0b79`, preserved loopback binding and the new signed-JWT HTTP tests, then verified all files and API routing exist in the branch.
- **Verified:** GitHub Actions run https://github.com/Mutethia-glitch/tokea/actions/runs/44422545779 passed all three jobs (web/reference, native TypeScript + Android JS export, API TypeScript/build + PostgreSQL migrations and tests). **16/16 API tests across five files passed**, including four real HTTP/JWKS integration tests for signature validity, unverified-adult rejection, creation, discovery, join, host-only acceptance, inbox, and member-only chat. No hosting or external service provisioning.


### 2026-11-18 — M5 native session screens added (pending verification)
- Replaced native Discover, Requests and Chats placeholders with screens consuming authenticated API endpoints.
- Added native Host form, session details/join request, confirmed session list and member-only conversation screen.
- Preserved Lovable-inspired purple typography and 20px card padding; extended 14 drink choices and grouped Nairobi neighbourhoods to native forms.
- No fake logged-in users or live sessions are displayed when identity/API is not configured.
- Added temporary PostgreSQL integration tests for creating/discovering sessions, join notifications, approvals, chat membership, cancellation and blocking.
- Corrected host detection for sessions with zero join requests: the server derives `isHost` from the JWT subject rather than whether invitations already exist.
- Native messages currently refresh on a short interval; full realtime transport, phone push receipts and complete identity/onboarding still outstanding.
- Made unverified-state Requests and Chats friendly: a plain explanation and a `Check age verification` action replace technical 403 errors. Simplified privacy notice wording for non-technical users.
- Initial CI exposed a malformed API routing module and a native list-type mismatch; both corrected.
- **Verified:** GitHub Actions run https://github.com/Mutethia-glitch/tokea/actions/runs/44388261555 passed web design-reference checks, Android JavaScript export, native TS check, PostgreSQL migration, backend compilation and **12 API tests** (4 session/request/chat integrations plus the prior 8 tests).
- No external service provisioned, no cloud hosting, and no native device push yet.
- **Pending:** GitHub CI, native typecheck and security review. No hosting or deployment.

### 2026-11-18 — M5 backend/API development, local-only (pending verification)
- Added database migration for member-only session messages; migrator now applies schema scripts in order.
- Added approved 14-category drink catalogue and approximate Nairobi neighbourhood choices, without revealing exact location.
- Added authenticated session discovery/create/detail routes, request submission/list/cancel, and approved-members-only chat read/post routes.
- Join submissions create host inbox events and per-device queued push jobs in one PostgreSQL transaction; new chat messages create privacy-preserving inbox and push-queue records.
- All routes require real JWKS JWT and server-side verified-adult checks. No mock authentication bypass.
- **Strict restriction: no hosting, no cloud resources, and no deployment.** GitHub CI uses only temporary test containers.
- **Pending:** native UI wiring, regression tests, build checks, full functional verification, and review. Real signup, vendor credentials, physical push delivery and cloud hosting are not configured.


### 2026-11-17 — M4 foundation checks verified (still not production-ready)
- CI: https://github.com/Mutethia-glitch/tokea/actions/runs/43990223625
- All 3 GitHub Actions jobs **PASSED**: legacy web build/Chromium, Expo native TypeScript + Android JS bundling, and API TypeScript/compile/tests.
- API: **8 tests passed**, including an isolated PostgreSQL 17 integration test that simultaneously approves two competing applicants for one remaining seat, confirms one acceptance only, verifies accepted/declined inbox entries and pending per-device push jobs, and tests read state.
- Native: code compiles and exports an Android JavaScript bundle; **not** a signed or installed Android/iOS app, not a verified notification bar delivery.
- Adjusted native opt-in logic to verify EAS project ID, secure API URL and signed-in account **before** requesting OS notification permission; added gitignore rules for credentials and generated native artifacts.
- Added notification-event design checklist to `docs/notifications.md`, with additional triggers beyond invitation decisions identified as future work.
- Remaining production blockers: real OTP and age assurance, external JWT issuer/credentials, managed database and API deployment, mobile session/login UX, Expo/EAS project ownership and FCM/APNs credentials, real device push receipts, monitoring/rate limits.


### 2026-11-17 — M4 Native mobile and notification API foundation (unverified)
- Reaffirmed native **Expo iOS/Android app** as the product target; Lovable web preview is visual reference/legacy prototype only, not the user-facing product.
- Added `apps/mobile` with native navigation, notification inbox, permission-on-opt-in, Expo token registration, native notification handlers, secure token storage helpers and notification tap routing.
- Added `services/api` independent Node.js/TypeScript API with PostgreSQL schema for users, sessions, join requests, blocks, notifications, opted-in device tokens and retryable per-device push deliveries.
- Server decision flow uses a session row lock to enforce capacity and host-only acceptance/decline, writing a durable inbox notice and push-delivery rows in the same transaction.
- Real JWT validation via trusted JWKS, issuer and audience; no mock auth bypass, and unverified adults cannot call protected endpoints.
- Included API domain tests, isolated API build job and native TypeScript/Android bundling job.
- First CI run: native SDK 58 dependencies installed, native TypeScript passed, and Expo Android JS bundle exported successfully. Web build + Chromium tests passed. API TypeScript/compile passed; API tests initially failed to start because Vitest loaded the root web config; fixed with an isolated test config.
- Second CI run confirmed **native TypeScript, Expo Android JS bundle, API TypeScript, API compile and API rule tests all pass**.
- Added PostgreSQL 17 service and real database integration tests for simultaneous approvals, capacity enforcement, durable in-app notifications, per-device push queue and read/unread state; rerun pending.
- **Still pending:** API test rerun, live PostgreSQL migration/integration tests, external authentication, native device build and actual OS push notification delivery. Do not treat this as a feature-complete app.
- Open decisions: EAS project ID, push credentials (FCM/APNs), identity/age provider, deployment environment, SMS provider and database vendor/region.


### 2026-11-17 — Onboarding and Profile copy cleanup (verification pending)
- Removed the visible Profile note `JPG, PNG or WebP · 5 MB max. Your photo stays in this browser for the demo; it is never uploaded.`; the file validation, cropping, local demo-only persistence and error feedback remain unchanged.
- Retained **For adults 18+ only** on the opening onboarding card and removed its additional prototype disclaimer paragraph.
- Added Chromium assertions that the age statement remains visible and both removed paragraphs are absent.
- No change to age verification status, eligibility requirements, account security, or backend capabilities. All real-world limitations remain documented in project notes and policies.
- **Pending:** typecheck, build, unit and browser tests, then merge.


### 2026-11-17 — M3 Expanded drink options (verification pending)
- Added 8 drink categories: **Muratina**, **Whiskey**, **Vodka**, **Gin**, **Rum**, **Tequila**, **Brandy**, and **Spirits**, retaining Beer, Wine, Cocktails, Coffee, Soft drinks and Tea (14 total).
- Shared the catalogue between session hosting, quick filters and full Discover filters, grouped as alcoholic/non-alcoholic for easier selection.
- Added light, locally rendered category-specific banner colors and matching icons for all new choices; no third-party artwork is loaded.
- Added Muratina and Whiskey sample sessions in fresh demo data. Previously saved browser demos retain local state; resetting the demo restores updated samples.
- Made the larger Discover filter sheet scrollable on small phones.
- Added browser checks for Muratina/Whiskey samples, Muratina filtering, and all new host form choices, plus catalogue/banner unit tests.
- **Verified:** GitHub Actions run https://github.com/Mutethia-glitch/tokea/actions/runs/43984920825 passed Bun install, strict TypeScript, production build, **20 Vitest tests across 3 files**, and Chromium browser smoke.
- Browser smoke confirms new drink choices in Host, Muratina filtering and seeded Muratina/Whiskey banners; existing card spacing and 320/390/448/768px no-overflow checks remained green.
- Change is only an extended frontend drink catalogue, not alcohol sales or a production backend.


### 2026-11-17 — M2 Discover cards and profile photos (verification pending)
- Restyled Discover cards with consistent 16px grid gaps, 20px card content padding, aligned lower metadata, minimum card content height and cleaner action links.
- Added six automatic lightweight gradient-and-icon category banners: Beer, Wine, Cocktails, Coffee, Soft drinks and Tea. Banner appearance derives from the host's chosen category and updates on edit.
- Removed the floating Host CTA that overlapped session content in the mobile screenshot; retained the action inline at the top of Discover.
- Added profile-photo selection, image type/size validation, center-crop to 320px square, JPEG compression, browser-local persistence, change/remove controls and avatar rendering throughout the demo.
- No backend, cloud image upload, or personal data transfer was added; production avatar storage/consent/deletion remain unresolved.
- Extended Chromium E2E coverage for drink mapping, exactly 16px vertical card gaps, photo persistence, custom hosted session category and narrow viewport behavior.
- First CI run: Bun install, TypeScript, build, and unit tests passed; Chromium passed card gaps, banner mapping, profile photo upload and viewport checks, but the newest hosted session test failed because the Discover comparator did not preserve multiple owned sessions in insertion order.
- Fixed the owned-session stable sorting rule and made the browser test wait for local-storage persistence before reloading Discover.
- Screenshot review: verified six distinct soft category banners and consistent card gaps; improved group host-name visibility by moving the request badge below the name.
- **Verified:** CI run https://github.com/Mutethia-glitch/tokea/actions/runs/43983666817 passed Bun install, strict TypeScript, production build, 16 unit tests and Chromium browser smoke.
- Browser assertions passed: six drink categories, 16px vertical gaps, equal-width cards, local photo compression/persistence, new Coffee session sorting, hosted category selection, no page overflow at 320/390/448/768px.
- Screenshots were reviewed from the CI artifact. No real cloud photo storage or production backend; visuals remain a demo.


### 2026-11-17 — Browser smoke suite verified
- CI run: https://github.com/Mutethia-glitch/tokea/actions/runs/43982458445
- **PASS:** Bun install, strict TypeScript, production build, 16 Vitest tests and Chromium browser smoke checks.
- Browser exercised onboarding, tab navigation, profile edit, chat message, host session creation, and no horizontal overflow at 320/390/448/768px.
- Screenshot artifact recorded for review; visual review identified Discover metadata/card refinements for next milestone.
- Current browser test is against Vite development server while CI independently checks the production build; hosted Vercel browser checks remain separate.

### 2026-11-17 — Browser smoke suite added (not yet verified)
- Added Playwright browser checks to GitHub Actions for demo onboarding, navigation, profile editing, session chat, creating a session, and overflow at 320/390/448/768px.
- Automated screenshot artifact is generated from mock data for mobile UI review.
- First browser CI attempt stopped before running tests: Playwright 1.58.2 cannot install Chromium on GitHub's Ubuntu 26.04 image.
- Pinned the workflow to supported Ubuntu 24.04; Chromium installation now succeeds.
- Browser CI then found `vite preview` incompatible with the Lovable TanStack/Nitro output (`dist/server/server.js` absent). Use the local Vite **development server** for browser smoke testing, while CI separately verifies the production build; rerun pending.
- **Pending:** complete browser CI run and investigate any runtime/UI failures before marking the browser QA checklist complete.


### 2026-11-17 — Vercel Git deployment connected
- Created Vercel project `tokea-demo`, linked to `Mutethia-glitch/tokea` production branch `main`.
- Hosted demo: https://tokea-demo.vercel.app (Vercel deployment `dpl_BcmCDwjUNskThxyVh4f2aHRcCPxP`, READY).
- Build logs confirm TanStack Start/Vite/Nitro outputs deployed successfully.
- Vercel SSO protection is enabled; this is not confirmed to be publicly accessible without signing in.
- End-to-end live browser and mobile tests still pending; no real user, SMS, location, or message services.


### 2026-11-17 — Frontend stabilization verified in GitHub Actions
- CI run: https://github.com/Mutethia-glitch/tokea/actions/runs/43980671907
- **PASS:** Bun dependency install, TypeScript strict check, Vite/Nitro production build, 2 test files and **16 tests**.
- React source compile and automated route/session logic checks are confirmed; browser E2E, mobile rendering and hosted demo remain outstanding.

### 2026-11-17 — Frontend stabilization (verification pending)
- Updated the generated route-tree snapshot for Requests, Chats, nested Chat Details and Profile; the TanStack plugin remains the authoritative generator at build time.
- Render nested chat content in its parent route without duplicating the Chats list.
- Added smoke tests for all seven URLs and session-rule regression tests.
- Strengthened demo approval and message guards (host ownership, session status, blocked applicants and approved chat participants).
- Configured TypeScript typechecking in CI before build/test.
- First PR CI run reached install, but npm 10 crashed inside its dependency resolver: `Cannot read properties of null (reading 'edgesOut')`. Typecheck/build/tests did not run.
- Switched CI installation to Bun and restored Lovable's original `bun.lock`; CI dependency install now **passes**.
- The next CI run reported strict TypeScript errors in nullable profile lookups, optional properties and array indexing, some inherited from the Lovable base. Patched these cases while preserving the approved UI.
- Type-check rerun narrowed errors from dozens to **one** remaining session-details fallback; corrected the final nullable host name.
- **Not yet verified:** Bun CI install/typecheck/build/tests, real device rendering and live preview; resolve any failures before marking M1 complete.


### 2026-11-17 — Repository quality checks
- Added a GitHub Actions workflow to run a Node.js install, production build and tests on pushes and pull requests.
- Added contributor/agent instructions requiring PROGRESS.md updates for major changes.
- Verification remains outstanding until checks actually run successfully; this is a setup milestone, not a production release.

### 2026-11-17 — Initial GitHub consolidation
- Created the GitHub repository foundation, using original Lovable source files and design tokens.
- Added the previously approved Requests, Chats, chat-thread and Profile screens as React routes.
- Added this progress tracker and documented the demo-only boundary and next verification steps.
- Pending: build/test verification after source integration; do not mark the React app fully validated yet.
