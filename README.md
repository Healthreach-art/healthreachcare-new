# HealthReachCare

Patient-facing healthcare workflow built with React, Vite, and Lucide icons. The repository currently provides a connected, browser-local sandbox so patient, provider, pharmacy, driver and admin journeys can be exercised before external services are configured.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local Vite URL printed in the terminal.

No Firebase or payment-provider credentials are required for sandbox mode.

## Connected sandbox journeys

### Doctor and homecare
- Patient submits a dated request into the shared workflow.
- Doctor or homecare coordination workspace accepts or declines it.
- Accepted requests unlock simulated checkout from the patient Activities detail.
- A successful simulated authorisation creates a payment-ledger record and confirms the booking.
- Patient cancellation records a simulated refund when payment was previously authorised.

### Medication order, pharmacy and driver
- Patient browses the sample catalogue and creates an order.
- Checkout records either a pending payment or a simulated authorisation; no real money moves.
- Pharmacy accepts and prepares the order. Inventory is checked and deducted once at preparation.
- Pharmacy can decline/cancel; if stock was deducted it is restored on cancellation, and an authorised test payment creates a simulated refund record.
- Delivery orders appear in the driver workspace. The driver can accept a test delivery and complete a recipient/reference handover checklist.
- Finance history uses completed delivery earnings only; it does not treat the medication order total as driver earnings.

### Prescription intake
- Patient selects a non-sensitive sample PDF/JPG/PNG to exercise intake validation.
- The file's bytes are never uploaded or stored; only bounded metadata is written to the sandbox workflow.
- Pharmacy can complete a sample review, request a clearer sample or reject it.
- This sample review does not approve a real prescription or authorise dispensing.

### Account, support and notifications
- Profile, preference and driver settings are saved in local browser storage.
- Patient in-app activity notices are derived from the shared local workflow.
- Support forms can prepare an email draft or save a local test issue; neither action claims the support team received a message.
- Driver availability, status changes, finance and payout settings are simulation-only.

## Sandbox configuration

The replaceable configuration is in `src/test-workflow.js`:
- `SIMULATION_CONFIG.homecareHourlyRates` — illustrative homecare rates in ZAR per hour.
- `SIMULATION_CONFIG.deliveryFee` — illustrative delivery fee.
- `SIMULATION_CONFIG.paymentMethods` — UI payment-method contract for simulated card, EFT and wallet options.
- `simulateTestBookingPayment` and `recordTestPayment` — payment-adapter seams. Replace them with a hosted payment provider and server-verified webhook; never mark a payment paid from client-side UI in production.
- `saveTestPrescription` — metadata-only intake seam. Replace with authenticated private storage, provider-scoped access control, audit logs and retention/deletion handling.
- `useTestWorkflow` — shared browser-local state adapter. Replace with an authenticated server API/repository without rebuilding the workflow screens.

All sandbox records are stored in local storage on the same browser origin. They are not shared between devices, not authoritative, and may be edited by the browser user. Do not enter real patient information, real prescription documents, real passwords, or real financial details.

## Production gates — not yet connected

Before any real patient or provider use:
- Implement real authentication, server-side role/ownership checks and session revocation.
- Move bookings, orders, inventory, prescription metadata and payment records to a trusted server/database with validation, concurrency control, audit logs and backups.
- Use private file storage for prescriptions with pharmacy-specific access, malware/type checks, expiry, retention and deletion controls.
- Connect a hosted payment gateway with server-side signature verification, idempotency, verified payment/refund webhooks and reconciliation. Never collect raw card data in this app.
- Connect provider verification and availability, booking conflict prevention, pharmacy branch scoping, dispatch, GPS, secure notifications and support delivery.
- Add integration and end-to-end tests for success, pending, decline, cancellation, refund, duplicate actions, insufficient stock and service failures.
- Review POPIA privacy obligations and publish approved notices/consent and data-rights processes.
- Run production acceptance checks and deploy only after explicit release approval.

A successful Vite build proves compilation, not production readiness. No production deployment or real payment integration is performed by this repository workflow.
