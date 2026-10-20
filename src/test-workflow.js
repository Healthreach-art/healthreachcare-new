import { useCallback, useEffect, useState } from "react";

export const WORKFLOW_KEY = "healthreachcare-test-workflow-v1";
export const LEGACY_BOOKINGS_KEY = "healthreachcare-test-bookings";
export const TEST_PRODUCTS = [
  { id: "test-paracetamol", name: "Paracetamol 500 mg", category: "OTC test item", description: "Illustrative catalogue item for interface testing only.", price: 25, stock: 24, prescriptionRequired: false, active: true },
  { id: "test-ors", name: "Oral rehydration salts", category: "OTC test item", description: "Illustrative catalogue item for interface testing only.", price: 12, stock: 40, prescriptionRequired: false, active: true },
  { id: "test-gauze", name: "Sterile gauze pads", category: "First aid test item", description: "Illustrative catalogue item for interface testing only.", price: 35, stock: 18, prescriptionRequired: false, active: true },
  { id: "test-thermometer", name: "Digital thermometer", category: "Health equipment test item", description: "Illustrative catalogue item for interface testing only.", price: 89, stock: 10, prescriptionRequired: false, active: true }
];

const freshState = () => ({ version: 1, inventory: TEST_PRODUCTS.map(item => ({ ...item })), orders: [], payments: [], bookings: [], updatedAt: new Date().toISOString() });

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
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
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
    bookings: current.bookings.map(item => ({ ...item }))
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
    return { productId: product.id, name: product.name, quantity, unitPrice: Number(product.price), lineTotal: Number(product.price) * quantity };
  });
  if (!lines.length) throw new Error("Add at least one item before checkout.");
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const order = {
    id: "TEST-ORD-" + Date.now().toString(36).toUpperCase(),
    patientName: String(patientName || "").trim(),
    phone: String(phone || "").trim(),
    address: String(address || "").trim(),
    items: lines,
    notes: String(notes || "").trim(),
    fulfilment,
    subtotal,
    deliveryFee: fulfilment === "delivery" ? 35 : 0,
    total: subtotal + (fulfilment === "delivery" ? 35 : 0),
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

export function recordTestPayment(orderId, method) {
  let payment;
  const result = updateWorkflow(draft => {
    const order = draft.orders.find(item => item.id === orderId);
    if (!order) return { error: "Order not found. Please return to the patient shop." };
    if (order.paymentStatus === "test_authorized") return { value: draft.payments.find(item => item.orderId === orderId) };
    payment = {
      id: "TEST-PAY-" + Date.now().toString(36).toUpperCase(),
      orderId,
      amount: order.total,
      method,
      status: "test_authorized",
      testOnly: true,
      fundsMoved: false,
      createdAt: new Date().toISOString()
    };
    draft.payments.unshift(payment);
    order.paymentMethod = method;
    order.paymentId = payment.id;
    order.paymentStatus = "test_authorized";
    order.status = "awaiting_pharmacy";
    return { value: payment };
  });
  if (result?.error) throw new Error(result.error);
  return payment || result?.value;
}

export function transitionTestOrder(orderId, nextStatus) {
  const allowed = {
    awaiting_payment: [],
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
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    return { value: order };
  });
}

export function saveTestBooking(booking) {
  const item = { ...booking, id: booking.id || "TEST-REQ-" + Date.now().toString(36).toUpperCase(), status: "awaiting_provider_review", paymentStatus: "not_started", testOnly: true, createdAt: new Date().toISOString() };
  updateWorkflow(draft => { draft.bookings.unshift(item); return { value: item }; });
  return item;
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

export function transitionTestBooking(bookingId, nextStatus) {
  const allowed = { awaiting_provider_review: ["accepted", "declined"], accepted: [], declined: [] };
  return updateWorkflow(draft => {
    const booking = draft.bookings.find(item => item.id === bookingId);
    if (!booking) return { error: "Test request not found. Refresh and try again." };
    if (booking.testOnly !== true) return { error: "This action is only available for test requests." };
    if (!(allowed[booking.status] || []).includes(nextStatus)) return { error: `Cannot change this request from ${booking.status} to ${nextStatus}.` };
    booking.status = nextStatus;
    booking.updatedAt = new Date().toISOString();
    return { value: booking };
  });
}
