import {schoolStorage} from '../backend/demoClient';
import {academicSnapshot} from '../services/studentLifecycle';
import { useLanguage } from "../design/language";
import StudentLookup from "../components/StudentLookup";
import { useRef, useState } from "react";
import { readStored, localDate, commitStoredBatch } from "../storage";
import {useSharedRecords} from '../backend/useSharedRecords';
import {sharedOperationalEnabled} from '../backend/sharedReadCache';
import {schoolFirebase} from '../backend/firebaseClient';
import {createFirebaseRepository} from '../backend/firebaseRepository';
import { formatTypes, formatFields, groupFormats, placeholders, defaultFormat, templateContext, renderFormat, documentHtml, downloadDocument, sanitizeFormatHtml, safeCss, escapeHtml } from "../services/templates";
import { aggregateResults } from "../services/results";
import { normalizeDate } from "../services/studentImport";
import { PageHeading, EmptyState } from "../design/SchoolUI";
import { notify } from "../components/Feedback";

export default function SchoolFormats({ initialType = "Bonafide Certificate", settings = {}, studentId: initialStudent }) {
  const { t } = useLanguage();
  const students = readStored("erp_pro_students", []);
  const [templates, saveTemplates] = useSharedRecords('settings',"erp_pro_document_templates",{kind:'document_template'});
  const [history, , , reloadHistory] = useSharedRecords('certificates',"erp_pro_certificates");
  const [generating,setGenerating]=useState(false);
  const [type, setType] = useState(initialType), [selected, setSelected] = useState(initialStudent ? [initialStudent] : []);
  const [extras, setExtras] = useState({ issue_date: localDate(), academic_year: settings.academicYear || "2026-27", exam: "Annual Exam", month: localDate().slice(0, 7), reason: "", last_class: "", progress: "", conduct: "", content: "", remarks: "" });
  const [editor, setEditor] = useState(null), [preview, setPreview] = useState(""), [issued, setIssued] = useState(null);
  const [confirmExit,setConfirmExit]=useState(false);
  const [previewSource, setPreviewSource] = useState(null);
  const frame = useRef(null);
  const template = templates.find(item => item.type === type) || defaultFormat(type);
  const targets = () => groupFormats.includes(type) ? [{ name: "School group", groupIds: selected }] : students.filter(s => selected.includes(s.id));
  const sourceSnapshot = () => JSON.stringify(["erp_pro_students", "erp_pro_results", "erp_pro_attendance", "erp_pro_document_templates", "schoolSettings"].map(key => readStored(key,null)));
  const build = (student, number = "PREVIEW") => {
    const values = { ...extras, certificate_number: number, last_class: extras.last_class || student.className, previous_school: extras.previous_school || student.previousSchool, admission_date: extras.admission_date || student.admissionDate, emergency_contact: extras.emergency_contact || student.emergencyContact || student.mobile, medical_note: extras.medical_note || student.healthNotes };
    if (["Marksheet", "Annual Result", "Progress Card"].includes(type)) {
      const rows = readStored("erp_pro_results", []).filter(r => (r.studentId === student.id || (!r.studentId && r.grNo === student.grNo)) && r.exam === extras.exam && (!r.academicYear || r.academicYear === extras.academic_year));
      if (!rows.length) throw new Error(`No marks for ${student.name}, ${extras.exam}, ${extras.academic_year}.`);
      const summary = aggregateResults(rows);
      Object.assign(values, { total: `${summary.total}/${summary.max}`, percentage: `${summary.percentage}%`, grade: summary.grade, result: summary.pass ? "Pass" : "Fail", subject_marks: `<table><tr><th>Subject</th><th>Component</th><th>Marks</th></tr>${rows.map(r => `<tr><td>${escapeHtml(r.subject)}</td><td>${escapeHtml(r.component || "Theory")}</td><td>${Number(r.obtainedMarks)}/${Number(r.maxMarks)}</td></tr>`).join("")}</table>` });
    }
    if (["Trip Student List", "Attendance Register"].includes(type)) {
      const members = students.filter(s => selected.includes(s.id)); if (!members.length) throw new Error("Choose students in Bulk Generate for this register.");
      const attendance = readStored("erp_pro_attendance", {}), days = Object.keys(attendance).filter(date => date.startsWith(extras.month || "")).sort();
      const headings = type === "Attendance Register" ? days : ["Emergency contact", "Medical note"];
      values.roster_table = `<table><tr><th>Student</th><th>GR</th><th>Class</th>${headings.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr>${members.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.grNo)}</td><td>${escapeHtml(`${s.className}/${s.division || ""}`)}</td>${(type === "Attendance Register" ? days.map(day => attendance[day][s.id] || "Unmarked") : [s.emergencyContact || s.mobile, s.healthNotes]).map(v => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</table>`;
    }
    return renderFormat(template, templateContext(student, settings, values));
  };
  const renderSelected = () => {
    if (!selected.length && !groupFormats.includes(type)) return notify("Select a student first.");
    if (!normalizeDate(extras.issue_date)) return notify("Choose a valid issue date.");
    try { setPreview(documentHtml(targets().map(s => `<section class="document">${build(s)}</section>`).join(""), template.css)); setPreviewSource(sourceSnapshot()); setIssued(null); } catch (error) { notify(error.message); }
  };
  const generate = async () => {
    if(generating)return;
    if (!preview || (!selected.length && !groupFormats.includes(type))) return notify("Preview your selection before generating.");
    if (previewSource !== sourceSnapshot()) return notify("School records changed. Preview again before generating.");
    if (type === "Leaving Certificate" && ["reason", "last_class", "progress", "conduct"].some(k => !extras[k].trim())) return notify("Leaving reason, last class, progress and conduct are required.");
    setGenerating(true);
    try {
      const source = schoolStorage.getItem("erp_pro_certificates");
      const current = sharedOperationalEnabled ? history : source === null ? [] : JSON.parse(source);
      const batch = targets().map(student => {
        const id = crypto.randomUUID(), certificateNo = `${type === "Leaving Certificate" ? "LC" : "DOC"}-${extras.issue_date.replaceAll("-", "")}-${id.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
        return { id, studentId: student.id || null, studentIds: student.groupIds, name: student.name, grNo: student.grNo, className: student.className, reason: type, certificateNo, issueDate: extras.issue_date, details: extras, templateVersion: template.version, draft: !template.approved, html: build(student, certificateNo), css: template.css };
      });
      const entries={erp_pro_certificates:[...current,...batch]},expected={erp_pro_certificates:source};
      if(type==='Leaving Certificate'&&confirmExit){
        if(extras.issue_date>localDate())throw Error('LC issue date cannot be in the future.');
        const master=readStored('erp_pro_students',[]),movements=readStored('erp_pro_student_movements',[]);
        expected.erp_pro_students=schoolStorage.getItem('erp_pro_students');expected.erp_pro_student_movements=schoolStorage.getItem('erp_pro_student_movements');
        entries.erp_pro_students=master.map(s=>{const cert=batch.find(c=>c.studentId===s.id);return cert?{...s,status:'TC/LC Issued',lcNumber:cert.certificateNo,lcIssueDate:cert.issueDate,leavingDate:s.leavingDate||cert.issueDate,leavingReason:s.leavingReason||extras.reason}:s});
        entries.erp_pro_academic_history=[...readStored('erp_pro_academic_history',[]),...master.filter(s=>batch.some(c=>c.studentId===s.id)).map(s=>({id:crypto.randomUUID(),...academicSnapshot(s,readStored('erp_pro_results',[]),readStored('erp_pro_attendance',{}),'LC Issued',extras.issue_date)}))];
        entries.erp_pro_student_movements=[...movements,...batch.map(c=>({id:crypto.randomUUID(),studentId:c.studentId,studentName:c.name,action:'LC Issued',type:'LC Issued',oldValue:{status:master.find(s=>s.id===c.studentId)?.status||'Active'},newValue:{status:'TC/LC Issued',lcNumber:c.certificateNo},actor:'local-review',createdAt:new Date().toISOString(),reason:extras.reason}))];
      }
      if(sharedOperationalEnabled){
        const client=schoolFirebase(),repo=createFirebaseRepository(client);await repo.membership();
        const mutations=batch.map(item=>{const student=students.find(s=>s.id===item.studentId);return {collection:'certificates',id:item.id,classId:student?`${student.className}:${student.division}`:'',expectedVersion:0,mutationId:crypto.randomUUID(),data:JSON.parse(JSON.stringify(item))};});
        if(type==='Leaving Certificate'&&confirmExit){
          for(const cert of batch){const original=students.find(s=>s.id===cert.studentId),{__version,...student}=entries.erp_pro_students.find(s=>s.id===cert.studentId);
            student.movements=[...(original.movements||[]),...entries.erp_pro_student_movements.filter(m=>m.studentId===student.id&&!original.movements?.some(old=>old.id===m.id)).map(m=>({...m,actor:client.auth.currentUser.uid}))];
            student.enrollmentHistory=[...(original.enrollmentHistory||[]),...entries.erp_pro_academic_history.filter(h=>h.studentId===student.id&&!original.enrollmentHistory?.some(old=>old.id===h.id))];
            mutations.push({collection:'students',id:student.id,classId:`${student.className}:${student.division}`,expectedVersion:__version,mutationId:crypto.randomUUID(),data:JSON.parse(JSON.stringify(student))});
          }
        }
        await repo.mutateMany(mutations);
      }else commitStoredBatch(entries,expected);
      reloadHistory(); setIssued(batch); setPreview(documentHtml(batch.map(item => `<section class="document">${item.html}</section>`).join(""), template.css)); notify(`${batch.length} document records saved${template.approved ? "" : " as drafts"}.`);
    } catch (error) { notify(error.message); }finally{setGenerating(false);}
  };
  const saveTemplate = async () => {
    try { safeCss(editor.css); const saved = { ...editor, id:editor.id||crypto.randomUUID(), html: sanitizeFormatHtml(editor.html), version: (template.version || 1) + 1 }; if (await saveTemplates([...templates.filter(t => t.type !== type), saved])) { setEditor(null); setPreview(""); notify("Template saved. Preview it before generating."); } } catch (error) { notify(error.message); }
  };
  const invalidate = () => { setPreview(""); setIssued(null); };
  return <div className="core-page"><PageHeading eyebrow="SCHOOL DOCUMENT STUDIO" title="Formats & certificates" description="One Student Master. Reusable school formats. Preview every document before issuing." />
    <StudentLookup students={students} onSelect={s => { setSelected([s.id]); invalidate(); }} /><section className="school-panel workflow-panel"><span className="audit-badge">{template.approved ? "School-approved template" : "NEEDS MY FORMAT — editable draft layout"}</span><div className="form-grid"><label>{t("Format")}<select aria-label="Format" value={type} onChange={e => { setType(e.target.value); setEditor(null); invalidate(); }}>{formatTypes.map(name => <option key={name}>{name}</option>)}</select></label><label>{t("Student")}<select aria-label="Document student" value={selected.length === 1 ? selected[0] : ""} onChange={e => { setSelected(e.target.value ? [e.target.value] : []); invalidate(); }}><option value="">Select student / use bulk selection</option>{students.map(s => <option key={s.id} value={s.id}>{s.name} · GR {s.grNo}</option>)}</select></label>{["issue_date", "academic_year", ...(formatFields[type] || [])].map(key => <label key={key}>{t(key.replaceAll("_", " "))}<input type={key === "month" ? "month" : key.endsWith("_date") || key === "deadline" ? "date" : "text"} value={extras[key] || ""} onChange={e => { setExtras({ ...extras, [key]: e.target.value }); invalidate(); }} /></label>)}</div>
    <details><summary>Bulk Generate — select students ({selected.length})</summary><div className="check-grid">{students.map(s => <label key={s.id}><input type="checkbox" checked={selected.includes(s.id)} onChange={e => { setSelected(e.target.checked ? [...selected, s.id] : selected.filter(id => id !== s.id)); invalidate(); }} />{s.name} · {s.grNo}</label>)}</div></details>
    {type==="Leaving Certificate"&&<label><input type="checkbox" checked={confirmExit} onChange={e=>setConfirmExit(e.target.checked)}/>Confirm actual LC issue and remove selected students from active rolls. Draft generation alone does not change enrollment.</label>}<div className="import-actions"><button className="school-button" onClick={renderSelected}>{t("Preview")}</button><button className="school-button secondary" onClick={generate} disabled={!preview || !!issued}>Generate {selected.length > 1 ? `${selected.length} documents` : type === "Bonafide Certificate" ? "Bonafide" : "document"}</button><button className="school-button secondary" disabled={!preview} onClick={() => frame.current?.contentWindow?.print()}>{t("Print / Save as PDF")}</button><button className="school-button secondary" disabled={!preview} onClick={() => downloadDocument(preview)}>{t("Download HTML")}</button><button className="school-link" onClick={() => setEditor({ ...template })}>{t("Customize school format")}</button></div><p>PDF uses the browser’s Print → Save as PDF. QR identifies an internal student record; it is not a public certificate verification service.</p></section>
    {editor && <section className="school-panel workflow-panel"><h3>Reusable HTML / CSS template</h3><p>{placeholders.map(p => `{{${p}}}`).join(" · ")}</p><label>HTML<textarea aria-label="Template HTML" className="format-editor" value={editor.html} onChange={e => setEditor({ ...editor, html: e.target.value })} /></label><label>CSS<textarea aria-label="Template CSS" className="format-editor" value={editor.css} onChange={e => setEditor({ ...editor, css: e.target.value })} /></label><label><input type="checkbox" checked={editor.approved} onChange={e => setEditor({ ...editor, approved: e.target.checked })} />I have reviewed this against the school’s official supplied format.</label><p>Scripts, remote resources and active HTML are removed. Use the supported placeholders for photos, logos and QR.</p><button onClick={saveTemplate}>{t("Save template")}</button><button onClick={() => setEditor(null)}>{t("Cancel")}</button></section>}
    {preview ? <iframe ref={frame} title="School document preview" className="format-preview" sandbox="allow-same-origin allow-modals" srcDoc={preview} /> : <EmptyState icon="file" title="Your next school document starts here" description="Choose a format and student, then preview the auto-filled document." />}
    <section className="school-panel workflow-panel"><h3>Issue history · {history.length}</h3>{history.length ? <div className="table-scroll"><table><thead><tr><th>Number</th><th>{t("Student")}</th><th>{t("Format")}</th><th>{t("Date")}</th><th>Output</th></tr></thead><tbody>{history.slice().reverse().map(item => <tr key={item.id}><td>{item.certificateNo}</td><td>{item.name} · {item.grNo}</td><td>{item.reason}{item.draft ? " (draft)" : ""}</td><td>{item.issueDate}</td><td>{item.html ? <button onClick={() => { setPreview(documentHtml(sanitizeFormatHtml(item.html), item.css)); setIssued([item]); }}>View saved issue</button> : "Legacy record — no saved output"}</td></tr>)}</tbody></table></div> : <p>No documents have been generated yet.</p>}</section>
  </div>;
}
