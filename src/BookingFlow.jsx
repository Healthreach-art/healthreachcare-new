import { useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3,
  Heart, MapPin, ShieldCheck, Stethoscope, House, CreditCard, ClipboardCheck,
  UserRound, Sparkles, Star, AlertCircle
} from "lucide-react";
import { saveTestBooking } from "./test-workflow.js";
import "./BookingFlow.css";

const doctors = [
  { id: "test-doc-1", name: "Dr. Amara Ndlovu", specialty: "General Practitioner", location: "Cape Town (sample)", fee: 450, initials: "AN" },
  { id: "test-doc-2", name: "Dr. Liam Jacobs", specialty: "Family Medicine", location: "Cape Town (sample)", fee: 380, initials: "LJ" },
  { id: "test-doc-3", name: "Dr. Zanele Mokoena", specialty: "Women's Health", location: "Online (sample)", fee: 520, initials: "ZM" }
];
const services = [
  { id: "nursing", title: "Nursing care", description: "Clinical support and nursing visits" },
  { id: "personal", title: "Personal care", description: "Help with daily routines and personal needs" },
  { id: "post-op", title: "Post-operative care", description: "Support while recovering after a procedure" },
  { id: "elder", title: "Elder care", description: "Practical support and wellbeing checks" },
  { id: "wound", title: "Wound care", description: "Dressing changes and wound support" },
  { id: "companionship", title: "Companionship", description: "Friendly visits and everyday support" }
];
const times = ["08:00", "09:30", "11:00", "13:00", "14:30", "16:00"];
const money = value => "R" + Number(value || 0).toFixed(2);
const localDate = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

