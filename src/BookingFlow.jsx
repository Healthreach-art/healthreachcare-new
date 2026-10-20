import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3,
  Heart, MapPin, ShieldCheck, Stethoscope, House, CreditCard, ClipboardCheck,
  UserRound, Sparkles, Star
} from "lucide-react";
import "./BookingFlow.css";

const doctors = [
  { id:"doc-1", name:"Dr. Amara Ndlovu", specialty:"General Practitioner", location:"Cape Town, Western Cape", modes:["In-person","Video"], fee:"R450", initials:"AN", rating:"4.9" },
  { id:"doc-2", name:"Dr. Liam Jacobs", specialty:"Family Medicine", location:"Cape Town, Western Cape", modes:["In-person","Phone"], fee:"R380", initials:"LJ", rating:"4.8" },
  { id:"doc-3", name:"Dr. Zanele Mokoena", specialty:"Women's Health", location:"Online · South Africa", modes:["Video"], fee:"R520", initials:"ZM", rating:"4.9" }
];
const doctorSteps = ["Choose","Compare","Schedule","Pay","Confirm","Care","Favourite"];
const homeSteps = ["Service","Details","Submit","Quote","Pay","Track","Favourite"];
const times = ["08:00","09:30","11:00","13:00","14:30","16:00"];
const services = [
  { id:"nursing", title:"Nursing care", description:"Clinical support and nursing visits", icon:"nursing" },
  { id:"personal", title:"Personal care", description:"Help with daily routines and personal needs", icon:"personal" },
  { id:"post-op", title:"Post-operative care", description:"Support while recovering after a procedure", icon:"post" },
  { id:"elder", title:"Elder care", description:"Practical support and wellbeing checks", icon:"elder" },
  { id:"wound", title:"Wound care", description:"Dressing changes and wound support", icon:"wound" },
  { id:"companionship", title:"Companionship", description:"Friendly visits and everyday support", icon:"companion" }
];

function getSavedRequests() {
  try { return JSON.parse(localStorage.getItem("healthreachcare-test-bookings") || "[]"); }
  catch { return []; }
}

