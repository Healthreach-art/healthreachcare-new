import { useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, CreditCard,
  HeartPulse, House, Package, Pill, ShieldCheck, ShoppingBag, Stethoscope,
  Truck, UserRound, Users, Wallet, RefreshCw, AlertCircle, Clock3, MapPin
} from "lucide-react";
import {
  createTestOrder, readWorkflow, recordTestPayment, transitionTestBooking, transitionTestOrder,
  updateWorkflow, useTestWorkflow
} from "./test-workflow.js";
import "./TestingPortal.css";

const money = value => "R" + Number(value || 0).toFixed(2);
const dateTime = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const statusLabel = value => String(value || "pending").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
const roles = [
  { id: "patient", title: "Patient", description: "Browse the test catalogue, place an order and follow its status.", icon: UserRound },
  { id: "doctor", title: "Doctor", description: "Review test appointment and home-care requests.", icon: Stethoscope },
  { id: "pharmacy", title: "Pharmacy", description: "Manage test stock, receive patient orders and prepare fulfilment.", icon: Pill },
  { id: "driver", title: "Driver", description: "View delivery-ready orders and update delivery progress.", icon: Truck },
  { id: "admin", title: "Admin", description: "Monitor test orders, payment attempts, stock and requests.", icon: ShieldCheck }
];

export function TestingLanding({ onOpenAuth }) {
  return <main className="test-landing">
    <header className="test-landing-header"><div className="test-brand"><span><HeartPulse size={24}/></span><div><strong>HealthReachCare</strong><small>Better access. Healthier communities.</small></div></div><span className="test-open-chip"><span/> HEALTHCARE PLATFORM</span></header>
    <section className="test-hero">
      <div className="test-hero-copy"><div className="eyebrow">ONE CONNECTED CARE JOURNEY</div><h1>Better access. Healthier communities.</h1><p>Find care, order medication and connect with the teams that support your health — in one connected platform.</p><div className="test-hero-actions"><button className="button button-primary" onClick={onOpenAuth}>Sign in or create an account <ArrowRight size={17}/></button><button className="test-secondary-cta" onClick={onOpenAuth}>Explore demo access</button></div><div className="test-trust-line"><ShieldCheck size={16}/> Secure access is planned for patient and provider accounts.</div></div>
      <div className="test-hero-art"><div className="test-art-ring"><HeartPulse size={74}/></div><span className="test-art-badge badge-one"><Pill size={17}/> Pharmacy</span><span className="test-art-badge badge-two"><Truck size={17}/> Delivery</span></div>
    </section>
    <section className="test-landing-services"><div className="eyebrow">CARE IN ONE PLACE</div><h2>From finding care to following up</h2><div className="test-service-strip"><span><Stethoscope size={18}/> Doctor appointments</span><span><Pill size={18}/> Medication orders</span><span><House size={18}/> Homecare services</span><span><Truck size={18}/> Delivery updates</span></div></section>
    <div className="test-warning"><AlertCircle size={19}/><div><strong>Testing environment</strong><p>Demo workspaces use sample data stored in this browser. Real sign-in, shared provider data and live payments are not connected yet. Do not enter real patient information.</p></div></div>
    <footer className="test-landing-footer"><ShieldCheck size={16}/> Production access must be authenticated and authorised by role. Demo access is kept separate from normal patient navigation.</footer>
  </main>;
}

const DEMO_ACCESS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ACCESS === "true";

