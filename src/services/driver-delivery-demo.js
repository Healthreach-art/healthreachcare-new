/**
 * Courier demo adapter v1. Synthetic browser-only data, never production auth.
 * Browser storage is not atomic, authoritative, secure, or cross-device.
 */
import { readWorkflow, updateWorkflow, WORKFLOW_KEY } from "../test-workflow.js";
export const DRIVER_DEMO_VERSION = 1;
const marker = "driverDeliveryDemoVersion";
// Driver sees the same synthetic patient delivery orders that Pharmacy processes.
const isDemo = o => o?.testOnly === true && o?.fulfilment === "delivery" && o?.status !== "cancelled";
const at = () => new Date().toISOString();
const result = (value, error) => error ? { ok:false, error } : { ok:true, value };
const clone = o => o ? { ...o, items:(o.items||[]).map(x=>({...x})), statusHistory:[...(o.statusHistory||[])] } : null;
function history(order, status, actor, event) {
  const time=at(); order.updatedAt=time;
  order.statusHistory=[...(order.statusHistory||[]),{status,at:time,actor,event,testOnly:true}];
  return time;
}
function makeSeed(draft) {
  const time=at(), suffix=Date.now().toString(36).toUpperCase();
  const id="HRC-DEMO-DEL-"+suffix, paymentId="HRC-DEMO-PAY-"+suffix;
  const order={
    id,driverDeliveryDemoVersion:DRIVER_DEMO_VERSION,demoLabel:"Synthetic courier workflow",
    patientName:"Demo Patient (Synthetic)",phone:"+27000000000",
    address:"Demo delivery location, Cape Town",deliveryAddress:"Demo delivery location, Cape Town",
    items:[{productId:"test-ors",name:"Oral rehydration salts (demo item)",quantity:1,unitPrice:12,lineTotal:12,prescriptionRequired:false}],
    notes:"Synthetic test order only. Contains no real patient information.",
    fulfilment:"delivery",subtotal:12,deliveryFee:35,driverEarnings:25,total:47,
    status:"awaiting_pharmacy",paymentStatus:"test_authorized",paymentMethod:"simulated-demo-payment",
    paymentId,stockDeducted:false,createdAt:time,updatedAt:time,testOnly:true,
    statusHistory:[{status:"awaiting_pharmacy",at:time,actor:"driver-demo-seed",testOnly:true}]
  };
  draft.orders.unshift(order);
  draft.payments.unshift({id:paymentId,orderId:id,amount:47,currency:"ZAR",method:"simulated-demo-payment",provider:"driver-demo-adapter",status:"test_authorized",type:"payment",testOnly:true,fundsMoved:false,createdAt:time,updatedAt:time});
  return order;
}
// Do not manufacture a courier order. Patient checkout is the only source of orders.
export function ensureDemoDelivery() {
  return {created:false,order:null};
}
/** Reset only driver-demo records; preserve all unrelated test work and inventory. */
export function resetDemoData() {
  // Reset is intentionally empty-state: never create a synthetic order or payment.
  // The only source of a new delivery is a patient checkout followed by successful
  // simulated payment and pharmacy preparation/ready-for-delivery.
  const r = updateWorkflow(d => {
    const demoOrders = d.orders.filter(o => o?.testOnly === true && o?.[marker] === DRIVER_DEMO_VERSION);
    const ids = new Set(demoOrders.map(o => o.id));
    for (const order of demoOrders) {
      if (order.stockDeducted && !order.stockRestocked) {
        for (const line of order.items || []) {
          const product = d.inventory.find(p => p.id === line.productId);
          if (product) product.stock = Number(product.stock || 0) + Number(line.quantity || 0);
        }
      }
    }
    d.orders = d.orders.filter(o => !ids.has(o.id));
    d.payments = d.payments.filter(p => !ids.has(p.orderId) && !ids.has(p.id));
    return { value: null };
  });
  if (r?.error) throw new Error(r.error);
  return null;
}

