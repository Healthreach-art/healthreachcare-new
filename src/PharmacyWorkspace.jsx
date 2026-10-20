import { useMemo, useState } from "react";
import { Activity, AlertCircle, ArrowRight, Banknote, Bell, CheckCircle2, ClipboardCheck, Clock3, Package, Pill, RefreshCw, Search, ShieldCheck, Truck, XCircle } from "lucide-react";
import { readWorkflow, transitionTestOrder, updateWorkflow, useTestWorkflow } from "./test-workflow.js";
import "./PharmacyWorkspace.css";

const money = value => "R" + Number(value || 0).toFixed(2);
const readable = value => String(value || "pending").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const dateTime = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const nextActions = {
  awaiting_pharmacy: [{ status: "accepted", label: "Accept order", Icon: CheckCircle2 }, { status: "cancelled", label: "Reject / cancel", Icon: XCircle }],
  accepted: [{ status: "preparing", label: "Start preparation", Icon: Package }, { status: "cancelled", label: "Cancel order", Icon: XCircle }],
  preparing: [{ status: "ready_for_delivery", label: "Ready for delivery", Icon: Truck }, { status: "ready_for_pickup", label: "Ready for pickup", Icon: CheckCircle2 }],
  ready_for_delivery: [{ status: "driver_assigned", label: "Assign demo driver", Icon: Truck }],
  driver_assigned: [{ status: "picked_up", label: "Confirm pickup", Icon: Package }],
  picked_up: [{ status: "out_for_delivery", label: "Out for delivery", Icon: Truck }],
  out_for_delivery: [{ status: "delivered", label: "Mark delivered", Icon: CheckCircle2 }]
};