export function TestingAuth({ onOpenRole, onBack }) {
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  return <main className="test-landing test-auth-page">
    <header className="test-landing-header"><button className="test-auth-brand-button" onClick={onBack}><div className="test-brand"><span><HeartPulse size={24}/></span><div><strong>HealthReachCare</strong><small>Better access. Healthier communities.</small></div></div></button><span className="test-open-chip"><span/> ACCOUNT ACCESS</span></header>
    <button className="test-back-link" onClick={onBack}><ArrowLeft size={16}/> Back to landing page</button>
    <section className="test-auth-layout">
      <div className="test-auth-intro"><div className="eyebrow">WELCOME BACK</div><h1>Sign in to HealthReachCare</h1><p>Access your healthcare workspace securely. Patient, doctor, pharmacy, driver and admin access will use verified accounts and role permissions in production.</p><div className="test-auth-security"><ShieldCheck size={20}/><div><strong>Account security is not switched on yet</strong><span>This build is still in testing. Real sign-in and account creation are not connected; no credentials are accepted or saved.</span></div></div></div>
      <section className="test-auth-card">
        <span className="test-auth-lock"><ShieldCheck size={24}/></span><h2>Sign in or create an account</h2><p>The authentication service must be configured before these actions can be enabled.</p>
        <label>Email address<input type="email" placeholder="you@example.com" disabled autoComplete="email"/></label>
        <label>Password<input type="password" placeholder="Enter your password" disabled autoComplete="current-password"/></label>
        <button className="button button-primary full" disabled>Sign in — not configured</button>
        <button className="test-create-account" disabled>Create an account · coming after authentication setup</button>
        <p className="test-auth-form-note">Do not enter a real password here. These fields are intentionally disabled.</p>
      </section>
    </section>
    <section className="test-auth-demo-section">
      <div className="test-auth-demo-heading"><div><div className="eyebrow">TESTING ONLY</div><h2>Demo workspace access</h2><p>Choose a role to test the current workflows. These demo links are separate from normal patient navigation.</p></div><span className="test-open-chip"><span/> DEMO MODE</span></div>
      {DEMO_ACCESS_ENABLED ? <div className="test-role-grid">{roles.map(role => { const Icon = role.icon; return <button className="test-role-card" key={role.id} onClick={() => onOpenRole(role.id)}><span className={"test-role-icon role-" + role.id}><Icon size={23}/></span><strong>{role.title}</strong><span>{role.description}</span><span className="test-role-link">Open demo workspace <ArrowRight size={15}/></span></button>; })}</div> : <div className="test-warning"><ShieldCheck size={19}/><div><strong>Demo access is disabled in this build</strong><p>For an approved test deployment, set VITE_ENABLE_DEMO_ACCESS=true. Keep it disabled for production and connect real authentication before launch.</p></div></div>}
      {showDemoNotice && <div className="inline-message"><AlertCircle size={18}/><span>Demo workspaces use browser-local test data only. They are not secure for real patient information.</span></div>}
      <button className="test-demo-disclaimer" onClick={() => setShowDemoNotice(value => !value)}><AlertCircle size={15}/> {showDemoNotice ? "Hide demo limitations" : "Read demo limitations"}</button>
    </section>
    <footer className="test-landing-footer"><ShieldCheck size={16}/> No real authentication, authorisation, patient records or payment processing is active in this test build.</footer>
  </main>;
}

