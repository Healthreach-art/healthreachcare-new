# South African patient-platform launch checklist

This is an operational checklist, not a legal opinion or a certification of compliance. The responsible business and qualified South African advisers must confirm which obligations apply to the final operating model.

## Privacy and health information
- [ ] Identify the legal responsible party/operator and publish its registered name, address and reliable contact details.
- [ ] Register the Information Officer with the Information Regulator where required; publish the correct contact channel.
- [ ] Prepare and publish a PAIA manual and implement a process for data-subject access/correction requests.
- [ ] Map every data flow: patient account, service request, provider assignment, messaging, prescription, location, reminder, analytics, payment and support.
- [ ] Document lawful purposes/bases, notices, consent where required, data minimisation, retention/deletion, correction and access procedures.
- [ ] Sign operator/data-processing agreements with hosting, communications, payment and provider partners; check cross-border processing and subprocessors.
- [ ] Apply least-privilege access, strong authentication for staff, audit logging, secure backups, incident response and breach notification procedures.
- [ ] Confirm health records and provider disclosures meet the National Health Act and relevant professional confidentiality obligations.
- [ ] Decide whether reminders and notifications can reveal health information on lock screens; default to generic notification text.
- [ ] Establish guardian/caregiver authority and age/minor workflows before allowing one account to manage another person's care records.

## Provider and clinical governance
- [ ] Verify doctors/practitioners against the appropriate professional council and confirm scope of practice.
- [ ] Verify pharmacy premises, responsible pharmacist and pharmacy registration through SAPC processes; confirm medicine sale/dispensing rules and prescription controls.
- [ ] Verify homecare organisations, staff credentials, scope, insurance, service area and safeguarding processes.
- [ ] Maintain evidence of checks, reviewer, date, renewal/expiry and suspension/revocation workflow.
- [ ] Have clinicians approve telehealth, prescribing, record-keeping, emergency escalation and consent workflows where relevant.
- [ ] Keep clinical records, access logs and retention rules separate from general customer support data.

## Orders, delivery and payments
- [ ] Use a real medicine catalogue with source pharmacy, stock, price, prescription requirement and branch identifiers; never fabricate stock or prices.
- [ ] Validate stock and final price server-side; reserve inventory atomically; prevent duplicate orders and duplicate webhook processing.
- [ ] Make pharmacy acceptance, preparation, handover, delivery and cancellation states auditable.
- [ ] Generate delivery verification codes on a trusted server; store patient-visible secrets separately so the provider cannot read the code; verify attempts server-side and rate-limit them.
- [ ] Only trusted server-side gateway verification may mark a payment paid; implement signed webhooks, idempotency, reconciliation, refunds and receipts.
- [ ] Disclose prices, delivery/service fees, provider identity, cancellation terms and refund process before payment.
- [ ] Never store raw card details, CVV, PINs or online banking credentials.
- [ ] Ensure tracking maps use real, consented GPS updates; limit access to the active service and stop tracking after completion.

## Customer support, safety and accessibility
- [ ] Configure a monitored support email and escalation owner; test delivery, acknowledgement and complaint resolution.
- [ ] Publish terms, privacy notice, PAIA manual, complaints process, cancellation/refund policy, provider terms and emergency disclaimer.
- [ ] Add account recovery, contact detail correction, logout/session handling and verified account deletion/data requests.
- [ ] Provide emergency numbers appropriate to the patient's location and state clearly that the app is not an emergency dispatch service.
- [ ] Test keyboard/screen-reader navigation, readable contrast, low bandwidth, mobile layouts and clear errors.
- [ ] Provide language/accessibility choices appropriate to the target community.
- [ ] Test on real devices for browser notification permission, background behavior, vibration/audio capability and installed-PWA requirements.

## Technical release gates
- [ ] Configure the intended Firebase project; deploy and emulator-test rules before production use.
- [ ] Test cross-user isolation for requests, messages, provider applications, notifications, documents and payments.
- [ ] Ensure providers can only access assigned records; ensure conversations close when a service is completed/cancelled.
- [ ] Test every valid and invalid status transition, concurrent stock/order changes, payment failures, duplicate events and cancellations.
- [ ] Implement server-side email/push delivery and delivery receipts; do not claim that a browser-only timer works when the app is closed.
- [ ] Run end-to-end tests with separate patient, doctor, pharmacist, homecare, admin and delivery accounts.
- [ ] Review logs and alerts, backup/restore, data export, rollback and incident drills.
- [ ] Obtain written sign-off from the operator, clinical lead, pharmacy lead, privacy lead and payment provider before accepting real users/payments.

## Official starting points
- POPIA: https://www.gov.za/documents/protection-personal-information-act
- Information Regulator eServices (Information Officer registration and PAIA services): https://eservices.inforegulator.org.za/services.aspx
- PAIA guidance and manual templates: https://inforegulator.org.za/paia/
- National Health Act: https://www.health.gov.za/wp-content/uploads/2022/05/NHREC-NHA-of-2003.pdf
- South African Pharmacy Council legislation and rules: https://www.sapc.za.org/Legislation_Rules
- SAPC registered persons: https://www.sapc.za.org/registered-persons
- Consumer Protection Act: https://www.gov.za/documents/consumer-protection-act
- Electronic Communications and Transactions Act: https://www.gov.za/documents/electronic-communications-and-transactions-act
