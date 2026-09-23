import {useSharedRecords} from "../backend/useSharedRecords";
import StudentForm from '../components/StudentForm';
import StudentChangeDialog, {StudentActions} from '../components/StudentActions';
import {currentAcademicYear, normalizeYear} from '../services/academicYears';
import {lifecycleActive,enrollment} from '../services/studentLifecycle';
import {previewMovements,commitMovements} from '../services/lifecycleStore';
import { bilingualStudent } from "../services/bilingualStudent";
import { useState } from "react";
import { readStored, commitStoredBatch } from "../storage";
import { exportStudents } from "../services/excel";
import { canonical, normalizeDate, normalizeMobile } from "../services/studentImport";
import { notify } from "../components/Feedback";
import { recordAudit } from "../services/audit";
import StudentDirectory from "./StudentDirectory";
import StudentProfile from "./StudentProfile";
import StudentImport from "./StudentImport";

export default function Students({ studentId, mode: initialMode, initialClass = "", archived = false, onNavigate, settings, role }) {
  const [mode, setMode] = useState(["import", "add"].includes(initialMode) ? initialMode : "directory");
  const [students, saveStudents, connection, reloadStudents] = useSharedRecords("students","erp_pro_students");
  const [selectedId, setSelectedId] = useState(studentId || null), [form, setForm] = useState({academicYear:currentAcademicYear(),status:"Active"});
  const [query, setQuery] = useState(""), [classFilter, setClassFilter] = useState(initialClass), [divisionFilter, setDivisionFilter] = useState("");
  const [action,setAction]=useState(null);
  const changeReason="";
  const [imageLoading, setImageLoading] = useState(false), [showArchived, setShowArchived] = useState(archived);
  const activeStudents = students.filter(s => showArchived ? !lifecycleActive(s) : lifecycleActive(s));
  const visible = activeStudents.filter(s => [s.name, s.student_name_en, s.student_name_mr, s.grNo, s.admissionNo, s.dob, s.rollNo].join(" ").toLowerCase().includes(query.toLowerCase()) && (!classFilter || s.className === classFilter) && (!divisionFilter || s.division === divisionFilter));
  const edit = id => { setForm(students.find(s => s.id === id) || {}); setMode("add"); setSelectedId(null); };
  const save = async () => {
    if (imageLoading||connection.busy) return;
    if (!["name", "grNo", "className"].every(key => String(form[key] || "").trim())) return notify("Name, GR and class are required.");
    if (students.some(s => s.id !== form.id && (canonical(s.grNo) === canonical(form.grNo) || (form.admissionNo && canonical(s.admissionNo) === canonical(form.admissionNo))))) return notify("GR or admission number already exists.");
    for (const field of ["dob", "admissionDate"]) if (form[field] && !normalizeDate(form[field])) return notify(`Invalid ${field}.`);
    if (form.dob && form.dob > new Date().toISOString().slice(0, 10)) return notify("Date of birth cannot be in the future.");
    if(!["fatherMobile","motherMobile","emergencyContact","mobile","guardianMobile"].some(k=>form[k]))return notify("Save at least one parent or emergency phone number.");
    for (const field of ["fatherWhatsapp", "motherWhatsapp", "mobile", "whatsapp", "fatherMobile", "motherMobile", "guardianMobile", "alternateMobile", "emergencyContact"]) if (form[field] && normalizeMobile(form[field]) === null) return notify(`Invalid ${field}.`);
    if(form.academicYear && !normalizeYear(form.academicYear)) return notify("Use a valid academic year such as 2026-27.");
    if(!/^(?:[1-9]|1[0-2])$/.test(form.className)) return notify("Choose standard 1–12.");
    const record = bilingualStudent({ ...form, academicYear:normalizeYear(form.academicYear)||(form.id?"":currentAcademicYear()), name: form.name.trim(), grNo: form.grNo.trim(), student_name_en: form.name.trim(), id: form.id || crypto.randomUUID(), updatedAt: new Date().toISOString() });
    const previous=students.find(s=>s.id===form.id);
    const changed=previous&&['className','division','rollNo','academicYear','status'].some(k=>String(previous[k]||'')!==String(record[k]||''));
    if(changed)return notify('Use Student Lifecycle for class, roll, academic-year or status changes so history is preserved.');
    if(connection.shared){if(!await saveStudents(previous?students.map(s=>s.id===record.id?record:s):[...students,{...record,status:record.status||"Active"}]))return;}else if(previous){if(!await saveStudents(students.map(s=>s.id===record.id?record:s)))return;}else{try{commitStoredBatch({erp_pro_students:[...students,{...record,status:record.status||'Active'}],erp_pro_student_movements:[...readStored('erp_pro_student_movements',[]),{id:crypto.randomUUID(),studentId:record.id,studentName:record.name,grNo:record.grNo,action:'Added',type:'Added',oldValue:null,newValue:enrollment(record),actor:'local-review',createdAt:new Date().toISOString()}]},{erp_pro_students:JSON.stringify(students)===JSON.stringify(readStored('erp_pro_students',[]))?localStorage.getItem('erp_pro_students'):'STALE'});reloadStudents()}catch(e){notify(e.message);return;}}
    if(!connection.shared)recordAudit(form.id ? "Student updated" : "Student created", { studentId: record.id }); setForm({}); setClassFilter(""); setDivisionFilter(""); setShowArchived(!lifecycleActive(record)); setQuery(record.grNo); setMode("directory"); notify("Student saved.");
  };
  const archive = async id => {
    const student = students.find(s => s.id === id);
    if (!window.confirm(student.archivedAt ? "Restore this student?" : "Archive this student? Existing history will be retained.")) return;
    if(connection.shared){const record={...student,archivedAt:student.archivedAt?null:new Date().toISOString(),status:student.archivedAt?(student.archivePriorStatus||"Active"):"Archived",archivePriorStatus:student.archivedAt?null:student.status||"Active"};await saveStudents(students.map(s=>s.id===id?record:s));return;}
    try{commitMovements(previewMovements([id],{action:student.archivedAt?'Restore':'Archive',reason:changeReason||'Student directory archive / restore'}));reloadStudents()}catch(e){notify(e.message)}
  };
  const photo = event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1024 * 1024) return notify("Choose a JPG, PNG or WebP smaller than 1 MB.");
    setImageLoading(true); const reader = new FileReader();
    reader.onload = () => { setForm(previous => ({ ...previous, photo: reader.result })); setImageLoading(false); };
    reader.onerror = () => { notify("Photo could not be read."); setImageLoading(false); }; reader.readAsDataURL(file);
  };
  if (mode === "import") return <StudentImport onNavigate={onNavigate} onBack={() => setMode("directory")} onDone={() => { reloadStudents(); setQuery(""); setClassFilter(""); setDivisionFilter(""); setShowArchived(false); setMode("directory"); }} />;
  const selected = students.find(s => String(s.id) === String(selectedId));
  const actions = student => <StudentActions student={student} onEdit={edit} onArchive={archive} onAction={(student,type)=>setAction({student,type})}/>;
  const dialog = action && <StudentChangeDialog key={action.student.id+action.type} student={action.student} action={action.type} role={role} onClose={()=>setAction(null)} onSaved={()=>{reloadStudents();setAction(null)}}/>;
  if (selected) return <>{actions(selected)}<StudentProfile student={selected} settings={settings} onBack={() => setSelectedId(null)} onNavigate={onNavigate}/>{dialog}</>;
  if (mode === "directory") return <><p role="status">{connection.status}</p><StudentDirectory students={activeStudents} visibleStudents={visible} query={query} setQuery={setQuery} classFilter={classFilter} setClassFilter={setClassFilter} divisionFilter={divisionFilter} setDivisionFilter={setDivisionFilter} showArchived={showArchived} setShowArchived={setShowArchived} onCreate={()=>{setForm({academicYear:currentAcademicYear(),status:'Active'});setMode('add')}} onImport={()=>setMode('import')} onExport={()=>exportStudents(visible,'students-filtered.xlsx')} onSelect={setSelectedId} onDelete={archive} onEdit={edit} onAction={(student,type)=>setAction({student,type})} onNavigate={onNavigate}/>{dialog}</>;
  return <StudentForm key={form.id||'new'} form={form} setForm={setForm} onSave={save} onBack={()=>setMode('directory')} onPhoto={photo} busy={imageLoading||connection.busy} onLifecycle={()=>onNavigate('Lifecycle',{studentId:form.id})}/>;
}
