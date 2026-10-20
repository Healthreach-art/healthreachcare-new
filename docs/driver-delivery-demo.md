# Driver delivery demo integration contract

The PR #39 HealthReachCare Courier workspace uses `src/services/driver-delivery-demo.js` and the existing `healthreachcare-test-workflow-v1` browser sandbox. Synthetic orders carry `driverDeliveryDemoVersion: 1`. The seeded payment is simulated (`fundsMoved: false`) and the displayed ZAR fee is illustrative. The map is an illustration; no GPS is requested or transmitted.

## Demo adapter operations

- `listAvailableDeliveries()`
- `getDelivery(orderId)`
- `claimDelivery(orderId, driverId, driverName)`
- `updateDeliveryStatus(orderId, nextStatus, driverId)`
- `confirmPickup(orderId, driverId, checklist)`
- `confirmDelivery(orderId, driverId, confirmation)`
- `getDeliveryHistory(driverId)`
- `getDriverEarnings(driverId)`
- `subscribeToDeliveryUpdates(callback)`
- `resetDemoData()`

Patient, pharmacy, admin and driver test views use the same browser workflow, so status changes align in the same browser profile. Browser storage is not authoritative, atomic, secure, or cross-device. Demo driver selection is not authentication. Proof of delivery is a synthetic confirmation reference; no photo, signature, GPS or real recipient evidence is collected.

Reset removes only driver-demo-marked orders and their linked payment entries. Other sandbox orders, inventory, bookings, messages and settings are preserved. Pharmacy stock remains governed by the existing sandbox preparation transition.

## Production adapter requirements

Keep the UI dependent on this contract and replace the local adapter with authenticated server operations when a backend is ready. Production must authenticate the driver and check role/eligibility on each operation; list authoritative pharmacy-ready unassigned delivery orders; claim with a transaction/conditional update and idempotency key; enforce status transitions server-side; validate pickup and delivery confirmation; and record auditable actor/time events.

History and earnings must be calculated from authoritative delivery and settlement records. Realtime updates must enforce ownership. Store patient contact details and prescriptions only in access-controlled backend storage and return the minimum details needed by the assigned driver. Patient, pharmacy and driver views must derive from the same server-authoritative order, and notifications must be emitted by trusted backend events. Calculate fees server-side and distinguish estimates, accrued earnings, payout eligibility and settled payouts. A completed delivery is not a payout.

No production credentials, live payment integration, GPS permissions or external APIs are required for this demo.