# HealthReachCare

Patient-facing HealthReachCare web app built with React, Vite, Lucide icons and responsive CSS.

## Local testing mode

The current patient UI is intentionally running without Firebase initialization so the screens can be tested without Firebase credentials, sign-in, or Firestore rules.

1. Install Node.js 20.19+ or 22.12+.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open the local Vite URL shown in the terminal.

No `.env.local` or Firebase web configuration is required for this UI test.

## Booking flows in test mode

- Doctor booking: choose an illustrative sample doctor, select a consultation type and preferred date/time, submit a test request, then review it in the doctor test workspace.
- Home-care booking: select a care type, enter visit details and submit a test request, then review it in the homecare provider test workspace.
- Sample practitioners, catalogue items, stock levels, fees and delivery charges are illustrative test fixtures only. They are not real providers, pharmacy inventory, availability or prices.
- The patient medicine page opens the test catalogue and mock checkout workflow. Test orders and test stock changes are shared with pharmacy/driver demo workspaces in the same browser origin.
- Test requests may be saved to this browser's local storage under `healthreachcare-test-bookings`.
- Requests are **not** sent to doctors, clinics, or home-care providers. Sample doctor selection is not a live directory and availability is not checked. The test checkout records a clearly marked mock authorisation only; no payment is collected.
- The header has no sidebar/dropdown navigation. The patient bottom navigation is Home, Activities and Account. The patient home does not show the browser-local test bookings panel, delivery-tracker placeholder, or recent-order-history placeholder.

## Before production

Firebase/Auth/Firestore integration, secure request ownership rules, provider assignment and review, live availability/booking locks, medicine catalogue/inventory, and secure payment checkout/webhook must be deliberately reconnected and end-to-end tested before any real patient requests or payments are enabled. Do not represent local test requests or sample prices as real bookings or quotes.

The app builds to `dist/` and can be deployed to a static host that supports Vite assets.