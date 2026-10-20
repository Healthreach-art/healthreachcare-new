import { useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, ChevronRight,
  HeartPulse, Home, MapPin, Pill, Moon, Sun,
  ShieldCheck, Stethoscope, UserRound, Video, Phone,
  Upload, House, MessageCircle, AlertCircle, X, Mail, LockKeyhole, BellRing, LogOut, Save,
  Clock3, Plus, Trash2, Volume2
} from "lucide-react";
import BookingFlow from "./BookingFlow.jsx";
import ProviderWorkspace from "./ProviderWorkspace.jsx";
import PrescriptionSandbox from "./PrescriptionSandbox.jsx";
import { readWorkflow, simulateTestBookingPayment, useTestWorkflow, SIMULATION_CONFIG } from "./test-workflow.js";
import { PatientMedicineShop, TestRoleWorkspace, TestingAuth, TestingLanding } from "./TestingPortal.jsx";


const LEGACY_BOOKINGS_KEY = "healthreachcare-test-bookings";
const readLegacyBookings = () => {
  try { const value = JSON.parse(localStorage.getItem(LEGACY_BOOKINGS_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const activityStatus = item => String(item.status || item.requestStatus || "pending").toLowerCase();
const isClosedActivity = item => ["delivered", "completed", "declined", "rejected", "cancelled", "canceled"].includes(activityStatus(item));
const activityKind = item => item.items ? "Medication order" : item.kind === "medication" ? "Medication order" : item.kind === "homecare" || item.type === "homecare" || /home.?care/i.test(item.serviceType || "") ? "Homecare request" : "Doctor appointment";
const activityProviderLabel = item => {
  const homecare = item.kind === "homecare" || item.type === "homecare" || /home.?care/i.test(item.serviceType || "");
  const medication = Boolean(item.items) || item.kind === "medication";
  if (homecare) return item.coordinatorName || item.homecareCoordinatorName || "Central homecare coordination team (preview)";
  if (medication) return item.pharmacyName || item.providerName || "Pharmacy not assigned in preview";
  if (item.driverName || item.driverId) return item.driverName || "Delivery driver assigned (preview)";
  return item.doctorName || item.providerName || "Doctor not assigned in preview";
};
const activityDate = value => {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || parsed.getFullYear() < 2000 || parsed.getFullYear() > 2100 ? "Date not set" : parsed.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
};
const hasInvalidPreviewDate = item => {
  const value = item.requestedDate || item.date;
  if (!value) return false;
  const year = Number(String(value).slice(0, 4));
  return !Number.isFinite(year) || year < 2000 || year > 2100;
};
const getActivityRecords = workflow => {
  const legacy = readLegacyBookings().map(item => ({ ...item, source: "legacy-test" }));
  const orders = (workflow.orders || []).filter(item => item.testOnly).map(item => ({ ...item, kind: "medication", source: "workflow-test" }));
  const bookings = (workflow.bookings || []).filter(item => item.testOnly).map(item => ({ ...item, kind: item.kind || (item.serviceType?.toLowerCase().includes("home") ? "homecare" : "appointment"), source: "workflow-test" }));
  // Hide obviously invalid legacy demo dates from the patient UI without deleting browser data.
  return [...legacy, ...bookings, ...orders]
    .filter(item => !hasInvalidPreviewDate(item))
    .sort((a, b) => new Date(b.updatedAt || b.providerResponseAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.providerResponseAt || a.createdAt || 0).getTime());
};
const activityStages = item => {
  const status = activityStatus(item);
  const closed = ["declined", "rejected", "cancelled", "canceled"].includes(status);
  const medication = Boolean(item.items) || item.kind === "medication";
  const homecare = item.kind === "homecare" || item.type === "homecare" || /home.?care/i.test(item.serviceType || "");
  const paymentVerified = ["paid", "verified", "succeeded", "test_authorized"].includes(String(item.paymentStatus || "").toLowerCase());
  const makeStages = definitions => definitions.map(([label, condition, currentCondition]) => ({
    label,
    done: Boolean(condition),
    current: !closed && Boolean(currentCondition)
  }));
  if (medication) {
    const pharmacyReviewed = ["accepted", "preparing", "ready_for_delivery", "ready_for_pickup", "out_for_delivery", "delivered"].includes(status);
    const preparing = ["preparing", "ready_for_delivery", "ready_for_pickup", "out_for_delivery", "delivered"].includes(status);
    const ready = ["ready_for_delivery", "ready_for_pickup", "out_for_delivery", "delivered"].includes(status);
    const out = ["out_for_delivery", "delivered"].includes(status);
    return makeStages([
      ["Order submitted", true, status === "awaiting_payment" || status === "awaiting_pharmacy" || status === "pending"],
      ["Pharmacy review", pharmacyReviewed, status === "awaiting_pharmacy"],
      ["Payment verified", paymentVerified, ["awaiting_payment", "payment_pending", "pending_gateway"].includes(status)],
      ["Preparing order", preparing, status === "preparing"],
      ["Ready / driver assigned", ready, ["ready_for_delivery", "ready_for_pickup"].includes(status)],
      ["Out for delivery", out, status === "out_for_delivery"],
      ["Delivered", status === "delivered", false]
    ]);
  }
  if (homecare) {
    const submitted = ["pending", "requested", "awaiting_provider_review", "accepted", "confirmed", "completed"].includes(status);
    const providerResponded = ["accepted", "confirmed", "completed"].includes(status);
    const serviceConfirmed = ["confirmed", "completed"].includes(status);
    return makeStages([
      ["Request submitted", submitted, ["pending", "requested", "awaiting_provider_review"].includes(status)],
      ["Payment verified", paymentVerified, !paymentVerified && ["awaiting_payment", "payment_pending", "pending_gateway"].includes(status)],
      ["Provider response", providerResponded, status === "accepted"],
      ["Service confirmed", serviceConfirmed, status === "confirmed"],
      ["Service completed", status === "completed", false]
    ]);
  }
  const submitted = ["pending", "requested", "awaiting_provider_review", "accepted", "confirmed", "completed"].includes(status);
  const providerResponded = ["accepted", "confirmed", "completed"].includes(status);
  const confirmed = ["confirmed", "completed"].includes(status);
  return makeStages([
    ["Request submitted", submitted, ["pending", "requested", "awaiting_provider_review"].includes(status)],
    ["Doctor response", providerResponded, status === "accepted"],
    ["Appointment confirmed", confirmed, status === "confirmed"],
    ["Appointment completed", status === "completed", false]
  ]);
};

const navItems = [
  { id:"home", label:"Home", icon:Home },
  { id:"activities", label:"Activities", icon:Activity },
  { id:"account", label:"Account", icon:UserRound }
];

function Brand() {
  return <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>HealthReachCare</strong></div></div>;
}

function App() {
  const [page, setPage] = useState("landing");
  const [user] = useState(null);
  const [accountDetails, setAccountDetails] = useState(() => {
    const defaults = {name:"",phone:"",email:"",dob:"",address:"",careNotifications:true,medicationReminders:true,announcements:true};
    try { return {...defaults, ...JSON.parse(localStorage.getItem("healthreachcare-test-account") || "{}")}; } catch { return defaults; }
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [darkBackground, setDarkBackground] = useState(false);
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [form, setForm] = useState({name:"",phone:"",details:"",location:"",date:"",time:"",service:"",duration:"",doctorId:"",doctorName:""});
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [reminders, setReminders] = useState(() => { try { return JSON.parse(localStorage.getItem("healthreachcare-test-reminders") || "[]"); } catch { return []; } });
  const [reminderForm, setReminderForm] = useState({ medicine: "", dose: "", time: "08:00", frequency: "Daily" });
  const [reminderMessage, setReminderMessage] = useState("");
  const [supportForm, setSupportForm] = useState({name:"",email:"",topic:"Care request",message:""});
  const [supportNotice, setSupportNotice] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("card_test");
  const [bookingPaymentError, setBookingPaymentError] = useState("");
  const [bookingPaymentNotice, setBookingPaymentNotice] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const workflow = useTestWorkflow();
  const activities = getActivityRecords(workflow);
  // In-app activity notifications are derived from the same simulated request ledger.
  // A push/email notification adapter can replace this selector when a backend exists.
  const notifications = activities.slice(0, 5).map(item => ({
    id: item.id,
    title: activityKind(item),
    message: String(activityStatus(item)).replace(/_/g, " ") + " · " + activityProviderLabel(item),
    createdAt: item.updatedAt || item.createdAt,
    read: true
  }));
  const notificationError = "";
  const latestActiveActivity = activities.find(item => !isClosedActivity(item));

  const payForSelectedBooking = () => {
    if (!selectedActivity?.id) return;
    setBookingPaymentError("");
    setBookingPaymentNotice("");
    try {
      const payment = simulateTestBookingPayment(selectedActivity.id, bookingPaymentMethod);
      const latest = readWorkflow().bookings.find(item => item.id === selectedActivity.id);
      if (latest) setSelectedActivity(latest);
      workflow.refresh();
      setBookingPaymentNotice("Simulated payment authorised. No funds moved. Your request is now confirmed in the sandbox.");
      if (!payment) setBookingPaymentNotice("This booking already has a simulated payment record.");
    } catch (error) {
      setBookingPaymentError(error.message || "Could not complete the simulated checkout.");
    }
  };

  const openForm = (type, extra = {}) => {
    setNotice("");
    setFormType(type);
    setForm({
      name:user?.displayName || "",
      phone:"",
      details:"",
      location:"",
      date:"",
      time:"",
      service:"",
      duration:"2 hours",
      doctorId:extra.doctorId || "",
      doctorName:extra.doctorName || ""
    });
  };

  const submitForm = event => {
    event.preventDefault();
    setNotice("This request form is a UI preview only. No account, booking, prescription, provider notification or payment service is connected, so nothing was submitted.");
    setFormType("");
    setSubmittingRequest(false);
  };

  const renderHome = () => <section className="page-content">
    <div className="hero">
      <div className="hero-copy">
        <div className="eyebrow light">YOUR HEALTH, MADE SIMPLER</div>
        <h1>Welcome{user?.displayName ? ", " + user.displayName.split(" ")[0] : ""} 👋</h1>
        <p>Your health is our priority. Let’s take care of it today.</p>

      </div>
      <div className="hero-art"><div className="hero-circle"><HeartPulse size={66}/></div><span className="hero-dot dot-one"/><span className="hero-dot dot-two"/></div>
    </div>
    {notice && <div className="notice"><AlertCircle size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice("")}><X size={17}/></button></div>}
    <div className="section-heading"><div><div className="eyebrow">HEALTHCARE, ALL IN ONE PLACE</div><h2>How can we help you?</h2></div><span className="section-note">Choose a service to get started</span></div>
    <div className="service-grid">
      <button className="service-card" onClick={()=>setPage("medicines")}><span className="service-icon green"><Pill/></span><strong>Order Medication</strong><span>Get your prescriptions filled and delivered to your location</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("doctor-booking")}><span className="service-icon blue"><CalendarDays/></span><strong>Book Doctor Appointment</strong><span>Find a doctor and request a consultation</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("homecare-booking")}><span className="service-icon lilac"><House/></span><strong>Request Homecare Services</strong><span>Arrange professional care in your home</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("prescriptions")}><span className="service-icon amber"><Upload/></span><strong>Upload Prescription</strong><span>Submit a prescription when the medicine requires one</span><ChevronRight className="service-arrow"/></button>
    </div>

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <span className="dashboard-panel-icon reminder-icon"><Bell size={20}/></span>
        <div><div className="eyebrow">STAY ON SCHEDULE</div><h2>Medication Reminders</h2><p>Keep track of medicines you need to take.</p></div>
        <button className="button button-outline panel-action" onClick={() => { setReminderMessage(""); setPage("reminders"); }}>Set up reminders <ArrowRight size={15}/></button>
      </div>
      {reminders.length ? reminders.slice().sort((a,b)=>a.time.localeCompare(b.time)).map(reminder => <div className="notification-item reminder-list-item" key={reminder.id}><span className="notification-dot"/><div><strong>{reminder.medicine}</strong><p>{reminder.dose} · {reminder.time} · {reminder.frequency}</p></div><button className="icon-button reminder-delete" aria-label={"Delete reminder for " + reminder.medicine} onClick={() => { const next = reminders.filter(item => item.id !== reminder.id); setReminders(next); try { localStorage.setItem("healthreachcare-test-reminders", JSON.stringify(next)); } catch {} }}><Trash2 size={16}/></button></div>) : <div className="dashboard-empty">
        <CalendarDays size={25}/>
        <div><strong>No reminders scheduled yet</strong><p>Your medication reminders will appear here when you set them up.</p><button className="text-button" onClick={() => { setReminderMessage(""); setPage("reminders"); }}>Create your first reminder <ArrowRight size={15}/></button></div>
      </div>}
    </div>

    <div className="dashboard-panel emergency-panel">
      <div className="dashboard-panel-heading"><span className="dashboard-panel-icon emergency-icon"><Phone size={20}/></span><div><div className="eyebrow">HELP IN AN EMERGENCY</div><h2>Emergency assistance</h2><p>If someone is seriously ill or injured, call for emergency help now.</p></div></div>
      <div className="emergency-number-grid"><div><span>Ambulance (South Africa)</span><a href="tel:10177">10177</a><small>National ambulance number</small></div><div><span>Emergency from a cellphone</span><a href="tel:112">112</a><small>Use if you need emergency assistance</small></div></div>
      <div className="emergency-actions"><button className="button button-primary" onClick={() => { const message = "In South Africa, call 10177 for an ambulance, or 112 from a cellphone for emergency assistance. HealthReachCare is not an emergency dispatch service."; if (typeof window !== "undefined" && "speechSynthesis" in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(message); utterance.lang = "en-ZA"; window.speechSynthesis.speak(utterance); } else { setNotice("Audio reading is not supported by this browser. Ambulance: 10177. Cellphone emergency: 112."); } }}><Volume2 size={17}/> Read emergency numbers aloud</button><p className="muted small">HealthReachCare cannot dispatch an ambulance. Call the number directly; do not wait for an app response.</p></div>
    </div>

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <span className="dashboard-panel-icon tracker-icon"><Activity size={20}/></span>
        <div><div className="eyebrow">YOUR CARE JOURNEY</div><h2>Care tracker</h2><p>Follow the progress of your appointments and care requests.</p></div>
      </div>
      {latestActiveActivity ? <div className="tracker-layout">
        <div className="tracker-latest-card">
          <div className="tracker-topline"><div><strong>{activityKind(latestActiveActivity)}</strong><p>{latestActiveActivity.id || "Preview reference"} · {activityDate(latestActiveActivity.requestedDate ? latestActiveActivity.requestedDate + "T" + (latestActiveActivity.requestedTime || "00:00") : latestActiveActivity.createdAt)}</p><small className="tracker-last-update">Last update: {activityDate(latestActiveActivity.updatedAt || latestActiveActivity.providerResponseAt || latestActiveActivity.createdAt)}</small></div><span className="tracker-status">{String(activityStatus(latestActiveActivity)).replace(/_/g," ")}</span></div>
          <div className="tracker-timeline">{activityStages(latestActiveActivity).map((stage,index)=><div className={"tracker-stage"+(stage.done?" done":"")+(stage.current?" current":"")} key={stage.label}><span className="tracker-stage-dot">{stage.done?"✓":index+1}</span><span>{stage.label}</span></div>)}</div>
          <p className="tracker-preview-note">Updates reflect this browser’s simulated workflow. Live dispatch and push notifications are not connected.</p>
          <button className="button button-primary" onClick={()=>{setSelectedActivity(latestActiveActivity);setPage("activities");}}>View request details <ArrowRight size={16}/></button>
        </div>
      </div> : <div className="tracker-empty-state"><HeartPulse size={28}/><strong>Your care journey starts here</strong><p>Your latest active booking or medication order will appear here.</p><div className="tracker-empty-actions"><button className="text-button" onClick={()=>setPage("medicines")}>Order medication <ArrowRight size={14}/></button><button className="text-button" onClick={()=>setPage("doctor-booking")}>Book a doctor <ArrowRight size={14}/></button><button className="text-button" onClick={()=>setPage("homecare-booking")}>Request homecare <ArrowRight size={14}/></button></div></div>}
    </div>
    <div className="dashboard-panel">
      <div className="dashboard-panel-heading recent-heading">
        <span className="dashboard-panel-icon recent-icon"><Activity size={20}/></span>
        <div><div className="eyebrow">YOUR LATEST UPDATES</div><h2>Recent activity</h2><p>A quick look at your latest care requests.</p></div>
        <button className="text-button" onClick={() => setPage("activities")}>View activities <ArrowRight size={15}/></button>
      </div>
      {activities.length ? activities.slice(0,3).map(item => <button type="button" className="notification-item recent-activity-button" key={item.id} onClick={()=>{setSelectedActivity(item);setPage("activities");}}><span className="notification-dot"/><span><strong>{activityKind(item)}</strong><p>{item.requestedDate ? activityDate(item.requestedDate + "T" + (item.requestedTime || "00:00")) : activityDate(item.createdAt)} · {String(activityStatus(item)).replace(/_/g," ")}</p><small>Test preview · {activityProviderLabel(item)}</small></span><ChevronRight size={16}/></button>) : <div className="dashboard-empty recent-empty"><CalendarDays size={24}/><div><strong>No recent activity yet</strong><p>Your appointments and homecare requests will appear here after you create one.</p></div></div>}
    </div>

  </section>;

  const saveReminder = event => {
    event.preventDefault();
    const medicine = reminderForm.medicine.trim();
    if (!medicine || !reminderForm.time) { setReminderMessage("Enter a medicine name and reminder time."); return; }
    const next = [...reminders, { id: "reminder-" + Date.now(), medicine, dose: reminderForm.dose.trim() || "Dose not specified", time: reminderForm.time, frequency: reminderForm.frequency, createdAt: new Date().toISOString() }];
    setReminders(next);
    try { localStorage.setItem("healthreachcare-test-reminders", JSON.stringify(next)); } catch { setReminderMessage("Could not save this reminder in your browser. Check storage settings."); return; }
    setReminderForm({ medicine: "", dose: "", time: "08:00", frequency: "Daily" });
    setReminderMessage("Reminder saved on this device. This preview does not send background notifications or replace your prescribed instructions.");
  };

  const renderReminders = () => <section className="page-content reminder-page">
    <button className="text-button" onClick={() => setPage("home")}><ArrowRight size={15} className="back-arrow"/> Back to Home</button>
    <div className="eyebrow">STAY ON SCHEDULE</div><h1>Medication Reminders</h1><p className="lead">Create a personal reminder to help you remember when to take your medicine. Follow your prescriber's instructions.</p>
    {reminderMessage && <div className="inline-message"><Bell size={18}/><span>{reminderMessage}</span></div>}
    <form className="panel reminder-form" onSubmit={saveReminder}><div className="panel-heading"><div className="panel-icon"><Clock3/></div><div><h2>Set up a reminder</h2><p>Saved only in this browser on this device.</p></div></div>
      <label>Medicine name<input required value={reminderForm.medicine} onChange={e=>setReminderForm({...reminderForm,medicine:e.target.value})} placeholder="Enter medicine name" maxLength={100}/></label>
      <label>Dose or note (optional)<input value={reminderForm.dose} onChange={e=>setReminderForm({...reminderForm,dose:e.target.value})} placeholder="e.g. 1 tablet — follow your prescription" maxLength={120}/></label>
      <div className="reminder-fields-row"><label>Reminder time<input required type="time" value={reminderForm.time} onChange={e=>setReminderForm({...reminderForm,time:e.target.value})}/></label><label>Repeat<select value={reminderForm.frequency} onChange={e=>setReminderForm({...reminderForm,frequency:e.target.value})}>{["Daily","Weekdays","Weekends","Weekly"].map(value=><option key={value}>{value}</option>)}</select></label></div>
      <button className="button button-primary" type="submit"><Plus size={17}/> Save reminder</button><p className="muted small">These entries are stored on this device only. No alarm will sound when the app is closed, and they do not change or validate your medicine dose.</p>
    </form>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Your reminders</h2><p>{reminders.length} saved on this device</p></div></div>
      {reminders.length ? reminders.slice().sort((a,b)=>a.time.localeCompare(b.time)).map(reminder=><div className="notification-item reminder-list-item" key={reminder.id}><span className="notification-dot"/><div><strong>{reminder.medicine}</strong><p>{reminder.dose} · {reminder.time} · {reminder.frequency}</p></div><button type="button" className="icon-button reminder-delete" aria-label={"Delete reminder for " + reminder.medicine} onClick={()=>{const next=reminders.filter(item=>item.id!==reminder.id);setReminders(next);try{localStorage.setItem("healthreachcare-test-reminders",JSON.stringify(next));}catch{setReminderMessage("Could not update local storage.");}}}><Trash2 size={16}/></button></div>) : <div className="empty-state"><CalendarDays size={26}/><h3>No reminders scheduled yet</h3><p>Add a medicine above to see it here.</p></div>}
    </div>
  </section>;

  const renderActivities = () => {
    const filtered = activities.filter(item => {
      if (activityFilter === "active") return !isClosedActivity(item);
      if (activityFilter === "past") return ["delivered", "completed"].includes(activityStatus(item));
      if (activityFilter === "cancelled") return ["cancelled", "canceled", "declined", "rejected"].includes(activityStatus(item));
      return true;
    });
    return <section className="page-content">
      <div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Your care requests, medication orders and updates.</p>
      <div className="activity-filters" role="group" aria-label="Filter activities">{[["all","All"],["active","Active"],["past","Past / completed"],["cancelled","Cancelled"]].map(([value,label])=><button type="button" key={value} className={activityFilter===value?"activity-filter active":"activity-filter"} onClick={()=>setActivityFilter(value)}>{label}</button>)}</div>
      <div className="panel"><div className="panel-heading"><div className="panel-icon"><CalendarDays/></div><div><h2>Care history</h2><p>Tap any item to view its full details and progress.</p></div></div>
        {filtered.length ? <div className="activity-list">{filtered.map(item=><button type="button" className="activity-card" key={item.id} onClick={()=>setSelectedActivity(item)}>
          <span className="activity-card-icon">{item.items?<Pill/>:activityKind(item)==="Homecare request"?<House/>:activityKind(item)==="Medication order"?<Pill/>:<Stethoscope/>}</span>
          <span className="activity-card-main"><strong>{activityKind(item)}</strong><small>{item.id || "Preview reference"} · {activityDate(item.requestedDate ? item.requestedDate + "T" + (item.requestedTime || "00:00") : item.createdAt)}</small><span>{item.items ? item.items.map(line=>line.quantity+" × "+line.name).join(", ") : (item.serviceType || item.service || item.consultationMode || "Service details not recorded")}</span><small>{item.providerName || item.doctorName || (item.items ? "Pharmacy assignment not connected" : "Provider not assigned")}</small>{["cancelled","canceled","declined","rejected"].includes(activityStatus(item)) && (item.cancellationReason || item.cancelReason) && <small className="activity-cancellation-reason">Reason: {item.cancellationReason || item.cancelReason}</small>}</span>
          <span className={"activity-status status-"+activityStatus(item)}>{String(activityStatus(item)).replace(/_/g," ")}</span><ChevronRight size={17}/>
        </button>)}</div> : <div className="empty-state"><CalendarDays size={27}/><h3>{activityFilter==="cancelled"?"No cancelled activities":activityFilter==="past"?"No completed activities":"No activities yet"}</h3><p>Test requests and orders appear here when created in this preview. No real provider is contacted.</p><button className="button button-outline" onClick={()=>setPage("home")}>Browse services</button></div>}
      </div>
      <div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Account and care updates</p></div></div>{notificationError?<div className="inline-message"><AlertCircle size={18}/><span>Notifications will appear here when connected.</span></div>:notifications.length?notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title||n.subject||"HealthReachCare update"}</strong><p>{n.message||n.body||"You have a new update."}</p></div></div>):<div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>Updates will appear here when available.</p></div>}</div>
      {selectedActivity && <div className="modal-backdrop" onClick={()=>setSelectedActivity(null)}><section className="request-modal activity-detail-modal" role="dialog" aria-modal="true" aria-label="Activity details" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><div><div className="eyebrow">ACTIVITY DETAILS · TEST PREVIEW</div><h2>{activityKind(selectedActivity)}</h2></div><button type="button" className="icon-button" aria-label="Close activity details" onClick={()=>setSelectedActivity(null)}><X/></button></div>
        <div className="booking-summary-table activity-detail-table">{[["Reference",selectedActivity.id||"Preview reference"],["Status",String(activityStatus(selectedActivity)).replace(/_/g," ")],["Requested / created",activityDate(selectedActivity.createdAt||selectedActivity.requestedDate)],["Preferred schedule",selectedActivity.requestedDate?activityDate(selectedActivity.requestedDate+"T"+(selectedActivity.requestedTime||"00:00")):"Not recorded"],["Service coordinator / provider",activityProviderLabel(selectedActivity)],["Delivery driver",selectedActivity.driverName||"Not assigned in preview"],["Service / items",selectedActivity.items?selectedActivity.items.map(line=>line.quantity+" × "+line.name).join(", "):(selectedActivity.serviceType||selectedActivity.service||"Not recorded")],["Location",selectedActivity.address||selectedActivity.location||"Not recorded"],["Payment",selectedActivity.paymentStatus||"Not connected"],["Fixed service price",selectedActivity.items&&typeof selectedActivity.total==="number"?"R"+selectedActivity.total.toFixed(2):(typeof selectedActivity.servicePrice==="number"?"R"+selectedActivity.servicePrice.toFixed(2):(typeof selectedActivity.totalAmount==="number"?"R"+selectedActivity.totalAmount.toFixed(2):"Not configured in preview"))],["Last update",activityDate(selectedActivity.updatedAt||selectedActivity.providerResponseAt||selectedActivity.createdAt)],["Cancellation reason",selectedActivity.cancellationReason||selectedActivity.cancelReason||"No reason recorded"]].map(([label,value])=><div key={label} className="booking-summary-line"><span>{label}</span><strong>{value||"Not recorded"}</strong></div>)}</div>
        <h3 className="activity-timeline-title">Progress</h3><div className="tracker-timeline detail-timeline">{activityStages(selectedActivity).map((stage,index)=><div className={"tracker-stage"+(stage.done?" done":"")+(stage.current?" current":"")} key={stage.label}><span className="tracker-stage-dot">{stage.done?"✓":index+1}</span><span>{stage.label}</span></div>)}</div>
        {selectedActivity.testOnly && selectedActivity.kind && selectedActivity.status === "accepted" && selectedActivity.paymentStatus !== "test_authorized" && <div className="activity-payment-panel"><div className="eyebrow">CHECKOUT</div><h3>Confirm your service booking</h3><p>The provider accepted this request. Review the quote and choose a simulated payment method to confirm the booking.</p><div className="activity-payment-amount"><span>Amount due</span><strong>R{Number(selectedActivity.servicePrice ?? selectedActivity.consultationFee ?? 0).toFixed(2)}</strong></div><label>Payment method<select value={bookingPaymentMethod} onChange={event=>setBookingPaymentMethod(event.target.value)}>{SIMULATION_CONFIG.paymentMethods.map(method=><option key={method.id} value={method.id}>{method.label} · simulation</option>)}</select></label>{bookingPaymentError&&<div className="inline-message test-error"><AlertCircle size={17}/><span>{bookingPaymentError}</span></div>}{bookingPaymentNotice&&<div className="inline-message"><CheckCircle2 size={17}/><span>{bookingPaymentNotice}</span></div>}<button type="button" className="button button-primary full" onClick={payForSelectedBooking}>Authorise simulated payment <ArrowRight size={16}/></button><small>No card details are collected and no real funds move. Production checkout will use a hosted payment provider and verified server callback.</small></div>}{selectedActivity.testOnly && selectedActivity.kind && selectedActivity.paymentStatus === "test_authorized" && <div className="inline-message"><CheckCircle2 size={17}/><span>Payment authorised in sandbox · {selectedActivity.paymentId || "payment recorded"} · no real funds moved.</span></div>}<div className="inline-message"><ShieldCheck size={17}/><span>Sandbox simulation. Requests, provider decisions and simulated payment records are saved in this browser. No real patient information or payments.</span></div>
        <a className="button button-outline full" href={"mailto:support@healthreachcare.co.za?subject="+encodeURIComponent("HealthReachCare support — "+activityKind(selectedActivity))+"&body="+encodeURIComponent("Please help with request "+(selectedActivity.id||"ID unavailable")+".") }><MessageCircle size={16}/> Contact support about this request</a>
        <button type="button" className="button button-outline full" onClick={()=>setSelectedActivity(null)}>Close details</button>
      </section></div>}
    </section>;
  };

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Testing mode is active. Live pharmacy stock is not connected; no invented products or prices are shown.</span></div><button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderSupport = () => <section className="page-content account-page"><button type="button" className="text-button" onClick={()=>setPage("account")}><ArrowRight size={15} className="back-arrow"/> Back to Account</button><div className="eyebrow">WE ARE HERE TO HELP</div><h1>Help and support</h1><p className="lead">Find answers or prepare a message for HealthReachCare support.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h2>Contact HealthReachCare</h2><p>Support email</p></div></div><a href="mailto:support@healthreachcare.co.za">support@healthreachcare.co.za</a><p className="muted small">This preview opens your email app; it does not send or store requests on a server.</p></div><div className="panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h2>Frequently asked questions</h2><p>Common questions</p></div></div><details><summary>How do I track a care request?</summary><p>Open Activities and select a request to review saved details. Live provider updates are not connected yet.</p></details><details><summary>Can I contact a provider directly?</summary><p>Direct provider messaging is not connected. Use this form for help routing an enquiry. Homecare uses one central coordinating team; doctor and pharmacy assignments are specific to each request when connected.</p></details><details><summary>Are bookings and orders confirmed?</summary><p>No. A saved test enquiry is not a confirmed booking, order, provider acceptance or payment.</p></details><details><summary>Are my profile details saved online?</summary><p>No. Profile and preference changes are stored in this browser only.</p></details><details><summary>What should I do in an emergency?</summary><p>Do not wait for an app response. In South Africa, call 10177 for an ambulance or 112 from a cellphone.</p></details></div><form className="panel" onSubmit={event=>{event.preventDefault();const subject=encodeURIComponent("HealthReachCare support — "+supportForm.topic);const body=encodeURIComponent("Name: "+supportForm.name.trim()+"\nReply email: "+supportForm.email.trim()+"\nTopic: "+supportForm.topic+"\n\nRequest:\n"+supportForm.message.trim());window.location.href="mailto:support@healthreachcare.co.za?subject="+subject+"&body="+body;setSupportNotice("Your email draft is prepared. Review and send it in your email app; HealthReachCare has not received it yet.");}}><div className="panel-heading"><div className="panel-icon"><Mail/></div><div><h2>Send a support request</h2><p>Prepare an email to the support team</p></div></div><label>Your name<input required maxLength={100} value={supportForm.name} onChange={e=>setSupportForm({...supportForm,name:e.target.value})}/></label><label>Your email<input required type="email" maxLength={254} value={supportForm.email} onChange={e=>setSupportForm({...supportForm,email:e.target.value})}/></label><label>Topic<select value={supportForm.topic} onChange={e=>setSupportForm({...supportForm,topic:e.target.value})}>{["Care request","Doctor appointment","Medicine order","Homecare service","Account and privacy","Other"].map(topic=><option key={topic}>{topic}</option>)}</select></label><label>Message<textarea required minLength={10} maxLength={3000} rows={5} value={supportForm.message} onChange={e=>setSupportForm({...supportForm,message:e.target.value})} placeholder="How can we help? Do not include sensitive medical information."/></label>{supportNotice&&<div className="inline-message"><Mail size={18}/><span>{supportNotice}</span></div>}<div className="inline-message"><ShieldCheck size={18}/><span>Do not include passwords, payment details or sensitive medical records. The email is sent only if you send it from your email app.</span></div><button className="button button-primary" type="submit"><Mail size={16}/> Prepare email</button></form></section>;

  const renderAccount = () => <section className="page-content account-page">
    <div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Manage your profile, contact details and preferences.</p>
    <div className="panel account-panel">
      <div className="account-avatar"><UserRound size={28}/></div>
      <div><h2>Patient profile</h2><p className="muted">Profile settings in this preview are saved only in this browser.</p></div>
      <span className="account-status"><span className="status-dot status-muted"/>Preview mode</span>
    </div>
    <form className="panel account-settings-form" onSubmit={event => { event.preventDefault(); try { localStorage.setItem("healthreachcare-test-account", JSON.stringify(accountDetails)); setNotice("Your profile changes were saved in this browser only."); } catch { setNotice("Could not save your profile in this browser. Check storage settings."); } }}>
      <div className="panel-heading"><div className="panel-icon"><UserRound/></div><div><h2>Personal and contact details</h2><p>Keep your patient profile details up to date.</p></div></div>
      <div className="account-fields-grid">
        <label>Full name<input value={accountDetails.name} onChange={e=>setAccountDetails({...accountDetails,name:e.target.value})} placeholder="Enter your full name" autoComplete="name"/></label>
        <label>Phone number<input type="tel" value={accountDetails.phone} onChange={e=>setAccountDetails({...accountDetails,phone:e.target.value})} placeholder="e.g. 082 123 4567" autoComplete="tel"/></label>
        <label>Email address<input type="email" value={accountDetails.email} onChange={e=>setAccountDetails({...accountDetails,email:e.target.value})} placeholder="you@example.com" autoComplete="email"/></label>
        <label>Date of birth<input type="date" value={accountDetails.dob} onChange={e=>setAccountDetails({...accountDetails,dob:e.target.value})} /></label>
        <label className="account-address-field">Home address<input value={accountDetails.address} onChange={e=>setAccountDetails({...accountDetails,address:e.target.value})} placeholder="Street, suburb, town or city" autoComplete="street-address"/></label>
      </div>
      <div className="account-form-actions"><button className="button button-primary" type="submit"><Save size={16}/> Save profile</button><span className="muted small">Local preview only — not synced to a server.</span></div>
    </form>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><LockKeyhole/></div><div><h2>Login and security</h2><p>Secure access and account verification.</p></div></div>
      <div className="account-setting-row"><span className="account-setting-icon"><Mail size={18}/></span><div><strong>Email verification</strong><p className="muted">Not available — sign-in and email verification are not connected yet.</p></div><span className="account-status">Not connected</span></div>
      <div className="account-setting-row"><span className="account-setting-icon"><LockKeyhole size={18}/></span><div><strong>Password and sign-in</strong><p className="muted">Password changes and secure login require the authentication service to be connected.</p></div><span className="account-status">Pending</span></div>
    </div>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><BellRing/></div><div><h2>Notification preferences</h2><p>Choose the updates you would like to receive in the connected app.</p></div></div>
      <label className="account-preference"><span><strong>Appointment and care updates</strong><small>Booking status and provider responses</small></span><input type="checkbox" checked={accountDetails.careNotifications} onChange={e=>setAccountDetails({...accountDetails,careNotifications:e.target.checked})}/></label>
      <label className="account-preference"><span><strong>Medication reminders</strong><small>Reminders you set for your medicines</small></span><input type="checkbox" checked={accountDetails.medicationReminders} onChange={e=>setAccountDetails({...accountDetails,medicationReminders:e.target.checked})}/></label>
      <label className="account-preference"><span><strong>Service announcements</strong><small>Important HealthReachCare service information</small></span><input type="checkbox" checked={accountDetails.announcements} onChange={e=>setAccountDetails({...accountDetails,announcements:e.target.checked})}/></label>
      <button className="button button-outline account-save-preferences" onClick={()=>{try{localStorage.setItem("healthreachcare-test-account",JSON.stringify(accountDetails));setNotice("Your preferences were saved in this browser only.");}catch{setNotice("Could not save preferences in this browser.");}}}><Save size={16}/> Save preferences</button>
    </div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Privacy and consent</h2><p>Manage your choices and understand how this preview handles information.</p></div></div><div className="account-setting-row"><div><strong>Profile and preference storage</strong><p className="muted">Changes are stored in this browser on this device only. They are not uploaded or linked to a verified patient account.</p></div><span className="account-status">Local preview</span></div><div className="account-setting-row"><div><strong>How information is used</strong><p className="muted">Information entered here supports the interface preview. It does not create a live medical record, send notifications or confirm care services.</p></div></div><div className="account-setting-row"><div><strong>Consent and your choices</strong><p className="muted">Secure account access, data-rights requests and a published privacy notice must be connected before production use. A formal privacy notice will be linked here once approved and published.</p></div></div></div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h2>Help and support</h2><p>FAQs and support for appointments, medicine orders and homecare.</p></div></div><p className="muted">Email support@healthreachcare.co.za or open the support centre.</p><button type="button" className="button button-outline" onClick={()=>setPage("support")}><MessageCircle size={17}/> Open help and support</button></div>
    <div className="panel account-logout-panel"><div><h2>Sign out</h2><p className="muted">The current preview does not have a signed-in account session.</p></div><button className="button button-outline" onClick={()=>{setPage("landing");setNotice("");}}><LogOut size={16}/> Return to welcome screen</button></div>
    {notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}
  </section>;

  if (page === "landing") return <TestingLanding onOpenAuth={() => setPage("auth")} />;
  if (page === "auth") return <TestingAuth onBack={() => setPage("landing")} onOpenRole={role => setPage(role === "patient" ? "home" : role === "doctor" ? "doctor-provider" : role === "homecare" ? "homecare-provider" : "test-" + role)} />;
  if (page.startsWith("test-")) return <TestRoleWorkspace role={page.slice(5)} onBack={() => setPage("auth")} />;

  return <div className={darkBackground ? "app-shell dark-background" : "app-shell"}>
    <header className="topbar"><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><button className="icon-button theme-toggle" aria-label={darkBackground ? "Use light background" : "Use dark background"} title={darkBackground ? "Use light background" : "Use dark background"} onClick={()=>setDarkBackground(value=>!value)}>{darkBackground ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
</header>
    <main>{page === "doctor-booking" ? <BookingFlow type="doctor" user={user} onBack={()=>setPage("home")} onOpenActivities={()=>setPage("activities")}/> : page === "homecare-booking" ? <BookingFlow type="homecare" user={user} onBack={()=>setPage("home")} onOpenActivities={()=>setPage("activities")}/> : page === "doctor-provider" ? <ProviderWorkspace role="doctor" onBack={()=>setPage("home")}/> : page === "homecare-provider" ? <ProviderWorkspace role="homecare" onBack={()=>setPage("home")}/> : page === "home" ? renderHome() : page === "activities" ? renderActivities() : page === "support" ? renderSupport() : page === "reminders" ? renderReminders() : page === "prescriptions" ? <PrescriptionSandbox onBack={() => setPage("home")} />: page === "medicines" ? <PatientMedicineShop onBack={() => setPage("home")} onOpenActivities={() => setPage("activities")} /> : renderAccount()}</main>
    
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines","reminders","prescriptions"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div>{notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}<p className="muted">{formType==="appointment" ? "Request a time with a verified practitioner. Your request remains pending until the provider confirms availability." : formType==="homecare" ? "Tell us what care you need and when. A provider must review and accept your request before it is confirmed." : "Send a prescription enquiry for the HealthReachCare team to review."}</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>{formType==="homecare"?"Care address / town or suburb":"Town or suburb"}<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label>{formType!=="prescription" && <><label>{formType==="appointment"?"Preferred consultation":"Home-care service"}<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choose an option</option>{(formType==="appointment"?["In-Person","Video","Phone"]:["Nursing care","Personal care","Post-operative care","Elder care","Wound care","Other"]).map(option=><option key={option} value={option}>{option}</option>)}</select></label><div className="filter-row"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Preferred time<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>{formType==="homecare" && <label>Requested duration<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(option=><option key={option}>{option}</option>)}</select></label>}</>}{formType==="appointment" && form.doctorName && <div className="inline-message"><Stethoscope size={17}/><span>Practitioner selected: <strong>{form.doctorName}</strong></span></div>}<label>{formType==="prescription"?"Prescription enquiry (do not include sensitive medical information)":"Additional details"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Test mode saves this enquiry in this browser only. It is not sent to a provider and no payment is taken. Do not use this form for emergencies or enter sensitive medical records.</span></div><button className="button button-primary full" type="submit" disabled={submittingRequest}>{submittingRequest ? "Sending request…" : "Save test enquiry"} <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
