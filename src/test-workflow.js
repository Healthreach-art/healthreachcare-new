import { useCallback, useEffect, useState } from "react";

export const WORKFLOW_KEY = "healthreachcare-test-workflow-v1";
export const LEGACY_BOOKINGS_KEY = "healthreachcare-test-bookings";

// A replaceable simulation configuration. A production pricing service can replace
// this module without changing the booking and checkout screens.
export const SIMULATION_CONFIG = Object.freeze({
  currency: "ZAR",
  deliveryFee: 35,
  homecareHourlyRates: Object.freeze({
    personal_care: 280,
    elderly_care: 300,
    post_surgery: 420,
    mobility: 280,
    medication_support: 250,
    specialised_care: 500
  }),
  paymentMethods: Object.freeze([
    { id: "card_test", label: "Bank card", provider: "simulated-card" },
    { id: "eft_test", label: "Instant EFT", provider: "simulated-eft" },
    { id: "wallet_test", label: "HealthReach wallet", provider: "simulated-wallet" }
  ]),
  paymentAdapter: "local-simulation"
});
export const TEST_PRODUCTS = [
  { id: "test-paracetamol", name: "Paracetamol 500 mg", category: "OTC test item", description: "Illustrative catalogue item for interface testing only.", price: 25, stock: 24, prescriptionRequired: false, active: true },
  { id: "test-ors", name: "Oral rehydration salts", category: "OTC test item", description: "Illustrative catalogue item for interface testing only.", price: 12, stock: 40, prescriptionRequired: false, active: true },
  { id: "test-gauze", name: "Sterile gauze pads", category: "First aid test item", description: "Illustrative catalogue item for interface testing only.", price: 35, stock: 18, prescriptionRequired: false, active: true },
  { id: "test-thermometer", name: "Digital thermometer", category: "Health equipment test item", description: "Illustrative catalogue item for interface testing only.", price: 89, stock: 10, prescriptionRequired: false, active: true }
];

const freshState = () => ({ version: 2, inventory: TEST_PRODUCTS.map(item => ({ ...item })), orders: [], payments: [], bookings: [], prescriptions: [], reviews: [], messages: [], updatedAt: new Date().toISOString() });

export function readWorkflow() {
  if (typeof window === "undefined") return freshState();
  try {
    const raw = window.localStorage.getItem(WORKFLOW_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    return {
      ...freshState(),
      ...parsed,
      // Preserve existing pharmacy stock/settings, while adding any catalogue entries
      // missing from older test-state versions. Existing inactive products stay inactive.
      inventory: (() => {
        const stored = Array.isArray(parsed.inventory) ? parsed.inventory : [];
        const normalized = stored.map(item => ({ ...item, active: item.active !== false, prescriptionRequired: item.prescriptionRequired === true }));
        for (const product of TEST_PRODUCTS) {
          if (!normalized.some(item => item.id === product.id)) normalized.push({ ...product });
        }
        return normalized;
      })(),
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
      prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : []
    };
  } catch { return freshState(); }
}

function publish(state) {
  if (typeof window === "undefined") return state;
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(WORKFLOW_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("healthreachcare-test-workflow", { detail: next }));
  } catch { /* Surface an explicit UI error at the action site where possible. */ }
  return next;
}

export function updateWorkflow(mutator) {
  const current = readWorkflow();
  const draft = {
    ...current,
    inventory: current.inventory.map(item => ({ ...item })),
    orders: current.orders.map(item => ({ ...item, items: Array.isArray(item.items) ? item.items.map(line => ({ ...line })) : [] })),
    payments: current.payments.map(item => ({ ...item })),
    bookings: current.bookings.map(item => ({ ...item })),
    prescriptions: (current.prescriptions || []).map(item => ({ ...item })),
    reviews: (current.reviews || []).map(item => ({ ...item })),
    messages: (current.messages || []).map(item => ({ ...item }))
  };
  const result = mutator(draft);
  if (result?.error) return result;
  publish(draft);
  return { state: draft, value: result?.value };
}

