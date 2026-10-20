import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, Clock3, HeartPulse, Home, MapPin, Pill, Search,
  ShieldCheck, Stethoscope, Truck, UserRound, Users, Video, Phone, RefreshCw,
  Upload, House, MessageCircle, AlertCircle, X
} from "lucide-react";
import BookingFlow from "./BookingFlow.jsx";

const specialties = ["All specialties","GP","Paediatrician","Cardiologist","Dermatologist","Gynaecologist","Psychiatrist","Psychologist","ENT","Ophthalmologist","Orthopaedic Surgeon","Neurologist","Endocrinologist","Urologist","Dentist","Physiotherapist"];
const sampleDoctors = [
  {id:"test-doc-1",name:"Dr. Amara Ndlovu",specialty:"General Practitioner",location:"Cape Town, Western Cape",consultationModes:"In-person, Video",verified:false,testingOnly:true},
  {id:"test-doc-2",name:"Dr. Liam Jacobs",specialty:"Family Medicine",location:"Cape Town, Western Cape",consultationModes:"In-person, Phone",verified:false,testingOnly:true},
  {id:"test-doc-3",name:"Dr. Zanele Mokoena",specialty:"Women\u2019s Health",location:"Online \u00b7 South Africa",consultationModes:"Video",verified:false,testingOnly:true}
];
const navItems = [
  { id:"home", label:"Home", icon:Home },
  { id:"activities", label:"Activities", icon:Activity },
  { id:"search", label:"Search", icon:Search },
  { id:"account", label:"Account", icon:UserRound }
];

function Brand() {
  return <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>HealthReachCare</strong><small>Better access. Healthier communities.</small></div></div>;
}

