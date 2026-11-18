# Tokea native notification plan

**Product:** installed iOS/Android app, not a website or WebView. **Current scope:** architecture and testable source-code foundation, not live phone delivery.

## Notifications are two separate channels

1. **In-app inbox** (database-backed): the source of truth for important events. This exists even when a user denies or disables phone notification permission; unread state is user-scoped and persists across app restarts.
2. **Native system push** (opt-in): server-initiated Expo Push Service → FCM for Android / APNs for iOS → notification shade/lock screen, subject to OS permissions, device state and platform delivery. Phone push is a transport, not the authoritative record.

## Notification event matrix

| Event | Recipient | In-app | OS push | Current state |
| --- | --- | --- | --- | --- |
| Join request accepted | Applicant | Yes | If opted in | **Backend decision → inbox + push queue implemented** |
| Join request declined | Applicant | Yes | If opted in | **Backend decision → inbox + push queue implemented** |
| Someone requests to join | Session host | Yes | If opted in | Schema supports event, request-submission API pending |
| New session chat message | Accepted session members except sender | Yes | Optional, respect mute | Not yet implemented |
| Session cancelled or materially changed | Accepted members | Yes | Yes, if opted in | Not yet implemented |
| Session starts soon | Confirmed members | Yes | Optional reminder | Not yet implemented |
| Safety/moderation or account security action | Affected account | Yes | Appropriate high priority | Not yet implemented |
| Marketing/news/promotions | Opted-in accounts only | Optional | Separate explicit consent | Not in MVP |

**Privacy:** notifications should not reveal exact GPS coordinates, a private residential address, sensitive identity information or the contents of private chat messages on the lock screen. Tapping notification opens only a known, allowlisted in-app route.

## Native installation / push requirements

- Register Tokea as an Expo/EAS project; replace `SET_REAL_EAS_PROJECT_ID_BEFORE_PUSH_TESTING`.
- Connect Android Firebase Cloud Messaging (FCM v1) and iOS Apple Push Notification service (APNs) credentials under the project's ownership.
- Create installable development builds for Android and iOS; Expo Go is not sufficient for remote push validation.
- Use a real verified sign-in session with a securely stored JWT; the API validates JWKS/issuer/audience and an adult-verification flag.
- Allow users to opt in from Profile; only then request OS permission and register the token with the server. Offer a disable/unregister action and respect OS settings.
- Persist invitation decision + in-app inbox + per-device push jobs in one PostgreSQL transaction to avoid lost event records.
- Run an authenticated, separate push worker. Confirm ticket IDs, query delivery receipts, disable invalid tokens, monitor retries, and include a notification preference/quiet-hours policy.
- Test actual acceptance and decline with two accounts on both iOS and Android, in foreground, background and locked-device states. Check tap-to-inbox behavior and repeat prevention.

## Security / compliance

All sensitive session transitions must be authorized **server-side**, never enforced only in React Native state. Ensure 18+ verification (not merely a checkbox), reporting/blocking and an applicable Kenya privacy-law review before admitting real users. Do not introduce alcohol commerce, ordering or deliveries.

## Engineering checklist

- [x] Server invitation decisions and PostgreSQL capacity guard
- [x] Durable in-app acceptance/decline records and per-device push queue
- [x] Native `expo-notifications` opt-in, token registration and inbox UI source
- [x] Unit tests and real PostgreSQL integration test
- [ ] Provider-backed OTP/age assurance and managed PostgreSQL deployment
- [ ] Native live-session and invitation requests with host notification event
- [ ] EAS project, APNs/FCM credentials and signed development builds
- [ ] OS push to two physical devices, platform receipt verification and end-to-end tracking
- [ ] Notification preferences, mute/quiet-hours, logout token revocation and secure-account alerts
