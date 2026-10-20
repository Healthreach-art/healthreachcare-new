import { useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, CreditCard,
  HeartPulse, House, Package, Pill, ShieldCheck, ShoppingBag, Stethoscope,
  Truck, UserRound, Users, Wallet, RefreshCw, AlertCircle, Clock3, MapPin,
  Search, ShoppingCart, X, Banknote, CalendarDays, CircleUserRound, FileText
} from "lucide-react";
import {
  createTestOrder, readWorkflow, recordTestPayment, transitionTestBooking, transitionTestOrder,
  updateWorkflow, useTestWorkflow
} from "./test-workflow.js";
import "./TestingPortal.css";
import "./MedicineShopEnhancements.css";

const money = value => "R" + Number(value || 0).toFixed(2);
const dateTime = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const statusLabel = value => String(value || "pending").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
const roles = [
  { id: "patient", title: "Patient", description: "Browse the test catalogue, place an order and follow its status.", icon: UserRound },
  { id: "doctor", title: "Doctor", description: "Review and respond to patient appointment test requests.", icon: Stethoscope },
  { id: "homecare", title: "Homecare provider", description: "Review and respond to homecare test requests.", icon: House },
  { id: "pharmacy", title: "Pharmacy", description: "Manage test stock, receive patient orders and prepare fulfilment.", icon: Pill },
  { id: "driver", title: "Driver", description: "View delivery-ready orders and update delivery progress.", icon: Truck },
  { id: "admin", title: "Admin", description: "Monitor test orders, payment attempts, stock and requests.", icon: ShieldCheck }
];

