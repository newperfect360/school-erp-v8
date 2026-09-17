import { notify } from "../components/Feedback";
import { useState } from "react";
import { readStored } from "../storage";

const messageFor = (student) => `आदरणीय पालक, ${student.name} यांच्या शाळेतील नोंदीसंदर्भात कृपया शाळेशी संपर्क साधावा. धन्यवाद.`;

export default function Parents() {
  const students = readStored("erp_pro_students", []);
  const [history, setHistory] = useState(() => readStored("erp_pro_communications", []));
  const [query, setQuery] = useState("");
  const filtered = students.filter((student) => [student.name, student.grNo, student.mobile, student.fatherName, student.motherName].join(" ").toLowerCase().includes(query.toLowerCase()));

  const openWhatsApp = (student) => {
    if (!/^\d{10}$/.test(student.mobile || "")) { notify("पालक मोबाईल नंबर उपलब्ध नाही."); return; }
    const message = messageFor(student); setHistory([...history, { id: crypto.randomUUID(), student: student.name, mobile: student.mobile, type: "WhatsApp", message, date: new Date().toISOString(), status: "Link उघडली" }]);
    window.open(`https://wa.me/91${student.mobile}?text=${encodeURIComponent(message)}`, "_blank");
  };
  const openSms = (student) => { if (!/^\d{10}$/.test(student.mobile || "")) { notify("पालक मोबाईल नंबर उपलब्ध नाही."); return; } const message = messageFor(student); setHistory([...history, { id: crypto.randomUUID(), student: student.name, mobile: student.mobile, type: "SMS", message, date: new Date().toISOString(), status: "SMS app उघडली" }]); window.open(`sms:${student.mobile}?body=${encodeURIComponent(message)}`, "_blank"); };

  return (
    <div className="page module-page">
      <div className="module-heading"><div><span className="eyebrow">FAMILY CONNECT</span><h2>पालक व्यवस्थापन</h2><p>विद्यार्थी नोंदीतून पालक संपर्क, भाषा आणि संवाद कृती.</p></div><div className="module-count">{filtered.length}<span>पालक नोंदी</span></div></div>
      <input className="module-search" aria-label="पालक शोधा" placeholder="नाव, GR किंवा मोबाईलने शोधा" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="record-grid">
        {filtered.map((student) => <article className="record-card" key={student.id}>
          {student.photo ? <img src={student.photo} alt="विद्यार्थी" /> : <div className="record-avatar">{student.name?.slice(0, 1) || "वि"}</div>}
          <div className="record-card-body"><span className="record-kicker">GR {student.grNo} · इयत्ता {student.className}</span><h3>{student.name}</h3><p>{student.fatherName || student.motherName || "पालकाचे नाव नोंदलेले नाही"}</p><strong>{student.mobile || "मोबाईल नोंदलेला नाही"}</strong></div>
          <div className="record-actions"><button onClick={() => openWhatsApp(student)}>WhatsApp</button><button className="button-muted" onClick={() => openSms(student)}>SMS</button><button className="button-muted" onClick={() => window.open(`tel:${student.mobile || ""}`)}>कॉल</button></div>
        </article>)}
      </div>
      {filtered.length === 0 && <div className="empty-state"><strong>पालक नोंदी सापडल्या नाहीत</strong><span>विद्यार्थी मास्टरमध्ये पालक मोबाईल आणि नाव भरा.</span></div>}
      {history.length > 0 && <section className="workflow-panel"><div className="panel-title"><h3>Communication History</h3><span>{history.length} messages</span></div>{history.slice().reverse().map((entry) => <div className="activity-row" key={entry.id}><strong>{entry.type} · {entry.student}</strong><span>{entry.status} · {entry.date.slice(0, 10)}</span></div>)}</section>}
    </div>
  );
}
