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
const demoDoctors = [
  { id: "demo-doctor-provider", name: "Dr. A. Mokoena", specialty: "General practitioner", location: "Illustrative clinic · Johannesburg", consultationFee: 350 },
  { id: "demo-doctor-provider-2", name: "Dr. L. Naidoo", specialty: "Family medicine", location: "Illustrative clinic · Cape Town", consultationFee: 420 },
  { id: "demo-doctor-provider-3", name: "Dr. T. Dlamini", specialty: "Primary care", location: "Illustrative clinic · Durban", consultationFee: 300 }
];
const modes = ["In-person", "Video", "Phone"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];
export default function BookingFlow({ type, user, onBack }) {
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
  const dateMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const next = () => {
    setMessage("");
    if (step === 1 && (!name.trim() || !phone.trim() || !date || !time || (homecare && !address.trim()))) {
      setMessage("Complete the required fields before continuing."); return;
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
      setMessage("Test request sent to the " + (homecare ? "Homecare Provider" : "Doctor Provider") + " test portal in this browser. No real provider was contacted and no payment was taken.");
      setStep(2);
    } catch {
      setMessage("Could not save the test request in this browser. Check browser storage settings and try again.");
    }
  };
  return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={step === 0 ? onBack : () => { setStep(current => current - 1); setMessage(""); }}><ArrowLeft size={16}/> {step === 0 ? "Back to HealthReachCare" : "Previous step"}</button>
    <div className="booking-heading"><div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div><div><div className="eyebrow">{homecare ? "HOMECARE REQUEST" : "DOCTOR APPOINTMENT"}</div><h1>{homecare ? (step === 0 ? "Choose homecare" : step === 1 ? "Visit details" : "Review your request") : (step === 0 ? "Appointment preferences" : step === 1 ? "Your preferred appointment" : "Review your request")}</h1><p>{homecare ? "Request professional care at home." : "Choose your preferred consultation details."} Sample providers are available for local workflow testing; no real provider is contacted.</p></div></div>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Local test mode:</strong> sample providers and requests let you test the patient-to-provider flow in this browser. No real clinician is contacted, availability is not live, and no payment is taken. Use test details only.</span></div>
    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Choose the service that best matches your needs.</p></div></div><div className="booking-service-grid">{services.map(s=><button key={s.id} className={service.id === s.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setService(s)}><span>{s.id === "elderly_care" ? <Heart size={20}/> : <House size={20}/>}</span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{service.id === s.id ? "Selected" : "Select service"}</span></button>)}</div></div>}
    {!homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Choose a test doctor</h2><p>These illustrative profiles and fees are for checking the booking journey only.</p></div></div><div className="booking-service-grid">{demoDoctors.map(d=><button type="button" key={d.id} className={doctor.id === d.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setDoctor(d)}><span><Stethoscope size={20}/></span><strong>{d.name}</strong><small>{d.specialty}</small><small>{d.location}</small><small>Illustrative fee: R{d.consultationFee.toFixed(2)}</small><span className="booking-select-label">{doctor.id === d.id ? "Selected" : "Select doctor"}</span></button>)}</div><div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m=><button type="button" key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div></div>}
    {step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Tell us about the visit" : "Your preferred appointment"}</h2><p>Details remain in this page only and are not submitted.</p></div></div><div className="booking-form-grid">
      <label className="booking-field"><span>Full name</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required/></label>
      <label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="e.g. 082 123 4567" required/></label>
      {homecare && <label className="booking-field"><span>Care address</span><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label>}
      <label className="booking-field"><span>Preferred date</span><input type="date" min={dateMin} value={date} onChange={e => setDate(e.target.value)} required/></label>
      <label className="booking-field"><span>Preferred time</span><select value={time} onChange={e => setTime(e.target.value)} required><option value="">Choose a time</option>{times.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      {homecare && <label className="booking-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{["1","2","4","8"].map(h => <option key={h} value={h}>{h} {h === "1" ? "hour" : "hours"}</option>)}</select></label>}
    </div>{!homecare && <div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m => <button key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div>}<label className="booking-field"><span>Additional notes (optional)</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Avoid detailed medical information in this preview."/></label></div>}
    {step === 2 && <div className="booking-main-card"><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><h2>Review your request</h2><p className="booking-muted">Your test request is shared with the matching provider test portal in this browser only. It is not sent to a real provider.</p><div className="booking-summary-table">{[["Patient",name],["Service",homecare ? service.title : "Doctor appointment"],["Consultation",homecare ? duration + " hours" : mode],["Address",homecare ? address : "To be selected after provider directory connects"],["Preferred date",date],["Preferred time",time],["Submission status","Local test request"],["Assigned provider",homecare ? "Demo Homecare Provider" : doctor.name],["Illustrative consultation fee",homecare ? "To be quoted by provider" : "R" + doctor.consultationFee.toFixed(2)],["Payment","Not connected"]].map(([label,value]) => <div key={label} className="booking-summary-line"><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div></div>}
    {message && <div className="booking-validation-error"><AlertCircle size={17}/> {message}</div>}
    <div className="booking-actions"><button className="button button-outline" onClick={step === 0 ? onBack : () => {setStep(current => current - 1);setMessage("");}}><ArrowLeft size={16}/> {step === 0 ? "Cancel" : "Back"}</button>{step < 2 ? <button className="button button-primary" onClick={next}>Continue <ArrowRight size={16}/></button> : <button className="button button-primary" onClick={submit}>Send test booking <ArrowRight size={16}/></button>}</div>
  </section>;
}
