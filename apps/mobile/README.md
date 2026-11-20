# Tokea — native iOS & Android application

This is the **native product**, distinct from the Lovable/Vercel web UX reference. Built with Expo SDK 58, React Native, Expo Router and `expo-notifications`.

## Native app development

```bash
cd apps/mobile
bun install
bunx expo install --fix
bun run typecheck
bun run start
```

For genuine iOS/Android **push notifications**:
1. Create/associate a real Expo EAS project ID in `app.json`.
2. Configure Android FCM v1 and iOS APNs credentials using Expo/EAS.
3. Create a **development build** and install it on a physical phone (or supported simulator/emulator). Expo Go cannot test remote pushes.
4. Deploy `services/api` with HTTPS, a managed PostgreSQL database, real OTP identity/age-assurance, and EXPO_ACCESS_TOKEN.
5. Configure EXPO_PUBLIC_API_URL (HTTPS) and sign in using a **real** verified server-issued JWT. There is no demo bypass.
6. A user taps **Enable phone notifications** in the native Profile; the token is linked to their authenticated account.

The backend stores all accepted/declined invitation events in an in-app notification inbox. If permission is granted and a device token is registered, it queues OS push delivery; a tap opens the app's Notifications screen.

**Current status:** native shell, notification registration and inbox flows are a source-code foundation only. Real identity, device build, API deployment, physical push delivery, receipts, and complete session screens are NOT finished or verified.

Always update the repository's `PROGRESS.md` with major milestones.

See [notification requirements](../../docs/notifications.md) for planned alerts, platform testing and user preferences.

## M5 local native screens (not hosted)

The native app contains Discover, Host, session details, Requests, Chats and conversation screens. They use the authenticated API; without a verified access token they show a sign-in/configuration message instead of fake production data. Session date/time is entered in the phone's local time zone. Cards use the original Lovable palette and 16px inter-card spacing.

The base `EXPO_PUBLIC_API_URL` should use HTTPS. For an **emulator only**, development builds accept loopback HTTP when `EXPO_PUBLIC_ALLOW_LOOPBACK_HTTP=true` and URL host is `localhost`, `127.0.0.1`, or Android emulator `10.0.2.2`. This exception is forbidden in production. A real phone on a LAN requires HTTPS for a safely authenticated API connection.

No remote app hosting, production database, EAS build or credentials were created.

## User accounts and profile pictures

The native sign-in screen takes a Kenyan mobile number beginning with `07`, `01` or `+254`. Africa's Talking sends an SMS code after the provider is securely configured. Phone verification alone does not unlock hosting or joining—ID plus selfie and an admin age-review decision are separate.

Profile photos are copied into `Paths.document` and restored from account-scoped metadata on app restart. Originals in the gallery are not deleted. An encrypted backend profile image sync endpoint allows other signed-in members to see the avatar once profile storage is configured; if offline/unconfigured, the user's selected photo remains on their own phone and other members see initials.

## Exact Tokea launcher icon + native copy (M7)

The owner-approved purple icon with the white paired glasses is kept as `assets/tokea-app-icon.svg` (vector source). Do **not** replace it with a screenshot or generated artwork. Run `bun install` then `bun run generate:icons` to create `assets/icon.png`, `assets/adaptive-icon.png`, `assets/monochrome-icon.png`, and `assets/brand-mark.png` using the `sharp` build-only tool. The generated PNGs are gitignored, regenerated on `bun run android` and in CI; the app config points at those paths. Do not call Expo prebuild before generation. Adding launcher resources requires prebuild and Android rebuild: Metro refresh alone will not change the home-screen icon.

User-visible server text goes through `src/display-copy.ts` at native presentation boundaries to render literal escaped backslash-n and backslash-t sequences properly without changing stored messages. The age review instructions themselves are real bullet rows in `app/verification.tsx`. Run `bun run test:copy` to check this and the one-line 18+ welcome notice. Current root web preview is the visual source of truth; never use its demo auth in native.

On Windows, if Gradle reports `SDK location not found`, set `ANDROID_HOME=$env:LOCALAPPDATA\\Android\\Sdk` and write `sdk.dir=C:/Users/<local-user>/AppData/Local/Android/Sdk` into the **ignored** `apps/mobile/android/local.properties`. This is local workstation configuration, never commit it. Native build on the owner's PC previously required CMake 3.31.6 / Ninja 1.12.1 and `--max-workers=1` due to RAM pressure and Windows path length.
