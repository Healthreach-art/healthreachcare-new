import { useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, CreditCard,
  HeartPulse, House, Package, Pill, ShieldCheck, ShoppingBag, Stethoscope,
  Truck, UserRound, Users, Wallet, RefreshCw, AlertCircle, Clock3, MapPin, MessageCircle, Send,
  Search, ShoppingCart, X, Banknote, CalendarDays, CircleUserRound, FileText, Save, Mail
} from "lucide-react";
import {
  createTestOrder, readWorkflow, recordTestPayment, sendTestMessage, transitionTestBooking, transitionTestEnquiry, transitionTestOrder, transitionTestPrescription,
  updateWorkflow, useTestWorkflow
} from "./test-workflow.js";
import "./TestingPortal.css";
import "./MedicineShopEnhancements.css";

const money = value => "R" + Number(value || 0).toFixed(2);
const dateTime = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const statusLabel = value => String(value || "pending").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
const roles = [
  { id: "patient", title: "Patient", description: "Browse the catalogue, place an order and follow its status.", icon: UserRound },
  { id: "doctor", title: "Doctor", description: "Review and respond to patient appointment test requests.", icon: Stethoscope },
  { id: "homecare", title: "Homecare provider", description: "Review and respond to homecare test requests.", icon: House },
  { id: "pharmacy", title: "Pharmacy", description: "Manage stock, receive patient orders and prepare fulfilment.", icon: Pill },
  { id: "driver", title: "Driver", description: "View delivery-ready orders and update delivery progress.", icon: Truck },
  { id: "admin", title: "Admin", description: "Monitor orders, payment attempts, stock and requests.", icon: ShieldCheck }
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
  const [paymentOutcome, setPaymentOutcome] = useState("success");
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
    } catch (e) { setError(e.message || "The order could not be created."); }
  };
  const simulatePayment = () => {
    setError("");
    try {
      const payment = recordTestPayment(currentOrder.id, method, paymentOutcome);
      setCurrentOrder(readWorkflow().orders.find(order => order.id === currentOrder.id) || currentOrder);
      setNotice(({success:"Test payment authorised. No card details were collected and no money moved.",pending:"Payment marked pending. Pharmacy fulfilment remains blocked until authorisation succeeds.",failed:"Test payment failed. Retry checkout to create a new attempt; the order is not released to pharmacy.",cancelled:"Test checkout cancelled. No money moved; you can retry when ready."})[paymentOutcome]);
      setStage(paymentOutcome === "success" ? "confirmation" : "pending");
      if (!payment) setNotice("A payment record already exists for this order.");
    } catch (e) { setError(e.message || "Test payment could not be recorded."); }
  };
  const cancelOrder = order => {
    if (!window.confirm("Cancel this sandbox order? If it has a simulated payment, a refund record will be created. No real money moves.")) return;
    setError(""); setNotice("");
    const result = transitionTestOrder(order.id, "cancelled");
    if (result?.error) setError(result.error);
    else {
      setNotice(order.paymentStatus === "test_authorized" ? "Order cancelled. A simulated refund was recorded; no funds moved and any deducted stock was restored." : "Order cancelled in the sandbox.");
      workflow.refresh();
      if (currentOrder?.id === order.id) setCurrentOrder(readWorkflow().orders.find(item=>item.id===order.id)||null);
    }
  };

  const leavePending = () => {
    setNotice("Order saved with payment pending. It will not be released to pharmacy fulfilment until a test authorisation is recorded.");
    setStage("pending");
  };

  return <section className="page-content test-shop-page">
    <button className="test-back-link" onClick={stage === "catalogue" ? onBack : () => { setError(""); setStage(stage === "payment" ? "details" : stage === "details" ? "catalogue" : "catalogue"); }}><ArrowLeft size={16}/> {stage === "catalogue" ? "Back to patient home" : "Back"}</button>
    <div className="test-page-heading"><span className="test-role-icon role-pharmacy"><ShoppingBag size={23}/></span><div><div className="eyebrow">PATIENT PHARMACY</div><h1>{stage === "catalogue" ? "Order medication" : stage === "details" ? "Delivery details" : stage === "payment" ? "Secure checkout preview" : stage === "pending" ? "Payment pending" : stage === "history" ? "My orders" : "Order created"}</h1><p>Sample catalogue and sandbox workflow only. No real medication is sold.</p></div><span className="test-open-chip">SANDBOX</span></div>
    <div className="test-payment-note"><ShieldCheck size={18}/><span>Preview only: sample products, prices and orders. Real pharmacy inventory and payment processing are not connected.</span></div>
    {error && <div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15}/></button></div>}
    {stage === "catalogue" && <>
      <div className="test-shop-toolbar medicine-shop-toolbar">
        <div><h2>Find medication and health essentials</h2><p>Search by name or browse categories. Add items to your basket as you go.</p></div>
        <button className="button button-outline" onClick={() => { setCartOpen(false); setStage("history"); }}>My orders ({orderHistory.length})</button>
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
        <div className="test-product-bottom"><strong>{money(product.price)}</strong><small>{product.stock} available units</small></div>
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
    {stage === "details" && <form className="test-checkout-layout" onSubmit={createOrder}><div className="test-surface"><h2>Contact and fulfilment</h2><label>Patient name (sandbox)<input required value={patient.name} onChange={e => setPatient({ ...patient, name: e.target.value })}/></label><label>Phone number<input required type="tel" value={patient.phone} onChange={e => setPatient({ ...patient, phone: e.target.value })} placeholder="Test number only"/></label><div className="test-choice-row"><label className={fulfilment === "delivery" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")}/><Truck size={18}/><strong>Delivery</strong><small>Illustrative fee R35</small></label><label className={fulfilment === "pickup" ? "test-choice selected" : "test-choice"}><input type="radio" name="fulfilment" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")}/><Package size={18}/><strong>Pickup</strong><small>No delivery fee</small></label></div>{fulfilment === "delivery" && <label>Delivery address<input required value={patient.address} onChange={e => setPatient({ ...patient, address: e.target.value })} placeholder="Test address only"/></label>}<label>Order note (optional)<textarea rows={3} value={patient.notes} onChange={e => setPatient({ ...patient, notes: e.target.value })} placeholder="No sensitive medical information"/></label><button className="button button-primary full" type="submit">Continue to payment <ArrowRight size={16}/></button></div><OrderSummary items={cartLines} subtotal={subtotal} deliveryFee={fulfilment === "delivery" ? 35 : 0} total={total}/></form>}
    {stage === "payment" && currentOrder && <div className="test-checkout-layout"><div className="test-surface"><div className="test-payment-title"><CreditCard size={24}/><div><h2>Payment method</h2><p>Payment gateway awaiting configuration</p></div></div><div className="test-payment-methods">{[{id:"card_test",title:"Bank card",detail:"Test checkout preview only"},{id:"eft_test",title:"Instant EFT",detail:"Provider connection pending"},{id:"wallet_test",title:"HealthReach wallet",detail:"Wallet payments not connected"}].map(item => <label className={method === item.id ? "test-method selected" : "test-method"} key={item.id}><input type="radio" name="method" checked={method === item.id} onChange={() => setMethod(item.id)}/><span className="test-method-icon"><Wallet size={18}/></span><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}</div><div className="test-payment-note"><AlertCircle size={17}/><span>Do not enter real card details. No payment provider has been called and no real funds will move.</span></div><label className="test-payment-outcome-field">Simulated gateway outcome<select value={paymentOutcome} onChange={event=>setPaymentOutcome(event.target.value)}><option value="success">Successful authorisation</option><option value="pending">Pending / awaiting callback</option><option value="failed">Declined / failed</option><option value="cancelled">Customer cancelled checkout</option></select></label><button className="button button-primary full" onClick={simulatePayment}>{paymentOutcome==="success"?"Authorise test payment":paymentOutcome==="pending"?"Simulate pending payment":paymentOutcome==="failed"?"Simulate payment failure":"Cancel test checkout"} <ArrowRight size={16}/></button><button className="button button-outline full" onClick={leavePending}>Save order without attempting payment</button></div><OrderSummary items={currentOrder.items} subtotal={currentOrder.subtotal} deliveryFee={currentOrder.deliveryFee} total={currentOrder.total} orderId={currentOrder.id}/></div>}
    {(stage === "confirmation" || stage === "pending") && currentOrder && <div className="test-surface test-order-confirmation"><span className="test-confirm-icon">{currentOrder.paymentStatus === "test_authorized" ? <CheckCircle2 size={34}/> : currentOrder.paymentStatus === "test_failed" ? <AlertCircle size={34}/> : <Clock3 size={34}/>}</span><h2>{currentOrder.paymentStatus === "test_authorized" ? "Payment authorised in sandbox" : currentOrder.paymentStatus === "test_failed" ? "Payment was declined" : currentOrder.paymentStatus === "test_cancelled" ? "Checkout cancelled" : "Payment is pending"}</h2><p>{currentOrder.paymentStatus === "test_authorized" ? "This is a simulated test authorisation only. No money was collected. The pharmacy can now see this order." : currentOrder.paymentStatus === "test_failed" ? "The simulated gateway declined this attempt. Your order remains saved, but pharmacy preparation is blocked until a successful test authorisation." : currentOrder.paymentStatus === "test_cancelled" ? "You cancelled the simulated checkout. No money moved. You can retry whenever you are ready." : "Your order is saved, but payment has not been authorised. The pharmacy must not prepare or release this order."}</p><div className="test-confirm-details"><div><span>Order reference</span><strong>{currentOrder.id}</strong></div><div><span>Order status</span><strong>{statusLabel(readWorkflow().orders.find(order => order.id === currentOrder.id)?.status || currentOrder.status)}</strong></div><div><span>Payment</span><strong>{statusLabel(currentOrder.paymentStatus)} — NO FUNDS MOVED</strong></div><div><span>Total (illustrative)</span><strong>{money(currentOrder.total)}</strong></div></div><div className="booking-actions"><button className="button button-outline" onClick={() => { setCart({}); setCurrentOrder(null); setNotice(""); setStage("history"); }}>View order tracking <ArrowRight size={16}/></button>{currentOrder.paymentStatus !== "test_authorized" && currentOrder.status !== "cancelled" && <button className="button button-primary" onClick={() => { setNotice(""); setError(""); setStage("payment"); }}>Retry checkout <ArrowRight size={16}/></button>}<button className="button button-outline" onClick={() => onOpenActivities?.()}>View Activities <ArrowRight size={16}/></button></div></div>}
    {stage === "history" && <div className="test-order-list"><div className="test-shop-toolbar"><div><h2>My orders</h2><p>Order progress shared with the pharmacy and driver workspaces in this browser.</p></div><button className="button button-outline" onClick={() => setStage("catalogue")}>Back to catalogue</button></div>{orderHistory.length ? orderHistory.map(order => <OrderCard order={order} key={order.id} onCancel={cancelOrder}/>) : <div className="empty-state"><ShoppingBag size={28}/><h3>No orders yet</h3><p>Create a order to see the shared workflow.</p></div>}</div>}
    <div className="test-shop-footer"><span>Sandbox data is stored in this browser only.</span><button className="text-button" onClick={onBack}>Return to patient home</button></div>
  </section>;
}
function OrderSummary({ items, subtotal, deliveryFee, total, orderId }) {
  return <aside className="test-surface test-order-summary"><h2>Order summary</h2>{orderId && <p className="test-order-ref">Reference: {orderId}</p>}{items.map((item, index) => <div className="test-summary-line" key={item.productId || item.name + index}><span>{item.quantity} × {item.name}</span><strong>{money(item.lineTotal ?? (item.unitPrice ?? item.price) * item.quantity)}</strong></div>)}<div className="test-summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div className="test-summary-line"><span>Delivery</span><strong>{deliveryFee ? money(deliveryFee) : "Free"}</strong></div><div className="test-summary-total"><span>Total</span><strong>{money(total)}</strong></div><small>All prices are illustrative test values.</small></aside>;
}

