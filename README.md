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

- Doctor booking: Choose, Compare, Schedule, Pay, Confirm, Care, Favourite.
- Home-care booking: Service, Details, Submit, Quote, Pay, Track, Favourite.
- Sample practitioners, time slots, fees and quote amounts are illustrative UI fixtures only.
- Test requests may be saved to this browser's local storage under `healthreachcare-test-bookings`.
- Requests are **not** sent to doctors, clinics, or home-care providers. Availability is not checked. No payment is collected or marked paid.
- The header has no sidebar/dropdown navigation. The patient bottom navigation is Home, Activities and Account. The patient home does not show the browser-local test bookings panel, delivery-tracker placeholder, or recent-order-history placeholder.

## Before production

Firebase/Auth/Firestore integration, secure request ownership rules, provider assignment and review, live availability/booking locks, medicine catalogue/inventory, and secure payment checkout/webhook must be deliberately reconnected and end-to-end tested before any real patient requests or payments are enabled. Do not represent local test requests or sample prices as real bookings or quotes.

The app builds to `dist/` and can be deployed to a static host that supports Vite assets.