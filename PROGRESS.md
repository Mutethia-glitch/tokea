# Tokea — Development Progress

**Project:** Tokea (formerly named Explore in early blueprint)  
**Last updated:** 2026-11-17  
**Current milestone:** M3 — Expanded Kenyan and international drink catalogue (verification pending)  
**Repository:** https://github.com/Mutethia-glitch/tokea  
**Design source:** https://lovable.dev/projects/20ff86c9-03b7-4e00-b80f-9560791ddbfb

## Working agreement

**Update this file as part of every major feature, architectural change, milestone, deployment, security/privacy decision, or significant bug fix.** Update its date, status, checklist, outstanding blockers, and a dated changelog entry in the *same commit* as the change. Do not claim features tested unless they actually passed.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| Blueprint and scope | Reviewed | Adults-only Kenya social discovery; no dating, alcohol commerce, payments, or AI matching |
| Visual design | Approved | Preserve original Lovable tokens, fonts, 448px mobile canvas, 64px nav/header, 20px card padding, 12px card gap |
| Discover + filters | **M3 update pending CI** | Added Muratina, Whiskey, Vodka, Gin, Rum, Tequila, Brandy and Spirits, with automatic matching banners and grouped filters; prior M2 mobile spacing verified |
| Onboarding + profile | Prototype | Demo-only self declaration and mock OTP; no actual verification |
| Host/create session | Prototype | Client-side creation/edit/pause/end |
| Join requests | Prototype | Local simulated acceptance/decline and capacity checks |
| Session chats | Prototype | Demo-only; access shown after approval, no real messages delivered |
| Profile + appearance | **M2 photo UX verified** | Browser-local cropped profile photo choose/change/remove, photo persistence and avatar rendering; no server upload |
| Safety | Preliminary | Block/report demo controls; no server-side enforcement |
| React web build | **Verified in CI** | Bun install, TypeScript, Vite/Nitro production build and 16 Vitest tests passed in GitHub Actions run #8 (2026-11-17) |
| Hosted web demo | **Vercel deployment READY** | https://tokea-demo.vercel.app · SSO protection enabled · browser routes not yet independently smoke-tested |
| Production backend | Not started | No real API, database, OTP, maps, push notifications or admin |
| Native iOS/Android | Not started | Expo/React Native planned later |
| Kenya legal review | Required | Final age assurance, privacy policies, licensing/alcohol considerations |

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
- [ ] Approve production requirements and infrastructure choices before adding backend services.

## Important architectural decisions

- The checked-in web project is **only an editable prototype**, not a shipped native app.
- Planned production architecture: **React Native + Expo + TypeScript**, independent **Node.js/TypeScript** API, **PostgreSQL/PostGIS** and appropriately selected storage/notifications.
- **Do not enable Supabase as backend/database.**
- No real age, phone, identity, or location verification exists in this prototype. Never imply otherwise.
- Original Lovable styles and shared UI components are the design source of truth.
- Draft privacy and terms effective date: **November 16, 2026**; no public support email yet.

## Changelog

### 2026-11-17 — M3 Expanded drink options (verification pending)
- Added 8 drink categories: **Muratina**, **Whiskey**, **Vodka**, **Gin**, **Rum**, **Tequila**, **Brandy**, and **Spirits**, retaining Beer, Wine, Cocktails, Coffee, Soft drinks and Tea (14 total).
- Shared the catalogue between session hosting, quick filters and full Discover filters, grouped as alcoholic/non-alcoholic for easier selection.
- Added light, locally rendered category-specific banner colors and matching icons for all new choices; no third-party artwork is loaded.
- Added Muratina and Whiskey sample sessions in fresh demo data. Previously saved browser demos retain local state; resetting the demo restores updated samples.
- Made the larger Discover filter sheet scrollable on small phones.
- Added browser checks for Muratina/Whiskey samples, Muratina filtering, and all new host form choices, plus catalogue/banner unit tests.
- **Pending:** CI typecheck, build, unit tests and browser smoke; don't merge until confirmed.


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