export function TestingLanding({ onOpenAuth }) {
  return <main className="test-landing">
    <header className="test-landing-header"><div className="test-brand"><span><HeartPulse size={24}/></span><div><strong>HealthReachCare</strong></div></div><span className="test-open-chip"><span/> HEALTHCARE PLATFORM</span></header>
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
    <header className="test-landing-header"><button className="test-auth-brand-button" onClick={onBack}><div className="test-brand"><span><HeartPulse size={24}/></span><div><strong>HealthReachCare</strong></div></div></button><span className="test-open-chip"><span/> ACCOUNT ACCESS</span></header>
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

const shopCategory = product => {
  const value = (product.name + " " + product.category).toLowerCase();
  if (/paracetamol|pain|fever/.test(value)) return "Pain relief";
  if (/rehydration|hydration|ors/.test(value)) return "Hydration";
  if (/gauze|first aid|wound/.test(value)) return "First aid";
  if (/thermometer|equipment|device/.test(value)) return "Health devices";
  return String(product.category || "Other").replace(/\s+test item/ig, "");
};

export function PatientMedicineShop({ onBack, onOpenActivities }) {
  const workflow = useTestWorkflow();
  const [cart, setCart] = useState({});
  const [stage, setStage] = useState("catalogue");
  const [patient, setPatient] = useState({ name: "Test Patient", phone: "", address: "", notes: "" });
  const [fulfilment, setFulfilment] = useState("delivery");
  const [method, setMethod] = useState("card_test");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const products = workflow.inventory.filter(item => item.active);
  const cartLines = products.filter(item => Number(cart[item.id]) > 0).map(item => ({ ...item, quantity: Number(cart[item.id]) }));
  const categories = ["All", ...Array.from(new Set(products.map(shopCategory)))];
  const visibleProducts = products.filter(product => {
    const matchesCategory = activeCategory === "All" || shopCategory(product) === activeCategory;
    const haystack = [product.name, product.description, shopCategory(product)].join(" ").toLowerCase();
    return matchesCategory && haystack.includes(searchQuery.trim().toLowerCase());
  });
  const itemCount = cartLines.reduce((sum, item) => sum + item.quantity, 0);
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
    setCartOpen(false);
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
    <div className="test-page-heading"><span className="test-role-icon role-pharmacy"><ShoppingBag size={23}/></span><div><div className="eyebrow">PATIENT PHARMACY</div><h1>{stage === "catalogue" ? "Order medication" : stage === "details" ? "Delivery details" : stage === "payment" ? "Secure checkout preview" : stage === "pending" ? "Payment pending" : stage === "history" ? "My test orders" : "Test order created"}</h1><p>Sample catalogue and test workflow only. No real medication is sold.</p></div><span className="test-open-chip">TEST MODE</span></div>
    <div className="test-payment-note"><ShieldCheck size={18}/><span>Preview only: sample products, prices and test orders. Real pharmacy inventory and payment processing are not connected.</span></div>
    {error && <div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}
    {stage === "catalogue" && <>
      <div className="test-shop-toolbar medicine-shop-toolbar">
        <div><h2>Find medication and health essentials</h2><p>Search by name or browse categories. Add items to your basket as you go.</p></div>
        <button className="button button-outline" onClick={() => { setCartOpen(false); setStage("history"); }}>My test orders ({orderHistory.length})</button>
      </div>
      <label className="medicine-search">
        <Search size={19} aria-hidden="true"/>
        <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search medication or health products" aria-label="Search medication or health products"/>
        {searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")}><X size={16}/></button>}
      </label>
      <div className="medicine-category-row" role="group" aria-label="Medicine categories">
        {categories.map(category => <button type="button" key={category} className={activeCategory === category ? "medicine-category active" : "medicine-category"} onClick={() => setActiveCategory(category)}>{category}</button>)}
      </div>
      <div className="medicine-results-heading"><span>{visibleProducts.length} {visibleProducts.length === 1 ? "item" : "items"}</span><span>{activeCategory === "All" ? "All categories" : activeCategory}</span></div>
      {visibleProducts.length ? <div className="test-product-grid medicine-product-grid">{visibleProducts.map(product => <article className="test-product-card medicine-product-card" key={product.id}>
        <div className="test-product-art"><Pill size={26}/></div>
        <span className="test-product-tag">{shopCategory(product)}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="test-product-bottom"><strong>{money(product.price)}</strong><small>{product.stock} test units</small></div>
        <div className="test-quantity-control"><button aria-label={"Remove one " + product.name} onClick={() => changeQuantity(product.id, Number(cart[product.id] || 0) - 1)} disabled={!cart[product.id]}>−</button><span>{cart[product.id] || 0} in basket</span><button aria-label={"Add one " + product.name} onClick={() => changeQuantity(product.id, Number(cart[product.id] || 0) + 1)} disabled={Number(cart[product.id] || 0) >= product.stock}>+</button></div>
      </article>)}</div> : <div className="empty-state medicine-empty"><Search size={28}/><h3>No matching products</h3><p>Try another search or choose a different category.</p><button className="button button-outline" onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>Clear filters</button></div>}
      <button type="button" className="medicine-floating-basket" onClick={() => setCartOpen(open => !open)} aria-expanded={cartOpen} aria-label={"Open basket, " + itemCount + " items"}>
        <span className="medicine-basket-icon"><ShoppingCart size={21}/>{itemCount > 0 && <span className="medicine-basket-count">{itemCount}</span>}</span>
        <span className="medicine-basket-copy"><strong>{itemCount ? "View basket" : "Your basket"}</strong><small>{itemCount} {itemCount === 1 ? "item" : "items"}</small></span>
        <strong className="medicine-basket-total">{money(subtotal)}</strong>
      </button>
      {cartOpen && <div className="medicine-cart-panel" role="dialog" aria-label="Your basket">
        <div className="medicine-cart-head"><div><h2>Your basket</h2><p>{itemCount} {itemCount === 1 ? "item" : "items"}</p></div><button type="button" aria-label="Close basket" onClick={() => setCartOpen(false)}><X size={18}/></button></div>
        {cartLines.length ? <div className="medicine-cart-lines">{cartLines.map(item => <div className="medicine-cart-line" key={item.id}>
          <div className="medicine-cart-item"><strong>{item.name}</strong><small>{money(item.price)} each</small></div>
          <div className="medicine-cart-qty"><button type="button" aria-label={"Remove one " + item.name} onClick={() => changeQuantity(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={"Add one " + item.name} onClick={() => changeQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button></div>
          <strong>{money(item.price * item.quantity)}</strong>
        </div>)}</div> : <div className="medicine-cart-empty"><ShoppingCart size={24}/><p>Your basket is empty. Add products to begin.</p></div>}
        <div className="medicine-cart-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <p className="medicine-cart-note">Delivery or collection details and any applicable fees are shown at checkout.</p>
        <button className="button button-primary full" type="button" disabled={!itemCount} onClick={startCheckout}>Continue to checkout <ArrowRight size={16}/></button>
      </div>}
    </>}
    {stage === "details" && <form className="test-checkout-layout" onSubmit={createOrder}><div className="test-surface"><h2>Contact and fulfilment</h2><label>Test patient name<input required value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })}/></label><label>Phone number<input required type="tel" value={patient.phone} onChange={e => setPatient({ ...patient, phone: e.target.value })} placeholder="Test number only"/></label><div className="test-choice-row"><label className={fulfilment === "delivery" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")}/><Truck size={18}/><strong>Delivery</strong><small>Illustrative fee R35</small></label><label className={fulfilment === "pickup" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")}/><Package size={18}/><strong>Pickup</strong><small>No delivery fee</small></label></div>{fulfilment === "delivery" && <label>Delivery address<input required value={patient.address} onChange={e => setPatient({ ...patient, address: e.target.value })} placeholder="Test address only"/></label>}<label>Order note (optional)<textarea rows={3} value={patient.notes} onChange={e => setPatient({ ...patient, notes: e.target.value })} placeholder="No sensitive medical information"/></label><button className="button button-primary full" type="submit">Continue to payment <ArrowRight size={16}/></button></div><OrderSummary items={cartLines} subtotal={subtotal} deliveryFee={fulfilment === "delivery" ? 35 : 0} total={total}/></form>}
    {stage === "payment" && currentOrder && <div className="test-checkout-layout"><div className="test-surface"><div className="test-payment-title"><CreditCard size={24}/><div><h2>Payment method</h2><p>Payment gateway awaiting configuration</p></div></div><div className="test-payment-methods">{[{id:"card_test",title:"Bank card",detail:"Test checkout preview only"},{id:"eft_test",title:"Instant EFT",detail:"Provider connection pending"},{id:"wallet_test",title:"HealthReach wallet",detail:"Wallet payments not connected"}].map(item => <label className={method === item.id ? "test-method selected" : "test-method"} key={item.id}><input type="radio" name="method" checked={method === item.id} onChange={() => setMethod(item.id)}/><span className="test-method-icon"><Wallet size={18}/></span><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}</div><div className="test-payment-note"><AlertCircle size={17}/><span>Do not enter real card details. No payment provider has been called and no real funds will move.</span></div><button className="button button-primary full" onClick={simulatePayment}>Simulate test authorisation <ArrowRight size={16}/></button><button className="button button-outline full" onClick={leavePending}>Leave payment pending</button></div><OrderSummary items={currentOrder.items} subtotal={currentOrder.subtotal} deliveryFee={currentOrder.deliveryFee} total={currentOrder.total} orderId={currentOrder.id}/></div>}
    {(stage === "confirmation" || stage === "pending") && currentOrder && <div className="test-surface test-order-confirmation"><span className="test-confirm-icon">{stage === "confirmation" ? <CheckCircle2 size={34}/> : <Clock3 size={34}/>}</span><h2>{stage === "confirmation" ? "Test payment authorised" : "Waiting for payment setup"}</h2><p>{stage === "confirmation" ? "This is a simulated test authorisation only. No money was collected. The pharmacy can now see this test order." : "Your test order is saved, but payment is pending. The pharmacy must not prepare or release this order."}</p><div className="test-confirm-details"><div><span>Order reference</span><strong>{currentOrder.id}</strong></div><div><span>Order status</span><strong>{statusLabel(readWorkflow().orders.find(order => order.id === currentOrder.id)?.status || currentOrder.status)}</strong></div><div><span>Payment</span><strong>{stage === "confirmation" ? "TEST AUTHORISED — NO FUNDS MOVED" : "PENDING — NOT PAID"}</strong></div><div><span>Total (illustrative)</span><strong>{money(currentOrder.total)}</strong></div></div><div className="booking-actions"><button className="button button-outline" onClick={() => { setCart({}); setCurrentOrder(null); setNotice(""); setStage("history"); }}>View order tracking <ArrowRight size={16}/></button><button className="button button-primary" onClick={() => onOpenActivities?.()}>View Activities <ArrowRight size={16}/></button></div></div>}
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
      <div className="test-surface"><div className="test-section-head"><div><h2>Test medicine inventory</h2><p>Changes are shared with the patient shop in this browser.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div><div className="test-inventory-table">{workflow.inventory.map(product => <div className="test-inventory-row" key={product.id}><div><strong>{product.name}</strong><small>{product.category} · {money(product.price)} test price · {product.prescriptionRequired ? "Prescription required" : "No prescription flag"}</small></div><label>Stock<input type="number" min="0" max="10000" step="1" value={stockDrafts[product.id] ?? product.stock} onChange={e => setStockDrafts({ ...stockDrafts, [product.id]: e.target.value })}/></label><label className="test-prescription-toggle"><input type="checkbox" checked={product.prescriptionRequired === true} onChange={e => { const result = updateWorkflow(draft => { const item = draft.inventory.find(entry => entry.id === product.id); if (!item) return { error: "This test item no longer exists." }; item.prescriptionRequired = e.target.checked; return { value: item }; }); if (result?.error) setError(result.error); else setNotice(e.target.checked ? "Prescription requirement enabled for this test catalogue item. Checkout will remain blocked until secure prescription verification is connected." : "Prescription requirement disabled for this test catalogue item."); }}/><span>Prescription required</span></label><button className="button button-outline" onClick={() => saveStock(product)}>Save stock</button></div>)}</div></div>
      <OrderList title="Patient test orders" orders={orders} actionFor={actionFor}/>
    </>}
    {role === "driver" && <DriverDashboard workflow={workflow} orders={orders} refresh={workflow.refresh} />}
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

function DriverDashboard({ workflow, orders, refresh }) {
  const [tab, setTab] = useState("home");
  const [online, setOnline] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem("healthreachcare-driver-profile-preview") || '{"fullName":"","phone":"","email":"","vehicleType":"","vehicleRegistration":"","bankName":"","accountHolder":"","accountLastFour":"","notifications":true}'); }
    catch { return {fullName:"",phone:"",email:"",vehicleType:"",vehicleRegistration:"",bankName:"",accountHolder:"",accountLastFour:"",notifications:true}; }
  });
  const ready = orders.filter(order => order.fulfilment === "delivery" && order.status === "ready_for_delivery");
  const active = orders.filter(order => order.fulfilment === "delivery" && order.status === "out_for_delivery" && order.driverId === "local-test-driver");
  const delivered = orders.filter(order => order.fulfilment === "delivery" && order.status === "delivered" && order.driverId === "local-test-driver");
  const earningsFor = order => Number(order.driverEarnings ?? order.deliveryFee ?? 0);
  const total = delivered.reduce((sum,order)=>sum+earningsFor(order),0);
  const today = new Date().toDateString();
  const todayDelivered = delivered.filter(order=>new Date(order.updatedAt||order.createdAt||0).toDateString()===today);
  const updateDelivery = (order, nextStatus) => {
    setBusy(order.id); setError(""); setNotice("");
    const result = updateWorkflow(draft => {
      const item = draft.orders.find(entry=>entry.id===order.id && entry.testOnly);
      if (!item) return {error:"This test delivery no longer exists."};
      const allowed = (item.status==="ready_for_delivery" && nextStatus==="out_for_delivery") || (item.status==="out_for_delivery" && nextStatus==="delivered");
      if (!allowed) return {error:"This test delivery cannot make that status transition."};
      const at = new Date().toISOString();
      item.status=nextStatus; item.driverId="local-test-driver"; item.driverName=profile.fullName||"Local test driver"; item.updatedAt=at;
      item.statusHistory=[...(Array.isArray(item.statusHistory)?item.statusHistory:[]),{status:nextStatus,at,testOnly:true}];
      return {value:item};
    });
    setBusy("");
    if (result?.error) setError(result.error);
    else setNotice("Test delivery updated in this browser only. No patient or pharmacy was notified.");
  };
  const saveProfile = event => {
    event.preventDefault();
    try { window.localStorage.setItem("healthreachcare-driver-profile-preview",JSON.stringify(profile)); setNotice("Profile saved on this device only. It has not been verified or submitted."); setError(""); }
    catch { setError("Could not save this preview profile."); }
  };
  const tabs=[{id:"home",label:"Home",Icon:Truck},{id:"finances",label:"Finances",Icon:Wallet},{id:"account",label:"Account",Icon:CircleUserRound}];
  return <div className="driver-dashboard">
    <div className="driver-preview-banner"><ShieldCheck size={18}/><div><strong>Driver preview workspace</strong><span>Availability, deliveries and finances are local test data. Going online does not dispatch real jobs.</span></div><span className="driver-preview-chip">PREVIEW</span></div>
    <div className="driver-tabs" role="tablist" aria-label="Driver dashboard sections">{tabs.map(item=><button type="button" role="tab" aria-selected={tab===item.id} className={"driver-tab"+(tab===item.id?" active":"")} key={item.id} onClick={()=>setTab(item.id)}><item.Icon size={18}/><span>{item.label}</span></button>)}</div>
    {notice&&<div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}{error&&<div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {tab==="home"&&<>
      <div className="driver-home-hero"><div className="driver-hero-top"><div><div className="eyebrow">YOUR DELIVERY DAY</div><h2>{profile.fullName?"Welcome back, "+profile.fullName.split(" ")[0]:"Ready when you are"}</h2><p>Deliver medicines safely and keep every handover clear.</p></div><span className={"driver-online-status"+(online?" is-online":"")}><span/>{online?"Online · preview":"Offline"}</span></div><div className="driver-online-control"><div><strong>{online?"You’re marked available in preview":"Go online when you’re ready"}</strong><small>{online?"No live dispatch is connected.":"Real delivery requests require an authenticated dispatch service."}</small></div><button type="button" className={"driver-go-button"+(online?" is-online":"")} onClick={()=>setOnline(value=>!value)}>{online?"Go offline":"Go online"} <ArrowRight size={17}/></button></div></div>
      <div className="driver-metric-grid"><div className="driver-metric"><span><Package size={18}/></span><small>Ready for delivery</small><strong>{ready.length}</strong><p>Test orders waiting</p></div><div className="driver-metric"><span><Truck size={18}/></span><small>My active deliveries</small><strong>{active.length}</strong><p>Assigned in preview</p></div><div className="driver-metric"><span><CheckCircle2 size={18}/></span><small>Completed today</small><strong>{todayDelivered.length}</strong><p>Local test records</p></div><div className="driver-metric"><span><Wallet size={18}/></span><small>Recorded earnings</small><strong>{money(total)}</strong><p>Delivery fees only</p></div></div>
      <div className="test-surface driver-queue-surface"><div className="test-section-head"><div><div className="eyebrow">DELIVERY WORK</div><h2>Available deliveries</h2><p>Only orders marked ready for delivery in the shared test workflow appear here.</p></div><button type="button" className="button button-outline" onClick={refresh}><RefreshCw size={15}/> Refresh</button></div>
      {ready.length?ready.map(order=><article className="driver-delivery-card" key={order.id}><div className="driver-delivery-head"><span className="driver-delivery-icon"><Package size={20}/></span><div><strong>{order.id}</strong><small>{(order.items||[]).map(item=>item.name).join(", ")||"Medicine order"} · {dateTime(order.createdAt)}</small></div><span className="test-status status-ready_for_delivery">Ready</span></div><div className="driver-delivery-details"><div><MapPin size={15}/><span><small>Delivery address</small><strong>{order.address||order.deliveryAddress||"Not provided in test order"}</strong></span></div><div><UserRound size={15}/><span><small>Recipient</small><strong>{order.patientName||"Test patient"}</strong></span></div><div><CreditCard size={15}/><span><small>Payment state</small><strong>{statusLabel(order.paymentStatus||"not connected")}</strong></span></div></div><div className="driver-delivery-footer"><span>Reference: {order.id}</span><button type="button" className="button button-primary" disabled={!online||Boolean(busy)} onClick={()=>updateDelivery(order,"out_for_delivery")}>{busy===order.id?"Updating…":"Accept & start test delivery"} <ArrowRight size={16}/></button></div>{!online&&<small className="driver-inline-note">Go online in preview to enable test delivery actions.</small>}</article>):<div className="driver-empty-state"><Package size={28}/><strong>No delivery-ready test orders</strong><p>Orders appear only after the pharmacy marks an order ready. No jobs are fabricated.</p></div>}</div>
      <div className="test-surface"><div className="test-section-head"><div><h2>My active deliveries</h2><p>Mark delivery complete only when the test handover step is complete.</p></div></div>{active.length?active.map(order=><article className="driver-active-row" key={order.id}><div><strong>{order.id}</strong><small>{order.patientName||"Test patient"} · {order.address||order.deliveryAddress||"Address not provided"}</small><span className="test-status status-out_for_delivery">Out for delivery</span></div><button type="button" className="button button-primary" disabled={!online||Boolean(busy)} onClick={()=>updateDelivery(order,"delivered")}>Mark delivered <CheckCircle2 size={16}/></button></article>):<div className="driver-quiet-empty">No active test deliveries assigned to this preview driver.</div>}</div>
      <div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Safe delivery reminder</strong><br/>Confirm the order reference and recipient before handing over medicine. Do not expose patient health details to unauthorised people.</p></div>
    </>}
    {tab==="finances"&&<div className="driver-finance-page"><div className="driver-finance-hero"><div className="eyebrow">FINANCES · TEST LEDGER</div><h2>{money(total)}</h2><p>Recorded test delivery earnings</p><span>Not withdrawable · No payout integration</span></div><div className="driver-metric-grid driver-finance-metrics"><div className="driver-metric"><span><CalendarDays size={18}/></span><small>Today</small><strong>{money(todayDelivered.reduce((sum,order)=>sum+earningsFor(order),0))}</strong><p>Completed test records</p></div><div className="driver-metric"><span><Clock3 size={18}/></span><small>Awaiting settlement</small><strong>{money(0)}</strong><p>No settlement records connected</p></div><div className="driver-metric"><span><Banknote size={18}/></span><small>Completed deliveries</small><strong>{delivered.length}</strong><p>Local test orders only</p></div></div><div className="test-surface"><div className="test-section-head"><div><h2>Delivery earnings history</h2><p>Only explicit driver earnings or delivery fees from completed test orders are included.</p></div></div>{delivered.length?delivered.slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0)).map(order=><div className="driver-finance-row" key={order.id}><span className="driver-finance-row-icon"><FileText size={18}/></span><div><strong>{order.id}</strong><small>{dateTime(order.updatedAt||order.createdAt)} · {order.fulfilment||"delivery"}</small><small>Order total is not treated as driver earnings.</small></div><strong>{money(earningsFor(order))}</strong></div>):<div className="driver-empty-state"><Wallet size={26}/><strong>No completed delivery earnings</strong><p>Completed test deliveries appear here. Real finance requires verified earnings and settlement records.</p></div>}</div><div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Payout setup required</strong><br/>Bank details and withdrawals are not connected. No cash-out action is available in this preview.</p></div></div>}
    {tab==="account"&&<div className="driver-account-page"><div className="driver-profile-card"><span className="driver-avatar"><UserRound size={30}/></span><div><div className="eyebrow">DRIVER PROFILE</div><h2>{profile.fullName||"Your driver profile"}</h2><p>{profile.email||"Add your contact details below"}</p></div><span className="driver-preview-chip">UNVERIFIED PREVIEW</span></div><form className="test-surface driver-account-form" onSubmit={saveProfile}><div className="test-section-head"><div><h2>Personal details</h2><p>Saved only in this browser; not submitted for verification.</p></div><CircleUserRound size={23}/></div><div className="driver-form-grid"><label>Full name<input autoComplete="name" maxLength={100} value={profile.fullName} onChange={event=>setProfile({...profile,fullName:event.target.value})} placeholder="Driver full name"/></label><label>Mobile number<input autoComplete="tel" inputMode="tel" maxLength={25} value={profile.phone} onChange={event=>setProfile({...profile,phone:event.target.value})} placeholder="+27…"/></label><label>Email address<input type="email" autoComplete="email" maxLength={254} value={profile.email} onChange={event=>setProfile({...profile,email:event.target.value})} placeholder="you@example.com"/></label><label>Vehicle type<input maxLength={60} value={profile.vehicleType} onChange={event=>setProfile({...profile,vehicleType:event.target.value})} placeholder="Car, motorbike, bicycle"/></label><label>Vehicle registration<input maxLength={20} value={profile.vehicleRegistration} onChange={event=>setProfile({...profile,vehicleRegistration:event.target.value.toUpperCase()})} placeholder="Optional"/></label></div><div className="driver-document-notice"><FileText size={18}/><div><strong>Driver verification</strong><p>Identity, licence, vehicle, insurance and background checks are not uploaded or verified here. Secure document storage and admin review are required before production.</p></div></div><div className="test-section-head driver-account-section-head"><div><h2>Payout profile</h2><p>Only a masked account suffix is collected for this local prototype. Do not enter full bank details.</p></div><Wallet size={22}/></div><div className="driver-form-grid"><label>Bank name<input maxLength={80} value={profile.bankName} onChange={event=>setProfile({...profile,bankName:event.target.value})} placeholder="Optional"/></label><label>Account holder<input maxLength={100} value={profile.accountHolder} onChange={event=>setProfile({...profile,accountHolder:event.target.value})} placeholder="Optional"/></label><label>Last four digits only<input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={profile.accountLastFour} onChange={event=>setProfile({...profile,accountLastFour:event.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="••••"/></label></div><label className="driver-notification-toggle"><input type="checkbox" checked={profile.notifications} onChange={event=>setProfile({...profile,notifications:event.target.checked})}/><span><strong>Driver updates</strong><small>Preference only; real push notifications are not connected.</small></span></label><button type="submit" className="button button-primary">Save preview profile</button></form><div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Account security</strong><br/>This test workspace has no sign-in or verified driver identity. Do not store sensitive identity or financial information here.</p></div></div>}
  </div>;
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
