# M7 setup checklist — no hosting or deployment

This is a local development checklist for Tokea's native consumer app and staff tools. **Do not paste API keys, Google app passwords, signing keys or private certificates into chat, GitHub or screenshots.**

## 1. SMS one-time codes for Kenya — Africa's Talking
1. Create an Africa's Talking developer account at https://africastalking.com/.
2. Create a sandbox app/username and obtain its API key for testing. The simulator does **not** deliver real messages to a phone.
3. Add credentials to an untracked local API environment: `AT_MODE=sandbox`, `AT_USERNAME`, `AT_API_KEY`, optional `AT_SENDER_ID`.
4. For real Kenyan handset SMS, complete account verification, sender ID approval or supported shortcode setup, purchase SMS credit, then switch deliberately to `AT_MODE=live`. Never switch automatically or claim delivery on HTTP acceptance.
5. Before enabling OTP locally, generate an RSA key file with `bun run identity:keygen`, set `OTP_AUTH_ENABLED=true`, `AUTH_PRIVATE_KEY_FILE=.local-secrets/tokea-identity.pem` and a random `OTP_HMAC_SECRET` of at least 32 characters.
6. The API only signs in users after a valid code. The account is still age-unverified until approved by a reviewer.

## 2. Gmail invites and Google login for staff
1. Create or dedicate a Gmail account for reviewer invitation emails; enable Google 2-Step Verification. If available, generate a **Google App Password** used only by the locally configured mail service, not your ordinary Gmail password.
2. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=<full Gmail address>`, `SMTP_PASSWORD=<app password>`, and `ADMIN_INVITES_FROM=<same Gmail address>` in the private local environment.
3. Staff login uses **Sign in with Google**, not Gmail SMTP. In Google Cloud Console create an OAuth client, enable the proper consent configuration, and register `http://127.0.0.1:4400/admin` as the local redirect URI if that OAuth client type supports it. Configure `ADMIN_OIDC_CLIENT_ID`, `ADMIN_OIDC_CLIENT_SECRET`, and `ADMIN_OIDC_REDIRECT_URI`.
4. Once local PostgreSQL migrations are applied, run `bun run admin:bootstrap -- owner@gmail.com` with the chosen owner's real Google email. This creates the first owner membership, but sends no invitation and contacts no external site.
5. The owner signs in with Google at the **local** staff page and invites reviewers via email. Each invited reviewer signs in with the addressed Google account, accepts the single-use invite, and gets a separate account. One final age-review decision cannot be changed by a second admin.
6. Email links using `127.0.0.1` work only on the same computer. Reviewers on separate computers will need an authenticated, appropriately secured reachable API when hosting is eventually approved—no hosting has been configured.

Google considers app passwords a fallback; for a longer-term sending service, review Gmail OAuth 2.0 or a dedicated transactional mail service.

## 3. Native push and device testing
1. Sign in to Expo and create/attach the Tokea EAS project. Replace the placeholder `extra.eas.projectId` with your real project ID in `apps/mobile/app.json` only after confirming the exact account.
2. Create a Firebase project for **Android**, enable Cloud Messaging/FCM v1 and provide its service-account credential through Expo EAS credentials. Do **not** commit `google-services.json` or the private key.
3. For **iOS**, use an Apple Developer Program account, register bundle ID `com.tokea.social` and create an APNs key/capability. Manage credentials with Expo EAS; do not send your `.p8` key over chat.
4. Build and install a native **development build** on a real Android/iPhone. Expo Go does not support push on current SDKs. Cloud EAS build is optional; prefer local native builds if you do not want cloud builds.
5. Log in, opt into notifications and register the device push token. Test pending/approved/declined review, invitation accepted/declined and chat messages; check in-app inbox and OS notification bar separately.
6. Push tickets and receipts demonstrate provider acceptance, **not guaranteed handset display**. Record failures, device revocations and delivery receipts.

## 4. Photos
- Native drink-category banners load third-party real photographs. Review [photo credits](banner-photo-credits.md), availability and licenses before release. For Muratina, verify attribution to the Commons photographer. Consider bundling selected optimized photos for offline reliability.
- Profile photo originals remain in the user's device gallery. Tokea copies a selected picture into its own persistent documents folder and, when enabled, syncs a resized encrypted avatar to the API. Age-verification ID and selfie photos are never reused as profile pictures.
- Local API and database can run on Windows. None of this creates hosting.

**Before real identity collection:** Kenya ODPC/DPIA review, staff training, monitored 24-hour deletion even through downtime, backup exclusion and user rights channels are required.
