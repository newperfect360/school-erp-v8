import {useSharedRecords} from "../backend/useSharedRecords";
import SharedAttendanceReview from "../components/SharedAttendanceReview";
import {CommunicationSession} from "../backend/CommunicationSession";
import AttendanceCorrection from "../components/AttendanceCorrection";
import SchoolDayTiming from '../components/SchoolDayTiming';
import AttendanceMarkDetails from '../components/AttendanceMarkDetails';
import AttendanceFinalization from "../components/AttendanceFinalization";
import {draftKey,draftId,studentStatuses,submissionKey,classKey} from "../services/attendanceAutomation";
import {configForAttendance} from "../services/attendanceAutomationStore";
import {currentAcademicYear} from "../services/academicYears";
import FamilyContactCard from '../components/FamilyContactCard';
import { notify } from "../components/Feedback";
import PresentCommunication from "../components/PresentCommunication";

import { useContext, useState } from "react";
import { useAbsenceCommunication } from "../components/AbsenceCommunication";
import { localDate, readStored, useStoredState } from "../storage";
import Icon from "../components/Icon";
import StudentLookup from "../components/StudentLookup";
import { Avatar, EmptyState, PageHeading } from "../design/SchoolUI";
import { studentDisplayName, useLanguage } from "../design/language";
import { attendanceSummary, isActiveStudent } from "../services/schoolOverview";