export function PatientMedicineShop({ onBack }) {
  const workflow = useTestWorkflow();
  const [cart, setCart] = useState({});
  const [stage, setStage] = useState("catalogue");
  const [patient, setPatient] = useState({ name: "Test Patient", phone: "", address: "", notes: "" });
  const [fulfilment, setFulfilment] = useState("delivery");
  const [method, setMethod] = useState("card_test");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const products = workflow.inventory.filter(item => item.active);
  const cartLines = products.filter(item => Number(cart[item.id]) > 0).map(item => ({ ...item, quantity: Number(cart[item.id]) }));
  const subtotal = cartLines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + (fulfilment === "delivery" ? 35 : 0);
  const orderHistory = useMemo(() => workflow.orders.filter(order => order.testOnly), [workflow.orders]);

  const changeQuantity = (id, quantity) => {
    setCart(current => ({ ...current, [id]: Math.max(0, Math.min(20, Number(quantity) || 0)) }));
    setError("");
  };
  const startCheckout = () => {
    setError("");
    if (!cartLines.length) { setError("Add at least one item to your basket."); return; }
    setStage("details");
  };
  const createOrder = event => {
    event.preventDefault();
    setError("");
    try {
      const order = createTestOrder({ patientName: patient.name, phone: patient.phone, address: patient.address, items: cartLines, fulfilment, notes: patient.notes });
      setCurrentOrder(order);
      setStage("payment");
    } catch (e) { setError(e.message || "The test order could not be created."); }
  };
  const simulatePayment = () => {
    setError("");
    try {
      const payment = recordTestPayment(currentOrder.id, method);
      setCurrentOrder(readWorkflow().orders.find(order => order.id === currentOrder.id) || currentOrder);
      setNotice("Test authorisation recorded. No card details were collected and no money moved.");
      setStage("confirmation");
      if (!payment) setNotice("Test order created. The payment gateway is still disconnected, so no funds moved.");
    } catch (e) { setError(e.message || "Test payment could not be recorded."); }
  };
  const leavePending = () => {
    setNotice("Order saved with payment pending. It will not be released to pharmacy fulfilment until a test authorisation is recorded.");
    setStage("pending");
  };

  return <section className="page-content test-shop-page">
    <button className="test-back-link" onClick={stage === "catalogue" ? onBack : () => { setError(""); setStage(stage === "payment" ? "details" : stage === "details" ? "catalogue" : "catalogue"); }}><ArrowLeft size={16}/> {stage === "catalogue" ? "Back to patient home" : "Back"}</button>
    <div className="test-page-heading"><span className="test-role-icon role-pharmacy"><ShoppingBag size={23}/></span><div><div className="eyebrow">PATIENT PHARMACY</div><h1>{stage === "catalogue" ? "Order medication" : stage === "details" ? "Delivery details" : stage === "payment" ? "Secure checkout preview" : stage === "pending" ? "Payment pending" : "Test order created"}</h1><p>Sample catalogue and test workflow only. No real medication is sold.</p></div><span className="test-open-chip">TEST MODE</span></div>
    <div className="test-payment-note"><ShieldCheck size={18}/><span>Mock payment only. Real payment processing is not connected. Test authorisation is clearly marked and never represents real money collected.</span></div>
    {error && <div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {stage === "catalogue" && <>
      <div className="test-shop-toolbar"><div><h2>Sample pharmacy catalogue</h2><p>Illustrative items and prices for checking the order-to-pharmacy flow.</p></div><button className="button button-outline" onClick={() => setStage("history")}>My test orders ({orderHistory.length})</button></div>
      <div className="test-product-grid">{products.map(product => <article className="test-product-card" key={product.id}><div className="test-product-art"><Pill size={26}/></div><span className="test-product-tag">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div className="test-product-bottom"><strong>{money(product.price)}</strong><small>{product.stock} test units</small></div><div className="test-quantity-control"><button aria-label={"Remove one " + product.name} onClick={() => changeQuantity(product.id, Number(cart[product.id] || 0) - 1)} disabled={!cart[product.id]}>−</button><span>{cart[product.id] || 0}</span><button aria-label={"Add one " + product.name} onClick={() => changeQuantity(product.id, Number(cart[product.id] || 0) + 1)} disabled={Number(cart[product.id] || 0) >= product.stock}>+</button></div></article>)}</div>
      <div className="test-cart-footer"><div><span>{cartLines.reduce((sum, item) => sum + item.quantity, 0)} item(s)</span><strong>{money(subtotal)}</strong></div><button className="button button-primary" onClick={startCheckout}>Continue to checkout <ArrowRight size={16}/></button></div>
    </>}
    {stage === "details" && <form className="test-checkout-layout" onSubmit={createOrder}><div className="test-surface"><h2>Contact and fulfilment</h2><label>Test patient name<input required value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })}/></label><label>Phone number<input required type="tel" value={patient.phone} onChange={e => setPatient({ ...patient, phone: e.target.value })} placeholder="Test number only"/></label><div className="test-choice-row"><label className={fulfilment === "delivery" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")}/><Truck size={18}/><strong>Delivery</strong><small>Illustrative fee R35</small></label><label className={fulfilment === "pickup" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")}/><Package size={18}/><strong>Pickup</strong><small>No delivery fee</small></label></div>{fulfilment === "delivery" && <label>Delivery address<input required value={patient.address} onChange={e => setPatient({ ...patient, address: e.target.value })} placeholder="Test address only"/></label>}<label>Order note (optional)<textarea rows={3} value={patient.notes} onChange={e => setPatient({ ...patient, notes: e.target.value })} placeholder="No sensitive medical information"/></label><button className="button button-primary full" type="submit">Create test order <ArrowRight size={16}/></button></div><OrderSummary items={cartLines} subtotal={subtotal} deliveryFee={fulfilment === "delivery" ? 35 : 0} total={total}/></form>}
    {stage === "payment" && currentOrder && <div className="test-checkout-layout"><div className="test-surface"><div className="test-payment-title"><CreditCard size={24}/><div><h2>Payment method</h2><p>Payment gateway awaiting configuration</p></div></div><div className="test-payment-methods">{[{id:"card_test",title:"Bank card",detail:"Test checkout preview only"},{id:"eft_test",title:"Instant EFT",detail:"Provider connection pending"},{id:"wallet_test",title:"HealthReach wallet",detail:"Wallet payments not connected"}].map(item => <label className={method === item.id ? "test-method selected" : "test-method"} key={item.id}><input type="radio" name="method" checked={method === item.id} onChange={() => setMethod(item.id)}/><span className="test-method-icon"><Wallet size={18}/></span><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}</div><div className="test-payment-note"><AlertCircle size={17}/><span>Do not enter real card details. No payment provider has been called and no real funds will move.</span></div><button className="button button-primary full" onClick={simulatePayment}>Simulate test authorisation <ArrowRight size={16}/></button><button className="button button-outline full" onClick={leavePending}>Leave payment pending</button></div><OrderSummary items={currentOrder.items} subtotal={currentOrder.subtotal} deliveryFee={currentOrder.deliveryFee} total={currentOrder.total} orderId={currentOrder.id}/></div>}
    {(stage === "confirmation" || stage === "pending") && currentOrder && <div className="test-surface test-order-confirmation"><span className="test-confirm-icon">{stage === "confirmation" ? <CheckCircle2 size={34}/> : <Clock3 size={34}/>}</span><h2>{stage === "confirmation" ? "Test payment authorised" : "Waiting for payment setup"}</h2><p>{stage === "confirmation" ? "This is a simulated test authorisation only. No money was collected. The pharmacy can now see this test order." : "Your test order is saved, but payment is pending. The pharmacy must not prepare or release this order."}</p><div className="test-confirm-details"><div><span>Order reference</span><strong>{currentOrder.id}</strong></div><div><span>Order status</span><strong>{statusLabel(readWorkflow().orders.find(order => order.id === currentOrder.id)?.status || currentOrder.status)}</strong></div><div><span>Payment</span><strong>{stage === "confirmation" ? "TEST AUTHORISED — NO FUNDS MOVED" : "PENDING — NOT PAID"}</strong></div><div><span>Total (illustrative)</span><strong>{money(currentOrder.total)}</strong></div></div><button className="button button-primary" onClick={() => { setCart({}); setCurrentOrder(null); setNotice(""); setStage("history"); }}>View order tracking <ArrowRight size={16}/></button></div>}
    {stage === "history" && <div className="test-order-list"><div className="test-shop-toolbar"><div><h2>My test orders</h2><p>Order progress shared with the pharmacy and driver workspaces in this browser.</p></div><button className="button button-outline" onClick={() => setStage("catalogue")}>Back to catalogue</button></div>{orderHistory.length ? orderHistory.map(order => <OrderCard order={order} key={order.id}/>) : <div className="empty-state"><ShoppingBag size={28}/><h3>No test orders yet</h3><p>Create a test order to see the shared workflow.</p></div>}</div>}
    <div className="test-shop-footer"><span>Test data is stored in this browser only.</span><button className="text-button" onClick={onBack}>Return to patient home</button></div>
  </section>;
}