export default function BookingFlow({ type, onBack }) {
  const homecare = type === "homecare";
  const steps = homecare ? homeSteps : doctorSteps;
  const [step, setStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [consultation, setConsultation] = useState("In-person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2 hours");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("Test Patient");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState("");
  const minimumDate = new Date().toLocaleDateString("en-CA");
  const stepTitle = useMemo(() => {
    if (!homecare) return ["Choose your doctor","Compare practitioners","Choose a date and time","Payment","Request summary","Your care journey","Save a favourite"][step];
    return ["Choose home care","Tell us what you need","Review your request","Sample provider quote","Payment","Track your request","Save a favourite"][step];
  }, [homecare, step]);

  const saveTestRequest = () => {
    const request = {
      id: "TEST-" + Date.now().toString(36).toUpperCase(),
      type: homecare ? "homecare" : "doctor-appointment",
      patientName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      service: homecare ? selectedService.title : selectedDoctor.name,
      specialty: homecare ? "" : selectedDoctor.specialty,
      consultation: homecare ? "" : consultation,
      date, time, duration, notes: notes.trim(),
      status: "TEST ONLY — not sent to a provider",
      paymentStatus: "Not collected",
      createdAt: new Date().toISOString()
    };
    const all = getSavedRequests();
    all.unshift(request);
    try { localStorage.setItem("healthreachcare-test-bookings", JSON.stringify(all)); }
    catch { /* Keep the visible test flow usable if browser storage is blocked. */ }
    setSaved(request);
    return request;
  };

  const continueFlow = () => {
    setError("");
    if (step === 2 && (!date || !time)) { setError("Choose a preferred date and time to continue."); return; }
    if (homecare && step === 1 && (!name.trim() || !phone.trim() || !address.trim())) { setError("Enter your name, phone number and care address."); return; }
    if (homecare && step === 1 && (!date || !time)) { setError("Choose a preferred date and time for the care visit."); return; }
    if (!homecare && step === 2 && (!name.trim() || !phone.trim())) { setError("Enter your name and phone number to continue."); return; }
    if (homecare && step === 2 && !saved) saveTestRequest();
    if (!homecare && step === 3 && !saved) saveTestRequest();
    setStep(current => Math.min(current + 1, steps.length - 1));
  };

  const back = () => {
    setError("");
    if (step === 0) onBack();
    else setStep(current => Math.max(0, current - 1));
  };

  const iconFor = item => item.id === "nursing" || item.id === "wound" ? <ShieldCheck size={20}/> : item.id === "elder" || item.id === "companionship" ? <Heart size={20}/> : <House size={20}/>;

  return <section className="page-content booking-page">
    <div className="booking-heading">
      <div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div>
      <div><div className="eyebrow">{homecare ? "HOME CARE BOOKING" : "DOCTOR APPOINTMENT"}</div><h1>{stepTitle}</h1><p>{homecare ? "Arrange care at home, step by step." : "Find the right practitioner and request a time that works for you."}</p></div>
      <span className="test-mode-chip"><Sparkles size={13}/> TEST MODE</span>
    </div>
    <div className="booking-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
      {steps.map((label, index) => <div key={label} className={index < step ? "booking-progress-step complete" : index === step ? "booking-progress-step current" : "booking-progress-step"}>
        <span>{index < step ? <Check size={14}/> : index + 1}</span><small>{label}</small>
      </div>)}
    </div>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Testing mode:</strong> this journey uses local sample data. No real provider is contacted and no payment is taken.</span></div>

    {!homecare && step === 0 && <div className="booking-layout">
      <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Find your doctor</h2><p>Choose a practitioner to compare their details.</p></div><span className="step-count">01 / 07</span></div>
        <div className="booking-search-box"><MapPin size={18}/><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Enter town or suburb (optional)"/></div>
        <div className="booking-choice-list">{doctors.map(d=><button key={d.id} className={selectedDoctor.id === d.id ? "booking-doctor-row selected" : "booking-doctor-row"} onClick={()=>setSelectedDoctor(d)}>
          <span className="booking-doctor-avatar">{d.initials}</span><span className="booking-doctor-info"><strong>{d.name}</strong><small>{d.specialty}</small><small><MapPin size={13}/> {d.location}</small></span><span className="booking-doctor-fee">{d.fee}<small>sample fee</small></span><span className="booking-radio">{selectedDoctor.id === d.id && <Check size={13}/>}</span>
        </button>)}</div>
      </div>
      <aside className="booking-side-card"><div className="booking-side-title"><ClipboardCheck size={19}/><strong>Your selection</strong></div><div className="booking-summary-doctor"><span className="booking-doctor-avatar">{selectedDoctor.initials}</span><div><strong>{selectedDoctor.name}</strong><small>{selectedDoctor.specialty}</small></div></div><div className="booking-summary-line"><span>Consultation</span><strong>{consultation}</strong></div><div className="booking-summary-line"><span>Sample consultation fee</span><strong>{selectedDoctor.fee}</strong></div><p className="booking-fine-print">Sample profile and fee for layout testing only. Not a verified provider listing or a real price.</p><button className="button button-primary full" onClick={continueFlow}>Compare doctors <ArrowRight size={16}/></button></aside>
    </div>}

    {!homecare && step === 1 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Compare practitioners</h2><p>Review sample profiles before choosing a consultation style.</p></div></div><div className="booking-compare-grid">{doctors.map(d=><button key={d.id} className={selectedDoctor.id === d.id ? "booking-compare-card selected" : "booking-compare-card"} onClick={()=>setSelectedDoctor(d)}><span className="booking-doctor-avatar large">{d.initials}</span><span className="booking-rating"><Star size={14} fill="currentColor"/> {d.rating} <small>sample</small></span><strong>{d.name}</strong><small>{d.specialty}</small><small><MapPin size={13}/> {d.location}</small><span className="booking-compare-fee">{d.fee}</span><span className="booking-select-label">{selectedDoctor.id === d.id ? "Selected" : "Choose doctor"}</span></button>)}</div><div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{["In-person","Video","Phone"].map(mode=><button key={mode} className={consultation === mode ? "booking-option selected" : "booking-option"} onClick={()=>setConsultation(mode)}>{mode === "Video" ? "Video consultation" : mode === "Phone" ? "Phone consultation" : "In-person visit"}</button>)}</div></div></div>}

    {!homecare && step === 2 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Schedule your appointment</h2><p>Select your preferred date and available-looking test slot.</p></div></div><div className="booking-form-grid"><label className="booking-field"><span>Preferred date</span><input type="date" min={minimumDate} value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="booking-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} required/></label><label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 082 123 4567" required/></label></div><div className="booking-field"><span>Preferred time</span><div className="booking-time-grid">{times.map(t=><button key={t} className={time === t ? "booking-time selected" : "booking-time"} onClick={()=>setTime(t)}><Clock3 size={15}/>{t}</button>)}</div><small>Time slots are illustrative only; availability is not checked in test mode.</small></div><label className="booking-field"><span>Notes (optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything you would like the practice to know? Avoid sensitive medical details."/></label></div>}

    {!homecare && step === 3 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Payment step preview</h2><p>The real payment gateway is intentionally disabled during testing.</p></div></div><div className="booking-payment-preview"><div className="booking-payment-icon"><CreditCard size={26}/></div><div><strong>No payment will be taken</strong><p>Paystack or another payment provider is not connected in this test build. You can continue to inspect the confirmation screens.</p></div></div><div className="booking-summary-line"><span>Sample consultation fee</span><strong>{selectedDoctor.fee}</strong></div><div className="booking-test-banner"><AlertCircleIcon/> This is not a checkout and must not be treated as paid.</div></div>}

    {!homecare && step === 4 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><h2>Appointment request preview</h2><p className="booking-muted">This is a local test request. It has not been sent to the doctor or a clinic.</p><Summary rows={[[ "Patient", name || "Test Patient" ],["Doctor", selectedDoctor.name],["Consultation", consultation],["Preferred date", date || "Not selected"],["Preferred time", time || "Not selected"],["Status", "TEST ONLY — not confirmed"],["Payment", "Not collected"]]} /></div>}

    {!homecare && step === 5 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Care journey</h2><p>Example milestones for a future connected booking.</p></div></div><div className="booking-timeline"><div className="active"><span>1</span><div><strong>Request created locally</strong><small>Saved in this browser for testing</small></div></div><div><span>2</span><div><strong>Provider review</strong><small>Not connected in test mode</small></div></div><div><span>3</span><div><strong>Appointment confirmation</strong><small>Will require real availability and provider acceptance</small></div></div></div></div>}

    {homecare && step === 0 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Choose the service that best matches your needs.</p></div><span className="step-count">01 / 07</span></div><div className="booking-service-grid">{services.map(s=><button key={s.id} className={selectedService.id === s.id ? "booking-service-card selected" : "booking-service-card"} onClick={()=>setSelectedService(s)}><span>{iconFor(s)}</span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{selectedService.id === s.id ? "Selected" : "Select service"}</span></button>)}</div></div>}

    {homecare && step === 1 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Tell us about the visit</h2><p>Share contact details and where care is needed.</p></div></div><div className="booking-form-grid"><label className="booking-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} required/></label><label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 082 123 4567" required/></label><label className="booking-field"><span>Care address</span><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label><label className="booking-field"><span>Preferred date</span><input type="date" min={minimumDate} value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="booking-field"><span>Preferred time</span><select value={time} onChange={e=>setTime(e.target.value)}><option value="">Choose a time</option>{times.map(t=><option key={t}>{t}</option>)}</select></label><label className="booking-field"><span>Duration</span><select value={duration} onChange={e=>setDuration(e.target.value)}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(d=><option key={d}>{d}</option>)}</select></label></div><label className="booking-field"><span>Additional details (optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tell us what support is needed. Avoid sensitive medical details."/></label></div>}

    {homecare && step === 2 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Review your request</h2><p>Submitting here saves a local test request only.</p></div></div><Summary rows={[[ "Patient", name || "Test Patient" ],["Service", selectedService.title],["Address", address || "Not provided"],["Preferred date", date || "Not selected"],["Preferred time", time || "Not selected"],["Duration", duration],["Status", "TEST ONLY — not sent"]]} /><div className="booking-test-banner"><ShieldCheck size={18}/> No provider receives this request while test mode is enabled.</div></div>}

    {homecare && step === 3 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Provider quote preview</h2><p>A real provider would review your request before quoting.</p></div></div><div className="booking-payment-preview"><div className="booking-payment-icon"><ClipboardCheck size={26}/></div><div><strong>Quote pending in a real workflow</strong><p>This test screen does not create a provider quote. The sample amount below is only to test the layout.</p></div></div><div className="booking-sample-quote"><span>Illustrative test amount</span><strong>R850.00</strong><small>Not a real quote. Do not pay this amount.</small></div></div>}

    {homecare && step === 4 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Payment step preview</h2><p>Real payments are disabled while we test the screens.</p></div></div><div className="booking-payment-preview"><div className="booking-payment-icon"><CreditCard size={26}/></div><div><strong>No payment will be taken</strong><p>No card details are requested or stored. A real quote and secure checkout are not connected.</p></div></div></div>}

    {homecare && step === 5 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Track your request</h2><p>Example status for a locally saved test request.</p></div></div><div className="booking-timeline"><div className="active"><span>1</span><div><strong>Request saved locally</strong><small>Test only</small></div></div><div><span>2</span><div><strong>Provider quote</strong><small>Not connected</small></div></div><div><span>3</span><div><strong>Payment and care visit</strong><small>Not scheduled or paid</small></div></div></div></div>}

    {step === 6 && <div className="booking-main-card"><button type="button" className="booking-card-back" onClick={back}><ArrowLeft size={16}/><span>{step === 0 ? "Back to HealthReachCare" : "Back"}</span></button><div className="booking-section-title"><div><h2>Your favourites</h2><p>Save this {homecare ? "service" : "practitioner"} on this browser for test purposes.</p></div></div><button className={favourite ? "booking-favourite saved" : "booking-favourite"} onClick={()=>setFavourite(!favourite)}><Heart size={21} fill={favourite ? "currentColor" : "none"}/><span><strong>{favourite ? "Saved to local favourites" : "Add to favourites"}</strong><small>{homecare ? selectedService.title : selectedDoctor.name}</small></span><Star size={18}/></button><div className="booking-test-banner"><ShieldCheck size={18}/> Favourites are stored only in this screen; no account sync in test mode.</div></div>}

    {error && <p className="booking-validation-error">{error}</p>}
    <div className="booking-actions"><button className="button button-outline" onClick={back}><ArrowLeft size={16}/> {step === 0 ? "Cancel" : "Back"}</button>{step < steps.length - 1 ? <button className="button button-primary" onClick={continueFlow}>{homecare && step === 2 ? "Save test request & continue" : !homecare && step === 3 ? "Continue to confirmation preview" : "Continue"} <ArrowRight size={16}/></button> : <button className="button button-primary" onClick={onBack}>Finish <Check size={16}/></button>}</div>
    {saved && <p className="booking-saved-note">Local test reference: <strong>{saved.id}</strong> · Not sent to a provider.</p>}
  </section>;
}

function Summary({ rows }) {
  return <div className="booking-summary-table">{rows.map(([label, value]) => <div key={label} className="booking-summary-line"><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

function AlertCircleIcon() {
  return <ShieldCheck size={17}/>;
}
