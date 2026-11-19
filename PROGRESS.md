# Tokea — Development Progress

**Project:** Tokea (formerly named Explore in early blueprint)  
**Last updated:** 2026-11-20  
**Current milestone:** M5 — native phone OTP, default-off sandbox API and private local smoke-test harness verified in CI; actual backend-to-simulator call pending  
**Repository:** https://github.com/Mutethia-glitch/tokea  
**Design source:** checked-in GitHub UX in src/components/tokea and src/styles.css, translated to apps/mobile/src/theme.ts and native components; external Lovable is not authoritative

## Working agreement

**Update this file as part of every major feature, architectural change, milestone, deployment, security/privacy decision, or significant bug fix.** Update its date, status, checklist, outstanding blockers, and a dated changelog entry in the *same commit* as the change. Do not claim features tested unless they actually passed.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| Blueprint and scope | Reviewed | Adults-only Kenya social discovery; no dating, alcohol commerce, payments, or AI matching |
| Visual design | **GitHub repository is authoritative** | Match checked-in GitHub session banners, rounded cards, avatars, colors, spacing; translate to native components, not external Lovable. |
| Legacy web Discover + filters | **M3 verified (historical)** | 14 drink categories, browser UI checks passed; this is not the customer app |
| Native phone proof | **M5 source verified in CI** | Native Kenyan number form, OTP input, countdown, resend throttle and API calls; Expo Android JS exported. Not a signed build, account/JWT or age assurance |
| Host/create session | Prototype | Client-side creation/edit/pause/end |
| Join requests | Prototype | Local simulated acceptance/decline and capacity checks |
| Session chats | Prototype | Demo-only; access shown after approval, no real messages delivered |
| Profile + appearance | **M2 photo UX verified** | Browser-local cropped profile photo choose/change/remove, photo persistence and avatar rendering; no server upload |
| Safety | Preliminary | Block/report demo controls; no server-side enforcement |
| React web build | **Verified in CI** | Bun install, TypeScript, Vite/Nitro production build and 16 Vitest tests passed in GitHub Actions run #8 (2026-11-17) |
| Hosted web demo | **Vercel deployment READY** | https://tokea-demo.vercel.app · SSO protection enabled · browser routes not yet independently smoke-tested |
| Production backend | **M5 OTP source verified in CI** | PostgreSQL-backed single-use phone OTP endpoints; adapter unit tests and database integration tests passed. Not login, JWT issuance, 18+ verification or deployed |
| Native push notifications | **M4 code verified, delivery unverified** | Explicit opt-in and Expo token registration, in-app inbox and native notification tap handling; push needs EAS ID, APNs/FCM credentials, real authentication and device testing |
| Native iOS/Android | **M5 source verified in CI** | Expo SDK 58 / React Native 0.88; authenticated read-only Discover screen and app copyright/about screens added; no installed native build or full feature UI |
| Kenya legal review | Required | Final age assurance, privacy policies, licensing/alcohol considerations |

## Immediate next steps

- [x] Review GitHub Actions for M5 native/API changes — all three CI jobs passed: https://github.com/Mutethia-glitch/tokea/actions/runs/44538251699.
- [x] Verify GitHub-design native Discover card translation — all three CI jobs passed: https://github.com/Mutethia-glitch/tokea/actions/runs/44539052668.
- [x] Owner confirmed Africa's Talking sandbox, generated sandbox key and simulator number; a direct Postman SMS arrived in the simulator November 20, 2026 (manual evidence, not backend integration).
- [x] Verify server OTP integration in CI — all 3 jobs passed at https://github.com/Mutethia-glitch/tokea/actions/runs/44626255270.
- [ ] Complete actual Tokea backend-to-sandbox OTP test using private server-only credentials (manual Postman-to-provider message already succeeded).
- [ ] Provision dedicated Google admin, Expo/Firebase, Apple Developer and a mail-only Zoho domain; see docs/account-setup.md. **No accounts created by repository changes.**
- [ ] Confirm Tokea trademark/brand suitability and ownership of the selected mail domain before publishing support contact details.

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
- [ ] Complete native account authentication, live sessions, invitations and private messaging screens; current native shell is only a starting point.
- [ ] Configure FCM/APNs credentials, build/install Tokea on Android and iOS devices, and verify accepted/declined requests generate OS + in-app notifications.
- [ ] Implement push receipt checks, delivery monitoring, preferences, user blocking, moderation and safe sign-out/device revocation.

