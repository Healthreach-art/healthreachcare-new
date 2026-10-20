import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, MapPin, Package, RefreshCw, ShieldCheck, Truck, UserRound, Wallet, AlertCircle, History, RotateCcw } from "lucide-react";
import { claimDelivery, confirmDelivery, confirmPickup, ensureDemoDelivery, getDriverEarnings, getDeliveryHistory, listAvailableDeliveries, resetDemoData, subscribeToDeliveryUpdates, updateDeliveryStatus } from "./services/driver-delivery-demo.js";
import "./DriverDeliveryDemo.css";

const DRIVERS=[{id:"demo-driver-01",label:"Demo Driver A"},{id:"demo-driver-02",label:"Demo Driver B"},{id:"demo-driver-03",label:"Demo Driver C"}];
const cash=value=>"R"+Number(value||0).toFixed(2);
const stamp=value=>value?new Date(value).toLocaleString("en-ZA",{dateStyle:"medium",timeStyle:"short"}):"Not recorded";
const itemText=order=>(order.items||[]).map(i=>i.name+" × "+(i.quantity||1)).join(", ")||"Synthetic medicine order";

export default function DriverDeliveryDemo({orders,refresh}) {
  const [tab,setTab]=useState("home"),[online,setOnline]=useState(false);
  const [driverId,setDriverId]=useState(()=>{try{return window.localStorage.getItem("healthreachcare-driver-demo-active-v1")||DRIVERS[0].id}catch{return DRIVERS[0].id}});
  const [notice,setNotice]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(""),[loading,setLoading]=useState(true);
  const [available,setAvailable]=useState([]),[history,setHistory]=useState([]),[earnings,setEarnings]=useState({total:0,count:0,items:[]});
  const [checks,setChecks]=useState({}),[proof,setProof]=useState({});
  const driverName=DRIVERS.find(d=>d.id===driverId)?.label||DRIVERS[0].label;
  const assigned=useMemo(()=>orders.filter(o=>o.testOnly&&o.driverDeliveryDemoVersion===1&&o.driverId===driverId&&["ready_for_delivery","out_for_delivery"].includes(o.status)),[orders,driverId]);
  const completed=useMemo(()=>orders.filter(o=>o.testOnly&&o.driverDeliveryDemoVersion===1&&o.driverId===driverId&&o.status==="delivered"),[orders,driverId]);
  const earned=completed.reduce((sum,o)=>sum+Number(o.driverEarnings??o.deliveryFee??0),0);

  const load=async()=>{
    setLoading(true);
    try{const [queue,past,ledger]=await Promise.all([listAvailableDeliveries(),getDeliveryHistory(driverId),getDriverEarnings(driverId)]);setAvailable(queue);setHistory(past);setEarnings(ledger);setError("");}
    catch(e){setError(e?.message||"Could not load deliveries. Refresh and try again.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    try{ensureDemoDelivery()}catch(e){setError(e?.message||"Could not seed synthetic demo order.");}
    const off=subscribeToDeliveryUpdates(()=>{refresh();void load()});
    void load();return off;
  },[driverId]);

  const act=async(id,operation,success)=>{
    setBusy(id);setError("");setNotice("");
    try{const r=await operation();if(!r?.ok)throw new Error(r?.error||"Action could not be completed.");refresh();await load();setNotice(success);}
    catch(e){setError(e?.message||"Action failed. Refresh and try again.");}
    finally{setBusy("");}
  };
  const changeDriver=value=>{
    setDriverId(value);
    try{window.localStorage.setItem("healthreachcare-driver-demo-active-v1",value)}catch{setError("Could not save selected demo driver.");}
    setNotice("Switched to "+(DRIVERS.find(d=>d.id===value)?.label||value)+". Orders assigned to other demo drivers are hidden.");
    setError("");
  };
  const reset=()=>{
    setBusy("reset");setError("");setNotice("");
    try{resetDemoData();setChecks({});setProof({});refresh();void load();setNotice("Demo reset. A new synthetic order is waiting in Pharmacy. Other sandbox orders and inventory were preserved.");}
    catch(e){setError(e?.message||"Could not reset demo data.");}
    finally{setBusy("");}
  };
  const steps=order=>{
    const ids=["accepted","picked_up","out_for_delivery","delivered"];
    const labels=["Accepted","Picked up","Out for delivery","Delivered"];
    const stage=order.status==="delivered"?"delivered":order.status==="out_for_delivery"?"out_for_delivery":order.deliveryStage||"accepted";
    const current=ids.indexOf(stage);
    return <div className="driver-demo-steps" aria-label={"Delivery progress: "+stage.replace(/_/g," ")}>{ids.map((id,i)=><div className={"driver-demo-step"+(i<=current?" is-complete":"")} key={id}><span>{i<current?<CheckCircle2 size={14}/>:i+1}</span><small>{labels[i]}</small></div>)}</div>;
  };
  const card=order=>{
    const mine=order.driverId===driverId,check=checks[order.id]||{},working=busy===order.id;
    return <article className="driver-demo-order-card" key={order.id}>
      <div className="driver-demo-order-head"><span className="driver-delivery-icon"><Package size={20}/></span><div><strong>{order.id}</strong><small>{itemText(order)}</small></div><span className={"test-status status-"+order.status}>{order.status.replace(/_/g," ")}</span></div>
      <div className="driver-delivery-details"><div><MapPin size={15}/><span><small>Pickup / delivery</small><strong>Demo pharmacy → {order.address||"Synthetic demo destination"}</strong></span></div><div><UserRound size={15}/><span><small>Recipient</small><strong>Demo Patient (Synthetic)</strong></span></div><div><Clock3 size={15}/><span><small>Created</small><strong>{stamp(order.createdAt)}</strong></span></div></div>
      {steps(order)}
      {!mine&&order.status==="ready_for_delivery"&&!order.driverId&&<div className="driver-demo-action-panel"><p>This pharmacy-ready synthetic order is unassigned. Accept it to reserve it for {driverName} in this browser's demo workflow.</p><div className="driver-demo-fee">Demo fee <strong>{cash(order.driverEarnings??order.deliveryFee)}</strong></div><button type="button" className="button button-primary" disabled={!online||Boolean(busy)} onClick={()=>act(order.id,()=>claimDelivery(order.id,driverId,driverName),"Delivery accepted and assigned to "+driverName+". It is hidden from other demo-driver queues.")}>{working?"Accepting…":"Accept delivery"} <ArrowRight size={16}/></button>{!online&&<small>Go online to enable demo actions.</small>}</div>}
      {mine&&order.status==="ready_for_delivery"&&order.deliveryStage==="accepted"&&<div className="driver-demo-action-panel"><h3><ClipboardCheck size={17}/> Pharmacy handover checklist</h3><p>Demo checklist only; it is not a verified chain-of-custody record.</p><label><input type="checkbox" checked={!!check.reference} onChange={e=>setChecks(s=>({...s,[order.id]:{...s[order.id],reference:e.target.checked}}))}/> I checked the order reference.</label><label><input type="checkbox" checked={!!check.package} onChange={e=>setChecks(s=>({...s,[order.id]:{...s[order.id],package:e.target.checked}}))}/> I checked the sealed demo package.</label><button type="button" className="button button-primary" disabled={!online||working||!check.reference||!check.package} onClick={()=>act(order.id,()=>confirmPickup(order.id,driverId,check),"Pickup confirmed. You can now mark the order out for delivery.")}>{working?"Confirming pickup…":"Confirm pickup"} <CheckCircle2 size={16}/></button></div>}
      {mine&&order.status==="ready_for_delivery"&&order.deliveryStage==="picked_up"&&<div className="driver-demo-action-panel"><h3><Truck size={17}/> Ready to leave</h3><p>The pickup is confirmed. The next status will appear in the pharmacy and patient test views in this browser.</p><button type="button" className="button button-primary" disabled={!online||working} onClick={()=>act(order.id,()=>updateDeliveryStatus(order.id,"out_for_delivery",driverId),"Order marked out for delivery in the shared test workflow.")}>{working?"Updating…":"Mark out for delivery"} <ArrowRight size={16}/></button></div>}
      {mine&&order.status==="out_for_delivery"&&<div className="driver-demo-action-panel"><h3><ShieldCheck size={17}/> Simulated proof of delivery</h3><p>No photo, signature, GPS point or real recipient details are collected. Confirmation creates a synthetic proof reference only.</p><label><input type="checkbox" checked={!!proof[order.id]} onChange={e=>setProof(s=>({...s,[order.id]:e.target.checked}))}/> I confirm the simulated demo handover.</label><button type="button" className="button button-primary" disabled={!online||working||!proof[order.id]} onClick={()=>act(order.id,()=>confirmDelivery(order.id,driverId,{confirmed:true}),"Delivery completed with simulated proof. No patient or pharmacy notification was sent.")}>{working?"Completing…":"Confirm demo delivery"} <CheckCircle2 size={16}/></button></div>}
      {order.status==="delivered"&&<div className="driver-demo-proof"><CheckCircle2 size={18}/><div><strong>Delivered · simulated proof only</strong><small>{order.deliveryProof?.reference||"Proof reference unavailable"} · {stamp(order.deliveryCompletedAt)}</small></div><strong>{cash(order.driverEarnings??order.deliveryFee)}</strong></div>}
      {mine&&<div className="driver-delivery-footer"><span>Assigned to {driverName} · synthetic assignment</span><span className="driver-demo-fee">Demo fee <strong>{cash(order.driverEarnings??order.deliveryFee)}</strong></span></div>}
    </article>;
  };

  return <div className="driver-dashboard">
    <div className="driver-preview-banner"><ShieldCheck size={18}/><div><strong>HealthReachCare Courier · TEST MODE</strong><span>Synthetic orders only. Browser demo; no live dispatch, GPS, patient notifications or money movement.</span></div><span className="driver-preview-chip">DEMO</span></div>
    <div className="driver-tabs" role="tablist" aria-label="Courier sections"><button type="button" role="tab" aria-selected={tab==="home"} className={"driver-tab"+(tab==="home"?" active":"")} onClick={()=>setTab("home")}><Truck size={18}/><span>Deliveries</span></button><button type="button" role="tab" aria-selected={tab==="history"} className={"driver-tab"+(tab==="history"?" active":"")} onClick={()=>setTab("history")}><History size={18}/><span>History & earnings</span></button></div>
    {notice&&<div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={()=>setNotice("")}>×</button></div>}
    {error&&<div className="inline-message test-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={()=>setError("")}>×</button></div>}
    <div className="driver-demo-toolbar"><label>Testing as<select value={driverId} onChange={e=>changeDriver(e.target.value)}>{DRIVERS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></label><div><button type="button" className="button button-outline" disabled={!!busy} onClick={()=>{void load();refresh();setNotice("Queue refreshed from the local shared workflow.")}}><RefreshCw size={15}/> Refresh</button><button type="button" className="button button-outline" disabled={!!busy} onClick={reset}><RotateCcw size={15}/> Reset demo data</button></div></div>
    {tab==="home"&&<>
      <div className="driver-home-hero"><div className="driver-hero-top"><div><div className="eyebrow">YOUR DELIVERY DAY</div><h2>Welcome, {driverName}</h2><p>Accept a pharmacy-ready test order, check the handover, and complete the delivery flow.</p></div><span className={"driver-online-status"+(online?" is-online":"")}><span/>{online?"Online · demo":"Offline"}</span></div><div className="driver-online-control"><div><strong>{online?"Available in the local simulation":"Go online when you’re ready"}</strong><small>Availability affects demo actions only. No real dispatch requests are sent.</small></div><button type="button" className={"driver-go-button"+(online?" is-online":"")} onClick={()=>setOnline(v=>!v)}>{online?"Go offline":"Go online"} <ArrowRight size={17}/></button></div></div>
      <div className="driver-metric-grid"><div className="driver-metric"><span><Package size={18}/></span><small>Ready for delivery</small><strong>{loading?"…":available.length}</strong><p>Unassigned test orders</p></div><div className="driver-metric"><span><Truck size={18}/></span><small>My active deliveries</small><strong>{assigned.length}</strong><p>Assigned to {driverName}</p></div><div className="driver-metric"><span><CheckCircle2 size={18}/></span><small>Completed deliveries</small><strong>{completed.length}</strong><p>Synthetic records</p></div><div className="driver-metric"><span><Wallet size={18}/></span><small>Simulated earnings</small><strong>{cash(earned)}</strong><p>No payout or settlement</p></div></div>
      <section className="courier-map-card" aria-label="Simulated delivery map"><div className="courier-map-top"><div><span className="courier-kicker">YOUR AREA</span><h2>Delivery map</h2><p>Illustrative pickup and driver markers. No coordinates are requested or transmitted.</p></div><span className="courier-map-status"><span/> {online?"Available for test orders":"Go online to accept demo orders"}</span></div><div className="courier-map-art" aria-hidden="true"><div className="courier-map-road road-one"/><div className="courier-map-road road-two"/><div className="courier-map-road road-three"/><div className="courier-map-block block-one"/><div className="courier-map-block block-two"/><div className="courier-map-block block-three"/><div className="courier-map-block block-four"/><div className="courier-map-route"><span className="courier-map-pickup"><Package size={15}/></span><span className="courier-map-line"/><span className="courier-map-driver"><Truck size={17}/></span></div><span className="courier-map-label label-pickup">PHARMACY PICKUP</span><span className="courier-map-label label-driver">DRIVER</span></div><div className="courier-map-footer"><span><MapPin size={15}/> Demo map — location is simulated</span><span>{available.length} unassigned {available.length===1?"order":"orders"}</span></div></section>
      <div className="test-surface driver-queue-surface"><div className="test-section-head"><div><div className="eyebrow">DELIVERY WORK</div><h2>Available deliveries</h2><p>Orders appear after the pharmacy prepares and marks them ready for delivery.</p></div></div>{loading?<div className="driver-empty-state"><RefreshCw size={24}/><strong>Loading delivery queue…</strong></div>:available.length?available.map(card):<div className="driver-empty-state"><Package size={28}/><strong>No delivery-ready orders</strong><p>The synthetic order is in the pharmacy queue until pharmacy accepts, prepares and marks it ready. Use Reset demo data if you completed the workflow already.</p></div>}</div>
      <div className="test-surface"><div className="test-section-head"><div><h2>My assigned deliveries</h2><p>Only deliveries assigned to {driverName} appear here. Other demo drivers have separate queues.</p></div></div>{assigned.length?assigned.map(card):<div className="driver-quiet-empty">No active deliveries assigned to this demo driver.</div>}</div>
    </>}
    {tab==="history"&&<div className="test-surface"><div className="test-section-head"><div><h2>Delivery history</h2><p>Completed test deliveries and simulated fees for {driverName}.</p></div><span className="driver-preview-chip">SIMULATED</span></div><div className="driver-metric-grid"><div className="driver-metric"><span><Wallet size={18}/></span><small>Total demo earnings</small><strong>{cash(earnings.total)}</strong><p>Completed deliveries only</p></div><div className="driver-metric"><span><CheckCircle2 size={18}/></span><small>Completed orders</small><strong>{earnings.count}</strong><p>No settlement record</p></div></div>{loading?<div className="driver-empty-state"><RefreshCw size={24}/><strong>Loading history…</strong></div>:history.length?history.map(card):<div className="driver-empty-state"><History size={26}/><strong>No completed deliveries yet</strong><p>Complete a synthetic delivery to see its simulated fee and proof reference here.</p></div>}<p className="driver-demo-footnote">Earnings are illustrative values. No payout, bank transfer or real money movement occurs.</p></div>}
    </>}
  </div>;
}
