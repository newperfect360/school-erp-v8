import { notify } from "../components/Feedback";
import { useState } from "react";
import { readStored, useStoredState } from "../storage";

const blank = { studentName: "", grNo: "", className: "", exam: "Unit Test", subject: "", maxMarks: "100", obtainedMarks: "" };
const gradeFor = (percentage) => percentage >= 90 ? "A+" : percentage >= 75 ? "A" : percentage >= 60 ? "B" : percentage >= 45 ? "C" : percentage >= 35 ? "D" : "F";

export default function Results() {
  const students = readStored("erp_pro_students", []);
  const [results, setResults] = useStoredState("erp_pro_results", []);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState("");
  const save = () => {
    const max = Number(form.maxMarks); const obtained = Number(form.obtainedMarks);
    if (!form.studentName.trim() || !form.subject.trim() || !Number.isFinite(max) || !Number.isFinite(obtained) || obtained < 0 || obtained > max) { notify("विद्यार्थी, विषय आणि योग्य गुण भरा"); return; }
    const percentage = Math.round((obtained / max) * 10000) / 100;
    if (!setResults([...results, { id: crypto.randomUUID(), ...form, maxMarks: max, obtainedMarks: obtained, percentage, grade: gradeFor(percentage), pass: percentage >= 35, createdAt: new Date().toISOString() }])) return;
    setForm(blank); notify("निकाल नोंद जतन झाली");
  };
  const fillStudent = (student) => setForm({ ...form, studentName: student.name, grNo: student.grNo, className: student.className });
  const visible = results.filter((result) => Object.values(result).join(" ").toLowerCase().includes(query.toLowerCase()));
  return <div className="page module-page"><div className="module-heading"><div><span className="eyebrow">ACADEMIC PERFORMANCE</span><h2>परीक्षा व निकाल</h2><p>Unit Test ते Annual Exam पर्यंत गुण, टक्केवारी आणि grade जतन करा.</p></div><div className="module-count">{results.length}<span>गुण नोंदी</span></div></div>
    <section className="workflow-panel"><div className="panel-title"><h3>गुण नोंदणी</h3><span>गुण जतन केल्यावर grade आपोआप मोजला जातो</span></div><div className="form-grid"><label>विद्यार्थी<select aria-label="विद्यार्थी निवडा" value={form.studentName} onChange={(event) => { const student = students.find((item) => item.name === event.target.value); student ? fillStudent(student) : setForm({ ...form, studentName: event.target.value }); }}><option value="">विद्यार्थी निवडा</option>{students.map((student) => <option key={student.id} value={student.name}>{student.name} · {student.grNo}</option>)}</select></label><label>परीक्षा<input aria-label="परीक्षा" value={form.exam} onChange={(event) => setForm({ ...form, exam: event.target.value })} /></label><label>विषय<input aria-label="विषय" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label>कमाल गुण<input aria-label="कमाल गुण" type="number" value={form.maxMarks} onChange={(event) => setForm({ ...form, maxMarks: event.target.value })} /></label><label>मिळालेले गुण<input aria-label="मिळालेले गुण" type="number" value={form.obtainedMarks} onChange={(event) => setForm({ ...form, obtainedMarks: event.target.value })} /></label></div><button onClick={save}>निकाल जतन करा</button></section>
    <input className="module-search" aria-label="निकाल शोधा" placeholder="नाव, GR, परीक्षा किंवा विषय शोधा" value={query} onChange={(event) => setQuery(event.target.value)} />
    {visible.length ? <div className="table-scroll"><table><thead><tr><th>विद्यार्थी</th><th>GR</th><th>परीक्षा</th><th>विषय</th><th>गुण</th><th>टक्के</th><th>Grade</th><th>स्थिती</th></tr></thead><tbody>{visible.map((result) => <tr key={result.id}><td>{result.studentName}</td><td>{result.grNo}</td><td>{result.exam}</td><td>{result.subject}</td><td>{result.obtainedMarks}/{result.maxMarks}</td><td>{result.percentage}%</td><td>{result.grade}</td><td>{result.pass ? "उत्तीर्ण" : "अनुत्तीर्ण"}</td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>निकाल नोंदी उपलब्ध नाहीत</strong><span>वरील गुण नोंदणी formमधून पहिली नोंद तयार करा.</span></div>}
  </div>;
}
