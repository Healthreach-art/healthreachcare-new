# Provider workflow and payment readiness

## Implemented in this branch

- Patient appointment requests are written to `appointments` with the selected `doctorId`, requested date/time, `requestStatus: pending`, and `paymentStatus: not_started`.
- Patient home-care requests are written to `homecareRequests` with `requestStatus: pending` and `paymentStatus: not_started`.
- The Provider workspace resolves an authenticated account's role from `user_roles/{uid}` or `profiles/{uid}`. It does not grant provider access based on a form field.
- Doctor workspace reads requests assigned by `doctorId` to the authenticated provider UID or configured provider/profile ID.
- Home-care workspace reads requests assigned by `providerUid` to the authenticated provider UID. Unassigned requests intentionally do not appear to every provider.
- Accept/decline uses a Firestore transaction that rechecks assignment and pending status before updating the request. The workspace does not mark a booking paid and does not collect card details.

## Required before provider workflows can be considered production-ready

This repository currently has no checked-in Firestore rules, trusted backend, Firebase Functions setup, or payment webhook. The UI alone cannot enforce access control. Configure and test rules in the actual Firebase project before exposing patient data.

Required data contracts:
- `user_roles/{uid}`: administrator-managed `role` (e.g. `doctor` or `homecare_provider`) and, when applicable, `providerId` pointing to the assigned provider profile.
- `doctors/{doctorId}`: only published, verified practitioner data; the provider's role record must map to the same ID used by patient appointment requests.
- `appointments/{requestId}`: patient-owned create; only the assigned, verified doctor (or authorized admin/dispatcher) may read or transition it.
- `homecareRequests/{requestId}`: patient-owned create; only the assigned home-care provider (or authorized admin/dispatcher) may read or transition it. A trusted dispatcher/admin workflow must set `providerUid`; do not expose all unassigned requests to every provider.
- Status transitions must be validated server-side or by strict Firestore rules. Patients must not be able to set `accepted`, `paid`, `acceptedBy`, or settlement fields themselves.

## Payment integration — intentionally not enabled yet

Do not collect or accept payment until all of the following are implemented and tested:
1. A trusted server endpoint initializes a Paystack transaction using a server-held secret. The browser must never receive the secret.
2. The endpoint authenticates the patient, verifies that the request belongs to them, confirms provider acceptance, and obtains the payable amount from a trusted provider quote or server-side price—not from an arbitrary client amount.
3. The browser is redirected to Paystack-hosted checkout; card/bank details are never stored by this app.
4. A public webhook endpoint verifies Paystack's HMAC-SHA512 signature against the raw request body using a server-side secret and constant-time comparison.
5. Only a verified successful webhook may mark the payment as paid and update the linked request/order. Browser redirects or client callbacks must never be treated as proof of payment.
6. Webhook processing is idempotent, validates transaction reference, currency, amount and request linkage, and records failures/refunds appropriately.
7. Configure Firebase Functions/Cloudflare backend deployment, secrets, webhook URL, provider account/currency, Firestore rules and end-to-end sandbox tests for the intended production environment.

Until those pieces are configured, accepted requests explicitly remain unpaid and the UI explains that checkout is unavailable. This is a safety gate, not a successful payment integration.


## Patient booking flow ported from the original HealthReachCare workflow

The new Vite repository now uses Firebase Authentication for patient identity and the booking cards submit authenticated requests to Firestore instead of writing fake requests to browser local storage.

### Doctor appointment journey
1. Load only records in `doctors` where `isActive == true` and `isVerified == true`.
2. Select a practitioner and consultation mode.
3. Enter patient contact details and preferred date/time.
4. Review the request and submit it to `appointments` with `patientUid`, `doctorId`, `requestStatus: pending`, and `paymentStatus: not_started`.
5. The assigned provider can review the request through the Provider workspace. A preferred time is not a confirmed slot until a trusted backend reserves and confirms availability.

### Homecare journey
1. Select the requested care service and enter the patient's contact details, address, preferred visit time, duration and notes.
2. Look for approved, verified records in `homecareProviders` to display a rate estimate only when a matching saved rate exists.
3. Submit the request to `homecareRequests` with `requestStatus: pending`, `paymentStatus: not_started`, and no client-supplied payable total or provider assignment.
4. An administrator/coordinator must assign an approved provider. The request remains pending until the provider and visit are confirmed.
5. The estimate is not a charge. Do not take payment from the browser or treat a request as confirmed.

### Important production boundary
- `firestore.rules` is deny-by-default for other collections and restricts patient-created requests to the signed-in patient. Review and test these rules against the actual Firebase project before deployment.
- The original repository's trusted server actions, transactional slot reservation, verified payment callbacks, and payment reconciliation are not drop-in compatible with this Vite-only repository. The new repository still needs a trusted backend for server-calculated homecare totals, appointment availability reservation, secure checkout initialization, payment webhook verification, refunds, and final confirmation.
- Never mark an appointment or homecare visit as paid based on a browser action. The current booking screens explicitly show requests as pending and payments as not collected.
- Firebase Authentication and Firestore must be configured using the `VITE_FIREBASE_*` environment variables. The `doctors`, `homecareProviders`, `appointments`, `homecareRequests`, `user_roles`, and `profiles` collections must follow the documented field contracts.
