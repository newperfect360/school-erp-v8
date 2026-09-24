import {schoolStorage} from '../backend/demoClient';
import {useSharedRecords} from "../backend/useSharedRecords";
import {exportRows} from '../services/excel';
import StaffAttendance from '../components/StaffAttendance';
import { notify } from "../components/Feedback";
import { useMemo, useState } from "react";
import { createBackup, recordAudit } from "../services/audit";
import { readStored } from "../storage";

const modules = {
  Admissions: { title: "प्रवेश आणि GR", eyebrow: "STUDENT INTAKE", key: "erp_pro_admissions", fields: ["Admission Number", "GR Number", "Admission Date", "Previous School", "Previous Standard", "Class Allocation", "Status"] },
  Library: { title: "ग्रंथालय", eyebrow: "READING CULTURE", key: "erp_pro_library", fields: ["Book ID", "पुस्तकाचे नाव", "लेखक", "Accession Number", "Available Copies", "Shelf / Rack"] },
  Inventory: { title: "शालेय मालमत्ता", eyebrow: "CAMPUS ASSETS", key: "erp_pro_inventory", fields: ["Asset Code", "Asset Name", "Category", "Location", "Assigned To", "Condition"] },
  Timetable: { title: "वेळापत्रक", eyebrow: "ACADEMIC RHYTHM", key: "erp_pro_timetable", fields: ["इयत्ता / तुकडी", "वार", "तास", "विषय", "शिक्षक", "कक्ष / प्रयोगशाळा"] },
  Calendar: { title: "शालेय दिनदर्शिका", eyebrow: "YEAR AT A GLANCE", key: "erp_pro_calendar", fields: ["कार्यक्रम", "प्रकार", "दिनांक", "वेळ", "ठिकाण", "नोंद"] },
  Staff: { title: "कर्मचारी मास्टर", eyebrow: "PEOPLE OPERATIONS", key: "erp_pro_staff", fields: ["Employee ID", "पूर्ण नाव", "पद", "विषय / विभाग", "मोबाईल", "Joining Date"] },
};