export default function PharmacyWorkspace({ onBack }) {
  const workflow = useTestWorkflow();
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reason, setReason] = useState({});
  const [draft, setDraft] = useState({ name: "", category: "OTC demo item", description: "", price: "25", stock: "20", prescriptionRequired: false });
  const [editingId, setEditingId] = useState("");
  const orders = (workflow.orders || []).filter(order => order.testOnly === true);
  const inventory = (workflow.inventory || []).filter(item => item.testOnly !== false);
  const paidOrders = orders.filter(order => order.paymentStatus === "test_authorized");
  const pending = orders.filter(order => order.status === "awaiting_pharmacy");
  const active = orders.filter(order => !["delivered", "cancelled", "ready_for_pickup"].includes(order.status));
  const lowStock = inventory.filter(item => Number(item.stock) <= 5 && item.active !== false);
  const revenue = paidOrders.filter(order => !["cancelled"].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0);
  const visibleOrders = orders.filter(order => {
    const matchesFilter = filter === "all" || (filter === "pending" ? order.status === "awaiting_pharmacy" : filter === "active" ? !["delivered", "cancelled", "awaiting_payment"].includes(order.status) : order.status === filter);
    const haystack = [order.id, order.patientName, order.address, ...(order.items || []).map(line => line.name)].join(" ").toLowerCase();
    return matchesFilter && haystack.includes(search.trim().toLowerCase());
  }).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const prescriptions = (workflow.prescriptions || []).filter(item => item.testOnly === true);
  const payments = (workflow.payments || []).filter(item => item.testOnly === true);

  const act = (order, status) => {
    setBusyId(order.id); setError(""); setNotice("");
    const result = transitionTestOrder(order.id, status);
    setBusyId("");
    if (result?.error) { setError(result.error); return; }
    setNotice(status === "cancelled" ? "Order cancelled in the demo. No real medication was dispensed and no money moved." : "Order updated to " + readable(status) + ". The patient activity screen reads this same demo workflow.");
    workflow.refresh();
  };
  const rejectPrescription = item => {
    const note = String(reason[item.id] || "").trim();
    if (note.length < 3) { setError("Add a short review note before recording the demo rejection."); return; }
    const result = updateWorkflow(state => {
      const target = state.prescriptions.find(row => row.id === item.id && row.testOnly === true);
      if (!target) return { error: "Prescription demo record not found." };
      if (!["pending", "awaiting_review", "submitted"].includes(target.status)) return { error: "This prescription has already been reviewed." };
      target.status = "rejected";
      target.reviewNote = note.slice(0, 500);
      target.reviewedAt = new Date().toISOString();
      target.updatedAt = target.reviewedAt;
      return { value: target };
    });
    if (result?.error) setError(result.error);
    else { setError(""); setNotice("Demo prescription rejection recorded. The sample record now shows the pharmacist note."); workflow.refresh(); }
  };
  const saveMedicine = event => {
    event.preventDefault(); setError(""); setNotice("");
    const name = draft.name.trim();
    const price = Number(draft.price), stock = Number(draft.stock);
    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) { setError("Enter a medicine name, a valid non-negative price and a whole-number stock quantity."); return; }
    const result = updateWorkflow(state => {
      if (editingId) {
        const item = state.inventory.find(row => row.id === editingId);
        if (!item) return { error: "Medicine no longer exists. Refresh and try again." };
        Object.assign(item, { name, category: draft.category, description: draft.description.trim(), price, stock, prescriptionRequired: Boolean(draft.prescriptionRequired), active: true, updatedAt: new Date().toISOString() });
        return { value: item };
      }
      const item = { id: "test-med-" + Date.now().toString(36), name, category: draft.category, description: draft.description.trim() || "Demo catalogue item.", price, stock, prescriptionRequired: Boolean(draft.prescriptionRequired), active: true, testOnly: true, createdAt: new Date().toISOString() };
      state.inventory.unshift(item);
      return { value: item };
    });
    if (result?.error) setError(result.error);
    else { setDraft({ name: "", category: "OTC demo item", description: "", price: "25", stock: "20", prescriptionRequired: false }); setEditingId(""); setNotice(editingId ? "Demo medicine updated." : "Demo medicine added to the shared patient catalogue."); workflow.refresh(); }
  };
  const editMedicine = item => { setEditingId(item.id); setDraft({ name: item.name, category: item.category || "OTC demo item", description: item.description || "", price: String(item.price ?? 0), stock: String(item.stock ?? 0), prescriptionRequired: Boolean(item.prescriptionRequired) }); setTab("inventory"); };
  const toggleMedicine = item => {
    const result = updateWorkflow(state => { const target = state.inventory.find(row => row.id === item.id); if (!target) return { error: "Medicine not found." }; target.active = target.active === false; target.updatedAt = new Date().toISOString(); return { value: target }; });
    if (result?.error) setError(result.error); else { setNotice(item.active === false ? "Medicine made available in the shared demo catalogue." : "Medicine hidden from the shared demo catalogue."); workflow.refresh(); }
  };

  const tabs = [
    { id: "overview", label: "Overview", Icon: Activity },
    { id: "orders", label: "Orders", Icon: ClipboardCheck },
    { id: "prescriptions", label: "Prescriptions", Icon: Pill },
    { id: "inventory", label: "Inventory", Icon: Package },
    { id: "finance", label: "Finance", Icon: Banknote }
  ];

  return <main className="pharmacy-app">
    <header className="pharmacy-topbar">
      <button className="pharmacy-brand" onClick={onBack} aria-label="Back to demo access"><span className="pharmacy-brand-mark"><Activity size={23}/></span><span><strong>HealthReachCare</strong><small>PHARMACY PORTAL</small></span></button>
      <div className="pharmacy-top-actions"><span className="pharmacy-demo-chip"><i/> DEMO ENVIRONMENT</span><button className="pharmacy-icon-button" onClick={()=>{workflow.refresh();setNotice("Refreshed from the shared demo workflow in this browser.");}} aria-label="Refresh pharmacy data"><RefreshCw size={17}/></button><span className="pharmacy-avatar">PH</span></div>
    </header>
    <div className="pharmacy-layout">
      <aside className="pharmacy-sidebar"><div className="pharmacy-sidebar-label">WORKSPACE</div>{tabs.map(item=><button key={item.id} className={"pharmacy-nav-item"+(tab===item.id?" active":"")} onClick={()=>{setTab(item.id);setNotice("");setError("");}}><item.Icon size={18}/><span>{item.label}</span>{item.id==="orders"&&pending.length>0&&<b>{pending.length}</b>}</button>)}<div className="pharmacy-sidebar-bottom"><ShieldCheck size={18}/><span><strong>Sandbox only</strong><small>Never use real patient records here.</small></span></div></aside>
      <section className="pharmacy-main">
        <div className="pharmacy-page-heading"><div><div className="pharmacy-eyebrow">PHARMACY OPERATIONS / DEMO</div><h1>{({overview:"Good day, Pharmacy team",orders:"Medication orders",prescriptions:"Prescription review",inventory:"Medicine inventory",finance:"Finance & payments"})[tab]}</h1><p>Process sample medication orders from patient checkout through pharmacy preparation and delivery handover.</p></div><span className="pharmacy-status-pill"><span/> All changes are simulated</span></div>
        <div className="pharmacy-safety-banner"><ShieldCheck size={19}/><div><strong>Demo data only</strong><p>Orders, prescription metadata, stock and payment attempts use this browser's shared sandbox ledger. No real prescriptions are approved, no files are stored, and no money moves.</p></div></div>
        {notice&&<div className="pharmacy-message"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Dismiss message"><XCircle size={15}/></button></div>}
        {error&&<div className="pharmacy-message is-error"><AlertCircle size={18}/><span>{error}</span><button onClick={()=>setError("")} aria-label="Dismiss error"><XCircle size={15}/></button></div>}

        {tab==="overview"&&<>
          <div className="pharmacy-stat-grid">
            <div className="pharmacy-stat-card"><span className="stat-icon blue"><ClipboardCheck size={20}/></span><small>Awaiting pharmacy</small><strong>{pending.length}</strong><span className="stat-foot">Paid test orders requiring review</span></div>
            <div className="pharmacy-stat-card"><span className="stat-icon violet"><Package size={20}/></span><small>Active orders</small><strong>{active.length}</strong><span className="stat-foot">Across preparation and delivery</span></div>
            <div className="pharmacy-stat-card"><span className="stat-icon amber"><AlertCircle size={20}/></span><small>Low stock</small><strong>{lowStock.length}</strong><span className="stat-foot">Five units or fewer</span></div>
            <div className="pharmacy-stat-card"><span className="stat-icon green"><Banknote size={20}/></span><small>Authorised test value</small><strong>{money(revenue)}</strong><span className="stat-foot">Simulated only · no funds moved</span></div>
          </div>
          <div className="pharmacy-overview-grid"><section className="pharmacy-panel pharmacy-wide"><div className="pharmacy-panel-heading"><div><h2>Incoming medication orders</h2><p>Patient orders appear after a successful simulated checkout.</p></div><button className="pharmacy-text-action" onClick={()=>setTab("orders")}>View all <ArrowRight size={15}/></button></div>
            {pending.length ? pending.slice(0,5).map(order=><article className="pharmacy-order-row" key={order.id}><span className="pharmacy-order-icon"><Pill size={19}/></span><div className="pharmacy-order-summary"><strong>{order.id}</strong><span>{order.patientName || "Demo patient"} · {(order.items||[]).map(line=>line.name+" × "+line.quantity).join(", ")}</span><small>{dateTime(order.createdAt)}</small></div><strong className="pharmacy-order-total">{money(order.total)}</strong><button className="pharmacy-small-button" onClick={()=>{setTab("orders");setFilter("pending");}} >Review</button></article>) : <div className="pharmacy-empty"><ClipboardCheck size={27}/><strong>No incoming demo orders yet</strong><p>Open the Patient demo, add an item to the basket and complete simulated checkout. Return here to process it.</p></div>}
          </section><section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>Stock watch</h2><p>Inventory needing attention</p></div><button className="pharmacy-text-action" onClick={()=>setTab("inventory")}>Manage <ArrowRight size={15}/></button></div>{inventory.filter(item=>item.active!==false).sort((a,b)=>Number(a.stock)-Number(b.stock)).slice(0,5).map(item=><div className="pharmacy-stock-row" key={item.id}><span className="pharmacy-stock-icon"><Package size={17}/></span><div><strong>{item.name}</strong><small>{item.category}</small></div><span className={Number(item.stock)<=5?"pharmacy-stock-count low":"pharmacy-stock-count"}>{item.stock} left</span></div>)}</section></div>
          <section className="pharmacy-panel pharmacy-recent"><div className="pharmacy-panel-heading"><div><h2>Recent activity</h2><p>Latest demo orders and their current status</p></div></div>{orders.slice(0,6).map(order=><div className="pharmacy-activity-row" key={order.id}><span className="pharmacy-activity-dot"/><div><strong>{order.id}</strong><small>{(order.items||[]).map(line=>line.name).join(", ")} · {dateTime(order.updatedAt||order.createdAt)}</small></div><span className={"pharmacy-order-status status-"+order.status}>{readable(order.status)}</span></div>)}</section>
        </>}

        {tab==="orders"&&<section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>Order queue</h2><p>Each change is written to the same sandbox workflow read by the patient activity screen.</p></div><span className="pharmacy-count-pill">{visibleOrders.length} orders</span></div><div className="pharmacy-order-tools"><label className="pharmacy-search"><Search size={17}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search order, patient or medicine"/></label><select value={filter} onChange={event=>setFilter(event.target.value)} aria-label="Filter orders"><option value="all">All orders</option><option value="pending">Awaiting pharmacy</option><option value="active">Active fulfilment</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div>
          {visibleOrders.length ? visibleOrders.map(order=><article className="pharmacy-order-card" key={order.id}><div className="pharmacy-order-card-head"><div><span className="pharmacy-order-reference">{order.id}</span><h3>{order.patientName || "Demo patient"}</h3><small>{dateTime(order.createdAt)} · {order.fulfilment==="delivery"?"Home delivery":"Pickup"}</small></div><span className={"pharmacy-order-status status-"+order.status}>{readable(order.status)}</span></div><div className="pharmacy-order-line-list">{(order.items||[]).map(line=><div key={line.productId+line.name}><span>{line.name} <small>× {line.quantity}</small></span><strong>{money(line.lineTotal ?? line.unitPrice*line.quantity)}</strong></div>)}</div><div className="pharmacy-order-meta"><span><Banknote size={15}/> {money(order.total)}</span><span><ShieldCheck size={15}/> Payment: {readable(order.paymentStatus)}</span><span><Truck size={15}/> {order.fulfilment==="delivery"?"Delivery":"Pickup"}</span></div>{order.address&&<div className="pharmacy-patient-address"><strong>Demo delivery address</strong><span>{order.address}</span></div>}{order.notes&&<div className="pharmacy-patient-address"><strong>Patient note (demo)</strong><span>{order.notes}</span></div>}
            {order.status==="awaiting_payment"&&<p className="pharmacy-inline-hint">Waiting for a successful simulated payment. This order is not ready for pharmacy processing.</p>}
            <div className="pharmacy-order-actions">{(nextActions[order.status]||[]).map(action=><button key={action.status} disabled={busyId===order.id} className={action.status==="cancelled"?"pharmacy-danger-button":"pharmacy-action-button"} onClick={()=>act(order,action.status)}><action.Icon size={16}/>{busyId===order.id?"Updating…":action.label}</button>)}{!nextActions[order.status]?.length&&<span className="pharmacy-order-terminal">No further pharmacy action for this status.</span>}</div>
            {order.status==="awaiting_pharmacy"&&<label className="pharmacy-review-note">Review / rejection note (demo)<textarea value={reason[order.id]||""} maxLength={300} onChange={event=>setReason(current=>({...current,[order.id]:event.target.value}))} placeholder="Optional note to explain a rejection"/></label>}
          </article>) : <div className="pharmacy-empty"><Package size={28}/><strong>No orders match this filter</strong><p>Try another filter or create a demo order from the patient shop.</p></div>}
        </section>}

        {tab==="prescriptions"&&<section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>Prescription review queue</h2><p>Only simulated intake metadata is available; document contents are not stored.</p></div><span className="pharmacy-count-pill">{prescriptions.filter(item=>["pending","awaiting_review","submitted"].includes(item.status)).length} pending</span></div>{prescriptions.length?prescriptions.map(item=><article className="pharmacy-prescription-card" key={item.id}><div className="pharmacy-order-card-head"><div><span className="pharmacy-order-reference">{item.id}</span><h3>{item.patientName}</h3><small>{item.fileName} · {Math.max(1,Math.round(Number(item.fileSize||0)/1024))} KB · {dateTime(item.createdAt)}</small></div><span className={"pharmacy-order-status status-"+item.status}>{readable(item.status)}</span></div>{item.notes&&<p className="pharmacy-prescription-note">Patient note: {item.notes}</p>}{item.reviewNote&&<p className="pharmacy-prescription-note">Review note: {item.reviewNote}</p>}{["pending","awaiting_review","submitted"].includes(item.status)&&<div className="pharmacy-prescription-review"><label>Review note<textarea value={reason[item.id]||""} maxLength={500} onChange={event=>setReason(current=>({...current,[item.id]:event.target.value}))} placeholder="Reason for the demo decision"/></label><button className="pharmacy-danger-button" onClick={()=>rejectPrescription(item)}><XCircle size={16}/> Record demo rejection</button><span className="pharmacy-inline-hint">Approval is intentionally not simulated as clinical approval because no prescription file contents or authorised pharmacist identity are verified.</span></div>}</article>) : <div className="pharmacy-empty"><Pill size={28}/><strong>No prescription requests yet</strong><p>Use the patient prescription intake demo to create a metadata-only request.</p></div>}</section>}

        {tab==="inventory"&&<div className="pharmacy-inventory-layout"><section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>Medicine catalogue</h2><p>Demo catalogue entries also appear in the patient shop.</p></div><span className="pharmacy-count-pill">{inventory.length} items</span></div><div className="pharmacy-inventory-table-wrap"><table className="pharmacy-inventory-table"><thead><tr><th>Medicine / item</th><th>Category</th><th>Price</th><th>Stock</th><th>Type</th><th>Actions</th></tr></thead><tbody>{inventory.map(item=><tr key={item.id}><td><strong>{item.name}</strong><small>{item.description}</small></td><td>{item.category}</td><td>{money(item.price)}</td><td><span className={Number(item.stock)<=5?"pharmacy-stock-count low":"pharmacy-stock-count"}>{item.stock}</span></td><td>{item.prescriptionRequired?"Prescription":"OTC demo"}</td><td><div className="pharmacy-table-actions"><button onClick={()=>editMedicine(item)}>Edit</button><button onClick={()=>toggleMedicine(item)}>{item.active===false?"Activate":"Hide"}</button></div></td></tr>)}</tbody></table></div></section>
          <section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>{editingId?"Edit medicine":"Add medicine"}</h2><p>Changes are saved to the local demo catalogue.</p></div></div><form className="pharmacy-medicine-form" onSubmit={saveMedicine}><label>Medicine name<input required minLength={2} maxLength={100} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})} placeholder="e.g. Demo vitamin tablets"/></label><label>Category<select value={draft.category} onChange={event=>setDraft({...draft,category:event.target.value})}><option>OTC demo item</option><option>First aid test item</option><option>Health equipment test item</option><option>Prescription demo item</option></select></label><label>Description<textarea maxLength={300} value={draft.description} onChange={event=>setDraft({...draft,description:event.target.value})} placeholder="Describe the sample item"/></label><div className="pharmacy-form-pair"><label>Price (ZAR)<input required type="number" min="0" step="0.01" value={draft.price} onChange={event=>setDraft({...draft,price:event.target.value})}/></label><label>Stock quantity<input required type="number" min="0" step="1" value={draft.stock} onChange={event=>setDraft({...draft,stock:event.target.value})}/></label></div><label className="pharmacy-check"><input type="checkbox" checked={draft.prescriptionRequired} onChange={event=>setDraft({...draft,prescriptionRequired:event.target.checked,category:event.target.checked?"Prescription demo item":draft.category})}/> Prescription-required demo item (patient checkout blocks it until prescription workflow is configured)</label><div className="pharmacy-form-actions"><button className="pharmacy-action-button" type="submit"><CheckCircle2 size={16}/>{editingId?"Save changes":"Add to demo catalogue"}</button>{editingId&&<button type="button" className="pharmacy-secondary-button" onClick={()=>{setEditingId("");setDraft({name:"",category:"OTC demo item",description:"",price:"25",stock:"20",prescriptionRequired:false});}}>Cancel edit</button>}</div></form></section></div>}

        {tab==="finance"&&<><div className="pharmacy-stat-grid"><div className="pharmacy-stat-card"><span className="stat-icon green"><Banknote size={20}/></span><small>Authorised test value</small><strong>{money(revenue)}</strong><span className="stat-foot">No real funds moved</span></div><div className="pharmacy-stat-card"><span className="stat-icon blue"><ClipboardCheck size={20}/></span><small>Payment attempts</small><strong>{payments.filter(item=>item.type!=="refund").length}</strong><span className="stat-foot">Simulated records</span></div><div className="pharmacy-stat-card"><span className="stat-icon amber"><AlertCircle size={20}/></span><small>Pending / failed</small><strong>{payments.filter(item=>["payment_pending","test_failed","test_cancelled"].includes(item.status)).length}</strong><span className="stat-foot">Not treated as revenue</span></div><div className="pharmacy-stat-card"><span className="stat-icon violet"><ShieldCheck size={20}/></span><small>Refund records</small><strong>{payments.filter(item=>item.type==="refund").length}</strong><span className="stat-foot">Simulated only</span></div></div><section className="pharmacy-panel"><div className="pharmacy-panel-heading"><div><h2>Payment ledger</h2><p>Read-only view of simulated payment attempts and refund records.</p></div></div>{payments.length?payments.map(item=><div className="pharmacy-activity-row" key={item.id}><span className="pharmacy-activity-dot"/><div><strong>{item.id} · {item.orderId}</strong><small>{readable(item.type)} · {readable(item.status)} · {dateTime(item.createdAt)}</small></div><strong>{money(item.amount)}</strong></div>):<div className="pharmacy-empty"><Banknote size={28}/><strong>No demo payment records</strong><p>Complete the simulated checkout in the patient shop to see records here.</p></div>}</section></>}
      </section>
    </div>
  </main>;
}
