import { canonical } from "./studentImport.js";
export const gradeFor = p => p >= 90 ? "A+" : p >= 75 ? "A" : p >= 60 ? "B" : p >= 45 ? "C" : p >= 35 ? "D" : "F";
export const marksColumns = ["Student Name", "GR Number", "Roll Number", "Subject", "Maximum Marks", "Obtained Marks"];
export function resultKey(row) { return [row.studentId || row.grNo, row.academicYear || "", row.exam, row.component || "Theory", canonical(row.subject)].join("|"); }
export function matchingResults(row, existing) {
  return existing.filter(item => (item.studentId ? String(item.studentId) === String(row.studentId) : canonical(item.grNo) === canonical(row.grNo)) && item.exam === row.exam && (item.component || "Theory") === (row.component || "Theory") && canonical(item.subject) === canonical(row.subject) && (!item.academicYear || item.academicYear === row.academicYear));
}
export function validateMarks(row) {
  const max = Number(row.maxMarks), obtained = Number(row.obtainedMarks);
  if (!row.studentId || !String(row.subject || "").trim() || !String(row.exam || "").trim()) return "Student, subject and exam are required.";
  if (String(row.maxMarks).trim() === "" || String(row.obtainedMarks).trim() === "" || !Number.isFinite(max) || !Number.isFinite(obtained) || max <= 0 || obtained < 0 || obtained > max) return "Maximum must be greater than zero; obtained marks must be provided and within 0–maximum.";
  return "";
}
export function calculatedResult(row) { const maxMarks = Number(row.maxMarks), obtainedMarks = Number(row.obtainedMarks), percentage = Math.round(obtainedMarks / maxMarks * 10000) / 100; return { ...row, maxMarks, obtainedMarks, percentage, grade: gradeFor(percentage), pass: percentage >= 35 }; }
export function reviewMarks(rows, students, existing, exam, component, academicYear) {
  const seen = new Set();
  return rows.map((raw, index) => {
    const candidates = students.filter(s => !s.archivedAt && canonical(s.grNo) === canonical(raw["GR Number"]));
    const student = candidates.length === 1 ? candidates[0] : null;
    const row = { studentId: student?.id, studentName: student?.name, grNo: student?.grNo, className: student?.className, division: student?.division, rollNo: student?.rollNo, subject: String(raw.Subject || "").trim(), maxMarks: raw["Maximum Marks"], obtainedMarks: raw["Obtained Marks"], exam, component, academicYear };
    const errors = [];
    if (!student) errors.push("GR must match exactly one active student.");
    if (student && raw["Student Name"] && canonical(raw["Student Name"]) !== canonical(student.name)) errors.push("Name does not match the GR record.");
    if (student && raw["Roll Number"] && canonical(raw["Roll Number"]) !== canonical(student.rollNo)) errors.push("Roll number does not match the GR record.");
    const invalid = validateMarks(row); if (invalid) errors.push(invalid);
    const key = resultKey(row); if (seen.has(key)) errors.push("Repeated subject/component for this student in the upload."); seen.add(key);
    const matches = matchingResults(row, existing);
    if (matches.length > 1) errors.push("Multiple saved marks match this subject. Review the existing register before importing.");
    return { index, rowNumber: raw.__row || index + 2, row, errors, existing: matches.length === 1 ? matches[0] : null };
  });
}
export function aggregateResults(rows) {
  const max = rows.reduce((sum, r) => sum + Number(r.maxMarks || 0), 0), total = rows.reduce((sum, r) => sum + Number(r.obtainedMarks || 0), 0);
  const percentage = max > 0 ? Math.round(total / max * 10000) / 100 : 0;
  const subjects = Object.values(rows.reduce((group, r) => { const key = canonical(r.subject); group[key] ||= { max: 0, obtained: 0 }; group[key].max += Number(r.maxMarks); group[key].obtained += Number(r.obtainedMarks); return group; }, {}));
  return { total, max, percentage, grade: gradeFor(percentage), pass: subjects.length > 0 && subjects.every(s => s.max > 0 && s.obtained / s.max >= .35) };
}
