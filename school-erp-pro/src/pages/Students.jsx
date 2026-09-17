import { useLanguage } from "../design/language";
import { useState } from "react";
import { readStored, useStoredState } from "../storage";
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
  const [imageLoading, setImageLoading] = useState(false), [showArchived, setShowArchived] = useState(archived);
  const activeStudents = students.filter(s => showArchived ? s.archivedAt : !s.archivedAt);
  const visible = activeStudents.filter(s => [s.name, s.student_name_en, s.student_name_mr, s.grNo, s.admissionNo, s.dob, s.rollNo].join(" ").toLowerCase().includes(query.toLowerCase()) && (!classFilter || s.className === classFilter) && (!divisionFilter || s.division === divisionFilter));
  const edit = id => { setForm(students.find(s => s.id === id) || {}); setMode("add"); setSelectedId(null); };
  const save = () => {
    if (imageLoading) return;
    if (!["name", "grNo", "className", "mobile"].every(key => String(form[key] || "").trim())) return notify("Name, GR, class and parent mobile are required.");
    if (students.some(s => s.id !== form.id && (canonical(s.grNo) === canonical(form.grNo) || (form.admissionNo && canonical(s.admissionNo) === canonical(form.admissionNo))))) return notify("GR or admission number already exists.");
    for (const field of ["dob", "admissionDate"]) if (form[field] && !normalizeDate(form[field])) return notify(`Invalid ${field}.`);
    if (form.dob && form.dob > new Date().toISOString().slice(0, 10)) return notify("Date of birth cannot be in the future.");
    for (const field of ["mobile", "whatsapp", "fatherMobile", "motherMobile", "guardianMobile", "alternateMobile", "emergencyContact"]) if (form[field] && normalizeMobile(form[field]) === null) return notify(`Invalid ${field}.`);
    const record = { ...form, name: form.name.trim(), grNo: form.grNo.trim(), student_name_en: form.name.trim(), id: form.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if (!saveStudents(form.id ? students.map(s => s.id === form.id ? record : s) : [...students, record])) return;
    recordAudit(form.id ? "Student updated" : "Student created", { studentId: record.id }); setForm({}); setMode("directory"); notify("Student saved.");
  };
  const archive = id => {
    const student = students.find(s => s.id === id);
    if (!window.confirm(student.archivedAt ? "Restore this student?" : "Archive this student? Existing history will be retained.")) return;
    if (saveStudents(students.map(s => s.id === id ? { ...s, archivedAt: s.archivedAt ? null : new Date().toISOString() } : s))) recordAudit(student.archivedAt ? "Student restored" : "Student archived", { studentId: id });
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
  if (mode === "directory") return <><div className="import-actions"><label><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Show archived students</label><button className="school-link" onClick={() => exportStudents(visible, "students-filtered.csv")}>Export filtered CSV</button><button className="school-link" onClick={() => exportStudents(readStored("erp_pro_students", []).filter(s => !s.archivedAt), "all-students.xlsx")}>Download All Students</button></div><StudentDirectory students={activeStudents} visibleStudents={visible} query={query} setQuery={setQuery} classFilter={classFilter} setClassFilter={setClassFilter} divisionFilter={divisionFilter} setDivisionFilter={setDivisionFilter} onCreate={() => { setForm({}); setMode("add"); }} onImport={() => setMode("import")} onExport={() => exportStudents(visible, "students-filtered.xlsx")} onSelect={setSelectedId} onDelete={archive} /></>;
  return <div className="core-page"><button className="school-link" onClick={() => setMode("directory")}>← Student Master</button><PageHeading eyebrow="STUDENT MASTER" title={form.id ? "Update student record" : "A new learner. A new beginning."} description="Keep English and Marathi names separately. Changes retain the student's ID and history." /><section className="school-panel workflow-panel"><div className="form-grid">{studentColumns.filter(([, field]) => field !== "srNo").map(([label, field]) => <label key={field}>{t(label)}<input name={field} type={["dob", "admissionDate"].includes(field) ? "date" : field.toLowerCase().includes("mobile") || field === "whatsapp" ? "tel" : "text"} value={form[field] || ""} onChange={e => setForm({ ...form, [field]: e.target.value })} /></label>)}<label>Student photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={photo} /></label></div><button className="school-button" aria-label="Save Student" onClick={save} disabled={imageLoading}>{t("Save student")}</button></section></div>;
}
