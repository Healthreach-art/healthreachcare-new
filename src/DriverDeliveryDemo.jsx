import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownRight, ArrowRight, Bell, Bike, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, ClipboardCheck, CreditCard, History, House,
  LogOut, MapPin, Menu, Package, Phone, RefreshCw, Route, ShieldCheck, SlidersHorizontal,
  Truck, UserRound, Wallet, X
} from "lucide-react";
import {
  claimDelivery, confirmDelivery, confirmPickup, ensureDemoDelivery,
  getDriverEarnings, getDeliveryHistory, listAvailableDeliveries, resetDemoData,
  subscribeToDeliveryUpdates, updateDeliveryStatus
} from "./services/driver-delivery-demo.js";
import "./DriverDeliveryDemo.css";

const DRIVERS = [
  { id: "demo-driver-01", label: "John Driver", initials: "JD", vehicle: "Toyota Etios", plate: "CA 123-456" },
  { id: "demo-driver-02", label: "Demo Driver B", initials: "DB", vehicle: "VW Polo Vivo", plate: "CA 234-567" },
  { id: "demo-driver-03", label: "Demo Driver C", initials: "DC", vehicle: "Suzuki Swift", plate: "CA 345-678" }
];
const money = value => "R" + Number(value || 0).toFixed(2);
const stamp = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const itemsText = order => (order.items || []).map(item => item.name + " × " + (item.quantity || 1)).join(", ") || "Synthetic medicine order";
const nav = [
  ["home", "Home", House], ["queue", "Delivery queue", Package], ["current", "Current delivery", Route],
  ["history", "History", History], ["earnings", "Earnings", Wallet], ["profile", "Profile", UserRound],
  ["vehicle", "Vehicle & documents", Truck], ["support", "Safety & support", CircleHelp]
];