function OrderSummary({ items, subtotal, deliveryFee, total, orderId }) {
  return <aside className="test-surface test-order-summary"><h2>Order summary</h2>{orderId && <p className="test-order-ref">Reference: {orderId}</p>}{items.map((item, index) => <div className="test-summary-line" key={item.productId || item.name + index}><span>{item.quantity} × {item.name}</span><strong>{money(item.lineTotal ?? (item.unitPrice ?? item.price) * item.quantity)}</strong></div>)}<div className="test-summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="test-summary-line"><span>Delivery</span><strong>{deliveryFee ? money(deliveryFee) : "Free"}</strong></div><div className="test-summary-total"><span>Total</span><strong>{money(total)}</strong></div><small>All prices are illustrative test values.</small></aside>;
}

function OrderCard({ order }) {
  return <article className="test-order-card"><div className="test-order-card-head"><div><span className="test-product-tag">TEST ORDER</span><h3>{order.id}</h3><p>{dateTime(order.createdAt)}</p></div><span className={"test-status status-" + order.status}>{statusLabel(order.status)}</span></div><div className="test-order-items">{order.items.map((item, index) => <span key={item.productId || index}>{item.quantity} × {item.name}</span>)}</div><div className="test-order-card-foot"><span>Payment: <strong>{statusLabel(order.paymentStatus)}</strong></span><strong>{money(order.total)}</strong></div></article>;
}