export default function BookingFlow({ type, onBack, user }) {
  const homecare = type === "homecare";
  const steps = homecare ? ["Service", "Details", "Submit", "Quote", "Pay", "Track", "Favourite"] : ["Choose", "Compare", "Schedule", "Pay", "Confirm", "Care", "Favourite"];
  const [step, setStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [consultation, setConsultation] = useState("In-person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2 hours");
  const [address, setAddress] = useState("");
  const [name, setName] = useState(user?.displayName || "Test Patient");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const stepTitle = homecare
    ? ["Choose home care", "Tell us what you need", "Review your request", "Sample provider quote", "Payment preview", "Track your request", "Save a favourite"][step]
    : ["Choose your doctor", "Compare practitioners", "Choose a date and time", "Payment preview", "Confirm your request", "Your care journey", "Save a favourite"][step];

  const saveRequest = () => {
    if (saved) return saved;
    const item = saveTestBooking({
      type: homecare ? "homecare" : "doctor-appointment",
      patientName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      service: homecare ? selectedService.title : selectedDoctor.name,
      doctorName: homecare ? "" : selectedDoctor.name,
      doctorId: homecare ? "" : selectedDoctor.id,
      specialty: homecare ? "" : selectedDoctor.specialty,
      consultation,
      date,
      time,
      duration,
      notes: notes.trim(),
      quote: homecare ? 350 : selectedDoctor.fee,
      quoteCurrency: "ZAR",
      status: "awaiting_provider_review",
      paymentStatus: "not_started",
      disclaimer: "Test request only. Not sent to a real provider."
    });
    setSaved(item);
    return item;
  };

  const continueFlow = () => {
    setError(""); setNotice("");
    if (homecare && step === 1 && (!name.trim() || !phone.trim() || !address.trim() || !date || !time)) {
      setError("Enter your test name, phone, care address, preferred date and time."); return;
    }
    if (!homecare && step === 2 && (!name.trim() || !phone.trim() || !date || !time)) {
      setError("Enter your test name, phone, preferred date and time."); return;
    }
    if (homecare && step === 2) {
      saveRequest();
      setNotice("Test care request saved locally. It has not been sent to a provider.");
    }
    if (!homecare && step === 4) {
      saveRequest();
      setNotice("Test appointment request saved locally. It has not been sent to a doctor.");
    }
    setStep(current => Math.min(current + 1, steps.length - 1));
  };
  const back = () => { setError(""); setNotice(""); if (step === 0) onBack(); else setStep(current => Math.max(0, current - 1)); };
  const stepLabel = index => index < step ? "complete" : index === step ? "current" : "";

  return <section className="page-content booking-page">
    <div className="booking-heading"><div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div><div><div className="eyebrow">{homecare ? "HOME CARE BOOKING" : "DOCTOR APPOINTMENT"}</div><h1>{stepTitle}</h1><p>{homecare ? "Arrange care at home, step by step." : "Compare sample practitioner profiles and request a preferred time."}</p></div><span className="test-mode-chip"><Sparkles size={13}/> TEST MODE</span></div>
    <div className="booking-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((label, index) => <div key={label} className={"booking-progress-step " + stepLabel(index)}><span>{index < step ? <Check size={14}/> : index + 1}</span><small>{label}</small></div>)}</div>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Testing mode:</strong> sample profiles, dates and fees only. No real provider is contacted, no live availability is checked, and no payment is collected.</span></div>
    {error && <div className="inline-message"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}

    {!homecare && step === 0 && <div className="booking-layout"><div className="booking-main-card"><div className="booking-section-title"><div><h2>Choose a practitioner</h2><p>Sample profiles for workflow testing only.</p></div><span className="step-count">01 / 07</span></div><div className="booking-choice-list">{doctors.map(doctor => <button type="button" key={doctor.id} className={selectedDoctor.id === doctor.id ? "booking-doctor-row selected" : "booking-doctor-row"} onClick={() => setSelectedDoctor(doctor)}><span className="booking-doctor-avatar">{doctor.initials}</span><span className="booking-doctor-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small><small><MapPin size={13}/> {doctor.location}</small></span><span className="booking-doctor-fee">{money(doctor.fee)}<small>sample fee</small></span><span className="booking-radio">{selectedDoctor.id === doctor.id && <Check size={13}/>}</span></button>)}</div><button className="button button-primary" onClick={continueFlow}>Compare doctor <ArrowRight size={16}/></button></div><aside className="booking-side-card"><div className="booking-side-title"><ClipboardCheck size={19}/><strong>Your selection</strong></div><div className="booking-summary-doctor"><span className="booking-doctor-avatar">{selectedDoctor.initials}</span><div><strong>{selectedDoctor.name}</strong><small>{selectedDoctor.specialty}</small></div></div><div className="booking-summary-line"><span>Sample fee</span><strong>{money(selectedDoctor.fee)}</strong></div><p className="booking-fine-print">Not a verified provider listing or a real price.</p></aside></div>}

    {!homecare && step === 1 && <div className="booking-layout"><div className="booking-main-card"><div className="booking-section-title"><div><h2>Compare practitioners</h2><p>Review sample details before choosing your preferred consultation.</p></div><span className="step-count">02 / 07</span></div><div className="booking-choice-list">{doctors.map(doctor => <button type="button" key={doctor.id} className={selectedDoctor.id === doctor.id ? "booking-doctor-row selected" : "booking-doctor-row"} onClick={() => setSelectedDoctor(doctor)}><span className="booking-doctor-avatar">{doctor.initials}</span><span className="booking-doctor-info"><strong>{doctor.name}</strong><small>{doctor.specialty}</small><small><Star size={13}/> Sample profile · {doctor.location}</small></span><span className="booking-doctor-fee">{money(doctor.fee)}<small>sample fee</small></span><span className="booking-radio">{selectedDoctor.id === doctor.id && <Check size={13}/>}</span></button>)}</div><label className="booking-form-label">Consultation type<select value={consultation} onChange={e => setConsultation(e.target.value)}>{["In-person","Phone","Video (preview only)"].map(value => <option key={value}>{value}</option>)}</select></label><button className="button button-primary" onClick={continueFlow}>Choose a time <ArrowRight size={16}/></button></div><aside className="booking-side-card"><div className="booking-side-title"><ClipboardCheck size={19}/><strong>Compare summary</strong></div><strong>{selectedDoctor.name}</strong><p className="booking-fine-print">{selectedDoctor.specialty} · {consultation} · sample fee {money(selectedDoctor.fee)}</p></aside></div>}

    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What support do you need?</h2><p>Select a sample service to explore the request flow.</p></div><span className="step-count">01 / 07</span></div><div className="booking-service-grid">{services.map(service => <button type="button" key={service.id} className={selectedService.id === service.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setSelectedService(service)}><span className="booking-service-icon"><House size={20}/></span><strong>{service.title}</strong><small>{service.description}</small>{selectedService.id === service.id && <CheckCircle2 size={17}/>}</button>)}</div><button className="button button-primary" onClick={continueFlow}>Continue to details <ArrowRight size={16}/></button></div>}

    {((homecare && step === 1) || (!homecare && step === 2)) && <div className="booking-layout"><div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Care visit details" : "Schedule your preferred time"}</h2><p>This is a request, not a confirmed appointment.</p></div><span className="step-count">{homecare ? "02" : "03"} / 07</span></div><div className="booking-form-grid"><label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Test patient name"/></label><label>Phone number<input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Test number only"/></label><label>Preferred date<input required type="date" min={localDate()} value={date} onChange={e => setDate(e.target.value)}/></label><label>Preferred time<select required value={time} onChange={e => setTime(e.target.value)}><option value="">Choose a time</option>{times.map(value => <option key={value}>{value}</option>)}</select></label>{homecare ? <><label className="booking-form-full">Care address<input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Test address only"/></label><label>Duration<select value={duration} onChange={e => setDuration(e.target.value)}>{["1 hour","2 hours","4 hours","8 hours","Overnight","To be discussed"].map(value => <option key={value}>{value}</option>)}</select></label></> : <label className="booking-form-full">Consultation type<select value={consultation} onChange={e => setConsultation(e.target.value)}>{["In-person","Phone","Video (preview only)"].map(value => <option key={value}>{value}</option>)}</select></label>}<label className="booking-form-full">Additional notes<textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Do not include sensitive medical information."/></label></div><button className="button button-primary" onClick={continueFlow}>Review request <ArrowRight size={16}/></button></div><aside className="booking-side-card"><div className="booking-side-title"><ClipboardCheck size={19}/><strong>Request summary</strong></div><strong>{homecare ? selectedService.title : selectedDoctor.name}</strong><div className="booking-summary-line"><span>Preferred time</span><strong>{date || "Not selected"} {time}</strong></div><div className="booking-summary-line"><span>Estimated test amount</span><strong>{money(homecare ? 350 : selectedDoctor.fee)}</strong></div><p className="booking-fine-print">Illustrative only. The provider has not accepted this request.</p></aside></div>}

    {homecare && step === 2 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Review and submit test request</h2><p>Check the details before saving locally.</p></div><span className="step-count">03 / 07</span></div><div className="booking-summary-table">{[["Service",selectedService.title],["Patient",name],["Phone",phone],["Address",address],["Preferred visit",date + " · " + time],["Duration",duration],["Payment","Not collected"]].map(([label,value]) => <div className="booking-summary-line" key={label}><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div><button className="button button-primary" onClick={continueFlow}>Save test request <ArrowRight size={16}/></button></div>}

    {((homecare && step === 3) || (!homecare && step === 3)) && <div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Illustrative provider quote" : "Payment preview"}</h2><p>No real quote or payment request is sent.</p></div><span className="step-count">{homecare ? "04" : "04"} / 07</span></div><div className="booking-payment-preview"><div className="booking-payment-icon"><CreditCard size={25}/></div><div><strong>{money(homecare ? 350 : selectedDoctor.fee)}</strong><p>{homecare ? "Sample home-care quote" : "Sample consultation fee"}</p></div></div><div className="booking-test-banner"><ShieldCheck size={18}/><span>Secure payment integration is pending. This is a payment screen mock-up only; no card details are requested and no funds are collected.</span></div><button className="button button-primary" onClick={continueFlow}>{homecare ? "Continue to payment preview" : "Continue to confirmation"} <ArrowRight size={16}/></button></div>}

    {!homecare && step === 4 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Confirm your test request</h2><p>This creates a local request record only.</p></div><span className="step-count">05 / 07</span></div><div className="booking-summary-table">{[["Practitioner",selectedDoctor.name],["Specialty",selectedDoctor.specialty],["Consultation",consultation],["Patient",name],["Phone",phone],["Preferred time",date + " · " + time],["Payment","Not collected"]].map(([label,value]) => <div className="booking-summary-line" key={label}><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div><button className="button button-primary" onClick={continueFlow}>Save test appointment <ArrowRight size={16}/></button></div>}

    {((homecare && step >= 4) || (!homecare && step >= 5)) && <div className="booking-main-card"><div className="booking-success-illustration">{step === steps.length - 1 ? <Heart size={40}/> : <CheckCircle2 size={40}/>}</div><div className="eyebrow">{homecare ? "HOME CARE TEST REQUEST" : "DOCTOR BOOKING TEST REQUEST"}</div><h2>{step === steps.length - 1 ? (favourite ? "Saved to test favourites" : "Favourites") : (homecare ? "Track your request" : "Your care journey")}</h2><p className="booking-muted">{saved ? "Reference " + saved.id + ". This request is stored locally and is not sent to a real provider." : "This screen is a test preview; no request has been sent to a provider."}</p><div className="booking-summary-table">{[["Reference",saved?.id || "Not created"],["Status",saved ? "Awaiting provider review (test)" : "Not submitted"],["Payment","Not collected"],["Preferred time",date + " · " + time]].map(([label,value]) => <div className="booking-summary-line" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{step === steps.length - 1 ? <button className="button button-primary" onClick={() => { setFavourite(value => !value); setNotice(favourite ? "Removed from local test favourites." : "Saved as a local test favourite."); }}><Heart size={16}/>{favourite ? "Remove favourite" : "Add to favourites"}</button> : <button className="button button-primary" onClick={continueFlow}>Continue <ArrowRight size={16}/></button>}<button className="button button-outline" onClick={onBack}>Return to patient home</button></div>}

    <div className="booking-actions"><button className="button button-outline" onClick={back}><ArrowLeft size={16}/> {step === 0 ? "Back to patient home" : "Previous step"}</button>{step < steps.length - 1 && <span className="booking-muted">Step {step + 1} of {steps.length}</span>}</div>
  </section>;
}