function OrderCard({ order, onCancel }) {
  return <article className="test-order-card"><div className="test-order-card-head"><div><span className="test-product-tag">MEDICATION ORDER</span><h3>{order.id}</h3><p>{dateTime(order.createdAt)}</p></div><span className={"test-status status-" + order.status}>{statusLabel(order.status)}</span></div><div className="test-order-items">{order.items.map((item, index) => <span key={item.productId || index}>{item.quantity} × {item.name}</span>)}</div><div className="test-order-card-foot"><span>Payment: <strong>{statusLabel(order.paymentStatus)}</strong></span><strong>{money(order.total)}</strong></div>{["awaiting_payment","awaiting_pharmacy","accepted","preparing"].includes(order.status)&&<button type="button" className="button button-outline" onClick={()=>onCancel?.(order)}>Cancel order{order.paymentStatus==="test_authorized"?" · simulate refund":""}</button>}{order.paymentStatus==="test_refunded"&&<small>Simulated refund recorded · {order.refundId || "reference unavailable"} · no funds moved.</small>}</article>;
}

export function TestRoleWorkspace({ role, onBack }) {
  const workflow = useTestWorkflow();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [stockDrafts, setStockDrafts] = useState({});
  const [orderMessageDrafts, setOrderMessageDrafts] = useState({});
  const [orderMessageErrors, setOrderMessageErrors] = useState({});
  const orders = workflow.orders.filter(order => order.testOnly);
  const pendingPayments = workflow.payments.filter(payment => payment.testOnly);
  const bookings = workflow.bookings.filter(item => item.testOnly);
  const prescriptions = (workflow.prescriptions || []).filter(item => item.testOnly);
  const meta = roles.find(item => item.id === role) || roles[0];
  const Icon = meta.icon;

  const sendPharmacyMessage = order => {
    const body = String(orderMessageDrafts[order.id] || "").trim();
    const result = sendTestMessage({ requestId: order.id, requestType: "order", senderRole: "pharmacy", senderName: "Pharmacy workspace", body });
    if (result?.error) { setOrderMessageErrors(current=>({...current,[order.id]:result.error})); return; }
    setOrderMessageDrafts(current=>({...current,[order.id]:""}));
    setOrderMessageErrors(current=>({...current,[order.id]:""}));
    setNotice("Message saved to this test order's conversation. No SMS, email or push notification was sent.");
    workflow.refresh();
  };

  const updateStatus = (order, nextStatus) => {
    setBusy(order.id); setError(""); setNotice("");
    const result = transitionTestOrder(order.id, nextStatus);
    setBusy("");
    setStockDrafts({});
    if (result?.error) setError(result.error);
    else setNotice(nextStatus === "cancelled" ? `Order ${order.id} cancelled in the sandbox. Any test payment was marked refunded and deducted stock was restored. No funds moved.` : `Order ${order.id} updated to ${statusLabel(nextStatus)} in the sandbox.`);
  };
  const reviewPrescription = (item, nextStatus) => {
    const result = transitionTestPrescription(item.id, nextStatus, nextStatus === "needs_information" ? "Please provide a clearer sample document in the sandbox." : nextStatus === "rejected" ? "Sandbox review rejected this sample." : "Sample review step completed. This does not authorise real dispensing.");
    if (result?.error) setError(result.error);
    else { setError(""); setNotice("Prescription " + item.id + " moved to " + statusLabel(nextStatus) + ". No document was opened, uploaded or approved for real dispensing."); }
  };

  const saveStock = (product) => {
    const value = Number(stockDrafts[product.id] ?? product.stock);
    if (!Number.isInteger(value) || value < 0 || value > 10000) { setError("Enter a whole-number stock value from 0 to 10,000."); return; }
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
    if (role === "driver") {
      if (order.fulfilment !== "delivery") return <span className="test-inline-status">Pickup order · not a driver delivery</span>;
      if (order.status === "ready_for_delivery") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "out_for_delivery")}>Start delivery</button>;
      if (order.status === "out_for_delivery") return <button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "delivered")}>Mark delivered</button>;
      if (order.status === "delivered") return <span className="test-inline-status">Delivery completed</span>;
      if (order.status === "cancelled") return <span className="test-inline-status">Order cancelled</span>;
      return <span className="test-inline-status">Waiting for pharmacy handoff</span>;
    }
    if (order.status === "awaiting_payment") return <span className="test-inline-status">Waiting for payment setup</span>;
    if (order.status === "awaiting_pharmacy") return <div className="test-order-actions"><button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "accepted")}>Accept order</button><button className="button button-outline" disabled={Boolean(busy)} onClick={() => updateStatus(order, "cancelled")}>Decline order</button></div>;
    if (order.status === "accepted") return <div className="test-order-actions"><button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, "preparing")}>Start preparation</button><button className="button button-outline" disabled={Boolean(busy)} onClick={() => updateStatus(order, "cancelled")}>Cancel order</button></div>;
    if (order.status === "preparing") return <div className="test-order-actions"><button className="button button-primary" disabled={Boolean(busy)} onClick={() => updateStatus(order, order.fulfilment === "pickup" ? "ready_for_pickup" : "ready_for_delivery")}>{order.fulfilment === "pickup" ? "Ready for pickup" : "Ready for delivery"}</button><button className="button button-outline" disabled={Boolean(busy)} onClick={() => updateStatus(order, "cancelled")}>Cancel & restock</button></div>;
    return <span className="test-inline-status">In progress</span>;
  };

  return <section className="page-content test-workspace-page">
    <button className="test-back-link" onClick={onBack}><ArrowLeft size={16}/> Back to testing landing page</button>
    {role === "driver" ? <div className="courier-app-heading"><div className="courier-heading-copy"><span className="courier-kicker">HEALTHREACHCARE COURIER</span><h1>Driver</h1><p>Go online, pick up pharmacy orders and complete safe deliveries.</p></div><span className="courier-open-chip"><span/> TEST MODE · NO LOGIN</span></div> : <div className="test-page-heading"><span className={"test-role-icon role-" + role}><Icon size={23}/></span><div><div className="eyebrow">OPEN TEST WORKSPACE</div><h1>{meta.title} workspace</h1><p>{meta.description}</p></div><span className="test-open-chip">NO LOGIN</span></div>}
    <div className={role === "driver" ? "test-payment-note courier-security-note" : "test-payment-note"}><ShieldCheck size={18}/><span>Open access is enabled for testing only. This workspace is not protected by role authentication and must not be exposed as a production portal.</span></div>
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {error && <div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {role === "pharmacy" && <>
      <div className="test-metric-grid"><Metric icon={<ClipboardList/>} label="All orders" value={orders.length}/><Metric icon={<Clock3/>} label="Awaiting pharmacy" value={orders.filter(order => order.status === "awaiting_pharmacy").length}/><Metric icon={<Package/>} label="Preparing" value={orders.filter(order => ["accepted","preparing"].includes(order.status)).length}/><Metric icon={<Truck/>} label="Ready for handoff" value={orders.filter(order => ["ready_for_delivery","ready_for_pickup","out_for_delivery"].includes(order.status)).length}/><Metric icon={<FileText/>} label="Prescription reviews" value={prescriptions.filter(item => item.status === "awaiting_pharmacy_review").length}/></div>
      <div className="staff-tab-row" role="tablist" aria-label="Pharmacy sections">{[["orders","Orders"],["medicines","Medicines"],["prescriptions","Prescriptions"],["finance","Finance"],["settings","Settings"]].map(([id,label])=><button type="button" role="tab" aria-selected={pharmacyTab===id} className={pharmacyTab===id?"active":""} key={id} onClick={()=>setPharmacyTab(id)}>{label}</button>)}</div>
      {pharmacyTab==="orders" && <OrderList title="Patient orders" orders={orders} actionFor={actionFor} messages={workflow.messages} messageDrafts={orderMessageDrafts} messageErrors={orderMessageErrors} onMessageDraftChange={(id,value)=>{setOrderMessageDrafts(current=>({...current,[id]:value}));setOrderMessageErrors(current=>({...current,[id]:""}));}} onSendMessage={sendPharmacyMessage}/>}
      {pharmacyTab==="medicines" && <div className="test-surface"><div className="test-section-head"><div><h2>Medicine catalogue and stock</h2><p>Stock changes update the shared patient catalogue and are deducted once when pharmacy preparation begins.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div><div className="test-inventory-table">{workflow.inventory.map(product => <div className="test-inventory-row" key={product.id}><div><strong>{product.name}</strong><small>{product.category} · {money(product.price)} test price · {product.prescriptionRequired ? "Prescription required" : "No prescription flag"}</small></div><label>Stock<input type="number" min="0" max="10000" step="1" value={stockDrafts[product.id] ?? product.stock} onChange={e => setStockDrafts({ ...stockDrafts, [product.id]: e.target.value })}/></label><label className="test-prescription-toggle"><input type="checkbox" checked={product.prescriptionRequired === true} onChange={e => { const result = updateWorkflow(draft => { const item = draft.inventory.find(entry => entry.id === product.id); if (!item) return { error: "This test item no longer exists." }; item.prescriptionRequired = e.target.checked; return { value: item }; }); if (result?.error) setError(result.error); else setNotice(e.target.checked ? "Prescription requirement enabled for this catalogue item. Checkout will remain blocked until secure prescription verification is connected." : "Prescription requirement disabled for this catalogue item."); }}/><span>Prescription required</span></label><button className="button button-outline" onClick={() => saveStock(product)}>Save stock</button></div>)}</div></div>}
      {pharmacyTab==="prescriptions" && <div className="test-surface"><div className="test-section-head"><div><h2>Prescription review queue</h2><p>Review simulated intake metadata. File contents are not stored or visible to pharmacy staff in this preview.</p></div><span className="test-open-chip">SANDBOX</span></div>{prescriptions.length ? prescriptions.map(item=><article className="test-order-card" key={item.id}><div className="test-order-card-head"><div><span className="test-product-tag">PRESCRIPTION INTAKE</span><h3>{item.id}</h3><p>{item.patientName} · {dateTime(item.createdAt)}</p></div><span className={"test-status status-" + item.status}>{statusLabel(item.status)}</span></div><div className="test-booking-summary"><strong>File metadata:</strong> {item.fileName} · {item.fileType} · {Math.max(1,Math.round(item.fileSize/1024))} KB</div><small>Metadata only — no file uploaded or stored. Never use this sample approval for real dispensing.</small>{item.notes&&<p>{item.notes}</p>}{item.reviewNote&&<p><strong>Review note:</strong> {item.reviewNote}</p>}{["awaiting_pharmacy_review","needs_information"].includes(item.status)&&<div className="test-order-actions"><button className="button button-primary" onClick={()=>reviewPrescription(item,"approved_for_test")}>Complete sample review</button><button className="button button-outline" onClick={()=>reviewPrescription(item,"needs_information")}>Request clearer sample</button><button className="button button-outline" onClick={()=>reviewPrescription(item,"rejected")}>Reject sample</button></div>}</article>) : <Empty title="No prescription requests" description="Use Patient → Upload Prescription to create a sample intake. The request will appear here in the same browser."/>}</div>}
      {pharmacyTab==="finance" && <div className="test-surface"><div className="test-section-head"><div><h2>Finance overview</h2><p>Reconciled sandbox ledger only. These are not settlements or real money.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div><div className="test-metric-grid"><Metric icon={<Banknote/>} label="Authorised test value" value={money(workflow.payments.filter(p=>p.testOnly&&p.status==="test_authorized"&&p.type!=="refund").reduce((sum,p)=>sum+Number(p.amount||0),0))}/><Metric icon={<Wallet/>} label="Refund records" value={workflow.payments.filter(p=>p.testOnly&&(p.type==="refund"||p.status==="test_refunded")).length}/><Metric icon={<ShoppingBag/>} label="Completed orders" value={orders.filter(o=>o.status==="delivered"||o.status==="ready_for_pickup").length}/></div><p className="muted small">No payout, bank settlement, fee deduction or real payment confirmation is configured. Each value comes from the local test ledger.</p>{workflow.payments.filter(p=>p.testOnly&&(p.orderId||p.type==="refund")).length>0?<div className="test-payment-ledger">{workflow.payments.filter(p=>p.testOnly&&(p.orderId||p.type==="refund")).map(p=><div key={p.id}><div><strong>{p.id}</strong><small>{p.orderId||"Refund"} · {dateTime(p.createdAt)}</small></div><span>{statusLabel(p.status)} · No funds moved</span><strong>{money(p.amount)}</strong></div>)}</div>:<Empty title="No finance records yet" description="Medication checkout and cancellation records will appear here."/>}</div>}
      {pharmacyTab==="settings" && <div className="test-surface"><div className="test-section-head"><div><h2>Pharmacy workspace settings</h2><p>Saved to this browser for the staff-preview workflow.</p></div></div><form className="pharmacy-settings-form" onSubmit={event=>{event.preventDefault();try{window.localStorage.setItem("healthreachcare-pharmacy-settings-preview",JSON.stringify(pharmacySettings));setNotice("Pharmacy preview settings saved locally. They are not synced to a server.");setError("");}catch{setError("Could not save pharmacy settings in this browser.");}}}><label>Pharmacy / branch name<input value={pharmacySettings.branchName||""} onChange={event=>setPharmacySettings(v=>({...v,branchName:event.target.value}))} maxLength={120} placeholder="Test pharmacy branch"/></label><label>Contact phone<input type="tel" value={pharmacySettings.phone||""} onChange={event=>setPharmacySettings(v=>({...v,phone:event.target.value}))} maxLength={40} placeholder="Test contact number"/></label><label>Contact email<input type="email" value={pharmacySettings.email||""} onChange={event=>setPharmacySettings(v=>({...v,email:event.target.value}))} maxLength={160} placeholder="pharmacy@example.test"/></label><label>Fulfilment preference<select value={pharmacySettings.fulfilment||"both"} onChange={event=>setPharmacySettings(v=>({...v,fulfilment:event.target.value}))}><option value="both">Delivery and pickup</option><option value="delivery">Delivery only</option><option value="pickup">Pickup only</option></select></label><label className="pharmacy-settings-toggle"><input type="checkbox" checked={pharmacySettings.acceptingOrders!==false} onChange={event=>setPharmacySettings(v=>({...v,acceptingOrders:event.target.checked}))}/> Accept new test orders</label><button className="button button-primary" type="submit"><Save size={16}/> Save settings</button><p className="muted small">Verification, branch access control, staff permissions and server-side order routing are not connected in this preview.</p></form></div>}
    </>}
    {role === "driver" && <DriverDashboard workflow={workflow} orders={orders} refresh={workflow.refresh} />}
    {role === "doctor" && <>
      <div className="test-metric-grid"><Metric icon={<ClipboardList/>} label="Test care requests" value={bookings.length}/><Metric icon={<Clock3/>} label="Awaiting review" value={bookings.filter(item => item.status === "awaiting_provider_review").length}/><Metric icon={<CalendarDaysFallback/>} label="Payment pending" value={bookings.filter(item => item.paymentStatus !== "test_authorized").length}/></div>
      <div className="test-surface"><div className="test-section-head"><div><h2>Appointment and home-care requests</h2><p>Requests saved through the patient booking flow appear here.</p></div><button className="button button-outline" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div>{bookings.length ? bookings.map(item => <article className="test-order-card" key={item.id}><div className="test-order-card-head"><div><span className="test-product-tag">{String(item.type || "care request").toUpperCase()}</span><h3>{item.patientName || "Test patient"}</h3><p>{item.id} · {dateTime(item.createdAt)}</p></div><span className="test-status status-awaiting_pharmacy">{statusLabel(item.status)}</span></div><p className="test-booking-summary">{item.service || item.doctorName || "Care request"} · {item.date || "Date not set"} {item.time || ""}</p><small>Payment: {statusLabel(item.paymentStatus)} · Test only, not assigned to a real clinician.</small>{item.status === "awaiting_provider_review" && <div className="test-order-actions"><button className="button button-primary" onClick={() => { const result = transitionTestBooking(item.id, "accepted"); if (result?.error) setError(result.error); else setNotice("Test request marked accepted in local test data only."); }}>Accept test request</button><button className="button button-outline" onClick={() => { const result = transitionTestBooking(item.id, "declined"); if (result?.error) setError(result.error); else setNotice("Test request marked declined in local test data only."); }}>Decline</button></div>}</article>) : <Empty title="No test requests yet" description="Create a doctor booking or home-care request from the patient experience."/>}</div>
    </>}
    {role === "admin" && <AdminDashboard workflow={workflow} orders={orders} payments={pendingPayments} bookings={bookings} prescriptions={prescriptions}/>}
    <div className="test-workspace-footer"><span><ShieldCheck size={16}/> Test data only — no real transactions or provider assignments.</span><button className="text-button" onClick={() => onBack()}>Exit workspace</button></div>
  </section>;
}