export function TestRoleWorkspace({ role, onBack }) {
  const workflow = useTestWorkflow();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [stockDrafts, setStockDrafts] = useState({});
  const orders = workflow.orders.filter(order => order.testOnly);
  const pendingPayments = workflow.payments.filter(payment => payment.testOnly);
  const bookings = workflow.bookings.filter(item => item.testOnly);
  const meta = roles.find(item => item.id === role) || roles[0];
  const Icon = meta.icon;

  const updateStatus = (order, nextStatus) => {
    setBusy(order.id); setError(""); setNotice("");
    const result = transitionTestOrder(order.id, nextStatus);
    setBusy("");
    setStockDrafts({});
    if (result?.error) setError(result.error);
    else setNotice(`Test order ${order.id} updated to ${statusLabel(nextStatus)}. This is local test data only.`);
  };
  const saveStock = (product) => {
    const value = Number(stockDrafts[product.id] ?? product.stock);
    if (!Number.isInteger(value) || value < 0 || value > 10000) { setError("Enter a whole-number test stock value from 0 to 10,000."); return; }
    const result = updateWorkflow(draft => {
      const item = draft.inventory.find(entry => entry.id === product.id);
      if (!item) return { error: "This test item no longer exists." };
      item.stock = value;
      return { value: item };
    });
    if (result?.error) setError(result.error);
    else { setStockDrafts({}); setError(""); setNotice(`Test stock for ${product.name} saved.`); }
  };

  const actionFor = order => {
    if (order.status === "awaiting_payment") return <span className="test-inline-status">Waiting for payment setup</span>;
    if (order.status === "awaiting_pharmacy") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "accepted")}>Accept test order</button>;
    if (order.status === "accepted") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "preparing")}>Start preparation</button>;
    if (order.status === "preparing") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, order.fulfilment === "pickup" ? "ready_for_pickup" : "ready_for_delivery")}>{order.fulfilment === "pickup" ? "Ready for pickup" : "Ready for delivery"}</button>;
    if (role === "driver" && order.status === "ready_for_delivery") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "out_for_delivery")}>Start delivery</button>;
    if (role === "driver" && order.status === "out_for_delivery") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "delivered")}>Mark delivered</button>;
    return <span className="test-inline-status">{role === "driver" ? "No delivery action" : "In progress"}</span>;
  };

  return <section className="page-content test-workspace-page">
    <button className="test-back-link" onClick={onBack}><ArrowLeft size={16}/> Back to testing landing page</button>
    <div className="test-page-heading"><span className={"test-role-icon role-" + role}><Icon size={23}/></span><div><div className="eyebrow">OPEN TEST WORKSPACE</div><h1>{meta.title} workspace</h1><p>{meta.description}</p></div><span className="test-open-chip">NO LOGIN</span></div>
    <div className="test-payment-note"><ShieldCheck size={18}/><span>Open access is enabled for testing only. This workspace is not protected by role authentication and must not be exposed as a production portal.</span></div>
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {error && <div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {role === "pharmacy" && <>
      <div className="test-metric-grid"><Metric icon={<ClipboardList/>} label="All test orders" value={orders.length}/><Metric icon={<Clock3/>} label="Awaiting pharmacy" value={orders.filter(order => order.status === "awaiting_pharmacy").length}/><Metric icon={<Package/>} label="Preparing" value={orders.filter(order => ["accepted","preparing"].includes(order.status)).length}/><Metric icon={<Truck/>} label="Ready for handoff" value={orders.filter(order => ["ready_for_delivery","ready_for_pickup","out_for_delivery"].includes(order.status)).length}/></div>
      <div className="test-surface"><div className="test-section-head"><div><h2>Test medicine inventory</h2><p>Changes are shared with the patient shop in this browser.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div><div className="test-inventory-table">{workflow.inventory.map(product => <div className="test-inventory-row" key={product.id}><div><strong>{product.name}</strong><small>{product.category} · {money(product.price)} test price</small></div><label>Stock<input type="number" min="0" max="10000" step="1" value={stockDrafts[product.id] ?? product.stock} onChange={e => setStockDrafts({ ...stockDrafts, [product.id]: e.target.value })}/></label><button className="button button-outline" onClick={() => saveStock(product)}>Save stock</button></div>)}</div></div>
      <OrderList title="Patient test orders" orders={orders} actionFor={actionFor}/>
    </>}
    {role === "driver" && <>
      <div className="test-metric-grid"><Metric icon={<Package/>} label="Ready for delivery" value={orders.filter(order => order.status === "ready_for_delivery" && order.fulfilment === "delivery").length}/><Metric icon={<Truck/>} label="Out for delivery" value={orders.filter(order => order.status === "out_for_delivery").length}/><Metric icon={<CheckCircle2/>} label="Delivered (test)" value={orders.filter(order => order.status === "delivered").length}/></div>
      <OrderList title="Delivery queue" orders={orders.filter(order => order.fulfilment === "delivery" && ["ready_for_delivery","out_for_delivery","delivered"].includes(order.status))} actionFor={actionFor}/>
    </>}
    {role === "doctor" && <>
      <div className="test-metric-grid"><Metric icon={<ClipboardList/>} label="Test care requests" value={bookings.length}/><Metric icon={<Clock3/>} label="Awaiting review" value={bookings.filter(item => item.status === "awaiting_provider_review").length}/><Metric icon={<CalendarDaysFallback/>} label="Payment pending" value={bookings.filter(item => item.paymentStatus !== "test_authorized").length}/></div>
      <div className="test-surface"><div className="test-section-head"><div><h2>Appointment and home-care requests</h2><p>Requests saved through the patient booking flow appear here.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div>{bookings.length ? bookings.map(item => <article className="test-order-card" key={item.id}><div className="test-order-card-head"><div><span className="test-product-tag">{String(item.type || "care request").toUpperCase()}</span><h3>{item.patientName || "Test patient"}</h3><p>{item.id} · {dateTime(item.createdAt)}</p></div><span className="test-status status-awaiting_pharmacy">{statusLabel(item.status)}</span></div><p className="test-booking-summary">{item.service || item.doctorName || "Care request"} · {item.date || "Date not set"} {item.time || ""}</p><small>Payment: {statusLabel(item.paymentStatus)} · Test only, not assigned to a real clinician.</small>{item.status === "awaiting_provider_review" && <div className="test-order-actions"><button className="button button-primary" onClick={() => { const result = transitionTestBooking(item.id, "accepted"); if (result?.error) setError(result.error); else setNotice("Test request marked accepted in local test data only."); }}>Accept test request</button><button className="button button-outline" onClick={() => { const result = transitionTestBooking(item.id, "declined"); if (result?.error) setError(result.error); else setNotice("Test request marked declined in local test data only."); }}>Decline</button></div>}</article>) : <Empty title="No test requests yet" description="Create a doctor booking or home-care request from the patient experience."/>}</div>
    </>}
    {role === "admin" && <>
      <div className="test-metric-grid"><Metric icon={<ShoppingBag/>} label="Test orders" value={orders.length}/><Metric icon={<CreditCard/>} label="Test payment records" value={pendingPayments.length}/><Metric icon={<Pill/>} label="Catalogue items" value={workflow.inventory.length}/><Metric icon={<Users/>} label="Care requests" value={bookings.length}/></div>
      <div className="test-surface"><div className="test-section-head"><div><h2>Test order and payment ledger</h2><p>Payment records are test authorisations only; amounts are not collected.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div><OrderList title="" orders={orders} actionFor={order => <span className="test-inline-status">{statusLabel(order.paymentStatus)}</span>}/>{pendingPayments.length > 0 && <div className="test-payment-ledger">{pendingPayments.map(payment => <div key={payment.id}><div><strong>{payment.id}</strong><small>{payment.orderId} · {dateTime(payment.createdAt)}</small></div><span>{statusLabel(payment.status)} · No funds moved</span><strong>{money(payment.amount)}</strong></div>)}</div>}{bookings.length > 0 && <><h3 className="test-subheading">Test care requests</h3>{bookings.map(item => <p className="test-booking-line" key={item.id}>{item.id} · {item.patientName || "Test patient"} · {item.service || item.type} · {statusLabel(item.status)}</p>)}</>}</div>
    </>}
    <div className="test-workspace-footer"><span><ShieldCheck size={16}/> Test data only — no real transactions or provider assignments.</span><button className="text-button" onClick={() => onBack()}>Exit workspace</button></div>
  </section>;
}

