# Tokea — Development Progress

**Project:** Tokea (formerly named Explore in early blueprint)  
**Last updated:** 2026-11-17  
**Current milestone:** M1 — frontend stabilization work in progress (PR; not verified)  
**Repository:** https://github.com/Mutethia-glitch/tokea  
**Design source:** https://lovable.dev/projects/20ff86c9-03b7-4e00-b80f-9560791ddbfb

## Working agreement

**Update this file as part of every major feature, architectural change, milestone, deployment, security/privacy decision, or significant bug fix.** Update its date, status, checklist, outstanding blockers, and a dated changelog entry in the *same commit* as the change. Do not claim features tested unless they actually passed.

## Current status

| Area | Status | Notes |
| --- | --- | --- |
| Blueprint and scope | Reviewed | Adults-only Kenya social discovery; no dating, alcohol commerce, payments, or AI matching |
| Visual design | Approved | Preserve original Lovable tokens, fonts, 448px mobile canvas, 64px nav/header, 20px card padding, 12px card gap |
| Discover + filters | Prototype | Seeded demo data and manual neighbourhood selection |
| Onboarding + profile | Prototype | Demo-only self declaration and mock OTP; no actual verification |
| Host/create session | Prototype | Client-side creation/edit/pause/end |
| Join requests | Prototype | Local simulated acceptance/decline and capacity checks |
| Session chats | Prototype | Demo-only; access shown after approval, no real messages delivered |
| Profile + appearance | Prototype | Profile edits, system/light/dark options, privacy/terms previews |
| Safety | Preliminary | Block/report demo controls; no server-side enforcement |
| React web build | **Verification pending** | Route-tree snapshot updated; typecheck/build/tests scheduled in CI for the stabilization pull request |
| Production backend | Not started | No real API, database, OTP, maps, push notifications or admin |
| Native iOS/Android | Not started | Expo/React Native planned later |
| Kenya legal review | Required | Final age assurance, privacy policies, licensing/alcohol considerations |

## Immediate next steps

- [ ] Verify `npm install`, `npm run build`, and `npm test` against the full integrated repository.
- [ ] Verify generated TanStack Router routes (`/requests`, `/chats`, `/chats/$id`, `/profile`).
- [ ] Exercise demo flows end to end and recheck screen layout on narrow devices.
- [ ] Add robust regression tests for capacity limits, blocking and private chat access.
- [ ] Approve production requirements and infrastructure choices before adding backend services.

## Important architectural decisions

- The checked-in web project is **only an editable prototype**, not a shipped native app.
- Planned production architecture: **React Native + Expo + TypeScript**, independent **Node.js/TypeScript** API, **PostgreSQL/PostGIS** and appropriately selected storage/notifications.
- **Do not enable Supabase as backend/database.**
- No real age, phone, identity, or location verification exists in this prototype. Never imply otherwise.
- Original Lovable styles and shared UI components are the design source of truth.
- Draft privacy and terms effective date: **November 16, 2026**; no public support email yet.

## Changelog

### 2026-11-17 — Frontend stabilization (verification pending)
- Updated the generated route-tree snapshot for Requests, Chats, nested Chat Details and Profile; the TanStack plugin remains the authoritative generator at build time.
- Render nested chat content in its parent route without duplicating the Chats list.
- Added smoke tests for all seven URLs and session-rule regression tests.
- Strengthened demo approval and message guards (host ownership, session status, blocked applicants and approved chat participants).
- Configured TypeScript typechecking in CI before build/test.
- **Not yet verified:** CI build/typecheck/tests, real device rendering and live preview; resolve any failures before marking M1 complete.


### 2026-11-17 — Repository quality checks
- Added a GitHub Actions workflow to run a Node.js install, production build and tests on pushes and pull requests.
- Added contributor/agent instructions requiring PROGRESS.md updates for major changes.
- Verification remains outstanding until checks actually run successfully; this is a setup milestone, not a production release.

### 2026-11-17 — Initial GitHub consolidation
- Created the GitHub repository foundation, using original Lovable source files and design tokens.
- Added the previously approved Requests, Chats, chat-thread and Profile screens as React routes.
- Added this progress tracker and documented the demo-only boundary and next verification steps.
- Pending: build/test verification after source integration; do not mark the React app fully validated yet.
