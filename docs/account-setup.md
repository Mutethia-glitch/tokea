# Tokea provider accounts and business email — setup checklist

Updated: 2026-11-19. **These are instructions, not evidence that accounts have been created.**
Production product: **native iOS and Android only**. There is no planned customer-facing website.
Brand name: **Tokea**. Do not use tokea.com as the email domain without confirmed ownership and rights.

## Ownership and security requirements

- Use accounts owned and recoverable by Tokea's authorized operator; retain recovery codes in a company-controlled password manager.
- Enable multi-factor authentication. Use separate administrative and least-privilege engineering access.
- Never commit API keys, APNs keys, Google service-account JSON, Firebase secrets, passwords or OTP values to GitHub. Never put provider secrets into EXPO_PUBLIC_* variables.
- Select a primary admin mailbox and a disaster-recovery contact before provisioning accounts. Record account owner and access in a private inventory, never in this public repo.
- Provider projects and credentials must be created by the account owner in the provider console. All items below remain **pending** until confirmed.

## 1. Africa's Talking — Kenyan phone OTP delivery

- [ ] Register an account at https://africastalking.com and enable 2FA if available.
- [ ] Create an application called **Tokea Development**; open the **Sandbox** environment.
- [ ] Get sandbox username/API key from the dashboard and use the Africa's Talking simulator for test numbers and SMS.
- [ ] Validate API request/response paths and rate limits from the API server. Never include API keys in the mobile bundle.
- [ ] Before real user trials, finish live account verification, Kenyan SMS enablement, approved sender arrangements and billing.
- [ ] Integrate server-side code issuance and checking with expiry, one-time use, per-number/IP rate limits, abuse detection, resend cooldowns, and logs that do not contain OTP values.
- [ ] Select a separate **real age-assurance method**. SMS ownership or an 18+ checkbox alone does not verify age.

Provider docs: https://help.africastalking.com/en/articles/1170660-how-do-i-get-started-on-the-africa-s-talking-sandbox

Expected API secrets, only once an integration is built: AFRICASTALKING_USERNAME, AFRICASTALKING_API_KEY, AFRICASTALKING_SENDER_ID. Keep unset until needed and never commit real values.

## 2. Google admin and invitation sending

- [ ] Register a dedicated recovery-controlled Gmail identity (candidate **tokea.admin@gmail.com**, availability unverified). Do not use a developer's personal mailbox.
- [ ] Enable Google 2-Step Verification and save recovery codes securely.
- [ ] Set up a separate transactional sender identity for **invitations** (prefer a verified domain mail address, e.g. invites@your-owned-domain); do not use a personal Gmail inbox as a bulk sending service.
- [ ] If staff Google sign-in is approved, create native **Android and iOS OAuth clients** in Google Cloud using package com.tokea.social, the actual Android signing fingerprints, and the actual iOS bundle ID. The OAuth client is not the same as Gmail SMTP credentials; validate backend tokens.
- [ ] If Google OAuth is not needed for staff, do not create unnecessary scopes/clients.

Google SMTP supports TLS port 465, but authentication and sending limits still apply. Avoid password-based Gmail integration where OAuth or a managed sending provider is appropriate. Gmail is not being used for consumer phone OTP.

Reference: https://developers.google.com/workspace/gmail/imap/imap-smtp

## 3. Expo / EAS, Firebase / FCM — Android

- [ ] Create a project named **Tokea** at https://expo.dev under a long-lived project owner.
- [ ] Install/configure EAS CLI; link apps/mobile to the EAS project and replace the placeholder extra.eas.projectId in app.json.
- [ ] Create Tokea Firebase project at https://console.firebase.google.com and add an Android application for **com.tokea.social**.
- [ ] Enable FCM v1 and securely configure service-account credentials with Expo EAS (not in GitHub).
- [ ] Configure an internal development build: from apps/mobile run **eas build --profile development --platform android** after project and credentials are ready. An eas.json profile is checked in.
- [ ] Install the signed build on a physical Android device, opt in inside the app after verified login, and confirm push ticket/receipt plus notification-bar delivery.

Expo push setup: https://docs.expo.dev/push-notifications/push-notifications-setup/
Remote push testing requires a development build, not Expo Go.

## 4. Apple Developer / APNs — iPhone

- [ ] Enroll the appropriate owner or legal entity at https://developer.apple.com/programs/enroll/.
- [ ] Register bundle ID **com.tokea.social**, enable the Push Notifications capability, and configure an APNs authentication key through Expo EAS credentials.
- [ ] Set up signing, create a signed iOS development build, and test on an actual iPhone with an eligible Apple Developer membership.
- [ ] Verify foreground/background/lock-screen delivery, tapped-notification navigation, push receipts and logout revocation.

Expo and Apple guides: https://docs.expo.dev/push-notifications/push-notifications-setup/ and https://developer.apple.com/notifications/push-notifications-console/

## 5. Mail-only business domain, Zoho and copyright

- [ ] Choose and legally clear a domain controlled by Tokea. **Candidate: gettokea.co.ke** (availability not verified). Alternatives: tokeaapp.co.ke or gettokea.app. No website is necessary.
- [ ] Provision Zoho Mail: verify domain ownership, set correct Zoho MX records, SPF, DKIM and DMARC using the values for your Zoho region.
- [ ] Establish support@YOUR_DOMAIN for customer help, admin@YOUR_DOMAIN for operations, and invites@YOUR_DOMAIN for outbound invitations, with role-based access. Consider help@ instead of support@ if desired.
- [ ] Update any future native support/legal contact screens only after an actual working inbox exists.
- [ ] Do a legal/trademark and Kenyan privacy review before releasing under the name Tokea. Choosing a different email domain does not resolve an existing brand/trademark conflict.

Current in-app copyright attribution: **© 2026 Tokea. All rights reserved.** This does not claim ownership of third-party code, fonts, or libraries; their own licenses remain in force.

Zoho setup: https://www.zoho.com/mail/how-to/setup-my-domain-with-zoho-mail.html

## Next gated milestone

First establish the administrative accounts, domain, OTP/identity and age-assurance decisions, EAS project and Android testing device. Then connect secure phone verification and real session creation/join APIs. Do not expose test-only OTPs or simulated conversations to real users.