## Important architectural decisions

- **No customer-facing website.** Native Android/iOS only; the root web project and protected Vercel preview are legacy internal references, not a shipped product.
- Planned production architecture: **React Native + Expo + TypeScript**, independent **Node.js/TypeScript** API, **PostgreSQL/PostGIS** and appropriately selected storage/notifications.
- **Do not enable Supabase as backend/database.**
- Africa's Talking sandbox SMS manual delivery is verified; server-side phone OTP source is added but not yet tested live. **Phone possession is not account authentication or age verification**, and no live age, identity or location verification exists. Never imply otherwise.
- **The checked-in GitHub design is the source of truth** (src/components/tokea, src/styles.css, apps/mobile/src/theme.ts and related native screens); external Lovable must not replace it.
- Draft privacy and terms effective date: **November 16, 2026**; no public support email yet. Candidate: support@gettokea.co.ke, subject to actual domain ownership, availability and legal clearance.
- Copyright attribution in native Profile/About: **© 2026 Tokea. All rights reserved.**

## Changelog

### 2026-11-20 — Native and private SMS-test harness CI verified
- New native phone number/OTP screen: https://github.com/Mutethia-glitch/tokea/actions/runs/44627229682 — all 3 jobs PASSED, including Kenyan phone-format tests and Android JS export/typecheck.
- Private local OTP harness and default-off sandbox feature gate: https://github.com/Mutethia-glitch/tokea/actions/runs/44627398858 — all 3 jobs PASSED, including PostgreSQL-backed API tests and disabled-public-route test, plus native and legacy browser regression jobs.
- **No live backend-to-provider request, device build, real signup or age check was performed by CI.** These require private operator credentials, deployed/local Postgres and separate identity/age providers.


### 2026-11-20 — Private sandbox verification harness and default-off API gate (CI pending)
- Added localhost-only backend-to-simulator CLI script at `services/api/scripts/otp-sandbox-smoke.mjs`; operator enters simulator number and received code locally. No credentials were uploaded or provider calls made by this commit.
- Added default-disabled `ENABLE_PHONE_OTP` gate to both public OTP endpoints, plus sandbox-only requirement. Added configurable `HOST` so local tests bind to loopback, and a regression test confirming the public endpoints are disabled by default.
- Documented private database, migration, local API and secret environment setup in `services/api/README.md`, with clear distinction between the prior manual provider test and a future full Tokea server end-to-end test. No public website is planned.
- Tests have not yet run for this commit. Real provider testing, signed native builds, phone account authentication and 18+ checks remain unfinished.


### 2026-11-20 — Native phone OTP UX (verification pending)
- Added `apps/mobile/app/verify-phone.tsx`: Kenya phone entry, six-digit code entry, expiry countdown, resend controls, verified/non-authenticated information and user-visible errors, matching the checked-in GitHub palette, rounded cards and spacing.
- Added native start/verify API calls without leaking Africa's Talking credentials or minting login tokens. Linked the screen from Profile and Discover's disconnected state.
- Added phone-number normalization checks to the native CI workflow. No real signed app, sandbox call, account creation or age assurance was verified by this patch.


### 2026-11-20 — M5 server OTP CI verification complete
- GitHub Actions: https://github.com/Mutethia-glitch/tokea/actions/runs/44626255270 — **all 3 jobs passed** (API TypeScript and compile, isolated PostgreSQL OTP/challenge and existing API tests, native Android JS export/typecheck, and legacy browser smoke tests).
- Africa's Talking transport unit tests used mocked HTTP responses, **not a real provider call**. Confirmed real sandbox SMS only via the separate user-performed Postman test. Need a real backend-to-simulator send and verify with privately configured sandbox credentials before declaring OTP end-to-end done.


