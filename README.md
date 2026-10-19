# HealthReachCare

Patient-facing HealthReachCare web app starter. Built with React, Vite, Firebase Web SDK and responsive CSS.

## Local development

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env.local`.
3. Add the Firebase **web app** configuration values from the intended Firebase project.
4. Set `VITE_SUPPORT_EMAIL` to the monitored HealthReachCare customer-support mailbox before deploying. Do not use an unmonitored or invented address.
4. Install dependencies and run the development server:

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`.

## Firebase collections expected by the current UI

- `doctors`: publicly readable, published practitioner records. The directory only displays records explicitly marked verified via `verified: true`, `isVerified: true`, or `verificationStatus: "verified"`.
- `users/{uid}/notifications`: personal notifications for the signed-in user, with optional `title`, `message`, `read`, and `createdAt` fields.

Configure and test Firestore security rules before production. Never make patient records, identity documents, prescriptions, or private profile data publicly readable. Only publish practitioner fields that are safe for public display.

## Honest integration status

The patient UI includes email/password authentication and password recovery, editable profile name, verified practitioner search, a Firestore-backed public medicine catalogue and single-pharmacy cart, structured medicine order requests, appointment/homecare/prescription request forms, patient activity timelines, destination maps and provider chat while a service is active. Patients can create account-scoped local medication/care reminders, enable browser notifications, and access South African emergency call shortcuts. Account pages include privacy, terms, cancellations/refunds, support, PAIA information-access guidance and patient-rights information.

The `firestore.rules` file provides a baseline: public reads are limited to explicitly verified doctor records, notification reads are scoped to the signed-in user, provider applications are private to the applicant and admins, patient requests are scoped to the patient/assigned provider/admin, provider status changes follow service-specific transitions, and clients cannot write payment records. These rules have **not yet been deployed or tested against the intended Firebase project**. Initial provider application/review and request-assignment/status controls now exist, but they are not a complete clinical or pharmacy system. Inventory reservation and final-price verification, appointment slot locking, homecare availability/dispatch, secure prescription file storage, trusted payment gateway/webhook processing, background push delivery, server-issued delivery PINs, live GPS update delivery, and end-to-end acceptance tests are not yet implemented. Catalogue records must be published with `publicCatalog: true` and `active: true`; stock and price are confirmed by the pharmacy. Reminders run in the open app and may show browser notifications when permitted, but browser-only reminders cannot guarantee an alarm after the app/browser is fully closed. Do not accept real clinical requests or payments until Firebase is configured, rules are deployed and tested, and provider workflows are completed.

## Provider verification and payments

Provider applicants can submit a doctor, pharmacy, or homecare application from Account. Applications remain pending until an administrator independently checks the relevant professional or business registration. Approval and role assignment are committed atomically; public doctor profiles contain only basic directory fields. Do not approve applicants based only on the form submission. This workflow still needs review against the actual Firebase project and real regulatory verification procedures before production use.

## Free-first operating model

- Keep Firebase Authentication and Firestore on the no-cost plan while usage stays within the plan's current quotas. Do not enable billing without the owner's approval. Usage limits and product eligibility can change, so check the current Firebase pricing page before enabling services.
- Avoid Cloud Functions, paid storage, SMS authentication and file uploads until they are necessary. The current provider application form collects registration references but does not collect identity documents.
- Host the static Vite frontend on a suitable free static-hosting tier. A small Cloudflare Worker can be evaluated for server-side endpoints and payment webhooks, subject to current platform limits.
- Payment gateway transaction fees may still apply even when hosting is free. The browser must never mark a payment as paid. A trusted server must create payment sessions, verify signed gateway webhooks, and then update payment/order records.
- Firestore rules default-deny collections without explicit permissions. No live gateway has been connected yet; do not collect real payments or present a payment as successful until the server-side gateway and webhook verification are implemented and tested.

## Deployment

The app builds to `dist/`. It can be deployed to a static host that supports Vite assets. Configure environment variables in the deployment environment; do not commit real secrets or private credentials.
