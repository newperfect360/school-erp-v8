import { notify } from "../components/Feedback";
import { useState } from "react";
import { useAbsenceCommunication } from "../components/AbsenceCommunication";
import { localDate, readStored, useStoredState } from "../storage";

export default function Attendance() {
  const [date, setDate] = useState(localDate());
  const [classTeachers, setClassTeachers] = useStoredState("erp_pro_classTeachers", [
    { className: "8", division: "A", teacherName: "पवार डी. एम." },
    { className: "9", division: "A", teacherName: "शिंदे एस. के." },
    { className: "10", division: "A", teacherName: "जाधव आर. बी." },
  ]);

  const roster = readStored("erp_pro_students", []);
  const [attendance, setAttendance] = useStoredState("erp_pro_attendance", {});
  const students = roster.map(s => ({ ...s, status: attendance[date]?.[s.id] || "Present" }));
  const communication = useAbsenceCommunication(date, students);
  const presentCount = students.filter(s => s.status === "Present").length;
  const absentCount = students.filter(s => s.status === "Absent").length;
  const getClassTeacher = s => classTeachers.find(t => t.className === s.className && t.division === s.division)?.teacherName || "वर्गशिक्षक नोंदवलेले नाहीत";
  const updateStatus = (id, status) => {
    if (!date) { notify("दिनांक निवडा"); return; }
    if (setAttendance({ ...attendance, [date]: { ...attendance[date], [id]: status } }) && status === "Absent" && attendance[date]?.[id] !== "Absent") communication.prepare([id]);
  };
  const markAll = status => {
    if (!date) { notify("दिनांक निवडा"); return; }
    setAttendance({ ...attendance, [date]: Object.fromEntries(students.map(s => [s.id, status])) });
  };
  const clearAttendance = () => {
    if (!date) { notify("दिनांक निवडा"); return; }
    const next = { ...attendance }; delete next[date]; setAttendance(next);
  };
  const saveAttendance = () => {
    if (!date) { notify("दिनांक निवडा"); return; }
    if (setAttendance({ ...attendance, [date]: Object.fromEntries(students.map(s => [s.id, s.status])) })) notify("उपस्थिती जतन झाली");
  };
  const updateTeacher = (index, field, value) => setClassTeachers(classTeachers.map((t, i) => i === index ? { ...t, [field]: value } : t));

  return <div className="page">
    <div className="section-heading"><div><span className="eyebrow">DAILY REGISTER</span><h2>विद्यार्थी उपस्थिती</h2></div><label className="date-control">दिनांक <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>
    <div className="attendance-summary"><div><span>एकूण विद्यार्थी</span><strong>{students.length}</strong></div><div className="is-present"><span>उपस्थित</span><strong>{presentCount}</strong></div><div className="is-absent"><span>अनुपस्थित</span><strong>{absentCount}</strong></div></div>
    <h3>वर्गशिक्षक सेटिंग</h3>
    <div className="table-scroll"><table><thead><tr><th>इयत्ता</th><th>तुकडी</th><th>वर्गशिक्षक</th></tr></thead><tbody>{classTeachers.map((t, i) => <tr key={i}><td><input value={t.className} onChange={e => updateTeacher(i, "className", e.target.value)} /></td><td><input value={t.division} onChange={e => updateTeacher(i, "division", e.target.value)} /></td><td><input value={t.teacherName} onChange={e => updateTeacher(i, "teacherName", e.target.value)} /></td></tr>)}</tbody></table></div>
    <button onClick={() => setClassTeachers([...classTeachers, { className: "", division: "", teacherName: "" }])}>+ नवीन वर्गशिक्षक जोडा</button>
    <div className="attendance-toolbar"><div><h3>आजची नोंद</h3><p>नवीन नोंदी आपोआप उपस्थित मानल्या जातात. अनुपस्थित विद्यार्थ्याला निवडा.</p></div><div className="attendance-actions"><button onClick={() => markAll("Present")}>सर्व उपस्थित</button><button className="button-muted" onClick={clearAttendance}>सर्व साफ करा</button></div></div>
    {!students.length && <p>Add students in Student Master to begin attendance.</p>}
    <div className="table-scroll"><table className="attendance-table"><thead><tr><th>GR</th><th>नाव</th><th>इयत्ता</th><th>तुकडी</th><th>मोबाईल</th><th>वर्गशिक्षक</th><th>स्थिती</th><th>Parent contact</th></tr></thead><tbody>{students.map(s => <tr key={s.id} data-student-id={s.id}>
      <td>{s.grNo}</td><td>{s.name}</td><td>{s.className}</td><td>{s.division}</td><td>{s.mobile ? `••••••${String(s.mobile).slice(-4)}` : "—"}</td><td>{getClassTeacher(s)}</td>
      <td data-label="स्थिती"><div className="attendance-buttons">{[["Present", "उपस्थित", "present"], ["Absent", "अनुपस्थित", "absent"], ["Late", "उशीर", "late"], ["Leave", "रजा", "leave"]].map(([status, label, css]) => <button key={status} className={`${s.status === status ? "status-selected " : ""}${css}`} onClick={() => updateStatus(s.id, status)}>{label}</button>)}</div><select aria-label={`Attendance for ${s.name}`} value={s.status} onChange={e => updateStatus(s.id, e.target.value)}>{["Present", "Absent", "Late", "Leave", "Half Day", "Medical Leave", "Sports Duty", "Trip Duty"].map(status => <option key={status}>{status}</option>)}</select></td>
      <td data-label="पालक संदेश">{s.status === "Absent" ? communication.quickActions(s) : "-"}</td>
    </tr>)}</tbody></table></div>
    {communication.panel}
    <div className="attendance-footer"><button onClick={saveAttendance}>उपस्थिती जतन करा</button></div>
  </div>;
}

