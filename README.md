# HealthReachCare

Patient-facing HealthReachCare web app starter. Built with React, Vite, Firebase Web SDK and responsive CSS.

## Local development

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env.local`.
3. Add the Firebase **web app** configuration values from the intended Firebase project.
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

The patient-facing UI includes home, doctor search/filtering, activity/notification states, medicine catalogue setup messaging, and request forms. Email/password sign-up and sign-in are implemented using Firebase Authentication. Signed-in patients can submit appointment, homecare, and prescription-enquiry requests to the `serviceRequests` Firestore collection; the Activities page reads back requests owned by the signed-in user. The app reports Firebase/rules errors instead of showing a false success when a request cannot be saved.

The `firestore.rules` file provides a baseline: public reads are limited to explicitly verified doctor records, notification reads are scoped to the signed-in user, patient requests can only be created for the authenticated patient, and request reads are limited to the patient, an explicitly assigned provider, or an admin role in `user_roles/{uid}`. These rules have **not yet been deployed or tested against the intended Firebase project**. The repository does not yet include complete doctor, pharmacy, and homecare provider workspaces, a live pharmacy inventory/order fulfilment flow, a production payment integration, or end-to-end acceptance tests. Medicine listings are not fabricated; the app shows setup messaging until the real catalogue is connected. Do not accept real clinical requests or payments until Firebase is configured, rules are deployed and tested, and provider workflows are completed.

## Deployment

The app builds to `dist/`. It can be deployed to a static host that supports Vite assets. Configure environment variables in the deployment environment; do not commit real secrets or private credentials.