export function createTestOrder({ patientName, phone, address, items, fulfilment = "delivery", notes = "" }) {
  const state = readWorkflow();
  const lines = items.map(line => {
    // Catalogue cards carry `id`; older checkout callers may carry `productId`.
    // Accept either shape and reject only products that are explicitly inactive.
    const selectedProductId = line.productId || line.id;
    const product = state.inventory.find(item => item.id === selectedProductId && item.active !== false);
    if (!product) throw new Error("One of the selected test items is no longer available. Return to the catalogue, refresh the stock list and try again.");
    const quantity = Math.max(1, Math.min(20, Number(line.quantity) || 1));
    if (quantity > Number(product.stock || 0)) throw new Error(`Only ${product.stock} unit(s) of ${product.name} remain in test stock.`);
    if (product.prescriptionRequired === true) {
      throw new Error(`${product.name} requires a prescription. Secure prescription upload and pharmacy review are not connected yet, so this test checkout cannot accept it safely.`);
    }
    return { productId: product.id, name: product.name, quantity, unitPrice: Number(product.price), lineTotal: Number(product.price) * quantity, prescriptionRequired: product.prescriptionRequired === true };
  });
  if (!lines.length) throw new Error("Add at least one item before checkout.");
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const order = {
    id: "HRC-ORD-" + Date.now().toString(36).toUpperCase(),
    patientName: String(patientName || "").trim(),
    phone: String(phone || "").trim(),
    address: String(address || "").trim(),
    items: lines,
    notes: String(notes || "").trim(),
    fulfilment,
    subtotal,
    deliveryFee: fulfilment === "delivery" ? SIMULATION_CONFIG.deliveryFee : 0,
    total: subtotal + (fulfilment === "delivery" ? SIMULATION_CONFIG.deliveryFee : 0),
    status: "awaiting_payment",
    paymentStatus: "pending_gateway",
    paymentMethod: "",
    stockDeducted: false,
    createdAt: new Date().toISOString(),
    testOnly: true
  };
  updateWorkflow(draft => { draft.orders.unshift(order); return { value: order }; });
  return order;
}

export function recordTestPayment(orderId, method, outcome = "success") {
  let payment;
  const outcomes = {
    success: { status: "test_authorized", label: "Authorised" },
    pending: { status: "payment_pending", label: "Pending" },
    failed: { status: "test_failed", label: "Failed" },
    cancelled: { status: "test_cancelled", label: "Cancelled by customer" }
  };
  const result = updateWorkflow(draft => {
    const order = draft.orders.find(item => item.id === orderId && item.testOnly === true);
    if (!order) return { error: "Test order not found. Please return to the patient shop." };
    if (order.status === "cancelled" || order.paymentStatus === "test_refunded") return { error: "This order is cancelled and cannot be paid again." };
    if (order.paymentStatus === "test_authorized") return { value: draft.payments.find(item => item.orderId === orderId && item.type !== "refund" && item.status === "test_authorized") };
    if (!SIMULATION_CONFIG.paymentMethods.some(item => item.id === method)) return { error: "Choose an available simulated payment method." };
    const selectedOutcome = outcomes[outcome];
    if (!selectedOutcome) return { error: "Choose a valid simulated payment outcome." };
    const now = new Date().toISOString();
    payment = {
      id: "HRC-PAY-" + Date.now().toString(36).toUpperCase(),
      orderId, amount: Number(order.total), currency: SIMULATION_CONFIG.currency,
      method, provider: SIMULATION_CONFIG.paymentMethods.find(item => item.id === method).provider,
      status: selectedOutcome.status, outcome, type: "payment", testOnly: true, fundsMoved: false,
      createdAt: now, updatedAt: now
    };
    draft.payments.unshift(payment);
    order.paymentMethod = method;
    order.paymentId = payment.id;
    order.paymentStatus = selectedOutcome.status;
    if (outcome === "success") order.status = "awaiting_pharmacy";
    order.updatedAt = now;
    order.statusHistory = [...(order.statusHistory || []), { status: selectedOutcome.status, at: now, testOnly: true, actor: "simulated-payment-adapter" }];
    return { value: payment };
  });
  if (result?.error) throw new Error(result.error);
  return payment || result?.value;
}

