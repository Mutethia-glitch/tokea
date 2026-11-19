# Tokea — native Android and iOS application

This is the **only intended customer product**; Tokea is not a website.

The **existing GitHub design is authoritative**. Translate checked-in session banners/cards/components from ../../src/components/tokea and ../../src/styles.css into native views, using src/theme.ts, src/ui.tsx and src/session-card.tsx. Do not replace it with the separate Lovable version.

## Local development

Run from apps/mobile after installing Bun and the compatible Node version:

- bun install
- bun run typecheck
- bun run start

The authenticated Discover feed uses GET /v1/sessions. Configure EXPO_PUBLIC_API_URL as HTTPS in a local, untracked environment for real testing. There is deliberately no fake account or sample session fallback: a trusted JWT and confirmed 18+ verification must exist before the API will serve requests.

## Native SMS sandbox screen

The installed app has an Expo Router phone-verification screen (`app/verify-phone.tsx`) using the checked-in GitHub design. It connects to the public Tokea phone start/verify endpoints without exposing SMS credentials on the device. A successful code response **does not create an account, authenticate, or prove the user is 18+**. A secure HTTPS API and separately provisioned private sandbox configuration are needed before the screen can make real calls. Format-check tests: `bun run test:phone`.

## EAS setup

After a real Expo project has been created and linked, replace the EAS project placeholder in app.json. The checked-in eas.json contains internal Android development/preview profiles. Configure Firebase FCM v1 credentials via EAS, build an installed Android development app, and test on a phone. Repeat on iOS once Apple signing and APNs are configured. Expo Go is insufficient for actual remote pushes.

See ../../docs/account-setup.md and ../../docs/notifications.md for provider ownership and OS push requirements.

## Security and limits

The API and managed database are not deployed. Real phone OTP and age assurance, host/create and join-request endpoints, and private chats are not implemented. Notification code is a foundation only: no verified phone delivery. Do not claim production launch readiness.

Copyright notice appears on Profile and About. © 2026 Tokea. All rights reserved.

Update ../../PROGRESS.md with every major milestone.