function AdminDashboard({workflow,orders,payments,bookings,prescriptions}) {
 const [tab,setTab]=useState("overview");
 const [query,setQuery]=useState("");
 const [stock,setStock]=useState({});
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const messages=workflow.messages||[], reviews=workflow.reviews||[], enquiries=workflow.enquiries||[];
 const auth=payments.filter(p=>p.status==="test_authorized"&&p.type!=="refund").length;
 const refunds=payments.filter(p=>p.type==="refund"||p.status==="test_refunded").length;
 const match=(...values)=>values.some(v=>String(v||"").toLowerCase().includes(query.toLowerCase().trim()));
 const visibleOrders=orders.filter(o=>match(o.id,o.patientName,o.status,o.paymentStatus));
 const visiblePayments=payments.filter(p=>match(p.id,p.orderId,p.bookingId,p.status,p.method,p.provider));
 const updateEnquiry=(item,status)=>{const result=transitionTestEnquiry(item.id,status);if(result?.error)setError(result.error);else{setError("");setNotice("Enquiry "+item.id+" moved to "+statusLabel(status)+".");workflow.refresh();}};
 const saveStock=product=>{
  const value=Number(stock[product.id]??product.stock);
  if(!Number.isInteger(value)||value<0||value>10000){setError("Stock must be a whole number from 0 to 10,000.");return;}
  const result=updateWorkflow(d=>{const item=d.inventory.find(x=>x.id===product.id);if(!item)return {error:"Catalogue item not found."};item.stock=value;return {value:item};});
  if(result?.error)setError(result.error);else{setError("");setNotice("Test stock saved for "+product.name+".");workflow.refresh();}
 };
 const tabs=[["overview","Overview"],["orders","Orders"],["payments","Payments & refunds"],["care","Care requests"],["inventory","Catalogue & stock"],["prescriptions","Prescriptions"],["enquiries","Patient enquiries"],["activity","Activity & messages"]];
 return <div className="admin-console">
  <div className="test-payment-note"><ShieldCheck size={18}/><span><strong>Operations preview.</strong> Records are browser-local simulations. This console does not authorise production access, real payments, dispensing or provider verification.</span></div>
  <div className="test-metric-grid"><Metric icon={<ShoppingBag/>} label="Orders" value={orders.length}/><Metric icon={<CreditCard/>} label="Payment attempts" value={payments.length}/><Metric icon={<Wallet/>} label="Test refunds" value={refunds}/><Metric icon={<Users/>} label="Care requests" value={bookings.length}/><Metric icon={<FileText/>} label="Prescription intakes" value={prescriptions.length}/><Metric icon={<MessageCircle/>} label="Messages" value={messages.length}/><Metric icon={<Mail/>} label="Open enquiries" value={enquiries.filter(e=>e.status==="awaiting_admin_review").length}/></div>
  <div className="admin-tab-row" role="tablist" aria-label="Admin sections">{tabs.map(([id,label])=><button type="button" role="tab" aria-selected={tab===id} className={tab===id?"active":""} key={id} onClick={()=>{setTab(id);setError("");}}>{label}</button>)}</div>
  <label className="admin-search"><Search size={16}/><input aria-label="Search admin records" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search references, names or statuses"/></label>
  {notice&&<div className="inline-message"><CheckCircle2 size={17}/><span>{notice}</span></div>}{error&&<div className="inline-message test-error"><AlertCircle size={17}/><span>{error}</span></div>}
  {tab==="overview"&&<div className="test-surface"><h2>Platform overview</h2><div className="admin-stat-list">{[["Authorised test payments",auth],["Pending orders",orders.filter(o=>["awaiting_payment","awaiting_pharmacy"].includes(o.status)).length],["Preparing orders",orders.filter(o=>["accepted","preparing"].includes(o.status)).length],["Deliveries in progress",orders.filter(o=>o.status==="out_for_delivery").length],["Awaiting provider review",bookings.filter(b=>b.status==="awaiting_provider_review").length],["Completed care requests",bookings.filter(b=>b.status==="completed").length],["Customer reviews",reviews.length]].map(([label,value])=><p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div><p className="muted small">Auth, shared server database, payment gateway callbacks and external notifications are not configured in this preview.</p></div>}
  {tab==="orders"&&<div className="test-surface"><h2>Medication order ledger</h2>{visibleOrders.length?<OrderList title="" orders={visibleOrders} actionFor={o=><span className="test-inline-status">{statusLabel(o.status)} · {statusLabel(o.paymentStatus)}</span>}/>:<Empty title="No matching orders" description="Create an order from the patient medicine shop."/>}</div>}
  {tab==="payments"&&<div className="test-surface"><h2>Payment attempts and refunds</h2><p className="muted small">{auth} authorised · {refunds} refund records · no funds moved.</p>{visiblePayments.length?<div className="test-payment-ledger">{visiblePayments.map(p=><div key={p.id}><div><strong>{p.id}</strong><small>{p.orderId||p.bookingId||"Unlinked"} · {dateTime(p.createdAt)} · {p.method||"No method"}</small></div><span>{statusLabel(p.status)} · {p.provider||"simulated"}</span><strong>{money(p.amount)}</strong></div>)}</div>:<Empty title="No payments" description="Checkout attempts appear here."/>}</div>}
  {tab==="care"&&<div className="test-surface"><h2>Doctor and homecare requests</h2>{bookings.filter(b=>match(b.id,b.patientName,b.service,b.serviceType,b.status)).map(b=><article className="admin-record-card" key={b.id}><div><strong>{b.id}</strong><span>{b.patientName||"Test patient"} · {b.serviceType||b.service||b.type}</span><small>{b.providerName||"No provider assigned"} · {b.requestedDate||b.date||"Date not set"} {b.requestedTime||b.time||""}</small></div><span className="test-inline-status">{statusLabel(b.status)} · {statusLabel(b.paymentStatus)}</span></article>)}</div>}
  {tab==="inventory"&&<div className="test-surface"><h2>Catalogue and stock</h2>{workflow.inventory.map(p=><article className="admin-inventory-row" key={p.id}><div><strong>{p.name}</strong><small>{money(p.price)} · {p.active===false?"Inactive":"Active"} · {p.prescriptionRequired?"Prescription required":"No prescription flag"}</small></div><label>Stock<input type="number" min="0" max="10000" value={stock[p.id]??p.stock} onChange={e=>setStock(v=>({...v,[p.id]:e.target.value}))}/></label><button className="button button-outline" onClick={()=>saveStock(p)}>Save stock</button><button className="button button-outline" onClick={()=>{const r=updateWorkflow(d=>{const item=d.inventory.find(x=>x.id===p.id);if(!item)return {error:"Item not found"};item.active=item.active===false;return {value:item};});if(r?.error)setError(r.error);else{setNotice("Catalogue availability updated in test data.");workflow.refresh();}}}>{p.active===false?"Reactivate":"Deactivate"}</button></article>)}</div>}
  {tab==="prescriptions"&&<div className="test-surface"><h2>Prescription intake queue</h2><p className="muted small">Metadata only; sample file content is not stored or available for dispensing.</p>{prescriptions.filter(p=>match(p.id,p.patientName,p.fileName,p.status)).map(p=><article className="admin-record-card" key={p.id}><div><strong>{p.id}</strong><span>{p.patientName} · {p.fileName}</span><small>{dateTime(p.createdAt)} · metadata only</small></div><span className="test-inline-status">{statusLabel(p.status)}</span></article>)}</div>}
  {tab==="enquiries"&&<div className="test-surface"><h2>Patient enquiries</h2><p className="muted small">Prescription and support enquiries are local test records. They are not delivered to a real team and contain no uploaded medical documents.</p>{enquiries.filter(e=>match(e.id,e.patientName,e.phone,e.location,e.details,e.type,e.status)).length?enquiries.filter(e=>match(e.id,e.patientName,e.phone,e.location,e.details,e.type,e.status)).map(e=><article className="admin-record-card" key={e.id}><div><strong>{e.id} · {statusLabel(e.type)}</strong><span>{e.patientName} · {e.phone} · {e.location||"Location not provided"}</span><small>{dateTime(e.createdAt)} · {statusLabel(e.status)}</small><p>{e.details}</p>{e.email&&<small>Reply email: {e.email}</small>}{e.reviewNote&&<small>Review note: {e.reviewNote}</small>}<div className="test-order-actions">{e.status==="awaiting_admin_review"&&<button type="button" className="button button-primary" onClick={()=>updateEnquiry(e,"in_review")}>Start review</button>}{["awaiting_admin_review","in_review"].includes(e.status)&&<><button type="button" className="button button-outline" onClick={()=>updateEnquiry(e,"resolved")}>Mark resolved</button><button type="button" className="button button-outline" onClick={()=>updateEnquiry(e,"rejected")}>Close as rejected</button></>}{["resolved","rejected"].includes(e.status)&&<button type="button" className="button button-outline" onClick={()=>updateEnquiry(e,"in_review")}>Reopen review</button>}</div></div><span className="test-inline-status">{statusLabel(e.status)}</span></article>):<Empty title="No matching enquiries" description="Patient prescription enquiries will appear here."/>}</div>}
  {tab==="activity"&&<div className="test-surface"><h2>Activity and request messages</h2>{[...orders.map(x=>({id:x.id,label:"Order",detail:x.patientName,status:x.status,at:x.updatedAt||x.createdAt})),...bookings.map(x=>({id:x.id,label:"Care request",detail:x.patientName,status:x.status,at:x.updatedAt||x.createdAt})),...payments.map(x=>({id:x.id,label:"Payment",detail:x.orderId||x.bookingId,status:x.status,at:x.createdAt})),...messages.map(x=>({id:x.id,label:"Message",detail:x.senderName,status:"saved locally",at:x.createdAt}))].filter(x=>match(x.id,x.label,x.detail,x.status)).sort((a,b)=>new Date(b.at||0)-new Date(a.at||0)).slice(0,80).map(x=><article className="admin-record-card" key={x.id+x.label}><div><strong>{x.label} · {x.id}</strong><span>{x.detail||"Test record"}</span><small>{dateTime(x.at)}</small></div><span className="test-inline-status">{statusLabel(x.status)}</span></article>)}{messages.filter(m=>match(m.requestId,m.senderName,m.body)).slice(-20).map(m=><article className="admin-record-card" key={m.id}><div><strong>{m.requestId} · {m.senderName}</strong><span>{m.body}</span><small>{m.requestType} · {dateTime(m.createdAt)}</small></div></article>)}</div>}
 </div>;
}

function DriverDashboard({ workflow, orders, refresh }) {
  const [tab, setTab] = useState("home");
  const [accountSection, setAccountSection] = useState("profile");
  const [online, setOnline] = useState(() => {
    try { return window.localStorage.getItem("healthreachcare-driver-online-preview") === "true"; }
    catch { return false; }
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [expandedOrder, setExpandedOrder] = useState("");
  const [handoverChecks, setHandoverChecks] = useState({});
  const [financePeriod, setFinancePeriod] = useState("all");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportTopic, setSupportTopic] = useState("Delivery issue");
  const [profile, setProfile] = useState(() => {
    const fallback = {fullName:"",phone:"",email:"",vehicleType:"",vehicleRegistration:"",bankName:"",accountHolder:"",accountLastFour:"",notifications:true,signInAlerts:true,privacyMode:true,screenLockPreference:false};
    try { return { ...fallback, ...JSON.parse(window.localStorage.getItem("healthreachcare-driver-profile-preview") || "{}") }; }
    catch { return fallback; }
  });
  const ready = orders.filter(order => order.testOnly === true && order.fulfilment === "delivery" && order.status === "ready_for_delivery");
  const active = orders.filter(order => order.testOnly === true && order.fulfilment === "delivery" && order.status === "out_for_delivery" && order.driverId === "local-test-driver");
  const delivered = orders.filter(order => order.testOnly === true && order.fulfilment === "delivery" && order.status === "delivered" && order.driverId === "local-test-driver");
  const earningsFor = order => Number(order.driverEarnings ?? order.deliveryFee ?? 0);
  const total = delivered.reduce((sum,order)=>sum+earningsFor(order),0);
  const today = new Date().toDateString();
  const todayDelivered = delivered.filter(order=>new Date(order.updatedAt||order.createdAt||0).toDateString()===today);
  const visibleDelivered = delivered.filter(order => {
    const date = new Date(order.updatedAt || order.createdAt || 0);
    if (financePeriod === "today") return date.toDateString() === today;
    if (financePeriod === "7days") return Date.now() - date.getTime() <= 7 * 86400000;
    return true;
  }).sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
  const persistOnline = value => {
    setOnline(value);
    try { window.localStorage.setItem("healthreachcare-driver-online-preview", String(value)); }
    catch { setError("Availability could not be saved in this browser."); }
    setNotice(value ? "You are available in the local driver simulation. No real dispatch is active." : "You are offline in the local driver simulation.");
    setError("");
  };
  const updateDelivery = (order, nextStatus) => {
    setBusy(order.id); setError(""); setNotice("");
    const result = updateWorkflow(draft => {
      const item = draft.orders.find(entry=>entry.id===order.id && entry.testOnly === true);
      if (!item) return {error:"This test delivery no longer exists."};
      const allowed = (item.status==="ready_for_delivery" && nextStatus==="out_for_delivery") || (item.status==="out_for_delivery" && nextStatus==="delivered");
      if (!allowed) return {error:"This test delivery cannot make that status transition. Refresh the queue and try again."};
      if (nextStatus === "out_for_delivery" && !online) return {error:"Go online in the preview before accepting a delivery."};
      if (nextStatus === "delivered" && !(handoverChecks[order.id]?.reference && handoverChecks[order.id]?.recipient)) return {error:"Confirm the order reference and recipient handover before completing this test delivery."};
      const at = new Date().toISOString();
      item.status=nextStatus;
      item.driverId="local-test-driver";
      item.driverName=profile.fullName||"Local test driver";
      item.updatedAt=at;
      item.statusHistory=[...(Array.isArray(item.statusHistory)?item.statusHistory:[]),{status:nextStatus,at,testOnly:true,actor:"local-test-driver"}];
      if (nextStatus === "delivered") {
        item.driverEarnings = Number(item.driverEarnings ?? item.deliveryFee ?? 0);
        item.deliveryCompletedAt = at;
      }
      return {value:item};
    });
    setBusy("");
    if (result?.error) setError(result.error);
    else {
      setNotice(nextStatus === "delivered" ? "Delivery marked complete in the local simulation. No patient or pharmacy was notified." : "Test delivery accepted. It is now assigned to this preview driver only.");
      setHandoverChecks(current=>({...current,[order.id]:{reference:false,recipient:false}}));
      setExpandedOrder("");
      refresh();
    }
  };
  const saveProfile = event => {
    event.preventDefault();
    setError(""); setNotice("");
    try { window.localStorage.setItem("healthreachcare-driver-profile-preview",JSON.stringify(profile)); setNotice("Driver profile and preferences saved on this device only. No verification or payout details were submitted."); }
    catch { setError("Could not save this preview profile. Check this browser's storage settings."); }
  };
  const submitSupport = event => {
    event.preventDefault();
    const message = supportMessage.trim();
    if (message.length < 10) { setError("Describe the issue in at least 10 characters."); return; }
    try {
      const key = "healthreachcare-driver-support-preview";
      const existing = JSON.parse(window.localStorage.getItem(key) || "[]");
      existing.unshift({id:"TEST-SUPPORT-"+Date.now().toString(36).toUpperCase(),topic:supportTopic,message,createdAt:new Date().toISOString(),status:"saved locally",testOnly:true});
      window.localStorage.setItem(key,JSON.stringify(existing.slice(0,20)));
      setSupportMessage(""); setError(""); setNotice("Support issue saved locally in this browser. It has not been sent to HealthReachCare support.");
    } catch { setError("Could not save the support issue in this browser."); }
  };
  const tabs=[{id:"home",label:"Home",Icon:Truck},{id:"finances",label:"Finances",Icon:Wallet},{id:"account",label:"Account",Icon:CircleUserRound}];
  return <div className="driver-dashboard">
    <div className="driver-preview-banner"><ShieldCheck size={18}/><div><strong>Driver preview workspace</strong><span>Simulates pharmacy-ready delivery orders using the shared sandbox workflow. No live dispatch, GPS, authentication or money movement.</span></div><span className="driver-preview-chip">PREVIEW</span></div>
    <div className="driver-tabs" role="tablist" aria-label="Driver dashboard sections">{tabs.map(item=><button type="button" role="tab" aria-selected={tab===item.id} className={"driver-tab"+(tab===item.id?" active":"")} key={item.id} onClick={()=>{setTab(item.id);setNotice("");setError("");}}><item.Icon size={18}/><span>{item.label}</span></button>)}</div>
    {notice&&<div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={()=>setNotice("")}><X size={15}/></button></div>}{error&&<div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={()=>setError("")}><X size={15}/></button></div>}
    {tab==="home"&&<>
      <div className="driver-home-hero"><div className="driver-hero-top"><div><div className="eyebrow">YOUR DELIVERY DAY</div><h2>{profile.fullName?"Welcome back, "+profile.fullName.split(" ")[0]:"Ready when you are"}</h2><p>Deliver medicines safely and keep every handover clear.</p></div><span className={"driver-online-status"+(online?" is-online":"")}><span/>{online?"Online · preview":"Offline"}</span></div><div className="driver-online-control"><div><strong>{online?"You’re marked available in preview":"Go online when you’re ready"}</strong><small>{online?"Only local orders can be accepted.":"Real delivery requests require an authenticated dispatch service."}</small></div><button type="button" className={"driver-go-button"+(online?" is-online":"")} onClick={()=>persistOnline(!online)}>{online?"Go offline":"Go online"} <ArrowRight size={17}/></button></div></div>
      <div className="driver-metric-grid"><div className="driver-metric"><span><Package size={18}/></span><small>Ready for delivery</small><strong>{ready.length}</strong><p>Pharmacy orders</p></div><div className="driver-metric"><span><Truck size={18}/></span><small>My active deliveries</small><strong>{active.length}</strong><p>Assigned to this test driver</p></div><div className="driver-metric"><span><CheckCircle2 size={18}/></span><small>Completed today</small><strong>{todayDelivered.length}</strong><p>Local test records</p></div><div className="driver-metric"><span><Wallet size={18}/></span><small>Recorded earnings</small><strong>{money(total)}</strong><p>Completed delivery fees only</p></div></div>
      <section className="courier-map-card" aria-label="Delivery map preview"><div className="courier-map-top"><div><span className="courier-kicker">YOUR AREA</span><h2>Delivery map</h2><p>Route guidance will appear here when live dispatch and GPS are connected.</p></div><span className="courier-map-status"><span/> {online?"Available for test orders":"Go online to receive test orders"}</span></div><div className="courier-map-art" aria-hidden="true"><div className="courier-map-road road-one"/><div className="courier-map-road road-two"/><div className="courier-map-road road-three"/><div className="courier-map-block block-one"/><div className="courier-map-block block-two"/><div className="courier-map-block block-three"/><div className="courier-map-block block-four"/><div className="courier-map-route"><span className="courier-map-pickup"><Package size={15}/></span><span className="courier-map-line"/><span className="courier-map-driver"><Truck size={17}/></span></div><span className="courier-map-label label-pickup">PHARMACY PICKUP</span><span className="courier-map-label label-driver">DRIVER</span></div><div className="courier-map-footer"><span><MapPin size={15}/> Map illustration · no live location</span><span>{ready.length} ready {ready.length===1?"order":"orders"}</span></div></section>
      <div className="test-surface driver-queue-surface"><div className="test-section-head"><div><div className="eyebrow">DELIVERY WORK</div><h2>Available deliveries</h2><p>Orders appear here only after the pharmacy workspace marks them ready for delivery.</p></div><button type="button" className="button button-outline" onClick={()=>{refresh();setNotice("Test order queue refreshed from this browser's shared workflow.");}}><RefreshCw size={15}/> Refresh</button></div>
      {ready.length?ready.map(order=><article className="driver-delivery-card" key={order.id}><div className="driver-delivery-head"><span className="driver-delivery-icon"><Package size={20}/></span><div><strong>{order.id}</strong><small>{(order.items||[]).map(item=>item.name+" × "+(item.quantity||1)).join(", ")||"Medicine order"} · {dateTime(order.createdAt)}</small></div><span className="test-status status-ready_for_delivery">Ready</span></div><div className="driver-delivery-details"><div><MapPin size={15}/><span><small>Delivery address</small><strong>{order.address||order.deliveryAddress||"Not provided in order"}</strong></span></div><div><UserRound size={15}/><span><small>Recipient</small><strong>{order.patientName||"Test patient"}</strong></span></div><div><CreditCard size={15}/><span><small>Payment state</small><strong>{statusLabel(order.paymentStatus||"not connected")}</strong></span></div></div><div className="driver-delivery-footer"><span>Reference: {order.id}</span><button type="button" className="button button-primary" disabled={!online||Boolean(busy)} onClick={()=>updateDelivery(order,"out_for_delivery")}>{busy===order.id?"Updating…":"Accept & start delivery"} <ArrowRight size={16}/></button></div>{!online&&<small className="driver-inline-note">Go online in preview to enable test delivery actions.</small>}</article>):<div className="driver-empty-state"><Package size={28}/><strong>No delivery-ready orders</strong><p>To test the full flow, create an order in the patient shop, record a test payment, then accept and prepare it in the pharmacy workspace. Choose delivery, not pickup.</p><button type="button" className="button button-outline" onClick={()=>{setNotice("Open the Patient workspace in the demo access screen to create a order; then process it in Pharmacy.");}}>How to create a order</button></div>}</div>
      <div className="test-surface"><div className="test-section-head"><div><h2>My active deliveries</h2><p>Confirm the order reference and recipient handover before marking an order delivered.</p></div></div>{active.length?active.map(order=><article className="driver-active-row driver-active-row-expanded" key={order.id}><div><strong>{order.id}</strong><small>{(order.items||[]).map(item=>item.name+" × "+(item.quantity||1)).join(", ")||"Medicine order"}</small><small>{order.patientName||"Test patient"} · {order.address||order.deliveryAddress||"Address not provided"}</small><span className="test-status status-out_for_delivery">Out for delivery</span><button type="button" className="text-button driver-details-toggle" onClick={()=>setExpandedOrder(current=>current===order.id?"":order.id)}>{expandedOrder===order.id?"Hide handover checklist":"Open handover checklist"} <ArrowRight size={14}/></button>{expandedOrder===order.id&&<div className="driver-handover-checks"><label><input type="checkbox" checked={Boolean(handoverChecks[order.id]?.reference)} onChange={event=>setHandoverChecks(current=>({...current,[order.id]:{...current[order.id],reference:event.target.checked}}))}/> I checked the order reference and package.</label><label><input type="checkbox" checked={Boolean(handoverChecks[order.id]?.recipient)} onChange={event=>setHandoverChecks(current=>({...current,[order.id]:{...current[order.id],recipient:event.target.checked}}))}/> I confirmed the recipient or authorised handover.</label><small>Preview checklist only. Do not expose medicine or health details to unauthorised people.</small></div>}</div><button type="button" className="button button-primary" disabled={!online||Boolean(busy)||!(handoverChecks[order.id]?.reference&&handoverChecks[order.id]?.recipient)} onClick={()=>updateDelivery(order,"delivered")}>{busy===order.id?"Updating…":"Mark delivered"} <CheckCircle2 size={16}/></button></article>):<div className="driver-quiet-empty">No active test deliveries assigned to this preview driver.</div>}</div>
      <div className="test-surface"><div className="test-section-head"><div><h2>Recently completed</h2><p>Latest local delivery records.</p></div><button type="button" className="button button-outline" onClick={()=>setTab("finances")}>View earnings <ArrowRight size={15}/></button></div>{delivered.length?delivered.slice().sort((a,b)=>new Date(b.deliveryCompletedAt||b.updatedAt||0)-new Date(a.deliveryCompletedAt||a.updatedAt||0)).slice(0,3).map(order=><div className="driver-finance-row" key={order.id}><span className="driver-finance-row-icon"><CheckCircle2 size={18}/></span><div><strong>{order.id}</strong><small>{dateTime(order.deliveryCompletedAt||order.updatedAt)} · {order.patientName||"Test recipient"}</small></div><strong>{money(earningsFor(order))}</strong></div>):<div className="driver-quiet-empty">Completed deliveries will appear here after the test handover checklist is completed.</div>}</div>
      <div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Safe delivery reminder</strong><br/>Confirm the order reference and recipient before handing over medicine. Do not expose patient health details to unauthorised people. Emergency and incident escalation is not connected in this preview.</p></div>
    </>}
    {tab==="finances"&&<div className="driver-finance-page"><div className="driver-finance-hero"><div className="eyebrow">FINANCES · TEST LEDGER</div><h2>{money(total)}</h2><p>Recorded test delivery earnings</p><span>Not withdrawable · No payout integration</span></div><div className="driver-metric-grid driver-finance-metrics"><div className="driver-metric"><span><CalendarDays size={18}/></span><small>Today</small><strong>{money(todayDelivered.reduce((sum,order)=>sum+earningsFor(order),0))}</strong><p>Completed test records</p></div><div className="driver-metric"><span><Clock3 size={18}/></span><small>Awaiting settlement</small><strong>{money(0)}</strong><p>No settlement records connected</p></div><div className="driver-metric"><span><Banknote size={18}/></span><small>Completed deliveries</small><strong>{delivered.length}</strong><p>Local orders only</p></div></div><div className="test-surface"><div className="test-section-head"><div><h2>Delivery earnings history</h2><p>Only explicit driver earnings or delivery fees from completed orders are included.</p></div><label className="driver-period-filter">Period<select value={financePeriod} onChange={event=>setFinancePeriod(event.target.value)}><option value="today">Today</option><option value="7days">Last 7 days</option><option value="all">All time</option></select></label></div>{visibleDelivered.length?visibleDelivered.map(order=><div className="driver-finance-row" key={order.id}><span className="driver-finance-row-icon"><FileText size={18}/></span><div><strong>{order.id}</strong><small>{dateTime(order.deliveryCompletedAt||order.updatedAt||order.createdAt)} · {order.fulfilment||"delivery"}</small><small>Order total is not treated as driver earnings.</small></div><strong>{money(earningsFor(order))}</strong></div>):<div className="driver-empty-state"><Wallet size={26}/><strong>No completed delivery earnings for this period</strong><p>Complete a test delivery to see the delivery fee here. Real finance requires verified earnings and settlement records.</p></div>}</div><div className="test-surface"><div className="test-section-head"><div><h2>Payments and settlements</h2><p>Financial controls stay read-only until a verified payment and settlement service is connected.</p></div><ShieldCheck size={22}/></div><div className="driver-finance-row"><span className="driver-finance-row-icon"><Banknote size={18}/></span><div><strong>Cash out / instant payout</strong><small>Disabled — no real payout provider or settlement ledger is configured.</small></div><span className="account-status">Unavailable</span></div><div className="driver-finance-row"><span className="driver-finance-row-icon"><FileText size={18}/></span><div><strong>Statements and tax records</strong><small>Not generated. This preview has no authoritative financial statements.</small></div><span className="account-status">Not connected</span></div></div><div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Finance safety</strong><br/>Never send a bank PIN, password, one-time code or full account number through support. No real funds have moved.</p></div></div>}
    {tab==="account"&&<div className="driver-account-page"><div className="driver-profile-card"><span className="driver-avatar"><UserRound size={30}/></span><div><div className="eyebrow">DRIVER PROFILE</div><h2>{profile.fullName||"Your driver profile"}</h2><p>{profile.email||"Add your contact details below"}</p></div><span className="driver-preview-chip">UNVERIFIED PREVIEW</span></div>
      <div className="driver-account-subtabs" role="tablist" aria-label="Driver account settings">{[{id:"profile",label:"Profile & vehicle"},{id:"security",label:"Security & privacy"},{id:"support",label:"Help & support"}].map(item=><button type="button" role="tab" aria-selected={accountSection===item.id} className={accountSection===item.id?"active":""} key={item.id} onClick={()=>{setAccountSection(item.id);setNotice("");setError("");}}>{item.label}</button>)}</div>
      {accountSection==="profile"&&<form className="test-surface driver-account-form" onSubmit={saveProfile}><div className="test-section-head"><div><h2>Personal details</h2><p>Saved only in this browser; not submitted for verification.</p></div><CircleUserRound size={23}/></div><div className="driver-form-grid"><label>Full name<input autoComplete="name" maxLength={100} value={profile.fullName} onChange={event=>setProfile({...profile,fullName:event.target.value})} placeholder="Driver full name"/></label><label>Mobile number<input autoComplete="tel" inputMode="tel" maxLength={25} value={profile.phone} onChange={event=>setProfile({...profile,phone:event.target.value})} placeholder="+27…"/></label><label>Email address<input type="email" autoComplete="email" maxLength={254} value={profile.email} onChange={event=>setProfile({...profile,email:event.target.value})} placeholder="you@example.com"/></label><label>Vehicle type<input maxLength={60} value={profile.vehicleType} onChange={event=>setProfile({...profile,vehicleType:event.target.value})} placeholder="Car, motorbike, bicycle"/></label><label>Vehicle registration<input maxLength={20} value={profile.vehicleRegistration} onChange={event=>setProfile({...profile,vehicleRegistration:event.target.value.toUpperCase()})} placeholder="Optional"/></label></div><div className="driver-document-notice"><FileText size={18}/><div><strong>Driver and vehicle verification</strong><p>Identity, driving licence, vehicle, insurance and background checks are not uploaded or verified here. Secure document storage, expiry checks and admin review must be connected before production. Do not upload real documents into this preview.</p></div></div><div className="test-section-head driver-account-section-head"><div><h2>Payout profile</h2><p>Only a masked account suffix is collected for this local prototype. Do not enter full bank details.</p></div><Wallet size={22}/></div><div className="driver-form-grid"><label>Bank name<input maxLength={80} value={profile.bankName} onChange={event=>setProfile({...profile,bankName:event.target.value})} placeholder="Optional"/></label><label>Account holder<input maxLength={100} value={profile.accountHolder} onChange={event=>setProfile({...profile,accountHolder:event.target.value})} placeholder="Optional"/></label><label>Last four digits only<input inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={profile.accountLastFour} onChange={event=>setProfile({...profile,accountLastFour:event.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="••••"/></label></div><label className="driver-notification-toggle"><input type="checkbox" checked={profile.notifications} onChange={event=>setProfile({...profile,notifications:event.target.checked})}/><span><strong>Driver delivery updates</strong><small>Preference only; real push notifications are not connected.</small></span></label><button type="submit" className="button button-primary">Save preview profile</button></form>}
      {accountSection==="security"&&<div className="test-surface driver-security-panel"><div className="test-section-head"><div><h2>Security and privacy</h2><p>Controls are preview preferences, not active account-security protections.</p></div><ShieldCheck size={23}/></div><div className="driver-security-status"><ShieldCheck size={22}/><div><strong>Authentication is not configured</strong><p>There is no driver sign-in session, password, MFA, identity verification or trusted-device service in this build. Never enter a real password or verification code.</p></div><span className="driver-preview-chip">NOT CONNECTED</span></div><label className="driver-notification-toggle"><input type="checkbox" checked={profile.signInAlerts} onChange={event=>setProfile({...profile,signInAlerts:event.target.checked})}/><span><strong>Sign-in and account alerts</strong><small>Saved as a preference only; no alerts can be sent yet.</small></span></label><label className="driver-notification-toggle"><input type="checkbox" checked={profile.privacyMode} onChange={event=>setProfile({...profile,privacyMode:event.target.checked})}/><span><strong>Privacy-conscious display</strong><small>Preference reminder to limit personal details on shared screens; not a security boundary.</small></span></label><label className="driver-notification-toggle"><input type="checkbox" checked={profile.screenLockPreference} onChange={event=>setProfile({...profile,screenLockPreference:event.target.checked})}/><span><strong>Remind me to lock my device</strong><small>Reminder preference only; the app cannot lock this device.</small></span></label><button type="button" className="button button-primary" onClick={()=>{try{window.localStorage.setItem("healthreachcare-driver-profile-preview",JSON.stringify(profile));setError("");setNotice("Security preferences saved locally. They do not enable authentication or security enforcement.");}catch{setError("Could not save security preferences in this browser.");}}}>Save security preferences</button><div className="driver-security-list"><div><strong>Password and two-step verification</strong><span>Unavailable until authenticated identity and MFA are configured.</span></div><div><strong>Active sessions and sign out everywhere</strong><span>No authenticated session exists in this preview, so session revocation is not available.</span></div><div><strong>Identity and document access</strong><span>Production must restrict private documents to authorised driver and review roles, with access logs and expiry controls.</span></div><div><strong>Data access and deletion requests</strong><span>Formal privacy requests require an authenticated, auditable backend workflow.</span></div></div></div>}
      {accountSection==="support"&&<div className="test-surface driver-support-panel"><div className="test-section-head"><div><h2>Driver help and support</h2><p>Save a local test issue for interface testing. Nothing is sent to the support team.</p></div><CircleUserRound size={23}/></div><div className="driver-support-topics"><div><strong>Delivery and handover</strong><span>Report a delivery workflow issue in preview.</span></div><div><strong>Payments and earnings</strong><span>Questions about test delivery fees or unavailable payouts.</span></div><div><strong>Account and verification</strong><span>Profile, vehicle documents and future verification setup.</span></div><div><strong>Safety or privacy</strong><span>Do not put patient details, passwords, bank numbers or security codes in a test issue.</span></div></div><form onSubmit={submitSupport} className="driver-support-form"><label>Issue category<select value={supportTopic} onChange={event=>setSupportTopic(event.target.value)}>{["Delivery issue","Order handover","Earnings and finance","Profile or vehicle","Security and privacy","Other"].map(item=><option key={item}>{item}</option>)}</select></label><label>Describe the issue<textarea rows={4} maxLength={1500} minLength={10} value={supportMessage} onChange={event=>setSupportMessage(event.target.value)} placeholder="Describe the test issue. Do not include sensitive or real patient information."/></label><button className="button button-primary" type="submit">Save test support issue</button></form><div className="driver-document-notice"><ShieldCheck size={18}/><div><strong>Urgent safety issue?</strong><p>This preview does not have a live safety response team or emergency escalation. Do not rely on this form for urgent help.</p></div></div></div>}
      <div className="driver-safety-note"><ShieldCheck size={18}/><p><strong>Production security gate</strong><br/>Before real drivers can use this workspace, connect verified sign-in, role-based access, server-side dispatch, protected document storage, audit logs, secure payout-provider tokens and privacy controls. These must be tested on the server, not simulated in the browser.</p></div>
    </div>}
  </div>;
}

function OrderList({ title, orders, actionFor, messages = [], messageDrafts = {}, messageErrors = {}, onMessageDraftChange, onSendMessage }) {
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
              {!["cancelled","delivered"].includes(order.status) && <div className="provider-message-thread"><div className="provider-message-title"><MessageCircle size={17}/><strong>Patient conversation</strong><span>{messages.filter(message=>message.requestId===order.id&&message.requestType==="order").length} messages</span></div><div className="provider-message-list">{messages.filter(message=>message.requestId===order.id&&message.requestType==="order").length ? messages.filter(message=>message.requestId===order.id&&message.requestType==="order").map(message=><article key={message.id} className={"provider-message-bubble"+(message.senderRole==="pharmacy"?" provider-message-own":"")}><div><strong>{message.senderName}</strong><small>{dateTime(message.createdAt)}</small></div><p>{message.body}</p></article>):<p className="provider-message-empty">No messages yet. Send an order-specific update to the patient.</p>}</div><label>Reply to patient<textarea rows={2} maxLength={2000} value={messageDrafts[order.id]||""} onChange={event=>onMessageDraftChange?.(order.id,event.target.value)} placeholder="Ask about delivery details or share an order update."/></label>{messageErrors[order.id]&&<p className="provider-message-error">{messageErrors[order.id]}</p>}<button type="button" className="button button-outline" onClick={()=>onSendMessage?.(order)}><Send size={15}/> Send reply</button><small>Local test conversation only. No external message is sent.</small></div>}
            </article>
          ))}
        </div>
      ) : (
        <Empty title="No matching orders" description="Place an order from the patient workspace to see it arrive here." />
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
