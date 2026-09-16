import { useState } from "react";
import { readStored, useStoredState, localDate } from "../storage";

const blankTrip = { name: "", destination: "", startDate: localDate(), returnDate: "", departure: "", returnTime: "", inCharge: "", instructions: "" };

export default function Trips() {
  const students = readStored("erp_pro_students", []);
  const [trips, setTrips] = useStoredState("erp_pro_trips", []);
  const [form, setForm] = useState(blankTrip);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTrip, setActiveTrip] = useState(null);
  const candidates = students.filter((student) => [student.name, student.className, student.grNo].join(" ").toLowerCase().includes(search.toLowerCase()));

  const saveTrip = () => {
    if (!form.name.trim() || !form.destination.trim() || !form.startDate) { alert("सहल नाव, ठिकाण आणि प्रारंभ दिनांक भरा"); return; }
    const participants = students.filter((student) => selected.includes(student.id)).map((student) => ({ studentId: student.id, consent: "प्रलंबित", payment: "प्रलंबित", boarding: "नोंद नाही" }));
    const trip = { id: crypto.randomUUID(), ...form, participants, status: "नियोजित", createdAt: new Date().toISOString() };
    if (!setTrips([...trips, trip])) return;
    setForm(blankTrip); setSelected([]); setActiveTrip(trip);
  };

  const updateParticipant = (trip, studentId, field, value) => {
    const updated = trips.map((item) => item.id !== trip.id ? item : { ...item, participants: item.participants.map((participant) => participant.studentId === studentId ? { ...participant, [field]: value } : participant) });
    setTrips(updated); setActiveTrip(updated.find((item) => item.id === trip.id));
  };

  const getStudent = (id) => students.find((student) => student.id === id) || {};
  const displayedTrip = activeTrip || trips[0];

  return <div className="page module-page trip-page">
    <div className="module-heading"><div><span className="eyebrow">FIELD OPERATIONS</span><h2>शैक्षणिक सहल</h2><p>सहल, सहभागी विद्यार्थी, संमती आणि boarding check-in एकाच ठिकाणी.</p></div><div className="module-count">{trips.length}<span>नोंदणीकृत सहली</span></div></div>
    <section className="workflow-panel"><div className="panel-title"><h3>नवीन सहल तयार करा</h3><span>माहिती स्थानिक सुरक्षित नोंदवहीत जतन होईल</span></div><div className="form-grid"><input aria-label="सहल नाव" placeholder="सहल नाव" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><input aria-label="ठिकाण" placeholder="गंतव्य / ठिकाण" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} /><input aria-label="प्रारंभ दिनांक" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /><input aria-label="परतीचा दिनांक" type="date" value={form.returnDate} onChange={(event) => setForm({ ...form, returnDate: event.target.value })} /><input aria-label="प्रभारी शिक्षक" placeholder="सहल प्रभारी शिक्षक" value={form.inCharge} onChange={(event) => setForm({ ...form, inCharge: event.target.value })} /><input aria-label="वाहन माहिती" placeholder="वाहन / ट्रेन माहिती" value={form.vehicle} onChange={(event) => setForm({ ...form, vehicle: event.target.value })} /><textarea aria-label="सूचना" placeholder="सूचना आणि emergency notes" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></div><h4>सहभागी विद्यार्थी निवडा</h4><input className="module-search" aria-label="विद्यार्थी शोधा" placeholder="विद्यार्थी, इयत्ता किंवा GR शोधा" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="selection-list">{candidates.map((student) => <label className="selection-row" key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, student.id] : selected.filter((id) => id !== student.id))} />{student.photo ? <img src={student.photo} alt="" /> : <span className="tiny-avatar">वि</span>}<span><strong>{student.name}</strong><small>इयत्ता {student.className} · GR {student.grNo}</small></span></label>)}{candidates.length === 0 && <p className="muted-copy">विद्यार्थी मास्टरमध्ये नोंदी उपलब्ध नाहीत.</p>}</div><button onClick={saveTrip}>सहल जतन करा</button></section>
    {displayedTrip && <section className="workflow-panel"><div className="panel-title"><div><h3>{displayedTrip.name}</h3><span>{displayedTrip.destination} · {displayedTrip.startDate} · {displayedTrip.status}</span></div><button className="button-muted" onClick={() => setActiveTrip(null)}>नवीन सहल</button></div><div className="trip-stats"><div><strong>{displayedTrip.participants.length}</strong><span>सहभागी</span></div><div><strong>{displayedTrip.participants.filter((p) => p.consent === "मिळाली").length}</strong><span>संमती मिळाली</span></div><div><strong>{displayedTrip.participants.filter((p) => p.boarding === "चढले").length}</strong><span>Boarded</span></div></div><div className="record-grid">{displayedTrip.participants.map((participant) => { const student = getStudent(participant.studentId); return <article className="record-card compact" key={participant.studentId}>{student.photo ? <img src={student.photo} alt="विद्यार्थी" /> : <div className="record-avatar">वि</div>}<div className="record-card-body"><span className="record-kicker">GR {student.grNo} · {student.mobile || "मोबाईल नाही"}</span><h3>{student.name}</h3><p>पालक: {student.fatherName || student.motherName || "नोंद नाही"}</p></div><div className="record-controls"><select aria-label={`${student.name} संमती`} value={participant.consent} onChange={(event) => updateParticipant(displayedTrip, student.id, "consent", event.target.value)}><option>प्रलंबित</option><option>मिळाली</option><option>नाही</option></select><select aria-label={`${student.name} boarding`} value={participant.boarding} onChange={(event) => updateParticipant(displayedTrip, student.id, "boarding", event.target.value)}><option>नोंद नाही</option><option>चढले</option><option>उपस्थित नाही</option></select></div></article>; })}</div></section>}
  </div>;
}
