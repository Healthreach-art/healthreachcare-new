import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, House, ShieldCheck, Stethoscope, AlertCircle, Accessibility, HandHeart, Pill, Sparkles } from "lucide-react";
import "./BookingFlow.css";
const services = [
  { id: "personal_care", title: "Personal care", description: "Daily living and personal support" },
  { id: "elderly_care", title: "Elderly care", description: "Companionship and everyday support" },
  { id: "post_surgery", title: "Post-surgery care", description: "Recovery support at home" },
  { id: "mobility", title: "Mobility assistance", description: "Safe movement and transfers" },
  { id: "medication_support", title: "Medication support", description: "Help following a prescribed medicine schedule" },
  { id: "specialised_care", title: "Specialised care", description: "Care requiring a suitably qualified provider" }
];
const demoDoctors = [
  { id: "demo-doctor-provider", name: "Dr. A. Mokoena", specialty: "General practitioner", location: "Illustrative clinic · Johannesburg", consultationFee: 350 },
  { id: "demo-doctor-provider-2", name: "Dr. L. Naidoo", specialty: "Family medicine", location: "Illustrative clinic · Cape Town", consultationFee: 420 },
  { id: "demo-doctor-provider-3", name: "Dr. T. Dlamini", specialty: "Primary care", location: "Illustrative clinic · Durban", consultationFee: 300 }
];
const modes = ["In-person", "Video", "Phone"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];
export default function BookingFlow({ type, user, onBack, onOpenActivities }) {
  const homecare = type === "homecare";
  const [step, setStep] = useState(0);
  const [service, setService] = useState(services[0]);
  const [doctor, setDoctor] = useState(demoDoctors[0]);
  const [mode, setMode] = useState("In-person");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const dateMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const next = () => {
    setMessage("");
    if (step === 1 && (!name.trim() || !phone.trim() || !date || date < dateMin || !time || (homecare && address.trim().length < 5))) {
      setMessage(homecare && address.trim().length < 5 ? "Enter a complete care address." : "Complete the required fields and choose a valid future date."); return;
    }
    setStep(current => Math.min(2, current + 1));
  };
  const submit = () => {
    try {
      const key = "healthreachcare-test-bookings";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const item = {
        id: "test-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        kind: homecare ? "homecare" : "appointment",
        providerId: homecare ? "demo-homecare-provider" : doctor.id,
        providerName: homecare ? "Demo Homecare Provider" : doctor.name,
        patientName: name.trim(),
        patientPhone: phone.trim(),
        patientUid: "local-test-patient",
        location: homecare ? address.trim() : "Patient-selected after provider confirms",
        serviceType: homecare ? service.title : "Doctor appointment",
        consultationMode: homecare ? "In-person" : mode,
        doctorId: homecare ? "" : doctor.id,
        doctorName: homecare ? "" : doctor.name,
        consultationFee: homecare ? 0 : doctor.consultationFee,
        duration: homecare ? duration + " hours" : "",
        requestedDate: date,
        requestedTime: time,
        details: notes.trim(),
        status: "pending",
        requestStatus: "pending",
        paymentStatus: "not_connected",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify([item, ...existing]));
      window.dispatchEvent(new CustomEvent("healthreachcare-test-bookings-updated"));
      setSubmittedRequest(item);
      setMessage("");
      setStep(3);
    } catch {
      setMessage("Could not save this test request. Check browser storage settings and try again.");
    }
  };
  return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={step === 0 ? onBack : () => { setStep(current => current - 1); setMessage(""); }}><ArrowLeft size={16}/> {step === 0 ? "Back to HealthReachCare" : "Previous step"}</button>
    <div className="booking-heading"><div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div><div><div className="eyebrow">{homecare ? "HOMECARE REQUEST" : "DOCTOR APPOINTMENT"}</div><h1>{homecare ? (step === 0 ? "Choose homecare" : step === 1 ? "Visit details" : step === 3 ? "Request received" : "Review your request") : (step === 0 ? "Choose a doctor" : step === 1 ? "Visit details" : step === 3 ? "Request received" : "Review your request")}</h1><p>{homecare ? "Choose a service, date and time. A fixed price will be displayed once approved service prices are configured." : "Choose a doctor and preferred time."}</p></div></div>
    <div className="booking-test-banner compact-test-banner"><ShieldCheck size={17}/><span><strong>Test mode.</strong> Requests stay on this device. No real booking or payment.</span></div>
    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Select one service to continue.</p></div></div><div className="booking-service-grid">{services.map(s=>{const Icon=s.id==="personal_care"?HandHeart:s.id==="elderly_care"?Heart:s.id==="post_surgery"?ShieldCheck:s.id==="mobility"?Accessibility:s.id==="medication_support"?Pill:Sparkles;return <button type="button" key={s.id} className={service.id === s.id ? "booking-service-card selected" : "booking-service-card"} aria-pressed={service.id===s.id} onClick={() => setService(s)}><span className="booking-service-icon"><Icon size={22}/></span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{service.id === s.id ? <><CheckCircle2 size={14}/> Selected</> : "Select service"}</span></button>})}</div></div>}
    {!homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Choose a test doctor</h2><p>These illustrative profiles and fees are for checking the booking journey only.</p></div></div><div className="booking-service-grid">{demoDoctors.map(d=><button type="button" key={d.id} className={doctor.id === d.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setDoctor(d)}><span><Stethoscope size={20}/></span><strong>{d.name}</strong><small>{d.specialty}</small><small>{d.location}</small><small>Illustrative fee: R{d.consultationFee.toFixed(2)}</small><span className="booking-select-label">{doctor.id === d.id ? "Selected" : "Select doctor"}</span></button>)}</div><div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m=><button type="button" key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div></div>}
    {step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Tell us about the visit" : "Your preferred appointment"}</h2><p>Fill in the required details.</p></div></div><div className="booking-form-grid">
      <label className="booking-field"><span>Full name</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required/></label>
      <label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="e.g. 082 123 4567" required/></label>
      {homecare && <label className="booking-field"><span>Care address</span><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label>}
      <label className="booking-field"><span>Preferred date</span><input type="date" min={dateMin} value={date} onChange={e => setDate(e.target.value)} required/></label>
      <label className="booking-field"><span>Preferred time</span><select value={time} onChange={e => setTime(e.target.value)} required><option value="">Choose a time</option>{times.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      {homecare && <label className="booking-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{["1","2","4","8"].map(h => <option key={h} value={h}>{h} {h === "1" ? "hour" : "hours"}</option>)}</select></label>}
    </div>{!homecare && <div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m => <button key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div>}<label className="booking-field"><span>Additional notes (optional)</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Avoid detailed medical information in this preview."/></label></div>}
    {step === 2 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Check your details</h2><p>Check your details before sending.</p></div></div><div className="booking-summary-table">{[["Patient",name],["Service",homecare ? service.title : "Doctor appointment"],["Consultation",homecare ? duration + " hours" : mode],["Address",homecare ? address : "To be selected after provider directory connects"],["Preferred date",date],["Preferred time",time],["Request status","Waiting for provider review"],["Test provider",homecare ? "Demo Homecare Provider" : doctor.name],["Service price",homecare ? "Fixed price not configured in preview" : "R" + doctor.consultationFee.toFixed(2)],["Pricing","Fixed service pricing is not configured in this preview"],["Payment","Not connected"]].map(([label,value]) => <div key={label} className="booking-summary-line"><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div></div>}
    {step === 3 && <div className="booking-main-card booking-confirmation"><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><div className="eyebrow">REQUEST CREATED</div><h2>Test request received</h2><p className="booking-muted">Your test request is in the {homecare ? "Homecare Provider" : "Doctor"} workspace on this device. It is waiting for review.</p><div className="booking-summary-table">{[["Reference",submittedRequest?.id || "Test request"],["Service",submittedRequest?.serviceType || service.title],["Preferred date",submittedRequest?.requestedDate || date],["Preferred time",submittedRequest?.requestedTime || time],["Status","Waiting for provider response"],["Payment","Not connected"]].map(([label,value])=><div key={label} className="booking-summary-line"><span>{label}</span><strong>{value}</strong></div>)}</div><div className="booking-confirm-note"><ShieldCheck size={17}/> Test only · No provider contacted · No payment taken</div></div>}
    {message && <div className="booking-validation-error"><AlertCircle size={17}/> {message}</div>}
    {step < 3 && <div className="booking-actions"><button type="button" className="button button-outline" onClick={step === 0 ? onBack : () => {setStep(current => current - 1);setMessage("");}}><ArrowLeft size={16}/> {step === 0 ? "Home" : "Back"}</button>{step < 2 ? <button type="button" className="button button-primary" onClick={next}>{step === 0 ? "Continue to details" : "Review request"} <ArrowRight size={16}/></button> : <button type="button" className="button button-primary" onClick={submit}>Submit test request <ArrowRight size={16}/></button>}</div>}
    {step === 3 && <div className="booking-actions"><button type="button" className="button button-outline" onClick={onBack}>Back to home</button><button type="button" className="button button-primary" onClick={onOpenActivities}>View Activities <ArrowRight size={16}/></button></div>}
  </section>;
}