### 2026-11-20 — Africa's Talking simulator delivery confirmed; Tokea server OTP foundation (CI pending)
- Owner provided screenshot of **Tokea test message received in Africa's Talking SMS simulator** after sending through Postman. This is proof of sandbox transport, not secure OTP flow or live mobile delivery.
- Added backend sandbox SMS adapter for Africa's Talking, six-digit cryptographically random phone OTP challenge issuance and confirmation, HMAC-only database persistence, five-minute expiry, five-attempt lockout, one-minute cooldown and per-phone/request-source hourly limits. Sender response validation checks provider recipient acceptance codes.
- Public phone proof routes `POST /v1/auth/phone/start` and `POST /v1/auth/phone/verify` return a challenge and a non-authenticated phone verification result, respectively. They **never issue JWTs or mark users age-verified**; real identity onboarding remains blocked.
- Added `0002_phone_otp.sql`, sequential migrations, unit/integration test coverage with mocked provider transport and isolated PostgreSQL. **CI verification pending**; no real API test with the private sandbox key has occurred.
- Updated backend environment example, setup guide and progress status. Provider secrets remain outside the public GitHub repository.
- Remaining production blockers include trusted proxy IP configuration/abuse controls, retention cleanup, real verified accounts/JWT issuer, actual age assurance, EAS/FCM/APNs device builds and proof of phone push.


### 2026-11-19 — M5 GitHub-design card translation verified in CI
- GitHub Actions: https://github.com/Mutethia-glitch/tokea/actions/runs/44539052668 — **all three jobs PASSED**: native Expo TypeScript/Android JS export; API compilation/PostgreSQL integration tests; archived web browser regressions.
- Confirms the native banner/session-card translation from the repository's existing UI compiles, without claiming a signed/installed app or live provider delivery. External account setup, age assurance, OTP and real-device testing are still outstanding.


### 2026-11-19 — M5 native Discover card styling translated from checked-in GitHub design (CI pending)
- Clarified that the **polished designs already in GitHub** (src/components/tokea and src/styles.css) are the visual source of truth for React Native, rather than either the separate Lovable project or the early placeholder native screens.
- Added apps/mobile/src/session-card.tsx with 80px drink banners, category-specific soft color fields, host initials/avatar, 24px-radius card surface, 20px padding, and metadata separator patterned after the existing checked-in SessionCard.
- Native Discover uses this shared card; no dummy live users, fake join actions or website launch were added. Awaiting native Android JS export and TypeScript CI results for this change.


### 2026-11-19 — M5 source CI verified
- GitHub Actions: https://github.com/Mutethia-glitch/tokea/actions/runs/44538251699 — **all three jobs passed** (native Expo TypeScript and Android JS export; API TypeScript, build, real PostgreSQL integration tests; historical browser regression).
- Confirms M5 read-only discovery query and integration assertions compile/pass. This is **not** proof of a signed native install, real OTP/age verification, API deployment, SMS delivery, Apple build or phone push.
- External service account creation and mail-domain registration remain pending owner action; no credentials were installed or published.


### 2026-11-19 — M5 native-only scope, provider checklist, copyright and read-only Discover (verification pending)
- User reconfirmed that Tokea is an installed Android/iOS application **without a public website**; existing GitHub native UI is the design source, not Lovable. Updated agent/contributor documentation accordingly.
- Added docs/account-setup.md covering Africa's Talking Kenyan SMS sandbox/live transition, dedicated Google administrator and staff OAuth, Expo/EAS + Firebase FCM, Apple Developer/APNs, and mail-only Zoho custom domain. **All external account creations remain user-controlled and pending.**
- Added read-only authenticated GET /v1/sessions to Node API. Server filters blocked users, inactive or non-verified hosts, ended/full sessions (while retaining host/approved-member visibility), and exposes only public session information. Added DB integration assertions; **not yet CI verified**.
- Replaced native Discover placeholder with a scrollable API-backed view, drink filtering, loading/empty/error states and existing purple/card design. No fake live sessions or request buttons were introduced.
- Added native Profile copyright footer and About screen: © 2026 Tokea. All rights reserved.; added EAS internal development/preview build profiles. No ownership of third-party rights is claimed.
- Remaining: CI verification, real verified sign-in, actual hosting/join APIs, messaging, service credentials, live database, physical push delivery, legal/age assurance review.


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
