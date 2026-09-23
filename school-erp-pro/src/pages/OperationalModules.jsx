import { notify } from "../components/Feedback";
import { useState } from "react";
import { useStoredState, localDate } from "../storage";
import { exportRows } from "../services/excel";

const definitions = {
  Sports: { eyebrow: "STUDENT WELLBEING", title: "क्रीडा व्यवस्थापन", key: "erp_pro_sports", fields: ["विद्यार्थी नाव", "खेळाचे नाव", "स्पर्धा स्तर", "स्पर्धा दिनांक", "निकाल / पदक"], prompt: "क्रीडा नोंद" },
  Scholarships: { eyebrow: "STUDENT SUPPORT", title: "शिष्यवृत्ती", key: "erp_pro_scholarships", fields: ["शिष्यवृत्तीचे नाव", "पात्र इयत्ता", "अंतिम दिनांक", "आवश्यक कागदपत्रे", "स्थिती"], prompt: "शिष्यवृत्ती नोंद" },
  Fees: { eyebrow: "OFFICE FINANCE", title: "शुल्क व्यवस्थापन", key: "erp_pro_fees", fields: ["विद्यार्थी / GR", "शुल्क प्रकार", "एकूण रक्कम", "भरलेली रक्कम", "पावती क्रमांक"], prompt: "शुल्क नोंद" },
  Notices: { eyebrow: "SCHOOL COMMUNICATION", title: "सूचना केंद्र", key: "erp_pro_notices", fields: ["सूचना शीर्षक", "लक्ष्य वर्ग / गट", "दिनांक", "संदेश", "चॅनेल"], prompt: "सूचना" },
  Meetings: { eyebrow: "FAMILY ENGAGEMENT", title: "पालक सभा", key: "erp_pro_meetings", fields: ["विद्यार्थी नाव / GR", "पालक नाव", "सभा दिनांक", "चर्चेचा विषय", "पुढील भेट"], prompt: "पालक सभा नोंद" },
  Transport: { eyebrow: "SAFE ARRIVAL", title: "शालेय वाहतूक", key: "erp_pro_transport", fields: ["वाहन क्रमांक", "चालक नाव", "मार्ग", "थांबे", "आपत्कालीन संपर्क"], prompt: "वाहतूक नोंद" },
  Automation: { eyebrow: "CONTROLLED WORKFLOWS", title: "स्वयंचलित नियम", key: "erp_pro_automation", fields: ["घटना", "पालक सूचना", "WhatsApp", "SMS", "स्थिती"], prompt: "नियम" },
  Communications: { eyebrow: "AUDITABLE CONTACT", title: "संवाद नोंद", key: "erp_pro_communications", fields: ["विद्यार्थी / पालक", "प्रकार", "संदेश", "दिनांक", "स्थिती"], prompt: "संवाद" },
};

export default function OperationalModules({ module }) {
  const definition = definitions[module] || definitions.Notices;
  const [items, setItems] = useStoredState(definition.key, []);
  const [form, setForm] = useState(() => Object.fromEntries(definition.fields.map((field) => [field, ""])));
  const [query, setQuery] = useState("");
  const save = () => {
    if (definition.fields.slice(0, 2).some(field => !form[field]?.trim())) { notify("पहिली दोन आवश्यक माहिती भरा / Complete the first two required fields."); return; }
    if (module === "Fees" && (!form["एकूण रक्कम"] || !form["भरलेली रक्कम"] || !Number.isFinite(Number(form["एकूण रक्कम"])) || !Number.isFinite(Number(form["भरलेली रक्कम"])) || Number(form["एकूण रक्कम"]) < 0 || Number(form["भरलेली रक्कम"]) < 0 || Number(form["भरलेली रक्कम"]) > Number(form["एकूण रक्कम"]))) return notify("Enter valid non-negative amounts; paid cannot exceed total.");
    const item={...form,id:form.id||crypto.randomUUID(),createdAt:form.createdAt||localDate()};
    if (!setItems(form.id ? items.map(row=>row.id===form.id?item:row) : [...items,item])) return;
    setForm(Object.fromEntries(definition.fields.map((field) => [field, ""])));
  };
  const visibleItems = items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <div className="page module-page"><div className="module-heading"><div><span className="eyebrow">{definition.eyebrow}</span><h2>{definition.title}</h2><p>{definition.prompt} तयार करा, शोधा आणि स्थानिक नोंद सुरक्षित ठेवा.</p></div><div className="module-count">{items.length}<span>एकूण नोंदी</span></div></div><section className="workflow-panel"><div className="panel-title"><h3>नवीन नोंद</h3><span>API credentials येथे साठवले जात नाहीत</span></div><div className="form-grid">{definition.fields.map((field) => field.includes("संदेश") || field.includes("चर्चे") || field.includes("कागदपत्रे") ? <textarea key={field} aria-label={field} placeholder={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /> : <input key={field} aria-label={field} placeholder={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />)}</div><button onClick={save}>नोंद जतन करा</button></section><input className="module-search" aria-label="नोंदी शोधा" placeholder="या moduleमधील नोंदी शोधा" value={query} onChange={(event) => setQuery(event.target.value)} /><div className="import-actions"><button onClick={() => exportRows(visibleItems, `${module}.xlsx`)}>Export Excel</button><button onClick={() => exportRows(visibleItems, `${module}.csv`)}>Export CSV</button></div>{module === "Automation" && <p className="inline-notice">Rules here are planning records only. No automatic sender or background worker is connected.</p>}<div className="record-grid">{visibleItems.map((item) => <article className="record-card text-record" key={item.id}><div className="record-card-body"><span className="record-kicker">{item.createdAt}</span><h3>{Object.values(item).filter((value) => value && typeof value === "string").slice(0, 2).join(" · ") || definition.prompt}</h3><p>{Object.entries(item).filter(([key]) => key !== "id" && key !== "createdAt").map(([key, value]) => `${key}: ${value}`).join(" · ")}</p><button onClick={()=>setForm({...item})}>Edit</button><button onClick={()=>{if(window.confirm("Delete this record?")){if(setItems(items.filter(row=>row.id!==item.id)) && form.id===item.id)setForm(Object.fromEntries(definition.fields.map(field=>[field,""])));}}}>Delete</button></div></article>)}</div>{visibleItems.length === 0 && <div className="empty-state"><strong>अद्याप नोंदी नाहीत</strong><span>वरील form वापरून पहिली नोंद तयार करा.</span></div>}</div>;
}