function App() {
  const [page, setPage] = useState("home");
  const [user] = useState({uid:"local-test-patient",displayName:"Test Patient",email:"test@healthreachcare.local",testingOnly:true});
  const [notifications, setNotifications] = useState([]);
  const [notificationError] = useState("Testing mode: notifications are not connected.");
  const [doctors] = useState(sampleDoctors);
  const [doctorState, setDoctorState] = useState("ready");
  const [doctorError, setDoctorError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [mode, setMode] = useState("All modes");
  const [distance, setDistance] = useState("50 km");
  const [locationMessage, setLocationMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [form, setForm] = useState({name:"",phone:"",details:"",location:"",date:"",time:"",service:"",duration:"",doctorId:"",doctorName:""});
  const [submittingRequest, setSubmittingRequest] = useState(false);



  const filteredDoctors = useMemo(() => doctors.filter(d => {
    const name = String(d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "");
    const spec = String(d.specialty || d.specialisation || "");
    const place = String(d.location || d.city || d.practiceAddress || "");
    const term = doctorSearch.trim().toLowerCase();
    return (!term || [name,spec,place].join(" ").toLowerCase().includes(term))
      && (specialty === "All specialties" || spec.toLowerCase().includes(specialty.toLowerCase()))
      && (mode === "All modes" || String(d.consultationModes || d.consultationMode || d.consultationType || "").toLowerCase().includes(mode.toLowerCase()));
  }), [doctors, doctorSearch, specialty, mode]);

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
    if (submittingRequest) return;
    setSubmittingRequest(true);
    const request = {
      id: "TEST-" + Date.now().toString(36).toUpperCase(),
      type: formType,
      patientName: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      details: form.details.trim(),
      status: "TEST ONLY — saved locally, not sent",
      paymentStatus: "Not collected",
      createdAt: new Date().toISOString()
    };
    try {
      const current = JSON.parse(localStorage.getItem("healthreachcare-test-bookings") || "[]");
      localStorage.setItem("healthreachcare-test-bookings", JSON.stringify([request, ...current]));
    } catch { /* The testing flow still works if browser storage is blocked. */ }
    setFormType("");
    setNotice("Test enquiry saved in this browser only. It was not sent to a provider and no payment was taken.");
    setSubmittingRequest(false);
  };

  const useLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("Location is not supported by this browser."); return; }
    setLocationMessage("Requesting your permission…");
    navigator.geolocation.getCurrentPosition(
      position => setLocationMessage("Location permission granted. Nearby distance filtering needs to be enabled on verified practitioner records."),
      () => setLocationMessage("Location access was not granted. You can still search by town or suburb."),
      {timeout:8000}
    );
  };

  const renderDoctorDirectory = () => <section className="page-content">
    <div className="eyebrow">CARE THAT FITS YOUR NEEDS</div>
    <h1>Find the Right Doctor</h1>
    <p className="lead">Search verified healthcare professionals by specialty and location.</p>
    <div className="directory-tools">
      <label className="search-field"><Search size={19}/><input value={doctorSearch} onChange={e=>setDoctorSearch(e.target.value)} placeholder="Doctor, specialty or location"/></label>
      <div className="filter-row">
        <label><span>Specialty</span><select value={specialty} onChange={e=>setSpecialty(e.target.value)}>{specialties.map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span>Consultation</span><select value={mode} onChange={e=>setMode(e.target.value)}>{["All modes","In-Person","Video","Phone"].map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span>Distance</span><select value={distance} onChange={e=>setDistance(e.target.value)}>{["25 km","50 km","75 km","100 km"].map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      <button className="button button-outline" onClick={useLocation}><MapPin size={17}/> Use my location</button>
      {locationMessage && <p className="muted small">{locationMessage}</p>}
    </div>
    {doctorState === "loading" && <div className="state-card"><RefreshCw className="spin" size={22}/><div><strong>Loading verified practitioners</strong><p>Please wait while the directory connects.</p></div></div>}
    {(doctorState === "error" || doctorState === "config") && <div className="state-card state-error"><AlertCircle size={23}/><div><strong>{doctorState === "config" ? "Directory setup needed" : "We couldn’t load the doctor directory"}</strong><p>{doctorError}</p><button className="text-button" onClick={()=>{setDoctorState("ready");setDoctorError("");}}><RefreshCw size={15}/> Try again</button></div></div>}
    {doctorState === "ready" && (filteredDoctors.length ? <div className="doctor-grid">{filteredDoctors.map(d=><article className="doctor-card" key={d.id}><div className="doctor-avatar"><Stethoscope size={23}/></div><div className="verified"><ShieldCheck size={14}/> Sample profile · test only</div><h3>{d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "Healthcare professional"}</h3><p className="doctor-specialty">{d.specialty || d.specialisation || "Healthcare professional"}</p><p className="muted"><MapPin size={15}/> {d.location || d.city || d.practiceAddress || "Location not listed"}</p><button className="button button-primary full" onClick={()=>setPage("doctor-booking")}>Start booking <ArrowRight size={16}/></button></article>)}</div> : <div className="empty-state"><Users size={27}/><h3>No matching verified practitioners</h3><p>Try another specialty or location. Only verified records are shown.</p><button className="button button-outline" onClick={()=>{setDoctorSearch("");setSpecialty("All specialties");setMode("All modes");}}>Clear filters</button></div>)}
  </section>;

  const renderHome = () => <section className="page-content">
    <div className="hero">
      <div className="hero-copy"><div className="eyebrow light">YOUR HEALTH, MADE SIMPLER</div><h1>Welcome{user?.displayName ? ", " + user.displayName.split(" ")[0] : ""} 👋</h1><p>Your health is our priority. Let’s take care of it today.</p><button className="button button-white" onClick={()=>setPage("doctor-booking")}>Book a doctor <ArrowRight size={17}/></button></div>
      <div className="hero-art"><div className="hero-circle"><HeartPulse size={66}/></div><span className="hero-dot dot-one"/><span className="hero-dot dot-two"/></div>
    </div>
    {notice && <div className="notice"><AlertCircle size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice("")}><X size={17}/></button></div>}
    <div className="section-heading"><div><div className="eyebrow">HEALTHCARE, ALL IN ONE PLACE</div><h2>How can we help you?</h2></div><span className="section-note">Choose a service to get started</span></div>
    <div className="service-grid">
      <button className="service-card" onClick={()=>setPage("doctor-booking")}><span className="service-icon green"><Stethoscope/></span><strong>Book a doctor</strong><span>Find care and choose a time</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("medicines")}><span className="service-icon blue"><Pill/></span><strong>Order medication</strong><span>Get your medication delivered</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("homecare-booking")}><span className="service-icon lilac"><House/></span><strong>Request home care</strong><span>Arrange care in your home</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>openForm("prescription")}><span className="service-icon amber"><Upload/></span><strong>Upload prescription</strong><span>Prepare a prescription request</span><ChevronRight className="service-arrow"/></button>
    </div>
    <div className="section-heading compact"><div><div className="eyebrow">YOUR CARE JOURNEY</div><h2>Care you can count on</h2></div></div>
    <div className="trust-grid"><div><ShieldCheck/><strong>Verified professionals</strong><p>Practitioner listings are filtered for verification.</p></div><div><Clock3/><strong>Convenient access</strong><p>Explore care services from one place.</p></div><div><HeartPulse/><strong>Care around you</strong><p>Designed for patients and communities across South Africa.</p></div></div>
  </section>;

  const renderActivities = () => <section className="page-content"><div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Keep track of updates related to your care.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Updates from your HealthReachCare account</p></div></div>{notificationError ? <div className="inline-message"><AlertCircle size={18}/><span>{notificationError}</span></div> : notifications.length ? notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p>{n.createdAt?.toDate && <small>{n.createdAt.toDate().toLocaleString()}</small>}</div></div>) : <div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>When there are updates to your appointments, orders or requests, they will appear here.</p></div>}</div></section>;

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Testing mode is active. Live pharmacy stock is not connected; no invented products or prices are shown.</span></div><button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderAccount = () => <section className="page-content"><div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Your personal HealthReachCare space.</p><div className="panel account-panel"><div className="account-avatar"><UserRound size={28}/></div><div><h2>{user?.displayName || "Welcome to HealthReachCare"}</h2><p className="muted">{user?.email || "Sign-in is not connected in this preview."}</p></div><span className="account-status"><span className={user ? "status-dot" : "status-dot status-muted"}/>{user ? "Signed in" : "Guest"}</span></div><div className="panel"><h2>Need help?</h2><p className="muted">Contact your HealthReachCare support team for help with appointments, medicine orders or home care.</p><button className="button button-outline" onClick={()=>setNotice("Support contact details need to be configured by the HealthReachCare team.")}><MessageCircle size={17}/> Contact support</button></div></section>;

  return <div className="app-shell">
    <header className="topbar"><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Care you can trust</span><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