export function transitionTestOrder(orderId, nextStatus) {
  const allowed = {
    awaiting_payment: ["cancelled"],
    awaiting_pharmacy: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready_for_delivery", "ready_for_pickup"],
    ready_for_delivery: ["out_for_delivery"],
    ready_for_pickup: [],
    out_for_delivery: ["delivered"],
    delivered: [],
    cancelled: []
  };
  return updateWorkflow(draft => {
    const order = draft.orders.find(item => item.id === orderId);
    if (!order) return { error: "Order not found. Refresh and try again." };
    if (order.testOnly !== true) return { error: "This action is only available for test orders." };
    if (!(allowed[order.status] || []).includes(nextStatus)) return { error: `Cannot change an order from ${order.status} to ${nextStatus}.` };
    if (nextStatus === "preparing" && order.paymentStatus !== "test_authorized") return { error: "A test payment authorisation is required before preparation. No real payment has been collected." };
    if (nextStatus === "preparing" && !order.stockDeducted) {
      for (const line of order.items) {
        const product = draft.inventory.find(item => item.id === line.productId);
        if (!product || Number(product.stock) < line.quantity) return { error: `Insufficient test stock for ${line.name}. Adjust stock before preparing this order.` };
      }
      for (const line of order.items) {
        const product = draft.inventory.find(item => item.id === line.productId);
        product.stock -= line.quantity;
      }
      order.stockDeducted = true;
    }
    if (nextStatus === "cancelled") {
      if (order.stockDeducted && !order.stockRestocked) {
        for (const line of order.items) {
          const product = draft.inventory.find(item => item.id === line.productId);
          if (product) product.stock = Number(product.stock || 0) + Number(line.quantity || 0);
        }
        order.stockRestocked = true;
      }
      if (order.paymentStatus === "test_authorized") {
        const refund = {
          id: "HRC-REF-" + Date.now().toString(36).toUpperCase(),
          orderId,
          amount: Number(order.total || 0),
          method: order.paymentMethod,
          status: "test_refunded",
          type: "refund",
          testOnly: true,
          fundsMoved: false,
          createdAt: new Date().toISOString()
        };
        draft.payments.unshift(refund);
        order.refundId = refund.id;
        order.paymentStatus = "test_refunded";
      }
    }
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory = [...(order.statusHistory || []), { status: nextStatus, at: order.updatedAt, testOnly: true }];
    return { value: order };
  });
}

export function saveTestBooking(booking) {
  const now = new Date().toISOString();
  const item = {
    ...booking,
    id: booking.id || "HRC-REQ-" + Date.now().toString(36).toUpperCase(),
    status: "awaiting_provider_review",
    paymentStatus: "not_started",
    paymentId: null,
    statusHistory: [{ status: "awaiting_provider_review", at: now, testOnly: true }],
    testOnly: true,
    createdAt: now,
    updatedAt: now
  };
  const result = updateWorkflow(draft => {
    if (draft.bookings.some(existing => existing.id === item.id)) return { error: "A request with this reference already exists." };
    draft.bookings.unshift(item);
    return { value: item };
  });
  if (result?.error) throw new Error(result.error);
  return item;
}

// Sandbox prescription intake stores metadata only; no file bytes or medical document
// are uploaded or persisted. Replace this with private object storage and pharmacy ACLs.
export function saveTestPrescription({ patientName, fileName, fileType, fileSize, notes = "" }) {
  const extension = String(fileName || "").toLowerCase().split(".").pop();
  const resolvedType = fileType || ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }[extension] || "");
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!String(patientName || "").trim()) throw new Error("Enter the sandbox patient name.");
  if (!String(fileName || "").trim()) throw new Error("Choose a sample file to simulate intake.");
  if (!allowedTypes.includes(resolvedType)) throw new Error("Use a PDF, JPG or PNG sample file.");
  if (!Number.isFinite(Number(fileSize)) || Number(fileSize) <= 0 || Number(fileSize) > 5 * 1024 * 1024) throw new Error("The sample file must be smaller than 5 MB.");
  const now = new Date().toISOString();
  const item = {
    id: "HRC-RX-" + Date.now().toString(36).toUpperCase(),
    patientName: String(patientName).trim().slice(0,100),
    fileName: String(fileName).split(/[\\/]/).pop().slice(0,160),
    fileType: resolvedType,
    fileSize: Number(fileSize),
    notes: String(notes || "").trim().slice(0,500),
    status: "awaiting_pharmacy_review",
    reviewStatus: "awaiting_pharmacy_review",
    createdAt: now,
    updatedAt: now,
    testOnly: true,
    fileStored: false,
    fileUploaded: false
  };
  const result = updateWorkflow(draft => { draft.prescriptions.unshift(item); return { value: item }; });
  if (result?.error) throw new Error(result.error);
  return item;
}

