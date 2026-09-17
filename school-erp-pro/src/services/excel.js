import * as XLSX from "xlsx";

export const studentColumns = [
  ["Sr No", "srNo"], ["Student Full Name", "name"], ["First Name", "firstName"], ["Middle Name", "middleName"], ["Last Name", "lastName"],
  ["Standard", "className"], ["Division", "division"], ["Roll Number", "rollNo"], ["GR Number", "grNo"], ["Date of Birth", "dob"],
  ["Gender", "gender"], ["Blood Group", "bloodGroup"], ["Admission Date", "admissionDate"], ["Academic Year", "academicYear"],
  ["Father Name", "fatherName"], ["Mother Name", "motherName"], ["Parent / Guardian Name", "guardianName"], ["Parent Mobile", "mobile"],
  ["Father Mobile", "fatherMobile"], ["Mother Mobile", "motherMobile"], ["Guardian Mobile", "guardianMobile"], ["Alternate Contact Name", "alternateName"],
  ["Alternate Mobile", "alternateMobile"], ["WhatsApp Number", "whatsapp"], ["Address", "address"], ["Emergency Contact", "emergencyContact"],
  ["Previous School", "previousSchool"], ["Student Category", "category"], ["Scholarship Details", "scholarship"], ["Sports Details", "sports"],
  ["Health Notes", "healthNotes"], ["Aadhaar Reference", "aadhaar"], ["Student Status", "status"],
];

const aliases = {
  name: ["studentfullname", "fullname", "studentname", "name", "विद्यार्थीपूर्णनाव", "विद्यार्थीनाव"],
  className: ["standard", "class", "classname", "इयत्ता"],
  division: ["division", "विभाग", "तुकडी"],
  rollNo: ["rollnumber", "rollno", "roll", "रोलनंबर"],
  grNo: ["grnumber", "grno", "generalregister", "gr", "जीआरनंबर"],
  dob: ["dateofbirth", "dob", "birthdate", "जन्मदिनांक"],
  mobile: ["parentmobile", "parentguardianmobile", "mobile", " मोबाईल"],
  fatherName: ["fathername", "वडिलांचेनाव"],
  motherName: ["mothername", "आईचेनाव"],
  address: ["address", "पत्ता"],
  gender: ["gender", "लिंग"],
  bloodGroup: ["bloodgroup", "रक्तगट"],
  aadhaar: ["aadhaarreference", "aadhaar", "आधार"],
};

const clean = (value) => String(value ?? "").trim();
const key = (value) => clean(value).toLowerCase().replace(/[\s_./-]+/g, "");

export function mapHeaders(headers) {
  return headers.reduce((mapping, header) => {
    const normalized = key(header);
    const direct = studentColumns.find(([label, field]) => key(field) === normalized || key(label) === normalized);
    const alias = Object.entries(aliases).find(([, names]) => names.includes(normalized));
    if (direct) mapping[header] = direct[1];
    else if (alias) mapping[header] = alias[0];
    return mapping;
  }, {});
}

export async function parseStudentFile(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  return { rows, headers: rows.length ? Object.keys(rows[0]) : [], mapping: rows.length ? mapHeaders(Object.keys(rows[0])) : {} };
}

export function normalizeStudentRow(row, mapping) {
  const student = {};
  Object.entries(mapping).forEach(([header, field]) => { student[field] = clean(row[header]); });
  if (!student.name && (student.firstName || student.lastName)) student.name = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  return student;
}

export function validateStudentRow(student, rowNumber, existing) {
  const errors = [];
  if (!student.name) errors.push("विद्यार्थी नाव रिकामे आहे");
  if (!student.grNo) errors.push("GR Number रिकामे आहे");
  if (!student.className) errors.push("Standard रिकामे आहे");
  if (student.mobile && !/^\d{10}$/.test(student.mobile.slice(-10))) errors.push("Parent Mobile चुकीचा आहे");
  if (student.dob && Number.isNaN(Date.parse(student.dob))) errors.push("Date of Birth चुकीची आहे");
  const duplicate = existing.find((item) => (student.grNo && item.grNo === student.grNo) || (student.name && student.dob && item.name === student.name && item.dob === student.dob));
  return { rowNumber, student, errors, duplicate: duplicate || null };
}

export function exportStudents(students, filename = "students.xlsx") {
  const rows = students.map((student, index) => Object.fromEntries(studentColumns.map(([label, field]) => [label, field === "srNo" ? index + 1 : student[field] || ""])));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, filename);
}

export function downloadStudentTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([studentColumns.map(([label]) => label)]);
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Student Template");
  XLSX.writeFile(workbook, "student-import-template.xlsx");
}

export function downloadErrorReport(errors) {
  const worksheet = XLSX.utils.json_to_sheet(errors.map(({ rowNumber, errors: reasons }) => ({ "Original Row": rowNumber, "Error Reason": reasons.join("; ")})));
  const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");
  XLSX.writeFile(workbook, "student-import-errors.xlsx");
}
