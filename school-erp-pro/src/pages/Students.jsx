import StudentContactFields from '../components/StudentContactFields';
import {contactFields} from '../services/contactFields';
import {lifecycleActive,enrollment} from '../services/studentLifecycle';
import {previewMovements,commitMovements} from '../services/lifecycleStore';
import { useLanguage } from "../design/language";
import { bilingualStudent, suggestMarathiName } from "../services/bilingualStudent";
import { useState } from "react";
import { readStored, useStoredState, commitStoredBatch } from "../storage";
import { studentColumns, exportStudents } from "../services/excel";
import { canonical, normalizeDate, normalizeMobile } from "../services/studentImport";
import { notify } from "../components/Feedback";
import { recordAudit } from "../services/audit";
import StudentDirectory from "./StudentDirectory";
import StudentProfile from "./StudentProfile";
import StudentImport from "./StudentImport";
import { PageHeading } from "../design/SchoolUI";

export default function Students({ studentId, mode: initialMode, initialClass = "", archived = false, onNavigate, settings }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(["import", "add"].includes(initialMode) ? initialMode : "directory");
  const [students, saveStudents, reloadStudents] = useStoredState("erp_pro_students", []);
  const [selectedId, setSelectedId] = useState(studentId || null), [form, setForm] = useState({});
  const [query, setQuery] = useState(""), [classFilter, setClassFilter] = useState(initialClass), [divisionFilter, setDivisionFilter] = useState("");
  const changeReason="";
  const [imageLoading, setImageLoading] = useState(false), [showArchived, setShowArchived] = useState(archived);
  const activeStudents = students.filter(s => showArchived ? !lifecycleActive(s) : lifecycleActive(s));
  const visible = activeStudents.filter(s => [s.name, s.student_name_en, s.student_name_mr, s.grNo, s.admissionNo, s.dob, s.rollNo].join(" ").toLowerCase().includes(query.toLowerCase()) && (!classFilter || s.className === classFilter) && (!divisionFilter || s.division === divisionFilter));
  const edit = id => { setForm(students.find(s => s.id === id) || {}); setMode("add"); setSelectedId(null); };
  const save = () => {
    if (imageLoading) return;
    if (!["name", "grNo", "className"].every(key => String(form[key] || "").trim())) return notify("Name, GR and class are required.");
    if (students.some(s => s.id !== form.id && (canonical(s.grNo) === canonical(form.grNo) || (form.admissionNo && canonical(s.admissionNo) === canonical(form.admissionNo))))) return notify("GR or admission number already exists.");
    for (const field of ["dob", "admissionDate"]) if (form[field] && !normalizeDate(form[field])) return notify(`Invalid ${field}.`);
    if (form.dob && form.dob > new Date().toISOString().slice(0, 10)) return notify("Date of birth cannot be in the future.");
    if(!["fatherMobile","motherMobile","emergencyContact","mobile","guardianMobile"].some(k=>form[k]))return notify("Save at least one parent or emergency phone number.");
    for (const field of ["fatherWhatsapp", "motherWhatsapp", "mobile", "whatsapp", "fatherMobile", "motherMobile", "guardianMobile", "alternateMobile", "emergencyContact"]) if (form[field] && normalizeMobile(form[field]) === null) return notify(`Invalid ${field}.`);
    const record = bilingualStudent({ ...form, name: form.name.trim(), grNo: form.grNo.trim(), student_name_en: form.name.trim(), id: form.id || crypto.randomUUID(), updatedAt: new Date().toISOString() });
    const previous=students.find(s=>s.id===form.id);
    const changed=previous&&['className','division','rollNo','academicYear','status'].some(k=>String(previous[k]||'')!==String(record[k]||''));
    if(changed)return notify('Use Student Lifecycle for class, roll, academic-year or status changes so history is preserved.');
    if(previous){if(!saveStudents(students.map(s=>s.id===record.id?record:s)))return;}else{try{commitStoredBatch({erp_pro_students:[...students,{...record,status:record.status||'Active'}],erp_pro_student_movements:[...readStored('erp_pro_student_movements',[]),{id:crypto.randomUUID(),studentId:record.id,studentName:record.name,grNo:record.grNo,action:'Added',type:'Added',oldValue:null,newValue:enrollment(record),actor:'local-review',createdAt:new Date().toISOString()}]},{erp_pro_students:JSON.stringify(students)===JSON.stringify(readStored('erp_pro_students',[]))?localStorage.getItem('erp_pro_students'):'STALE'});reloadStudents()}catch(e){notify(e.message);return;}}
    recordAudit(form.id ? "Student updated" : "Student created", { studentId: record.id }); setForm({}); setMode("directory"); notify("Student saved.");
  };
  const archive = id => {
    const student = students.find(s => s.id === id);
    if (!window.confirm(student.archivedAt ? "Restore this student?" : "Archive this student? Existing history will be retained.")) return;
    try{commitMovements(previewMovements([id],{action:student.archivedAt?'Restore':'Archive',reason:changeReason||'Student directory archive / restore'}));reloadStudents()}catch(e){notify(e.message)}
  };
  const photo = event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1024 * 1024) return notify("Choose a JPG, PNG or WebP smaller than 1 MB.");
    setImageLoading(true); const reader = new FileReader();
    reader.onload = () => { setForm(previous => ({ ...previous, photo: reader.result })); setImageLoading(false); };
    reader.onerror = () => { notify("Photo could not be read."); setImageLoading(false); }; reader.readAsDataURL(file);
  };
  if (mode === "import") return <StudentImport onBack={() => setMode("directory")} onDone={() => { reloadStudents(); setMode("directory"); }} />;
  const selected = students.find(s => String(s.id) === String(selectedId));
  if (selected) return <><button className="school-button secondary" onClick={() => edit(selected.id)}>Edit student</button><StudentProfile student={selected} settings={settings} onBack={() => setSelectedId(null)} onNavigate={onNavigate} /></>;
  if (mode === "directory") return <><div className="import-actions"><button onClick={()=>onNavigate("Lifecycle")}>Student Lifecycle / Promote / Restore</button><button onClick={()=>onNavigate("PhotoImport")}>Photo Folder Import</button><label><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Show inactive / archived students</label><button className="school-link" onClick={() => exportStudents(visible, "students-filtered.csv")}>Export filtered CSV</button><button className="school-link" onClick={() => exportStudents(readStored("erp_pro_students", []).filter(s => !s.archivedAt), "all-students.xlsx")}>Download All Students</button></div><StudentDirectory students={activeStudents} visibleStudents={visible} query={query} setQuery={setQuery} classFilter={classFilter} setClassFilter={setClassFilter} divisionFilter={divisionFilter} setDivisionFilter={setDivisionFilter} onCreate={() => { setForm({}); setMode("add"); }} onImport={() => setMode("import")} onExport={() => exportStudents(visible, "students-filtered.xlsx")} onSelect={setSelectedId} onDelete={archive} /></>;
  return <div className="core-page"><button className="school-link" onClick={() => setMode("directory")}>← Student Master</button><PageHeading eyebrow="STUDENT MASTER" title={form.id ? "Update student record" : "A new learner. A new beginning."} description="Keep English and Marathi names separately. Changes retain the student's ID and history." /><section className="school-panel workflow-panel">{form.id&&<button onClick={()=>onNavigate("Lifecycle",{studentId:form.id})}>Change class / year / status with history</button>}<div className="form-grid">{studentColumns.filter(([, field]) => field !== "srNo"&&!contactFields.includes(field)).map(([label, field]) => <label key={field}>{t(label)}<input name={field} type={["dob", "admissionDate"].includes(field) ? "date" : field.toLowerCase().includes("mobile") || field === "whatsapp" || field.endsWith("Whatsapp") || field === "emergencyContact" ? "tel" : "text"} value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} /></label>)}<button onClick={()=>{setForm({...form,student_name_mr:form.student_name_mr||suggestMarathiName(form.name),father_name_mr:form.father_name_mr||suggestMarathiName(form.fatherName),mother_name_mr:form.mother_name_mr||suggestMarathiName(form.motherName)});notify("Limited offline name suggestions applied where known. Review Marathi spellings; unknown names and addresses require manual entry.")}}>Suggest Marathi names (review required)</button><label>Student photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={photo} /></label></div><StudentContactFields form={form} setForm={setForm}/><button className="school-button" aria-label="Save Student" onClick={save} disabled={imageLoading}>{t("Save student")}</button></section></div>;
}