export function transitionTestPrescription(prescriptionId, nextStatus, reviewNote = "") {
  const allowed = { awaiting_pharmacy_review: ["approved_for_test", "needs_information", "rejected"], needs_information: ["awaiting_pharmacy_review", "rejected"], approved_for_test: [], rejected: [] };
  return updateWorkflow(draft => {
    const item = (draft.prescriptions || []).find(entry => entry.id === prescriptionId && entry.testOnly === true);
    if (!item) return { error: "Sandbox prescription request not found." };
    if (!(allowed[item.status] || []).includes(nextStatus)) return { error: "This prescription review transition is not allowed." };
    item.status = nextStatus;
    item.reviewStatus = nextStatus;
    item.reviewNote = String(reviewNote || "").trim().slice(0,500);
    item.reviewedAt = new Date().toISOString();
    item.updatedAt = item.reviewedAt;
    return { value: item };
  });
}

// Payment adapter seam: replace this implementation with a hosted gateway and
// verified server webhook when production credentials and backend are configured.
export function simulateTestBookingPayment(bookingId, method, outcome = "success") {
  let payment;
  const outcomes = { success: "test_authorized", pending: "payment_pending", failed: "test_failed", cancelled: "test_cancelled" };
  const result = updateWorkflow(draft => {
    const booking = draft.bookings.find(item => item.id === bookingId && item.testOnly === true);
    if (!booking) return { error: "Booking not found. Refresh Activities and try again." };
    if (booking.status !== "accepted") return { error: "The provider must accept the request before payment." };
    if (booking.paymentStatus === "test_authorized") return { value: draft.payments.find(item => item.bookingId === bookingId && item.status === "test_authorized") || null };
    const selectedMethod = SIMULATION_CONFIG.paymentMethods.find(item => item.id === method);
    const amount = Number(booking.servicePrice ?? booking.consultationFee);
    if (!selectedMethod) return { error: "Choose an available test payment method." };
    if (!Number.isFinite(amount) || amount <= 0) return { error: "A valid service price is not configured, so checkout is unavailable." };
    if (!outcomes[outcome]) return { error: "Choose a valid simulated payment outcome." };
    const now = new Date().toISOString();
    payment = {
      id: "HRC-PAY-" + Date.now().toString(36).toUpperCase(),
      bookingId, amount, currency: SIMULATION_CONFIG.currency,
      method: selectedMethod.id, provider: selectedMethod.provider,
      status: outcomes[outcome], outcome, type: "payment", testOnly: true, fundsMoved: false,
      idempotencyKey: "booking-" + bookingId, createdAt: now, updatedAt: now
    };
    draft.payments.unshift(payment);
    booking.paymentMethod = selectedMethod.id;
    booking.paymentId = payment.id;
    booking.paymentStatus = outcomes[outcome];
    if (outcome === "success") booking.status = "confirmed";
    booking.updatedAt = now;
    booking.statusHistory = [...(booking.statusHistory || []), { status: outcomes[outcome], at: now, testOnly: true, actor: "simulated-payment-adapter" }];
    if (outcome === "success") booking.statusHistory.push({ status: "confirmed", at: now, testOnly: true });
    return { value: payment };
  });
  if (result?.error) throw new Error(result.error);
  return payment || result?.value;
}

export function cancelTestBooking(bookingId) {
  const result = updateWorkflow(draft => {
    const booking = draft.bookings.find(item => item.id === bookingId && item.testOnly === true);
    if (!booking) return { error: "Booking not found. Refresh Activities and try again." };
    if (!["awaiting_provider_review", "accepted", "confirmed"].includes(booking.status)) return { error: "This booking can no longer be cancelled from the sandbox." };
    const now = new Date().toISOString();
    if (booking.paymentStatus === "test_authorized" && !booking.refundId) {
      const refund = {
        id: "HRC-REF-" + Date.now().toString(36).toUpperCase(),
        bookingId,
        amount: Number(booking.servicePrice ?? booking.consultationFee ?? 0),
        method: booking.paymentMethod,
        status: "test_refunded",
        type: "refund",
        testOnly: true,
        fundsMoved: false,
        createdAt: now
      };
      draft.payments.unshift(refund);
      booking.refundId = refund.id;
      booking.paymentStatus = "test_refunded";
    }
    booking.status = "cancelled";
    booking.cancelledAt = now;
    booking.updatedAt = now;
    booking.statusHistory = [...(booking.statusHistory || []), { status: "cancelled", at: now, testOnly: true }];
    return { value: booking };
  });
  return result;
}