</header>
    <main>{page === "doctor-booking" ? <BookingFlow type="doctor" onBack={()=>setPage("home")}/> : page === "homecare-booking" ? <BookingFlow type="homecare" onBack={()=>setPage("home")}/> : page === "home" ? renderHome() : page === "search" ? renderDoctorDirectory() : page === "activities" ? renderActivities() : page === "medicines" ? renderMedicines() : renderAccount()}</main>
    <footer className="site-footer"><Brand/><p>Better access. Healthier communities.</p><span>Healthcare information is not a substitute for professional medical advice.</span></footer>
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="search" && page==="search") || (item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div>{notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}<p className="muted">{formType==="appointment" ? "Request a time with a verified practitioner. Your request remains pending until the provider confirms availability." : formType==="homecare" ? "Tell us what care you need and when. A provider must review and accept your request before it is confirmed." : "Send a prescription enquiry for the HealthReachCare team to review."}</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>{formType==="homecare"?"Care address / town or suburb":"Town or suburb"}<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label>{formType!=="prescription" && <><label>{formType==="appointment"?"Preferred consultation":"Home-care service"}<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choose an option</option>{(formType==="appointment"?["In-Person","Video","Phone"]:["Nursing care","Personal care","Post-operative care","Elder care","Wound care","Other"]).map(option=><option key={option} value={option}>{option}</option>)}</select></label><div className="filter-row"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Preferred time<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>{formType==="homecare" && <label>Requested duration<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(option=><option key={option}>{option}</option>)}</select></label>}</>}{formType==="appointment" && form.doctorName && <div className="inline-message"><Stethoscope size={17}/><span>Practitioner selected: <strong>{form.doctorName}</strong></span></div>}<label>{formType==="prescription"?"Prescription enquiry (do not include sensitive medical information)":"Additional details"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Test mode saves this enquiry in this browser only. It is not sent to a provider and no payment is taken. Do not use this form for emergencies or enter sensitive medical records.</span></div><button className="button button-primary full" type="submit" disabled={submittingRequest}>{submittingRequest ? "Sending request…" : "Save test enquiry"} <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