function BackupPanel() {
  const [logs] = useState(() => readStored("erp_pro_audit", []));
  const download = () => {
    const backup = createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `school-erp-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    recordAudit("Backup डाउनलोड", { scope: "localStorage" });
  };
  const restore = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!backup?.data || typeof backup.data !== "object" || !window.confirm("हा backup local dataमध्ये restore करायचा आहे का?")) return;
        Object.entries(backup.data).forEach(([key, value]) => schoolStorage.setItem(key, value));
        recordAudit("Backup restore", { version: backup.version || "unknown" });
        notify("Backup restore झाला. पान reload करा.");
      } catch { notify("Backup file वाचता आली नाही."); }
    };
    reader.readAsText(file);
  };
  return <div className="page module-page"><div className="module-heading"><div><span className="eyebrow">DATA SAFETY</span><h2>Backup आणि Audit</h2><p>Local dataची versioned copy डाउनलोड करा आणि महत्त्वाच्या कृतींची नोंद पहा.</p></div><div className="module-count">{logs.length}<span>audit entries</span></div></div><section className="workflow-panel"><div className="panel-title"><h3>Recovery controls</h3><span>Restoreसाठी स्पष्ट confirmation आवश्यक आहे</span></div><button onClick={download}>Backup डाउनलोड करा</button><label className="file-action">Backup Restore<input type="file" accept="application/json" onChange={restore} /></label></section><div className="record-grid">{logs.slice().reverse().map((log) => <article className="record-card text-record" key={log.id}><div className="record-card-body"><span className="record-kicker">{log.date} · {log.time}</span><h3>{log.action}</h3><p>{log.user} · {JSON.stringify(log.details)}</p></div></article>)}</div>{logs.length === 0 && <div className="empty-state"><strong>Audit log रिकामा आहे</strong><span>महत्त्वाच्या create, backup आणि restore actions येथे दिसतील.</span></div>}</div>;
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

export default function SchoolOperations({ module = "Admissions" }) {
  return module === "Backup" ? <BackupPanel /> : <SchoolRecordPanel key={module} module={module} />;
}

function SchoolRecordPanel({ module }) {
  const definition = modules[module] || modules.Admissions;
  const aliases=module==="Staff"?Object.fromEntries(definition.fields.map((label,index)=>[label,["employeeId","name","designation","subject","mobile","joiningDate"][index]])):{};
  const [items, setItems, connection] = useSharedRecords(module==="Staff"?"teachers":null,definition.key,{kind:module==="Staff"?"staff":"",aliases});
  const [form, setForm] = useState(() => Object.fromEntries(definition.fields.map((field) => [field, ""])));
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())), [items, query]);

  const save = async () => {
    if (definition.fields.slice(0, 2).some((field) => !form[field]?.trim())) { notify("पहिली आवश्यक माहिती भरा"); return; }
    const item = { ...form, id: form.id || crypto.randomUUID(), createdAt: form.createdAt || new Date().toISOString() };
    if (!await setItems(form.id ? items.map(row=>row.id===form.id?item:row) : [...items, item])) return;
    if(!connection.shared)recordAudit(`${definition.title} नोंद तयार`, { id: item.id });
    setForm(Object.fromEntries(definition.fields.map((field) => [field, ""])));
  };

  const backup = () => { downloadJson(`school-erp-backup-${new Date().toISOString().slice(0, 10)}.json`, createBackup()); recordAudit("Backup डाउनलोड", { scope: "localStorage" }); };

  return <div className="page module-page">{module === "Staff" && <StaffAttendance/>}
    <div className="module-heading"><div><span className="eyebrow">{definition.eyebrow}</span><h2>{definition.title}</h2><p>शाळेच्या दैनंदिन कामकाजासाठी सुरक्षित, शोधता येणारी नोंदवही.</p></div><div className="module-count">{items.length}<span>एकूण नोंदी</span></div></div>
    <section className="workflow-panel"><div className="panel-title"><h3>नवीन नोंद</h3><span>डेटा migration किंवा delete होत नाही</span></div><div className="form-grid">{definition.fields.map((field) => <input key={field} aria-label={field} placeholder={field} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />)}</div><p role="status">{connection.status}</p><button disabled={connection.busy} onClick={save}>नोंद जतन करा</button>{module === "Admissions" && <button className="button-muted" onClick={backup}>Backup डाउनलोड</button>}</section>
    <input className="module-search" aria-label="नोंदी शोधा" placeholder={`${definition.title} मध्ये शोधा`} value={query} onChange={(event) => setQuery(event.target.value)} />
    <button onClick={()=>exportRows(visibleItems,`${module}.xlsx`)}>Export Excel</button><div className="record-grid">{visibleItems.map((item) => <article className="record-card text-record" key={item.id}><div className="record-card-body"><span className="record-kicker">{item.createdAt?.slice(0, 10)}</span><h3>{definition.fields.slice(0,2).map(field=>item[field]).filter(Boolean).join(" · ")}</h3><p>{Object.entries(item).filter(([key]) => key !== "id" && key !== "createdAt" && key !== "__version" && key !== "kind").map(([key, value]) => `${key}: ${value}`).join(" · ")}</p><button onClick={()=>setForm({...item})}>Edit</button><button onClick={async()=>{if(window.confirm("Delete this record?")){if(await setItems(items.filter(row=>row.id!==item.id)) && form.id===item.id)setForm(Object.fromEntries(definition.fields.map(field=>[field,""])));}}}>Delete</button></div></article>)}</div>
    {visibleItems.length === 0 && <div className="empty-state"><strong>अद्याप नोंदी नाहीत</strong><span>वरील formमधून पहिली नोंद तयार करा.</span></div>}
  </div>;
}