function OrderList({ title, orders, actionFor }) {
  return (
    <div className="test-surface">
      <div className="test-section-head">
        <div>
          <h2>{title}</h2>
          <p>Patient orders are shared locally across open test workspaces on this browser origin.</p>
        </div>
      </div>
      {orders.length ? (
        <div className="test-workspace-order-list">
          {orders.map(order => (
            <article className="test-order-card" key={order.id}>
              <div className="test-order-card-head">
                <div>
                  <span className="test-product-tag">{order.id}</span>
                  <h3>{order.patientName}</h3>
                  <p>
                    <MapPin size={13} />{" "}
                    {order.fulfilment === "pickup" ? "Pharmacy pickup" : order.address || "No address supplied"}
                    {" · "}{dateTime(order.createdAt)}
                  </p>
                </div>
                <span className={"test-status status-" + order.status}>{statusLabel(order.status)}</span>
              </div>
              <div className="test-order-items">
                {order.items.map((item, index) => (
                  <span key={item.productId || index}>{item.quantity} × {item.name}</span>
                ))}
              </div>
              <div className="test-order-card-foot">
                <span>Payment: <strong>{statusLabel(order.paymentStatus)}</strong></span>
                <strong>{money(order.total)}</strong>
              </div>
              <div className="test-order-actions">{actionFor(order)}</div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No matching test orders" description="Place an order from the patient workspace to see it arrive here." />
      )}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return <div className="test-metric"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>;
}
function Empty({ title, description }) {
  return <div className="empty-state"><ClipboardList size={27}/><h3>{title}</h3><p>{description}</p></div>;
}
function CalendarDaysFallback() { return <Activity/>; }
