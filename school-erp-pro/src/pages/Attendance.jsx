import { useState } from "react";
import { localDate, readStored, useStoredState } from "../storage";

export default function Attendance() {
  const [date, setDate] = useState(localDate());
  const [classTeachers, setClassTeachers] = useStoredState("erp_pro_classTeachers", [
    { className: "8", division: "A", teacherName: "पवार डी. एम." },
    { className: "9", division: "A", teacherName: "शिंदे एस. के." },
    { className: "10", division: "A", teacherName: "जाधव आर. बी." },
  ]);

  const [roster] = useState(() => readStored("erp_pro_students", [
    { id: 1, grNo: "101", name: "अक्षय पाटील", className: "8", division: "A", mobile: "7507514475", status: "Present" },
    { id: 2, grNo: "102", name: "रोहन शिंदे", className: "9", division: "A", mobile: "7507514475", status: "Present" },
  ]));

  const [attendance, setAttendance] = useStoredState("erp_pro_attendance", {});
  const students = roster.map(s => ({ ...s, status: attendance[date]?.[s.id] || "Present" }));
  const presentCount = students.filter((student) => student.status === "Present").length;
  const absentCount = students.filter((student) => student.status === "Absent").length;

  const getClassTeacher = (s) => {
    const found = classTeachers.find((t) => t.className === s.className && t.division === s.division);
    return found ? found.teacherName : "वर्गशिक्षक नोंदवलेले नाहीत";
  };

  const updateStatus = (id, status) => {
    if (!date) { alert("दिनांक निवडा"); return; }
    setAttendance({ ...attendance, [date]: { ...attendance[date], [id]: status } });
  };

  const markAll = (status) => {
    if (!date) { alert("दिनांक निवडा"); return; }
    const day = students.reduce((result, student) => ({ ...result, [student.id]: status }), {});
    setAttendance({ ...attendance, [date]: day });
  };

  const clearAttendance = () => {
    if (!date) { alert("दिनांक निवडा"); return; }
    const next = { ...attendance };
    delete next[date];
    setAttendance(next);
  };

  const saveAttendance = () => {
    if (!date) { alert("दिनांक निवडा"); return; }
    setAttendance({ ...attendance, [date]: students.reduce((result, student) => ({ ...result, [student.id]: student.status }), {}) });
    alert("उपस्थिती जतन झाली");
  };

  const updateTeacher = (index, field, value) => {
    const copy = [...classTeachers];
    copy[index] = { ...copy[index], [field]: value };
    setClassTeachers(copy);
  };

  const addClassTeacher = () => {
    setClassTeachers([...classTeachers, { className: "", division: "", teacherName: "" }]);
  };

  const makeAbsentMessage = (student) => {
    const teacherName = getClassTeacher(student);
    return `आदरणीय पालक,

आपले पाल्य ${student.name} इयत्ता ${student.className} तुकडी ${student.division} यांनी दिनांक ${date} रोजी शाळेत उपस्थिती लावलेली नाही.

कृपया आपल्या पाल्यास नियमितपणे शाळेत उपस्थित राहण्याबाबत सूचना करावी.

- वर्गशिक्षक : ${teacherName}

स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय,
नायगाव (भिकापूर), ता. जि. छत्रपती संभाजीनगर`;
  };

  const sendWhatsApp = (student) => {
    if (!student.mobile || !/^(?:\+?91)?\d{10}$/.test(student.mobile.trim())) {
      alert("पालक मोबाईल नंबर चुकीचा आहे.");
      return;
    }
    const mobile = "91" + student.mobile.slice(-10);
    const message = encodeURIComponent(makeAbsentMessage(student));
    const url = `https://wa.me/${mobile}?text=${message}`;
    window.open(url, "_blank");
  };

  const sendAllAbsent = () => {
    const absent = students.filter((s) => s.status === "Absent");
    if (absent.length === 0) {
      alert("आज कोणताही विद्यार्थी अनुपस्थित नाही.");
      return;
    }
    absent.forEach((s, i) => setTimeout(() => sendWhatsApp(s), i * 1200));
  };

  const sendSms = (student) => {
    if (!student.mobile || !/^\d{10}$/.test(student.mobile.slice(-10))) {
      alert("पालक मोबाईल नंबर चुकीचा आहे.");
      return;
    }
    window.open(`sms:${student.mobile.slice(-10)}?body=${encodeURIComponent(makeAbsentMessage(student))}`, "_blank");
  };

  return (
    <div className="page">
      <div className="section-heading">
        <div><span className="eyebrow">DAILY REGISTER</span><h2>विद्यार्थी उपस्थिती</h2></div>
        <label className="date-control">दिनांक <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      <div className="attendance-summary">
        <div><span>एकूण विद्यार्थी</span><strong>{students.length}</strong></div>
        <div className="is-present"><span>उपस्थित</span><strong>{presentCount}</strong></div>
        <div className="is-absent"><span>अनुपस्थित</span><strong>{absentCount}</strong></div>
      </div>

      <h3>वर्गशिक्षक सेटिंग</h3>
      <table>
        <thead>
          <tr><th>इयत्ता</th><th>तुकडी</th><th>वर्गशिक्षक</th></tr>
        </thead>
        <tbody>
          {classTeachers.map((t, i) => (
            <tr key={i}>
              <td><input value={t.className} onChange={(e) => updateTeacher(i, "className", e.target.value)} /></td>
              <td><input value={t.division} onChange={(e) => updateTeacher(i, "division", e.target.value)} /></td>
              <td><input value={t.teacherName} onChange={(e) => updateTeacher(i, "teacherName", e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addClassTeacher}>+ नवीन वर्गशिक्षक जोडा</button>

      <div className="attendance-toolbar">
        <div><h3>आजची नोंद</h3><p>नवीन नोंदी आपोआप उपस्थित मानल्या जातात. अनुपस्थित विद्यार्थ्याला निवडा.</p></div>
        <div className="attendance-actions"><button onClick={() => markAll("Present")}>सर्व उपस्थित</button><button className="button-muted" onClick={clearAttendance}>सर्व साफ करा</button></div>
      </div>
      <table className="attendance-table">
        <thead>
          <tr><th>GR</th><th>नाव</th><th>इयत्ता</th><th>तुकडी</th><th>मोबाईल</th><th>वर्गशिक्षक</th><th>स्थिती</th><th>WhatsApp</th></tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.grNo}</td>
              <td>{s.name}</td>
              <td>{s.className}</td>
              <td>{s.division}</td>
              <td>{s.mobile}</td>
              <td>{getClassTeacher(s)}</td>
              <td data-label="स्थिती">
                <div className="attendance-buttons">
                  <button className={s.status === "Present" ? "status-selected present" : "present"} onClick={() => updateStatus(s.id, "Present")}>उपस्थित</button>
                  <button className={s.status === "Absent" ? "status-selected absent" : "absent"} onClick={() => updateStatus(s.id, "Absent")}>अनुपस्थित</button>
                  <button className={s.status === "Late" ? "status-selected late" : "late"} onClick={() => updateStatus(s.id, "Late")}>उशीर</button>
                  <button className={s.status === "Leave" ? "status-selected leave" : "leave"} onClick={() => updateStatus(s.id, "Leave")}>रजा</button>
                </div>
                <select value={s.status} onChange={(e) => updateStatus(s.id, e.target.value)}>
                  <option>Present</option><option>Absent</option><option>Late</option><option>Leave</option><option>Half Day</option><option>Medical Leave</option><option>Sports Duty</option><option>Trip Duty</option>
                </select>
              </td>
              <td data-label="पालक संदेश">{s.status === "Absent" ? <div className="message-actions"><button onClick={() => sendWhatsApp(s)}>WhatsApp</button><button className="button-sms" onClick={() => sendSms(s)}>SMS</button></div> : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="attendance-footer"><button onClick={sendAllAbsent}>अनुपस्थित पालकांना WhatsApp</button><button onClick={saveAttendance}>उपस्थिती जतन करा</button></div>
    </div>
  );
}

