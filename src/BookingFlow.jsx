import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, House, ShieldCheck, Stethoscope, AlertCircle } from "lucide-react";
import "./BookingFlow.css";
const services = [
  { id: "personal_care", title: "Personal care", description: "Daily living and personal support" },
  { id: "elderly_care", title: "Elderly care", description: "Companionship and everyday support" },
  { id: "post_surgery", title: "Post-surgery care", description: "Recovery support at home" },
  { id: "mobility", title: "Mobility assistance", description: "Safe movement and transfers" },
  { id: "medication_support", title: "Medication support", description: "Help following a prescribed medicine schedule" },
  { id: "specialised_care", title: "Specialised care", description: "Care requiring a suitably qualified provider" }
];
const modes = ["In-person", "Video", "Phone"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];
export default function BookingFlow({ type, onBack }) {
  const homecare = type === "homecare";
  const [step, setStep] = useState(0);
  const [service, setService] = useState(services[0]);
  const [mode, setMode] = useState("In-person");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const dateMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const next = () => {
    setMessage("");
    if (step === 1 && (!name.trim() || !phone.trim() || !date || !time || (homecare && !address.trim()))) {
      setMessage("Complete the required fields before continuing."); return;
    }
    setStep(current => Math.min(2, current + 1));
  };
  const submit = () => setMessage("Preview only: no booking was sent. Connect a trusted backend before enabling account sign-in, provider availability, appointment reservations, homecare assignment or payments.");
  return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={step === 0 ? onBack : () => { setStep(current => current - 1); setMessage(""); }}><ArrowLeft size={16}/> {step === 0 ? "Back to HealthReachCare" : "Previous step"}</button>
    <div className="booking-heading"><div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div><div><div className="eyebrow">{homecare ? "HOMECARE REQUEST" : "DOCTOR APPOINTMENT"}</div><h1>{homecare ? (step === 0 ? "Choose homecare" : step === 1 ? "Visit details" : "Review your request") : (step === 0 ? "Appointment preferences" : step === 1 ? "Your preferred appointment" : "Review your request")}</h1><p>{homecare ? "Request professional care at home." : "Choose your preferred consultation details."} The UI is prepared for a future backend integration but does not send data yet.</p></div></div>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Preview mode:</strong> no Firebase SDK, authentication service, provider database, booking endpoint or payment gateway is connected. Do not enter sensitive medical information.</span></div>
    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Choose the service that best matches your needs.</p></div></div><div className="booking-service-grid">{services.map(s=><button key={s.id} className={service.id === s.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setService(s)}><span>{s.id === "elderly_care" ? <Heart size={20}/> : <House size={20}/>}</span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{service.id === s.id ? "Selected" : "Select service"}</span></button>)}</div></div>}
    {!homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Appointment preferences</h2><p>The verified-doctor directory will be connected when a backend is selected.</p></div></div><div className="empty-state"><Stethoscope size={25}/><h3>Doctor directory not connected</h3><p>No sample doctors are shown. Provider search and availability will be connected through the future data adapter.</p></div><div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m=><button key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div></div>}
    {step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Tell us about the visit" : "Your preferred appointment"}</h2><p>Details remain in this page only and are not submitted.</p></div></div><div className="booking-form-grid">
      <label className="booking-field"><span>Full name</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required/></label>
      <label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="e.g. 082 123 4567" required/></label>
      {homecare && <label className="booking-field"><span>Care address</span><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label>}
      <label className="booking-field"><span>Preferred date</span><input type="date" min={dateMin} value={date} onChange={e => setDate(e.target.value)} required/></label>
      <label className="booking-field"><span>Preferred time</span><select value={time} onChange={e => setTime(e.target.value)} required><option value="">Choose a time</option>{times.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      {homecare && <label className="booking-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{["1","2","4","8"].map(h => <option key={h} value={h}>{h} {h === "1" ? "hour" : "hours"}</option>)}</select></label>}
    </div>{!homecare && <div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m => <button key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div>}<label className="booking-field"><span>Additional notes (optional)</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Avoid detailed medical information in this preview."/></label></div>}
    {step === 2 && <div className="booking-main-card"><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><h2>Review your request</h2><p className="booking-muted">This is a local preview only. No request has been created.</p><div className="booking-summary-table">{[["Patient",name],["Service",homecare ? service.title : "Doctor appointment"],["Consultation",homecare ? duration + " hours" : mode],["Address",homecare ? address : "To be selected after provider directory connects"],["Preferred date",date],["Preferred time",time],["Submission status","Not submitted"],["Payment","Not connected"]].map(([label,value]) => <div key={label} className="booking-summary-line"><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div></div>}
    {message && <div className="booking-validation-error"><AlertCircle size={17}/> {message}</div>}
    <div className="booking-actions"><button className="button button-outline" onClick={step === 0 ? onBack : () => {setStep(current => current - 1);setMessage("");}}><ArrowLeft size={16}/> {step === 0 ? "Cancel" : "Back"}</button>{step < 2 ? <button className="button button-primary" onClick={next}>Continue <ArrowRight size={16}/></button> : <button className="button button-primary" onClick={submit}>Check backend readiness <ArrowRight size={16}/></button>}</div>
  </section>;
}