export default function DriverDeliveryDemo({ orders = [], refresh = () => {} }) {
  const [section, setSection] = useState("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [online, setOnline] = useState(false);
  const [driverId, setDriverId] = useState(() => {
    try { return window.localStorage.getItem("healthreachcare-driver-demo-active-v1") || DRIVERS[0].id; }
    catch { return DRIVERS[0].id; }
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, count: 0, items: [] });
  const [checks, setChecks] = useState({});
  const [proof, setProof] = useState({});
  const [supportTopic, setSupportTopic] = useState("Delivery issue");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [profile, setProfile] = useState({ phone: "Demo contact only", email: "driver@example.test", area: "Cape Town, South Africa" });

  const driver = DRIVERS.find(item => item.id === driverId) || DRIVERS[0];
  const mine = useMemo(() => orders.filter(order => order.testOnly && order.fulfilment === "delivery" && order.driverId === driverId), [orders, driverId]);
  const assigned = mine.filter(order => ["driver_assigned", "picked_up", "out_for_delivery"].includes(order.status));
  const completed = mine.filter(order => order.status === "delivered");
  const activeOrder = assigned.find(order => ["driver_assigned", "picked_up", "out_for_delivery"].includes(order.status));
  const completedEarnings = completed.reduce((sum, order) => sum + Number(order.driverEarnings ?? order.deliveryFee ?? 0), 0);

  const load = async () => {
    setLoading(true);
    try {
      const [queue, past, ledger] = await Promise.all([listAvailableDeliveries(), getDeliveryHistory(driverId), getDriverEarnings(driverId)]);
      setAvailable(queue); setHistory(past); setEarnings(ledger); setError("");
    } catch (e) { setError(e?.message || "Could not load demo deliveries. Refresh and try again."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    try { ensureDemoDelivery(); } catch (e) { setError(e?.message || "Could not create a synthetic demo order."); }
    const unsubscribe = subscribeToDeliveryUpdates(() => { refresh(); void load(); });
    void load();
    return unsubscribe;
  }, [driverId]);

  const act = async (id, operation, success) => {
    setBusy(id); setError(""); setNotice("");
    try {
      const result = await operation();
      if (!result?.ok) throw new Error(result?.error || "Action could not be completed.");
      refresh(); await load(); setNotice(success);
    } catch (e) { setError(e?.message || "Action failed. Refresh and try again."); }
    finally { setBusy(""); }
  };
  const changeDriver = value => {
    setDriverId(value); setNotice(""); setError("");
    try { window.localStorage.setItem("healthreachcare-driver-demo-active-v1", value); }
    catch { setError("Could not save the selected demo driver in this browser."); }
  };
  const go = value => { setSection(value); setMobileNav(false); setNotice(""); setError(""); };
  const reset = () => {
    setBusy("reset"); setError(""); setNotice("");
    try {
      resetDemoData(); setChecks({}); setProof({}); refresh(); void load();
      setNotice("Demo reset. A synthetic medication order is waiting in the Pharmacy workspace.");
    } catch (e) { setError(e?.message || "Could not reset demo data."); }
    finally { setBusy(""); }
  };
  const statusLabel = status => ({
    driver_assigned: "Accepted · awaiting pickup", picked_up: "Picked up", out_for_delivery: "Out for delivery", delivered: "Delivered"
  }[status] || String(status || "Pending").replace(/_/g, " "));

  const progress = order => {
    const statuses = ["driver_assigned", "picked_up", "out_for_delivery", "delivered"];
    const labels = ["Accepted", "Picked up", "On the way", "Delivered"];
    const active = Math.max(0, statuses.indexOf(order.status));
    return <div className="hc-driver-progress" aria-label={"Delivery status: " + statusLabel(order.status)}>
      {labels.map((label, index) => <div className={index <= active ? "complete" : ""} key={label}><span>{index < active ? <CheckCircle2 size={15}/> : index + 1}</span><small>{label}</small></div>)}
    </div>;
  };
  const deliveryCard = order => {
    const isMine = order.driverId === driverId;
    const check = checks[order.id] || {};
    const working = busy === order.id;
    return <article className="hc-driver-order" key={order.id}>
      <div className="hc-driver-order-top"><div className="hc-driver-order-icon"><Package size={20}/></div><div className="hc-driver-order-title"><span className="hc-driver-eyebrow">ORDER REFERENCE</span><h3>{order.id}</h3><p>{itemsText(order)}</p></div><span className={"hc-driver-status status-" + order.status}>{statusLabel(order.status)}</span></div>
      <div className="hc-driver-order-details">
        <div><span>Pickup</span><strong><MapPin size={15}/> Demo pharmacy</strong></div>
        <div><span>Delivery destination</span><strong><House size={15}/> {order.address || "Synthetic demo destination"}</strong></div>
        <div><span>Recipient</span><strong><UserRound size={15}/> Demo Patient</strong></div>
      </div>
      {progress(order)}
      {!isMine && order.status === "ready_for_delivery" && !order.driverId && <div className="hc-driver-action">
        <div><strong>Ready to collect</strong><p>Confirm availability to assign this synthetic order to {driver.label}.</p></div>
        <div className="hc-driver-action-bottom"><span>Demo fee <b>{money(order.driverEarnings ?? order.deliveryFee)}</b></span><button className="hc-driver-primary" disabled={!online || !!busy} onClick={() => act(order.id, () => claimDelivery(order.id, driverId, driver.label), "Delivery accepted and assigned to " + driver.label + ".")}>{working ? "Accepting…" : "Accept delivery"} <ArrowRight size={16}/></button></div>
        {!online && <small>Go online to accept demo deliveries.</small>}
      </div>}
      {isMine && order.status === "driver_assigned" && order.deliveryStage === "accepted" && <div className="hc-driver-action">
        <strong><ClipboardCheck size={17}/> Pharmacy pickup checklist</strong><p>Check the reference and sealed package before confirming collection.</p>
        <label><input type="checkbox" checked={!!check.reference} onChange={e => setChecks(s => ({ ...s, [order.id]: { ...s[order.id], reference: e.target.checked } }))}/> Order reference checked</label>
        <label><input type="checkbox" checked={!!check.package} onChange={e => setChecks(s => ({ ...s, [order.id]: { ...s[order.id], package: e.target.checked } }))}/> Sealed demo package checked</label>
        <button className="hc-driver-primary" disabled={!online || working || !check.reference || !check.package} onClick={() => act(order.id, () => confirmPickup(order.id, driverId, check), "Pickup confirmed. The delivery is ready to start.")}>{working ? "Confirming…" : "Confirm pickup"} <CheckCircle2 size={16}/></button>
      </div>}
      {isMine && order.status === "picked_up" && <div className="hc-driver-action"><strong><Truck size={17}/> Ready to depart</strong><p>Mark the parcel as on the way. The change is visible in the local test workflow.</p><button className="hc-driver-primary" disabled={!online || working} onClick={() => act(order.id, () => updateDeliveryStatus(order.id, "out_for_delivery", driverId), "Delivery marked out for delivery in the demo.")}>{working ? "Updating…" : "Start delivery"} <ArrowRight size={16}/></button></div>}
      {isMine && order.status === "out_for_delivery" && <div className="hc-driver-action"><strong><ShieldCheck size={17}/> Delivery handover</strong><p>Demo confirmation only. No photo, signature, GPS point or real patient details are collected.</p><label><input type="checkbox" checked={!!proof[order.id]} onChange={e => setProof(s => ({ ...s, [order.id]: e.target.checked }))}/> I confirm the simulated handover</label><button className="hc-driver-primary" disabled={!online || working || !proof[order.id]} onClick={() => act(order.id, () => confirmDelivery(order.id, driverId, { confirmed: true }), "Demo delivery completed. No real recipient notification was sent.")}>{working ? "Completing…" : "Confirm delivery"} <CheckCircle2 size={16}/></button></div>}
      {order.status === "delivered" && <div className="hc-driver-completed"><CheckCircle2 size={18}/><div><strong>Delivery completed</strong><small>Simulated proof: {order.deliveryProof?.reference || "DEMO-PROOF"} · {stamp(order.deliveryCompletedAt)}</small></div><b>{money(order.driverEarnings ?? order.deliveryFee)}</b></div>}
    </article>;
  };

  const metrics = <div className="hc-driver-metrics">
    <div><span className="hc-metric-icon"><Package size={18}/></span><small>Ready for delivery</small><strong>{loading ? "…" : available.length}</strong><em>Unassigned test orders</em></div>
    <div><span className="hc-metric-icon"><Truck size={18}/></span><small>Active deliveries</small><strong>{assigned.length}</strong><em>Assigned to you</em></div>
    <div><span className="hc-metric-icon"><CheckCircle2 size={18}/></span><small>Completed today</small><strong>{completed.length}</strong><em>Demo records</em></div>
    <div><span className="hc-metric-icon"><Wallet size={18}/></span><small>Demo earnings</small><strong>{money(completedEarnings)}</strong><em>No payout or settlement</em></div>
  </div>;

  const map = <section className="hc-driver-map-card">
    <div className="hc-driver-section-heading"><div><span className="hc-driver-eyebrow">ROUTE OVERVIEW</span><h2>Delivery map</h2><p>Illustrative route for the demo workspace — no live location is collected.</p></div><span className="hc-driver-map-badge"><span/> {online ? "Available" : "Offline"}</span></div>
    <div className="hc-driver-map">
      <span className="hc-map-road road-a"/><span className="hc-map-road road-b"/><span className="hc-map-road road-c"/><span className="hc-map-block block-a"/><span className="hc-map-block block-b"/><span className="hc-map-block block-c"/><span className="hc-map-block block-d"/><span className="hc-map-block block-e"/>
      <span className="hc-map-route"><i/><b/><i/></span><span className="hc-map-pin pin-pharmacy"><Package size={17}/></span><span className="hc-map-pin pin-driver"><Truck size={17}/></span><span className="hc-map-caption caption-one">PHARMACY</span><span className="hc-map-caption caption-two">DELIVERY AREA</span>
      <div className="hc-map-legend"><span><i/> Pickup point</span><span><i/> Route illustration</span></div>
    </div>
    <div className="hc-driver-map-foot"><span><MapPin size={15}/> Cape Town · simulated area</span><span>Map is illustrative, not navigational</span></div>
  </section>;

  const empty = (icon, title, detail, action) => <div className="hc-driver-empty"><span>{icon}</span><strong>{title}</strong><p>{detail}</p>{action}</div>;

  const content = () => {
    if (section === "home") return <>
      <div className="hc-driver-welcome"><div><span className="hc-driver-eyebrow">DRIVER OVERVIEW</span><h1>Good day, {driver.label.split(" ")[0]}</h1><p>Here’s your delivery activity and what needs your attention.</p></div><button className={"hc-driver-online-toggle" + (online ? " online" : "")} onClick={() => setOnline(value => !value)}><span/>{online ? "Go offline" : "Go online"} <ArrowRight size={16}/></button></div>
      {metrics}
      <div className="hc-driver-home-grid"><div className="hc-driver-main-column">{map}<section className="hc-driver-panel"><div className="hc-driver-section-heading"><div><span className="hc-driver-eyebrow">NEXT STEP</span><h2>Available deliveries</h2><p>Accept an order after the pharmacy marks it ready.</p></div><button className="hc-driver-link" onClick={() => go("queue")}>View queue <ChevronRight size={16}/></button></div>{loading ? empty(<RefreshCw/>, "Loading delivery queue", "Checking local demo orders…") : available.length ? available.slice(0,2).map(deliveryCard) : empty(<Package/>, "No delivery-ready orders", "Patient orders appear here only after a patient completes simulated payment and Pharmacy marks the delivery ready. No patient order means no driver delivery.", <button className="hc-driver-secondary" onClick={() => go("queue")}>Open delivery queue</button>)}</section></div>
      <aside className="hc-driver-side-column"><section className="hc-driver-panel hc-driver-current-panel"><div className="hc-driver-section-heading"><div><span className="hc-driver-eyebrow">IN PROGRESS</span><h2>Current delivery</h2></div></div>{activeOrder ? <>{deliveryCard(activeOrder)}<button className="hc-driver-secondary full" onClick={() => go("current")}>Open delivery details <ArrowRight size={15}/></button></> : empty(<Route/>, "Nothing in progress", "Accept a ready order to see pickup and delivery steps here.")}</section><section className="hc-driver-panel hc-driver-safety-panel"><span className="hc-driver-safety-icon"><ShieldCheck size={20}/></span><div><strong>Safety first</strong><p>Verify the package and follow the handover checklist. This demo does not contact emergency services.</p><button className="hc-driver-link" onClick={() => go("support")}>Safety & support <ArrowRight size={15}/></button></div></section><section className="hc-driver-panel hc-driver-profile-mini"><div className="hc-driver-avatar">{driver.initials}</div><div><strong>{driver.label}</strong><small>{driver.vehicle} · {driver.plate}</small><button className="hc-driver-link" onClick={() => go("profile")}>View profile <ArrowRight size={14}/></button></div></section></aside></div>
      <section className="hc-driver-panel"><div className="hc-driver-section-heading"><div><span className="hc-driver-eyebrow">RECENT ACTIVITY</span><h2>Today’s deliveries</h2></div><button className="hc-driver-link" onClick={() => go("history")}>View history <ChevronRight size={16}/></button></div>{mine.length ? mine.slice(0,3).map(deliveryCard) : empty(<History/>, "No recent deliveries", "Your accepted and completed demo orders will appear here.")}</section>
    </>;
    if (section === "queue") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">WORK</span><h1>Delivery queue</h1><p>Pharmacy orders appear here only after they are marked ready for delivery.</p></div>{metrics}<section className="hc-driver-panel"><div className="hc-driver-section-heading"><div><h2>Available orders</h2><p>Accept a delivery to assign it to {driver.label}.</p></div><button className="hc-driver-secondary" onClick={() => { void load(); refresh(); }}><RefreshCw size={15}/> Refresh queue</button></div>{loading ? empty(<RefreshCw/>, "Loading queue", "Checking demo orders…") : available.length ? available.map(deliveryCard) : empty(<Package/>, "Your queue is clear", "To test the complete flow, use Patient to create an order, then Pharmacy to accept it, prepare it and mark it ready for delivery.")}</section><section className="hc-driver-panel"><div className="hc-driver-section-heading"><div><h2>My active deliveries</h2><p>Orders already assigned to this driver.</p></div></div>{assigned.length ? assigned.map(deliveryCard) : empty(<Truck/>, "No active assignments", "Accepted deliveries will appear here.")}</section></>;
    if (section === "current") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">ACTIVE WORK</span><h1>Current delivery</h1><p>Pickup checks, delivery progress and simulated handover.</p></div>{activeOrder ? <>{map}{deliveryCard(activeOrder)}</> : empty(<Route/>, "No active delivery", "Accept a pharmacy-ready order from the Delivery queue to start.", <button className="hc-driver-primary" onClick={() => go("queue")}>Open delivery queue <ArrowRight size={16}/></button>)}</>;
    if (section === "history") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">PAST ACTIVITY</span><h1>Delivery history</h1><p>Completed and active deliveries for {driver.label}.</p></div><section className="hc-driver-panel">{history.length ? history.map(deliveryCard) : empty(<History/>, "No delivery history yet", "Completed demo deliveries will be listed here.")}</section></>;
    if (section === "earnings") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">YOUR FINANCES</span><h1>Earnings</h1><p>Illustrative demo fees only. No real money is earned or paid out.</p></div><div className="hc-driver-metrics"><div><span className="hc-metric-icon"><Wallet size={18}/></span><small>Total demo earnings</small><strong>{money(earnings.total)}</strong><em>Simulated ledger</em></div><div><span className="hc-metric-icon"><CheckCircle2 size={18}/></span><small>Completed deliveries</small><strong>{earnings.count}</strong><em>Demo only</em></div><div><span className="hc-metric-icon"><CreditCard size={18}/></span><small>Pending payout</small><strong>R0.00</strong><em>No payout integration</em></div><div><span className="hc-metric-icon"><Activity size={18}/></span><small>Today</small><strong>{money(completedEarnings)}</strong><em>Based on completed test orders</em></div></div><section className="hc-driver-panel"><div className="hc-driver-section-heading"><div><h2>Earnings history</h2><p>Fee records created by simulated deliveries.</p></div></div>{history.filter(order => order.status === "delivered").length ? history.filter(order => order.status === "delivered").map(deliveryCard) : empty(<Wallet/>, "No earnings records", "A simulated fee is recorded when a demo delivery is completed.")}</section></>;
    if (section === "profile") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">ACCOUNT</span><h1>Driver profile</h1><p>Editable information saved for this screen only.</p></div><section className="hc-driver-panel hc-driver-profile-form"><div className="hc-driver-profile-hero"><div className="hc-driver-avatar large">{driver.initials}</div><div><h2>{driver.label}</h2><p>HealthReachCare courier · Demo profile</p><span className="hc-driver-profile-status"><i/> Test profile</span></div></div><label>Driver display name<input value={driver.label} readOnly/></label><label>Contact phone<input value={profile.phone} onChange={e => setProfile(s => ({...s, phone:e.target.value}))}/></label><label>Contact email<input type="email" value={profile.email} onChange={e => setProfile(s => ({...s, email:e.target.value}))}/></label><label>Service area<input value={profile.area} onChange={e => setProfile(s => ({...s, area:e.target.value}))}/></label><button className="hc-driver-primary" onClick={() => setNotice("Profile fields updated for this screen. They are not sent to a server.")}>Save profile <CheckCircle2 size={16}/></button><p className="hc-driver-muted">Profile edits are not persisted to a server and do not verify driver identity.</p></section></>;
    if (section === "vehicle") return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">COMPLIANCE</span><h1>Vehicle & documents</h1><p>Sample vehicle information and document checklist.</p></div><section className="hc-driver-panel"><div className="hc-driver-vehicle-card"><span><Truck size={30}/></span><div><h2>{driver.vehicle}</h2><p>{driver.plate} · Demo vehicle</p><span className="hc-driver-profile-status"><i/> Sample record · not verified</span></div></div>{[["Vehicle registration","Sample only · not uploaded"],["Driver licence","Sample only · not verified"],["Delivery insurance","Not connected"],["Pharmacy handling guidance","Read before accepting assignments"]].map(([title,detail])=><div className="hc-driver-document-row" key={title}><span><ClipboardCheck size={18}/></span><div><strong>{title}</strong><small>{detail}</small></div><span className="hc-driver-status-neutral">Demo</span></div>)}<p className="hc-driver-muted">Do not use these sample fields as proof of licensing, insurance or provider approval.</p></section></>;
    return <><div className="hc-driver-page-title"><span className="hc-driver-eyebrow">HELP CENTRE</span><h1>Safety & support</h1><p>Record a demo issue or review the safety reminders. No live support team is contacted.</p></div><section className="hc-driver-panel hc-driver-support"><div className="hc-driver-support-card"><ShieldCheck size={24}/><div><h2>Delivery safety</h2><p>Check the order reference, inspect package seals, keep patient details private and follow the pharmacy handover process. Do not leave medicine unattended unless the real service policy permits it.</p></div></div><div className="hc-driver-support-card"><Phone size={24}/><div><h2>Need help?</h2><p>This is a testing workspace. The form below records only a local on-screen confirmation; it does not call emergency services or send a support ticket.</p></div></div><form onSubmit={e => { e.preventDefault(); if (!supportMessage.trim()) return; setSupportSent(true); setSupportMessage(""); }}><label>Issue type<select value={supportTopic} onChange={e => setSupportTopic(e.target.value)}><option>Delivery issue</option><option>Pharmacy pickup issue</option><option>Recipient unavailable</option><option>Safety concern</option><option>App or technical issue</option></select></label><label>Describe the issue<textarea value={supportMessage} onChange={e => {setSupportMessage(e.target.value);setSupportSent(false);}} rows={4} maxLength={1000} placeholder="Describe a sample issue…"/></label><button className="hc-driver-primary" type="submit" disabled={!supportMessage.trim()}>Record demo issue <ArrowRight size={16}/></button>{supportSent && <p className="hc-driver-support-success"><CheckCircle2 size={17}/> Demo issue recorded on screen: {supportTopic}. Nothing was sent externally.</p>}</form></section></>;
  };

  return <div className="hc-driver-app">
    <div className="hc-driver-demo-notice"><ShieldCheck size={18}/><div><strong>TEST MODE · Synthetic data only</strong><span>No live dispatch, GPS tracking, patient notifications, identity checks or real payments are connected.</span></div><span className="hc-driver-demo-pill">DEMO</span></div>
    <header className="hc-driver-topbar"><button className="hc-driver-menu-button" onClick={() => setMobileNav(value => !value)} aria-label="Toggle navigation">{mobileNav ? <X/> : <Menu/>}</button><div className="hc-driver-brand"><span className="hc-driver-brand-mark"><Truck size={22}/></span><span><strong>HealthReachCare</strong><small>DRIVER PARTNER</small></span></div><div className="hc-driver-topbar-right"><span className={"hc-driver-online-chip" + (online ? " online" : "")}><i/>{online ? "Online" : "Offline"}</span><button className="hc-driver-icon-button" onClick={() => setNotice("No real notifications are connected in this demo.")} aria-label="Notifications"><Bell size={19}/></button><div className="hc-driver-top-avatar">{driver.initials}</div><div className="hc-driver-top-user"><strong>{driver.label}</strong><small>Demo driver</small></div><button className="hc-driver-icon-button" onClick={reset} title="Reset demo data" aria-label="Reset demo data"><RefreshCw size={17}/></button></div></header>
    <div className="hc-driver-layout">
      <aside className={"hc-driver-sidebar" + (mobileNav ? " open" : "")}><div className="hc-driver-sidebar-label">WORKSPACE</div><nav>{nav.map(([id,label,Icon]) => <button key={id} className={section === id ? "active" : ""} onClick={() => go(id)}><Icon size={18}/><span>{label}</span>{section === id && <ChevronRight size={15}/>}</button>)}</nav><div className="hc-driver-sidebar-bottom"><div className="hc-driver-sidebar-help"><span><ShieldCheck size={18}/></span><strong>Safe deliveries</strong><p>Follow every handover step and protect patient privacy.</p><button onClick={() => go("support")}>View safety tips <ArrowRight size={14}/></button></div><button className="hc-driver-exit" onClick={() => setNotice("Use the Back to testing landing page link above to exit this workspace.")}><LogOut size={17}/> Exit workspace</button></div></aside>
      <main className="hc-driver-main"><div className="hc-driver-main-toolbar"><div className="hc-driver-breadcrumb">Testing portal <ChevronRight size={14}/> <strong>{nav.find(item => item[0] === section)?.[1] || "Home"}</strong></div><label className="hc-driver-driver-select">Testing as<select value={driverId} onChange={e => changeDriver(e.target.value)}>{DRIVERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        {notice && <div className="hc-driver-message success"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15}/></button></div>}
        {error && <div className="hc-driver-message error" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
        {content()}
        <footer className="hc-driver-footer"><span>HealthReachCare Courier · Demo workspace</span><span>Sample data only · Not for live delivery operations</span></footer>
      </main>
    </div>
  </div>;
}