export default function Attendance({ initialClass = "", initialDivision = "", initialStatus = "", onNavigate }) {
  const { language, t } = useLanguage();
  const actor=useContext(CommunicationSession);
  const [studentRows]=useSharedRecords("students","erp_pro_students");
  const [sharedAttendance,saveSharedAttendance,connection]=useSharedRecords("attendance","erp_pro_attendance_records");
  const [date, setDate] = useState(localDate());
  const [classFilter, setClassFilter] = useState(initialClass);
  const [divisionFilter, setDivisionFilter] = useState(initialDivision);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [classTeachers, setClassTeachers] = useStoredState("erp_pro_classTeachers", [
    { className: "8", division: "A", teacherName: "पवार डी. एम." },
    { className: "9", division: "A", teacherName: "शिंदे एस. के." },
    { className: "10", division: "A", teacherName: "जाधव आर. बी." },
  ]);
  const [year,setYear]=useState(currentAcademicYear());
  const [localDrafts,saveLocalDrafts,reloadDrafts]=useStoredState(draftKey,{});
  const drafts=connection.shared?Object.fromEntries(sharedAttendance.map(row=>[draftId(row.academicYear,row.date,row.studentId),row])):localDrafts;
  const setDrafts=async next=>{if(!connection.shared)return saveLocalDrafts(next);let records=[...sharedAttendance];for(const student of studentRows){const value=next[draftId(year,date,student.id)];if(!value)continue;const old=records.find(row=>row.studentId===student.id&&row.date===date&&row.academicYear===year);if(old&&JSON.stringify(value)===JSON.stringify(old))continue;const id=old?.id||student.id+"_"+date+"_"+year;const row={...old,...value,id,studentId:student.id,academicYear:year,date};if(old?.submittedAt&&row.status!==old.status){const reason=window.prompt("Reason for correcting finalized attendance");if(!reason?.trim())return false;row.correctionReason=reason.trim();}records=old?records.map(r=>r.id===id?row:r):[...records,row];}return saveSharedAttendance(records);};
  const roster = studentRows.filter(isActiveStudent).filter(student=>student.academicYear===year);
  const [teachers]=useSharedRecords("teachers","erp_pro_teachers");
  const [localAttendance, , reloadAttendance] = useStoredState("erp_pro_attendance", {});
  const savedAttendance=connection.shared?sharedAttendance.filter(r=>r.academicYear===year).reduce((days,r)=>({...days,[r.date]:{...days[r.date],[r.studentId]:r.status}}),{}):localAttendance;
  const attendance={...savedAttendance,[date]:{...savedAttendance[date],...Object.fromEntries(roster.filter(student=>drafts[draftId(year,date,student.id)]).map(student=>[student.id,drafts[draftId(year,date,student.id)].status]))}};
  const submitted=connection.shared?[]:readStored(submissionKey,[]);
  const finalized=student=>connection.shared?(!["Super Admin","Admin","Headmaster"].includes(actor?.role)&&sharedAttendance.some(r=>r.studentId===student.id&&r.date===date&&r.academicYear===year&&r.submittedAt)):submitted.some(entry=>entry.date===date&&entry.groupKey===classKey(year,student.className,student.division));
  const detailsFor=student=>drafts[draftId(year,date,student.id)]||submitted.find(entry=>entry.date===date&&entry.groupKey===classKey(year,student.className,student.division))?.rows.find(row=>row.id===student.id)||{};
  const students = roster.map(s => ({ ...s, status: attendance[date]?.[s.id] || "Not Marked" }));
  const classes = [...new Set(roster.map(s => s.className))].sort((a, b) => String(a).localeCompare(String(b), "en", { numeric: true }));
  const divisions = [...new Set(roster.filter(s => !classFilter || s.className === classFilter).map(s => s.division).filter(Boolean))];
  const visibleStudents = students.filter(s => (!statusFilter || s.status === statusFilter) && (!classFilter || s.className === classFilter) && (!divisionFilter || s.division === divisionFilter) && `${s.name} ${s.student_name_mr || ""} ${s.grNo} ${s.rollNo}`.toLowerCase().includes(query.toLowerCase()));
  const communication = useAbsenceCommunication(date, visibleStudents);
  const summary = attendanceSummary(visibleStudents, attendance[date]);
  const updateStatus = (id, status) => {
    if(roster.some(s=>s.id===id&&finalized(s)))return notify("Already finalized. This register is read-only.");
    if(!readStored("erp_pro_students",[]).some(s=>s.id===id&&isActiveStudent(s)))return notify("Student is no longer enrolled. Reopen Attendance.");
    if (!date) { notify(t("Choose an attendance date.", "दिनांक निवडा.")); return; }
    setDrafts({...drafts,[draftId(year,date,id)]:{...drafts[draftId(year,date,id)],status}});
  };
  const markVisiblePresent = async () => {
    if(visibleStudents.some(finalized))return notify("Selection contains finalized attendance. Choose an unsubmitted class/date.");
    if(visibleStudents.some(s=>!readStored("erp_pro_students",[]).some(m=>m.id===s.id&&isActiveStudent(m))))return notify("Student enrollment changed. Reopen Attendance.");
    if (!date) { notify(t("Choose an attendance date.", "दिनांक निवडा.")); return; }
    if (visibleStudents.some(s => attendance[date]?.[s.id] && attendance[date][s.id] !== "Present") && !confirm(t("Replace attendance for all visible students with Present?", "दिसणाऱ्या सर्व विद्यार्थ्यांची नोंद उपस्थित अशी बदलायची आहे का?"))) return;
    if(await setDrafts({...drafts,...Object.fromEntries(visibleStudents.map(student=>[draftId(year,date,student.id),{...drafts[draftId(year,date,student.id)],status:"Present"}]))}))notify("Present marks saved as drafts. Review and submit the complete class.");
  };
  const saveAttendance=()=>notify("Drafts are saved. Use Review attendance, then Final Submit below.");
  const updateTeacher = (index, field, value) => setClassTeachers(classTeachers.map((teacher, i) => i === index ? { ...teacher, [field]: value } : teacher));
  const statusLabels = { "Not Marked":"Not Marked",...Object.fromEntries([...studentStatuses,...configForAttendance().customStatuses].map(status=>[status,status])), Present: t("Present", "उपस्थित"), Absent: t("Absent", "अनुपस्थित"), Late: t("Late", "उशीर"), Leave: t("Leave", "रजा"), "Half Day": t("Half day", "अर्धा दिवस"), "Medical Leave": t("Medical leave", "वैद्यकीय रजा"), "Sports Duty": t("Sports duty", "क्रीडा कार्य"), "Trip Duty": t("Trip duty", "सहल कार्य") };
  return <div className="core-page attendance-workspace">
    <StudentLookup students={roster} onSelect={student => { setClassFilter(student.className); setDivisionFilter(student.division || ""); setQuery(student.grNo); }} />
    <PageHeading eyebrow={t("THE DAILY CLASS REGISTER", "दैनिक वर्ग नोंदवही")} title={t("Every student counts.", "प्रत्येक विद्यार्थ्याची नोंद.")} description={t("Mark attendance. Reach a parent. Keep the school day moving.", "उपस्थिती नोंदवा. पालकांशी संपर्क साधा. शालेय कामकाज सुरळीत ठेवा.")}><button className="school-button secondary" onClick={() => onNavigate?.("Reports")}><Icon name="chart" size={17} />{t("Attendance reports", "उपस्थिती अहवाल")}</button></PageHeading>
    <div className="register-filters"><label>Academic Year<select aria-label="Attendance academic year" value={year} onChange={e=>setYear(e.target.value)}>{[...new Set([year,...readStored("erp_pro_students",[]).map(s=>s.academicYear).filter(Boolean)])].map(value=><option key={value}>{value}</option>)}</select></label><label>{t("Status filter", "उपस्थिती प्रकार")}<select aria-label="Attendance status filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">{t("All statuses", "सर्व प्रकार")}</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{t("Attendance date", "उपस्थिती दिनांक")}<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>{t("Class", "इयत्ता")}<select aria-label="Attendance class" value={classFilter} onChange={e => { setClassFilter(e.target.value); setDivisionFilter(""); }}><option value="">{t("All classes", "सर्व इयत्ता")}</option>{classes.map(name => <option key={name} value={name}>{t("Class", "इयत्ता")} {name}</option>)}</select></label><label>{t("Division", "तुकडी")}<select aria-label="Attendance division" value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}><option value="">{t("All divisions", "सर्व तुकड्या")}</option>{divisions.map(name => <option key={name}>{name}</option>)}</select></label><div className="register-date-note"><Icon name="calendar" size={20} /><div><strong>{date === localDate() ? t("Today's register", "आजची नोंदवही") : date || t("Select a date", "दिनांक निवडा")}</strong><span>{connection.shared?connection.status||"Shared school attendance":"Draft changes saved locally"}</span></div></div></div>
    <SchoolDayTiming date={date}/><div className="register-summary">{[["Total students", "एकूण विद्यार्थी", summary.total, "users", "blue"], ["Present", "उपस्थित", summary.present, "check", "green"], ["Absent", "अनुपस्थित", summary.absent, "message", "rose"], ["Unmarked", "नोंद बाकी", summary.pending, "clock", "amber"]].map(([en, mr, count, icon, tone]) => <div key={en}><span className={`metric-icon tone-${tone}`}><Icon name={icon} size={20} /></span><span>{t(en, mr)}<strong>{count}</strong></span></div>)}</div>
    <section className="school-panel register-panel"><div className="register-toolbar"><div><h2>{classFilter ? `${t("Class", "इयत्ता")} ${classFilter}${divisionFilter ? ` / ${divisionFilter}` : ""}` : t("Student register", "विद्यार्थी नोंदवही")} <span className="count-badge">{visibleStudents.length}</span></h2><p>{"Draft marks require Review and Final Submit. Unmarked students remain unmarked."}</p></div><div className="register-toolbar-actions"><label className="input-with-icon"><Icon name="search" size={16} /><input aria-label="Search attendance students" placeholder={t("Find a student…", "विद्यार्थी शोधा…")} value={query} onChange={e => setQuery(e.target.value)} /></label><button className="school-button secondary" disabled={!visibleStudents.length || !date} onClick={markVisiblePresent}><Icon name="check" size={16} />{t("Mark all present", "सर्व उपस्थित")}</button></div></div>
      {visibleStudents.length ? <div className="table-scroll register-table-wrap"><table className="attendance-table academic-register"><thead><tr><th>{t("Student", "विद्यार्थी")}</th><th>{t("Class / GR", "इयत्ता / GR")}</th><th>{t("Attendance", "उपस्थिती")}</th><th>{t("Parent communication", "पालक संपर्क")}</th></tr></thead><tbody>{visibleStudents.map(s => <tr key={s.id} data-student-id={s.id} className={s.status === "Absent" ? "row-absent" : ""}>
        <td><div className="register-student"><Avatar name={s.name} photo={s.photo} /><div><strong>{studentDisplayName(s, language)}</strong><span>{t("Roll no.", "हजेरी क्र.")} {s.rollNo || "—"}<span className="mobile-student-class"> · {s.className}/{s.division} · GR {s.grNo}</span></span></div></div></td><td><strong>{s.className} / {s.division || "—"}</strong><small className="cell-secondary">GR {s.grNo}</small></td>
        <td><div className="attendance-buttons">{[["Present", "present", "P"], ["Absent", "absent", "A"], ["Late", "late", "L"], ["Approved Leave", "leave", "AL"], ["Permission Leave", "leave", "PL"]].map(([status, css, short]) => <button key={status} disabled={finalized(s)} aria-label={`${statusLabels[status]} — ${s.name}`} title={statusLabels[status]} aria-pressed={attendance[date]?.[s.id] === status} className={`${attendance[date]?.[s.id] === status ? "status-selected " : ""}${css}`} onClick={() => updateStatus(s.id, status)}><span>{short}</span><small>{statusLabels[status]}</small></button>)}</div><select disabled={finalized(s)} className="extended-status" aria-label={`Attendance for ${s.name}`} value={s.status} onChange={e => updateStatus(s.id, e.target.value)}>{Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><AttendanceMarkDetails student={s} details={detailsFor(s)} disabled={finalized(s)} onChange={patch=>setDrafts({...drafts,[draftId(year,date,s.id)]:{...detailsFor(s),status:s.status,...patch}})}/><span className="register-save-state">{attendance[date]?.[s.id] ? statusLabels[s.status] : t("Not yet recorded", "अद्याप नोंद नाही")}</span></td>
        <td>{s.status === "Absent" ? <FamilyContactCard key={`${s.id}:${date}`} student={s} date={date} compact onNavigate={onNavigate} requireAbsent/> : <details className="attendance-family"><summary>Father / Mother / Emergency</summary><FamilyContactCard student={s} date={date} compact onNavigate={onNavigate}/></details>}{s.status === "Absent" ? communication.quickActions(s) : attendance[date]?.[s.id] === "Present" ? <PresentCommunication student={s} date={date} onNavigate={onNavigate}/> : <span className="contact-not-needed"><Icon name="check" size={15} />{t("No absence follow-up", "अनुपस्थिती संपर्क नाही")}</span>}</td>
      </tr>)}</tbody></table></div> : <EmptyState icon="users" title={roster.length ? t("No matching students", "संबंधित विद्यार्थी नाहीत") : t("A class begins with its students", "वर्गाची सुरुवात विद्यार्थ्यांपासून")} description={roster.length ? t("Try another class or clear your search.", "दुसरा वर्ग निवडा किंवा शोध बदला.") : t("Add or import students before taking attendance.", "उपस्थितीपूर्वी विद्यार्थ्यांची नोंद किंवा आयात करा.")} action={<button className="school-button secondary" onClick={() => roster.length ? (setClassFilter(""), setDivisionFilter(""), setQuery("")) : onNavigate?.("Students")}>{roster.length ? t("Clear filters", "फिल्टर काढा") : t("Open student directory", "विद्यार्थी सूची उघडा")}</button>} />}
      <div className="register-footer"><span><Icon name="shield" size={16} />{t("Parent contacts come directly from Student Master.", "पालक संपर्क विद्यार्थी मास्टरमधून घेतले जातात.")}</span><button className="school-button" disabled={!visibleStudents.length || !date} onClick={saveAttendance}><Icon name="check" size={17} />{t("Save register", "उपस्थिती जतन करा")}</button></div>
    </section>
    {!connection.shared&&<AttendanceCorrection year={year} standard={classFilter} division={divisionFilter} date={date} onSaved={()=>{reloadAttendance();reloadDrafts()}}/>}{connection.shared?<SharedAttendanceReview students={studentRows} records={sharedAttendance} save={saveSharedAttendance} year={year} standard={classFilter} division={divisionFilter} date={date} busy={connection.busy}/>:<AttendanceFinalization year={year} standard={classFilter} division={divisionFilter} date={date} onSaved={()=>{reloadAttendance();reloadDrafts()}}/>}
    {communication.panel}
    <details className="assignment-settings"><summary><Icon name="settings" size={17} />{t("Class teacher assignments", "वर्गशिक्षक सेटिंग")}</summary><p>{t("Assign a teacher to a class and division. Existing assignments are retained.", "वर्ग व तुकडीसाठी शिक्षक निवडा. पूर्वीच्या नेमणुका जतन आहेत.")}</p><div className="table-scroll"><table><thead><tr><th>{t("Class", "इयत्ता")}</th><th>{t("Division", "तुकडी")}</th><th>{t("Teacher", "शिक्षक")}</th></tr></thead><tbody>{classTeachers.map((teacher, i) => <tr key={i}><td><input aria-label={`Assigned class ${i + 1}`} value={teacher.className} onChange={e => updateTeacher(i, "className", e.target.value)} /></td><td><input aria-label={`Assigned division ${i + 1}`} value={teacher.division} onChange={e => updateTeacher(i, "division", e.target.value)} /></td><td><select aria-label={`Assigned teacher ${i + 1}`} value={teacher.teacherId || ""} onChange={e => { const selected = teachers.find(item => String(item.id) === e.target.value); setClassTeachers(classTeachers.map((item, index) => index === i ? { ...item, teacherId: selected?.id || "", teacherName: selected?.name || "" } : item)); }}><option value="">{teacher.teacherName || t("Choose a teacher", "शिक्षक निवडा")}</option>{teachers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td></tr>)}</tbody></table></div><button className="school-button secondary" onClick={() => setClassTeachers([...classTeachers, { className: "", division: "", teacherName: "" }])}><Icon name="plus" size={16} />{t("Add class teacher", "वर्गशिक्षक जोडा")}</button></details>
  </div>;
}
