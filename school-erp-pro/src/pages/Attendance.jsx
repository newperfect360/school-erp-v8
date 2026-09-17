import { notify } from "../components/Feedback";
import { useState } from "react";
import { useAbsenceCommunication } from "../components/AbsenceCommunication";
import { localDate, readStored, useStoredState } from "../storage";
import Icon from "../components/Icon";
import StudentLookup from "../components/StudentLookup";
import { Avatar, EmptyState, PageHeading } from "../design/SchoolUI";
import { studentDisplayName, useLanguage } from "../design/language";
import { attendanceSummary, isActiveStudent } from "../services/schoolOverview";

export default function Attendance({ initialClass = "", initialDivision = "", initialStatus = "", onNavigate }) {
  const { language, t } = useLanguage();
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
  const roster = readStored("erp_pro_students", []).filter(isActiveStudent);
  const teachers = readStored("erp_pro_teachers", []);
  const [attendance, setAttendance] = useStoredState("erp_pro_attendance", {});
  const students = roster.map(s => ({ ...s, status: attendance[date]?.[s.id] || "Present" }));
  const classes = [...new Set(roster.map(s => s.className))].sort((a, b) => String(a).localeCompare(String(b), "en", { numeric: true }));
  const divisions = [...new Set(roster.filter(s => !classFilter || s.className === classFilter).map(s => s.division).filter(Boolean))];
  const visibleStudents = students.filter(s => (!statusFilter || s.status === statusFilter) && (!classFilter || s.className === classFilter) && (!divisionFilter || s.division === divisionFilter) && `${s.name} ${s.student_name_mr || ""} ${s.grNo} ${s.rollNo}`.toLowerCase().includes(query.toLowerCase()));
  const communication = useAbsenceCommunication(date, visibleStudents);
  const summary = attendanceSummary(visibleStudents, attendance[date]);
  const updateStatus = (id, status) => {
    if (!date) { notify(t("Choose an attendance date.", "दिनांक निवडा.")); return; }
    if (setAttendance({ ...attendance, [date]: { ...attendance[date], [id]: status } }) && status === "Absent" && attendance[date]?.[id] !== "Absent") communication.prepare([id]);
  };
  const markVisiblePresent = () => {
    if (!date) { notify(t("Choose an attendance date.", "दिनांक निवडा.")); return; }
    if (visibleStudents.some(s => attendance[date]?.[s.id] && attendance[date][s.id] !== "Present") && !confirm(t("Replace attendance for all visible students with Present?", "दिसणाऱ्या सर्व विद्यार्थ्यांची नोंद उपस्थित अशी बदलायची आहे का?"))) return;
    if (setAttendance({ ...attendance, [date]: { ...attendance[date], ...Object.fromEntries(visibleStudents.map(s => [s.id, "Present"])) } })) notify(t("Visible students marked present.", "दिसणारे विद्यार्थी उपस्थित नोंदवले."));
  };
  const saveAttendance = () => {
    if (!date) { notify(t("Choose an attendance date.", "दिनांक निवडा.")); return; }
    if (setAttendance({ ...attendance, [date]: { ...attendance[date], ...Object.fromEntries(visibleStudents.map(s => [s.id, s.status])) } })) notify(t("Attendance saved for the visible students.", "दिसणाऱ्या विद्यार्थ्यांची उपस्थिती जतन झाली."));
  };
  const updateTeacher = (index, field, value) => setClassTeachers(classTeachers.map((teacher, i) => i === index ? { ...teacher, [field]: value } : teacher));
  const statusLabels = { Present: t("Present", "उपस्थित"), Absent: t("Absent", "अनुपस्थित"), Late: t("Late", "उशीर"), Leave: t("Leave", "रजा"), "Half Day": t("Half day", "अर्धा दिवस"), "Medical Leave": t("Medical leave", "वैद्यकीय रजा"), "Sports Duty": t("Sports duty", "क्रीडा कार्य"), "Trip Duty": t("Trip duty", "सहल कार्य") };
  return <div className="core-page attendance-workspace">
    <StudentLookup students={roster} onSelect={student => { setClassFilter(student.className); setDivisionFilter(student.division || ""); setQuery(student.grNo); }} />
    <PageHeading eyebrow={t("THE DAILY CLASS REGISTER", "दैनिक वर्ग नोंदवही")} title={t("Every student counts.", "प्रत्येक विद्यार्थ्याची नोंद.")} description={t("Mark attendance. Reach a parent. Keep the school day moving.", "उपस्थिती नोंदवा. पालकांशी संपर्क साधा. शालेय कामकाज सुरळीत ठेवा.")}><button className="school-button secondary" onClick={() => onNavigate?.("Reports")}><Icon name="chart" size={17} />{t("Attendance reports", "उपस्थिती अहवाल")}</button></PageHeading>
    <div className="register-filters"><label>{t("Status filter", "उपस्थिती प्रकार")}<select aria-label="Attendance status filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="">{t("All statuses", "सर्व प्रकार")}</option>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{t("Attendance date", "उपस्थिती दिनांक")}<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label>{t("Class", "इयत्ता")}<select aria-label="Attendance class" value={classFilter} onChange={e => { setClassFilter(e.target.value); setDivisionFilter(""); }}><option value="">{t("All classes", "सर्व इयत्ता")}</option>{classes.map(name => <option key={name} value={name}>{t("Class", "इयत्ता")} {name}</option>)}</select></label><label>{t("Division", "तुकडी")}<select aria-label="Attendance division" value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}><option value="">{t("All divisions", "सर्व तुकड्या")}</option>{divisions.map(name => <option key={name}>{name}</option>)}</select></label><div className="register-date-note"><Icon name="calendar" size={20} /><div><strong>{date === localDate() ? t("Today's register", "आजची नोंदवही") : date || t("Select a date", "दिनांक निवडा")}</strong><span>{t("Changes are saved as you mark", "नोंद करताच बदल जतन होतात")}</span></div></div></div>
    <div className="register-summary">{[["Total students", "एकूण विद्यार्थी", summary.total, "users", "blue"], ["Present", "उपस्थित", summary.present, "check", "green"], ["Absent", "अनुपस्थित", summary.absent, "message", "rose"], ["Unmarked", "नोंद बाकी", summary.pending, "clock", "amber"]].map(([en, mr, count, icon, tone]) => <div key={en}><span className={`metric-icon tone-${tone}`}><Icon name={icon} size={20} /></span><span>{t(en, mr)}<strong>{count}</strong></span></div>)}</div>
    <section className="school-panel register-panel"><div className="register-toolbar"><div><h2>{classFilter ? `${t("Class", "इयत्ता")} ${classFilter}${divisionFilter ? ` / ${divisionFilter}` : ""}` : t("Student register", "विद्यार्थी नोंदवही")} <span className="count-badge">{visibleStudents.length}</span></h2><p>{t("Unmarked entries default to Present only when you save the register.", "जतन करताना नोंद बाकी असलेले विद्यार्थी उपस्थित मानले जातील.")}</p></div><div className="register-toolbar-actions"><label className="input-with-icon"><Icon name="search" size={16} /><input aria-label="Search attendance students" placeholder={t("Find a student…", "विद्यार्थी शोधा…")} value={query} onChange={e => setQuery(e.target.value)} /></label><button className="school-button secondary" disabled={!visibleStudents.length || !date} onClick={markVisiblePresent}><Icon name="check" size={16} />{t("Mark all present", "सर्व उपस्थित")}</button></div></div>
      {visibleStudents.length ? <div className="table-scroll register-table-wrap"><table className="attendance-table academic-register"><thead><tr><th>{t("Student", "विद्यार्थी")}</th><th>{t("Class / GR", "इयत्ता / GR")}</th><th>{t("Attendance", "उपस्थिती")}</th><th>{t("Parent communication", "पालक संपर्क")}</th></tr></thead><tbody>{visibleStudents.map(s => <tr key={s.id} data-student-id={s.id} className={s.status === "Absent" ? "row-absent" : ""}>
        <td><div className="register-student"><Avatar name={s.name} photo={s.photo} /><div><strong>{studentDisplayName(s, language)}</strong><span>{t("Roll no.", "हजेरी क्र.")} {s.rollNo || "—"}<span className="mobile-student-class"> · {s.className}/{s.division} · GR {s.grNo}</span></span></div></div></td><td><strong>{s.className} / {s.division || "—"}</strong><small className="cell-secondary">GR {s.grNo}</small></td>
        <td><div className="attendance-buttons">{[["Present", "present", "P"], ["Absent", "absent", "A"], ["Late", "late", "L"], ["Leave", "leave", "LV"]].map(([status, css, short]) => <button key={status} aria-label={`${statusLabels[status]} — ${s.name}`} title={statusLabels[status]} aria-pressed={attendance[date]?.[s.id] === status} className={`${attendance[date]?.[s.id] === status ? "status-selected " : ""}${css}`} onClick={() => updateStatus(s.id, status)}><span>{short}</span><small>{statusLabels[status]}</small></button>)}</div><select className="extended-status" aria-label={`Attendance for ${s.name}`} value={s.status} onChange={e => updateStatus(s.id, e.target.value)}>{Object.entries(statusLabels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><span className="register-save-state">{attendance[date]?.[s.id] ? statusLabels[s.status] : t("Not yet recorded", "अद्याप नोंद नाही")}</span></td>
        <td>{s.status === "Absent" ? communication.quickActions(s) : <span className="contact-not-needed"><Icon name="check" size={15} />{t("No absence follow-up", "अनुपस्थिती संपर्क नाही")}</span>}</td>
      </tr>)}</tbody></table></div> : <EmptyState icon="users" title={roster.length ? t("No matching students", "संबंधित विद्यार्थी नाहीत") : t("A class begins with its students", "वर्गाची सुरुवात विद्यार्थ्यांपासून")} description={roster.length ? t("Try another class or clear your search.", "दुसरा वर्ग निवडा किंवा शोध बदला.") : t("Add or import students before taking attendance.", "उपस्थितीपूर्वी विद्यार्थ्यांची नोंद किंवा आयात करा.")} action={<button className="school-button secondary" onClick={() => roster.length ? (setClassFilter(""), setDivisionFilter(""), setQuery("")) : onNavigate?.("Students")}>{roster.length ? t("Clear filters", "फिल्टर काढा") : t("Open student directory", "विद्यार्थी सूची उघडा")}</button>} />}
      <div className="register-footer"><span><Icon name="shield" size={16} />{t("Parent contacts come directly from Student Master.", "पालक संपर्क विद्यार्थी मास्टरमधून घेतले जातात.")}</span><button className="school-button" disabled={!visibleStudents.length || !date} onClick={saveAttendance}><Icon name="check" size={17} />{t("Save register", "उपस्थिती जतन करा")}</button></div>
    </section>
    {communication.panel}
    <details className="assignment-settings"><summary><Icon name="settings" size={17} />{t("Class teacher assignments", "वर्गशिक्षक सेटिंग")}</summary><p>{t("Assign a teacher to a class and division. Existing assignments are retained.", "वर्ग व तुकडीसाठी शिक्षक निवडा. पूर्वीच्या नेमणुका जतन आहेत.")}</p><div className="table-scroll"><table><thead><tr><th>{t("Class", "इयत्ता")}</th><th>{t("Division", "तुकडी")}</th><th>{t("Teacher", "शिक्षक")}</th></tr></thead><tbody>{classTeachers.map((teacher, i) => <tr key={i}><td><input aria-label={`Assigned class ${i + 1}`} value={teacher.className} onChange={e => updateTeacher(i, "className", e.target.value)} /></td><td><input aria-label={`Assigned division ${i + 1}`} value={teacher.division} onChange={e => updateTeacher(i, "division", e.target.value)} /></td><td><select aria-label={`Assigned teacher ${i + 1}`} value={teacher.teacherId || ""} onChange={e => { const selected = teachers.find(item => String(item.id) === e.target.value); setClassTeachers(classTeachers.map((item, index) => index === i ? { ...item, teacherId: selected?.id || "", teacherName: selected?.name || "" } : item)); }}><option value="">{teacher.teacherName || t("Choose a teacher", "शिक्षक निवडा")}</option>{teachers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></td></tr>)}</tbody></table></div><button className="school-button secondary" onClick={() => setClassTeachers([...classTeachers, { className: "", division: "", teacherName: "" }])}><Icon name="plus" size={16} />{t("Add class teacher", "वर्गशिक्षक जोडा")}</button></details>
  </div>;
}