export function useTestWorkflow() {
  const [state, setState] = useState(() => readWorkflow());
  const refresh = useCallback(() => setState(readWorkflow()), []);
  useEffect(() => {
    const onCustom = event => setState(event.detail || readWorkflow());
    const onStorage = event => { if (!event.key || event.key === WORKFLOW_KEY) refresh(); };
    window.addEventListener("healthreachcare-test-workflow", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("healthreachcare-test-workflow", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);
  return { ...state, refresh };
}

export function sendTestMessage({ requestId, requestType = "booking", senderRole, senderName, body }) {
  const text = String(body || "").trim();
  const allowedRoles = ["patient", "doctor", "homecare", "pharmacy", "driver", "admin"];
  if (!String(requestId || "").trim()) return { error: "Choose a request before sending a message." };
  if (!allowedRoles.includes(senderRole)) return { error: "This sender role is not supported." };
  if (text.length < 1 || text.length > 2000) return { error: "Messages must contain 1–2,000 characters." };
  return updateWorkflow(draft => {
    const target = requestType === "order"
      ? draft.orders.find(item => item.id === requestId && item.testOnly === true)
      : draft.bookings.find(item => item.id === requestId && item.testOnly === true);
    if (!target) return { error: "This test request was not found. Refresh and try again." };
    if (["cancelled", "declined", "rejected"].includes(target.status)) return { error: "Messaging is closed for this cancelled or declined request." };
    const now = new Date().toISOString();
    const message = {
      id: "HRC-MSG-" + Date.now().toString(36).toUpperCase(),
      requestId, requestType, senderRole,
      senderName: String(senderName || senderRole).trim().slice(0,100),
      body: text, createdAt: now, testOnly: true
    };
    draft.messages.push(message);
    target.lastMessageAt = now;
    target.updatedAt = now;
    return { value: message };
  });
}

export function submitTestReview({ bookingId, rating, comment = "" }) {
  const score = Number(rating);
  const text = String(comment || "").trim().slice(0, 1000);
  return updateWorkflow(draft => {
    const booking = draft.bookings.find(item => item.id === bookingId && item.testOnly === true);
    if (!booking) return { error: "Completed test booking not found." };
    if (booking.status !== "completed") return { error: "A review is available only after the provider marks the booking completed." };
    if (!Number.isInteger(score) || score < 1 || score > 5) return { error: "Choose a rating from 1 to 5 stars." };
    if (draft.reviews.some(item => item.bookingId === bookingId && item.testOnly === true)) return { error: "A review has already been submitted for this booking." };
    const review = { id: "HRC-REV-" + Date.now().toString(36).toUpperCase(), bookingId, providerId: booking.providerId, providerName: booking.providerName, kind: booking.kind, rating: score, comment: text, createdAt: new Date().toISOString(), testOnly: true };
    draft.reviews.unshift(review);
    booking.reviewId = review.id;
    booking.reviewedAt = review.createdAt;
    booking.updatedAt = review.createdAt;
    return { value: review };
  });
}

export function transitionTestBooking(bookingId, nextStatus) {
  const allowed = { awaiting_provider_review: ["accepted", "declined"], accepted: ["declined"], confirmed: ["completed"], declined: [], completed: [] };
  return updateWorkflow(draft => {
    const booking = draft.bookings.find(item => item.id === bookingId);
    if (!booking) return { error: "Test request not found. Refresh and try again." };
    if (booking.testOnly !== true) return { error: "This action is only available for test requests." };
    if (!(allowed[booking.status] || []).includes(nextStatus)) return { error: `Cannot change this request from ${booking.status} to ${nextStatus}.` };
    if (nextStatus === "completed" && booking.paymentStatus !== "test_authorized") return { error: "A successful simulated payment is required before completing this booking." };
    booking.status = nextStatus;
    booking.updatedAt = new Date().toISOString();
    booking.providerResponseAt = booking.providerResponseAt || booking.updatedAt;
    booking.statusHistory = [...(booking.statusHistory || []), { status: nextStatus, at: booking.updatedAt, testOnly: true }];
    return { value: booking };
  });
}