export async function listAvailableDeliveries() {
  return readWorkflow().orders.filter(o=>isDemo(o)&&o.status==="ready_for_delivery"&&!o.driverId).map(clone);
}
export async function getDelivery(orderId) { return clone(readWorkflow().orders.find(o=>isDemo(o)&&o.id===orderId)); }
/** Best-effort local claim. Production must use an atomic server-side conditional update. */
export async function claimDelivery(orderId,driverId,driverName) {
  if(!String(driverId||"").trim()) return result(null,"Choose a demo driver first.");
  const r=updateWorkflow(d=>{
    const o=d.orders.find(x=>isDemo(x)&&x.id===orderId);
    if(!o) return {error:"Demo delivery not found. Refresh the queue."};
    if(o.fulfilment!=="delivery"||o.status!=="ready_for_delivery") return {error:"This delivery is no longer available."};
    if(o.driverId) return {error:"Another driver has already accepted this delivery. Refresh the queue."};
    o.driverId=driverId;o.driverName=String(driverName||driverId).slice(0,80);o.deliveryStage="accepted";o.status="driver_assigned";
    o.driverAcceptedAt=history(o,"driver_assigned",driverId,"driver_accepted");
    return {value:o};
  });
  return r?.error?result(null,r.error):result(clone(r.value));
}
export async function confirmPickup(orderId,driverId,checklist={}) {
  if(checklist.reference!==true||checklist.package!==true) return result(null,"Confirm both the order reference and sealed package.");
  const r=updateWorkflow(d=>{
    const o=d.orders.find(x=>isDemo(x)&&x.id===orderId);
    if(!o) return {error:"Demo delivery not found."};
    if(o.driverId!==driverId) return {error:"This delivery belongs to another demo driver."};
    if(o.status!=="driver_assigned"||o.deliveryStage!=="accepted") return {error:"Pickup requires an accepted delivery and can happen only once."};
    o.status="picked_up";o.deliveryStage="picked_up";o.pickupConfirmedAt=history(o,"picked_up",driverId,"pickup_confirmed");
    return {value:o};
  });
  return r?.error?result(null,r.error):result(clone(r.value));
}
export async function updateDeliveryStatus(orderId,nextStatus,driverId) {
  if(nextStatus!=="out_for_delivery") return result(null,"Use pickup or simulated proof-of-delivery confirmation for this step.");
  const r=updateWorkflow(d=>{
    const o=d.orders.find(x=>isDemo(x)&&x.id===orderId);
    if(!o) return {error:"Demo delivery not found."};
    if(o.driverId!==driverId) return {error:"This delivery belongs to another demo driver."};
    if(o.status!=="picked_up"||o.deliveryStage!=="picked_up"||!o.pickupConfirmedAt) return {error:"Complete the pickup checklist before starting delivery."};
    o.status="out_for_delivery";o.deliveryStage="out_for_delivery";history(o,nextStatus,driverId,"delivery_started");
    return {value:o};
  });
  return r?.error?result(null,r.error):result(clone(r.value));
}
export async function confirmDelivery(orderId,driverId,confirmation={}) {
  if(confirmation.confirmed!==true) return result(null,"Confirm the simulated recipient handover to complete this demo.");
  const r=updateWorkflow(d=>{
    const o=d.orders.find(x=>isDemo(x)&&x.id===orderId);
    if(!o) return {error:"Demo delivery not found."};
    if(o.driverId!==driverId) return {error:"This delivery belongs to another demo driver."};
    if(o.status!=="out_for_delivery"||o.deliveryStage!=="out_for_delivery") return {error:"Only an out-for-delivery order can be completed."};
    if(o.deliveryCompletedAt) return {error:"This delivery is already complete."};
    const time=at();o.status="delivered";o.deliveryStage="delivered";o.deliveryCompletedAt=time;
    o.deliveryProof={type:"simulated-confirmation",reference:"DEMO-POD-"+Date.now().toString(36).toUpperCase(),confirmedAt:time,synthetic:true};
    o.driverEarnings=Number(o.driverEarnings??o.deliveryFee??0);
    history(o,"delivered",driverId,"simulated_proof_of_delivery");
    return {value:o};
  });
  return r?.error?result(null,r.error):result(clone(r.value));
}
export async function getDeliveryHistory(driverId) {
  return readWorkflow().orders.filter(o=>isDemo(o)&&o.driverId===driverId&&o.status==="delivered")
    .sort((a,b)=>new Date(b.deliveryCompletedAt||b.updatedAt)-new Date(a.deliveryCompletedAt||a.updatedAt)).map(clone);
}
export async function getDriverEarnings(driverId) {
  const items=await getDeliveryHistory(driverId);
  return {currency:"ZAR",total:items.reduce((sum,o)=>sum+Number(o.driverEarnings??o.deliveryFee??0),0),count:items.length,items:items.map(o=>({orderId:o.id,amount:Number(o.driverEarnings??o.deliveryFee??0),completedAt:o.deliveryCompletedAt,simulated:true}))};
}
/** Same-browser refresh only; this is not realtime server synchronization. */
export function subscribeToDeliveryUpdates(callback) {
  if(typeof window==="undefined") return ()=>{};
  const workflow=e=>callback(e.detail||readWorkflow());
  const storage=e=>{if(!e.key||e.key===WORKFLOW_KEY)callback(readWorkflow());};
  window.addEventListener("healthreachcare-test-workflow",workflow);window.addEventListener("storage",storage);
  return ()=>{window.removeEventListener("healthreachcare-test-workflow",workflow);window.removeEventListener("storage",storage);};
}
