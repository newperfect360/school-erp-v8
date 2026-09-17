import { readStored } from "../storage";
export const reportTypes = ["Students", "Parent Contact List", "Attendance", "Attendance Summary", "Trip Students", "Sports Students", "Scholarship Students", "Results", "Fees", "Library", "Homework", "Communications"];
export function reportRows(type, { className = "", division = "", month = "" } = {}) {
  const all = readStored("erp_pro_students", []), students = all.filter(s => !s.archivedAt && (!className || s.className === className) && (!division || s.division === division));
  const ids = new Set(students.map(s => s.id)), grs = new Set(students.map(s => s.grNo));
  const allowed = row => !className && !division || ids.has(row.studentId) || (row.grNo && grs.has(row.grNo));
  const studentRow = s => ({ Student: s.name, "Marathi Name": s.student_name_mr || "", GR: s.grNo, Class: s.className, Division: s.division, Roll: s.rollNo, DOB: s.dob, "Academic Year": s.academicYear || "" });
  if (type === "Students") return students.map(studentRow);
  if (type === "Parent Contact List") return students.map(s => ({ ...studentRow(s), Parent: s.guardianName || s.fatherName || s.motherName || "", Mobile: s.mobile || "", WhatsApp: s.whatsapp || "", Emergency: s.emergencyContact || "" }));
  const attendance = readStored("erp_pro_attendance", {});
  if (type === "Attendance") return Object.entries(attendance).filter(([date]) => !month || date.startsWith(month)).flatMap(([date, records]) => students.map(s => ({ Date: date, ...studentRow(s), Status: records[s.id] || "Unmarked" })));
  if (type === "Attendance Summary") return students.map(s => {
    const statuses = Object.entries(attendance).filter(([date]) => !month || date.startsWith(month)).map(([, records]) => records[s.id]).filter(Boolean);
    const present = statuses.filter(status => ["Present", "Late", "Sports Duty", "Trip Duty"].includes(status)).length;
    return { ...studentRow(s), "Recorded Days": statuses.length, "Present / Duty Days": present, Absent: statuses.filter(status => status === "Absent").length, "Percentage of recorded days": statuses.length ? Math.round(present / statuses.length * 10000) / 100 : "Not recorded" };
  });
  if (type === "Trip Students") return readStored("erp_pro_trips", []).flatMap(trip => (trip.participants || []).filter(p => ids.has(p.studentId)).map(p => ({ Trip: trip.name, Date: trip.startDate, ...studentRow(students.find(s => s.id === p.studentId)), Consent: p.consent, Boarding: p.boarding })));
  if (type === "Sports Students") return readStored("erp_pro_sports_athletes", []).filter(allowed);
  if (type === "Scholarship Students") return readStored("erp_pro_scholarship_applications", []).filter(allowed);
  const keys = { Results: "erp_pro_results", Fees: "erp_pro_fees", Library: "erp_pro_library_loans", Homework: "erp_pro_homework", Communications: "erp_pro_absence_communications" };
  return readStored(keys[type] || "erp_pro_students", []).filter(row => type === "Homework" ? (!className || row.className === className) && (!division || row.division === division) : allowed(row));
}
